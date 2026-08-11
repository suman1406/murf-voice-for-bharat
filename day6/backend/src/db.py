import sqlite3
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List

logger = logging.getLogger("krishivani-db")
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "farmer_outbound.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize SQLite database for caller profiles, alerts, and call outcomes."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Farmer profiles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS farmer_profiles (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                language_preference TEXT DEFAULT 'Hindi',
                district TEXT DEFAULT 'करनाल (Karnal)',
                crops_grown TEXT DEFAULT 'धान (Paddy), गेहूँ (Wheat)',
                opted_out INTEGER DEFAULT 0,
                user_consented INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Outbound call outcomes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS call_outcomes (
                call_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                phone_or_sip TEXT,
                alert_type TEXT NOT NULL,
                outcome TEXT NOT NULL, -- answered, no_answer, busy, voicemail, opt_out, immediate_hangup
                retry_count INTEGER DEFAULT 0,
                next_retry_at TIMESTAMP,
                notes TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Pre-seed default test profiles if empty
        cursor.execute("SELECT COUNT(*) FROM farmer_profiles")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO farmer_profiles (user_id, name, phone, district, crops_grown, opted_out, user_consented)
                VALUES ('farmer_001', 'रामेश्वर जी', '+919876543210', 'करनाल (Karnal)', 'धान (Paddy), गेहूँ (Wheat)', 0, 1)
            """)
            cursor.execute("""
                INSERT INTO farmer_profiles (user_id, name, phone, district, crops_grown, opted_out, user_consented)
                VALUES ('farmer_002', 'सुनीता जी', '+919812345678', 'अंबाला (Ambala)', 'कपास (Cotton), सरसों (Mustard)', 0, 1)
            """)
        
        conn.commit()
        logger.info("Database initialized successfully at %s", DB_PATH)


def get_caller_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve farmer profile by user_id or phone."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM farmer_profiles WHERE user_id = ? OR phone = ?", (user_id, user_id))
        row = cursor.fetchone()
        if row:
            return {
                "user_id": row["user_id"],
                "name": row["name"],
                "phone": row["phone"],
                "language_preference": row["language_preference"],
                "district": row["district"],
                "crops_grown": row["crops_grown"],
                "opted_out": bool(row["opted_out"]),
                "user_consented": bool(row["user_consented"]),
                "updated_at": row["updated_at"],
            }
    return None


def save_caller_profile(
    user_id: str,
    name: str,
    phone: str = "",
    district: str = "करनाल (Karnal)",
    crops_grown: str = "धान (Paddy)",
    opted_out: bool = False,
    user_consented: bool = True
) -> Dict[str, Any]:
    """Save or update farmer profile."""
    with get_connection() as conn:
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO farmer_profiles (user_id, name, phone, district, crops_grown, opted_out, user_consented, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name=excluded.name,
                phone=excluded.phone,
                district=excluded.district,
                crops_grown=excluded.crops_grown,
                opted_out=excluded.opted_out,
                user_consented=excluded.user_consented,
                updated_at=excluded.updated_at
        """, (user_id, name, phone, district, crops_grown, int(opted_out), int(user_consented), now))
        conn.commit()
    return {"status": "success", "user_id": user_id, "opted_out": opted_out}


def unsubscribe_farmer_alerts(user_id: str) -> Dict[str, Any]:
    """Mark farmer as opted out from outbound alert calls."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE farmer_profiles
            SET opted_out = 1, updated_at = ?
            WHERE user_id = ? OR phone = ?
        """, (datetime.now().isoformat(), user_id, user_id))
        conn.commit()
        logger.info("Farmer %s opted out from outbound alert calls.", user_id)
    return {
        "status": "success",
        "message": "किसान ने आउटबाउंड कॉल अलर्ट सेवा को अनसब्सक्राइब कर दिया है। भविष्य में कोई कॉल नहीं की जाएगी।"
    }


def is_farmer_opted_out(user_id: str) -> bool:
    """Check if farmer has opted out of outbound calls."""
    profile = get_caller_profile(user_id)
    if profile:
        return profile.get("opted_out", False)
    return False


def record_call_outcome(
    call_id: str,
    user_id: str,
    phone_or_sip: str,
    alert_type: str,
    outcome: str,
    notes: str = ""
) -> Dict[str, Any]:
    """
    Log outbound call outcome and schedule retries if necessary.
    Outcomes:
    - 'answered': Full call completed.
    - 'no_answer': Callee didn't pick up. Retry in 30 mins (max 3 retries).
    - 'busy': Line busy. Retry in 15 mins (max 3 retries).
    - 'voicemail': Answering machine reached. Logged, no immediate retry.
    - 'opt_out': Callee asked to opt out during opening/call.
    - 'immediate_hangup': Callee hung up immediately (<5s). Retry once after 2 hours.
    """
    valid_outcomes = {"answered", "no_answer", "busy", "voicemail", "opt_out", "immediate_hangup"}
    if outcome not in valid_outcomes:
        outcome = "answered"
        
    next_retry = None
    now = datetime.now()
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT retry_count FROM call_outcomes WHERE call_id = ?", (call_id,))
        row = cursor.fetchone()
        retry_count = (row[0] + 1) if row else 0
        
        if outcome == "no_answer" and retry_count < 3:
            next_retry = (now + timedelta(minutes=30)).isoformat()
        elif outcome == "busy" and retry_count < 3:
            next_retry = (now + timedelta(minutes=15)).isoformat()
        elif outcome == "immediate_hangup" and retry_count < 1:
            next_retry = (now + timedelta(hours=2)).isoformat()
            
        cursor.execute("""
            INSERT INTO call_outcomes (call_id, user_id, phone_or_sip, alert_type, outcome, retry_count, next_retry_at, notes, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(call_id) DO UPDATE SET
                outcome=excluded.outcome,
                retry_count=excluded.retry_count,
                next_retry_at=excluded.next_retry_at,
                notes=excluded.notes,
                timestamp=excluded.timestamp
        """, (call_id, user_id, phone_or_sip, alert_type, outcome, retry_count, next_retry, notes, now.isoformat()))
        conn.commit()
        
        if outcome == "opt_out":
            unsubscribe_farmer_alerts(user_id)
            
    logger.info("Call outcome recorded for %s: outcome=%s, retry_count=%d, next_retry=%s", call_id, outcome, retry_count, next_retry)
    return {
        "status": "success",
        "call_id": call_id,
        "outcome": outcome,
        "retry_count": retry_count,
        "next_retry_at": next_retry
    }


def get_recent_call_outcomes(limit: int = 10) -> List[Dict[str, Any]]:
    """Fetch recent logged call outcomes for dashboard UI."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM call_outcomes ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
