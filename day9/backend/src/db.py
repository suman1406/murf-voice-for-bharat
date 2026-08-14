import os
import random
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

DB_PATH = os.getenv("DB_PATH", "krishivani_day7.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Profiles table for farmer facts & memory
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            language_preference TEXT DEFAULT 'Hindi',
            crops_grown TEXT,
            land_size TEXT,
            district TEXT,
            irrigation_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    )

    # Escalations table for human help requests
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS escalations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reference_id TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            caller_name TEXT DEFAULT 'Kisan',
            caller_phone TEXT DEFAULT 'Not provided',
            preferred_contact_method TEXT DEFAULT 'Phone Call',
            language TEXT DEFAULT 'Hindi',
            issue_category TEXT NOT NULL,
            urgency TEXT NOT NULL DEFAULT 'MEDIUM',
            summary TEXT NOT NULL,
            checked_by_agent TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'OPEN',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        )
    """
    )

    conn.commit()
    conn.close()


def generate_reference_id() -> str:
    num = random.randint(1000, 9999)
    return f"REF-KV-{num}"


def create_escalation_db(
    user_id: str,
    caller_name: str = "Kisan",
    caller_phone: str = "Not provided",
    preferred_contact_method: str = "Phone Call",
    language: str = "Hindi",
    issue_category: str = "severe_crop_problem",
    urgency: str = "HIGH",
    summary: str = "",
    checked_by_agent: str = "",
    user_consented: bool = True,
) -> Dict[str, Any]:
    if not user_consented:
        return {
            "status": "refused",
            "message": "User did not consent to creating a human help request.",
            "reference_id": None,
        }

    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    # Check for existing open request for same user_id and issue_category within last 24h (Duplicate Prevention)
    one_day_ago = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        """
        SELECT reference_id FROM escalations
        WHERE user_id = ? AND issue_category = ? AND status != 'RESOLVED' AND created_at >= ?
        ORDER BY id DESC LIMIT 1
    """,
        (user_id, issue_category, one_day_ago),
    )

    existing = cursor.fetchone()
    if existing:
        ref_id = existing["reference_id"]
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute(
            """
            UPDATE escalations
            SET summary = ?, checked_by_agent = ?, urgency = ?, created_at = ?
            WHERE reference_id = ?
        """,
            (summary, checked_by_agent, urgency, now_str, ref_id),
        )
        conn.commit()
        conn.close()
        return {
            "status": "updated_existing",
            "reference_id": ref_id,
            "is_duplicate_updated": True,
            "message": f"Updated existing open request {ref_id}.",
        }

    ref_id = generate_reference_id()
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute(
        """
        INSERT INTO escalations (
            reference_id, user_id, caller_name, caller_phone,
            preferred_contact_method, language, issue_category,
            urgency, summary, checked_by_agent, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    """,
        (
            ref_id,
            user_id,
            caller_name,
            caller_phone,
            preferred_contact_method,
            language,
            issue_category,
            urgency,
            summary,
            checked_by_agent,
            now_str,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "status": "created",
        "reference_id": ref_id,
        "is_duplicate_updated": False,
        "message": f"Created new human help escalation {ref_id}.",
    }


def get_escalations_db(
    status: Optional[str] = None, urgency: Optional[str] = None
) -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM escalations WHERE 1=1"
    params = []

    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status)

    if urgency and urgency != "ALL":
        query += " AND urgency = ?"
        params.append(urgency)

    query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(
            {
                "id": r["id"],
                "reference_id": r["reference_id"],
                "user_id": r["user_id"],
                "caller_name": r["caller_name"],
                "caller_phone": r["caller_phone"],
                "preferred_contact_method": r["preferred_contact_method"],
                "language": r["language"],
                "issue_category": r["issue_category"],
                "urgency": r["urgency"],
                "summary": r["summary"],
                "checked_by_agent": r["checked_by_agent"],
                "status": r["status"],
                "created_at": r["created_at"],
                "resolved_at": r["resolved_at"],
            }
        )
    return result


def update_escalation_status_db(reference_id: str, new_status: str) -> Dict[str, Any]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S") if new_status == "RESOLVED" else None

    cursor.execute(
        """
        UPDATE escalations
        SET status = ?, resolved_at = ?
        WHERE reference_id = ?
    """,
        (new_status, now_str, reference_id),
    )

    rows_affected = cursor.rowcount
    conn.commit()
    conn.close()

    if rows_affected > 0:
        return {"status": "success", "reference_id": reference_id, "new_status": new_status}
    return {"status": "error", "message": f"Reference ID {reference_id} not found."}


def save_caller_profile(
    user_id: str,
    name: str,
    language_preference: str = "Hindi",
    crops_grown: str = "",
    land_size: str = "",
    district: str = "",
    irrigation_type: str = "",
    user_consented: bool = False,
) -> Dict[str, Any]:
    if not user_consented:
        return {
            "status": "refused",
            "message": "Permission denied by user. Caller data was NOT saved.",
        }

    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        """
        INSERT INTO profiles (user_id, name, language_preference, crops_grown, land_size, district, irrigation_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            name=excluded.name,
            language_preference=excluded.language_preference,
            crops_grown=excluded.crops_grown,
            land_size=excluded.land_size,
            district=excluded.district,
            irrigation_type=excluded.irrigation_type,
            updated_at=excluded.updated_at
    """,
        (
            user_id,
            name,
            language_preference,
            crops_grown,
            land_size,
            district,
            irrigation_type,
            now_str,
            now_str,
        ),
    )

    conn.commit()
    conn.close()
    return {"status": "success", "user_id": user_id, "name": name}


def get_caller_profile(user_id: str) -> Optional[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "user_id": row["user_id"],
            "name": row["name"],
            "language_preference": row["language_preference"],
            "facts": {
                "crops_grown": row["crops_grown"] or "Not specified",
                "land_size": row["land_size"] or "Not specified",
                "district": row["district"] or "Not specified",
                "irrigation_type": row["irrigation_type"] or "Not specified",
            },
        }
    return None


def forget_caller_profile(user_id: str) -> Dict[str, Any]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM profiles WHERE user_id = ?", (user_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()

    if affected > 0:
        return {"status": "deleted", "user_id": user_id}
    return {"status": "not_found", "user_id": user_id}
