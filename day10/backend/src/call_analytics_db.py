import json
import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

DB_PATH = os.getenv("DB_PATH", "krishivani_day8.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_call_analytics_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS call_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_name TEXT NOT NULL,
            participant_identity TEXT DEFAULT 'anonymous',
            channel TEXT DEFAULT 'browser',
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP,
            duration_seconds REAL DEFAULT 0,
            outcome TEXT DEFAULT 'IN_PROGRESS',
            failure_reason TEXT DEFAULT '',
            tools_used TEXT DEFAULT '[]',
            tools_succeeded TEXT DEFAULT '[]',
            language TEXT DEFAULT 'Hindi',
            summary TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()


def create_call_log(room_name: str, participant_identity: str = "anonymous", channel: str = "browser") -> int:
    """Create a new call log entry when a session starts. Returns the call log ID."""
    init_call_analytics_db()
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO call_logs (room_name, participant_identity, channel, start_time, outcome)
        VALUES (?, ?, ?, ?, 'IN_PROGRESS')
    """, (room_name, participant_identity, channel, now))
    call_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return call_id


def update_call_outcome(
    call_id: int,
    outcome: str,
    failure_reason: str = "",
    tools_used: List[str] = None,
    tools_succeeded: List[str] = None,
    summary: str = "",
) -> Dict[str, Any]:
    """Update the call log with outcome when session ends."""
    init_call_analytics_db()
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    # Get start time to calculate duration
    cursor.execute("SELECT start_time FROM call_logs WHERE id = ?", (call_id,))
    row = cursor.fetchone()
    duration = 0.0
    if row:
        try:
            start = datetime.strptime(row["start_time"], "%Y-%m-%d %H:%M:%S")
            end = datetime.strptime(now, "%Y-%m-%d %H:%M:%S")
            duration = (end - start).total_seconds()
        except Exception:
            pass
    
    cursor.execute("""
        UPDATE call_logs
        SET end_time = ?, duration_seconds = ?, outcome = ?, failure_reason = ?,
            tools_used = ?, tools_succeeded = ?, summary = ?
        WHERE id = ?
    """, (
        now, duration, outcome, failure_reason,
        json.dumps(tools_used or []),
        json.dumps(tools_succeeded or []),
        summary,
        call_id,
    ))
    conn.commit()
    conn.close()
    return {"status": "updated", "call_id": call_id, "outcome": outcome, "duration": duration}


def get_call_analytics() -> Dict[str, Any]:
    """Get aggregated call analytics."""
    init_call_analytics_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM call_logs")
    total = cursor.fetchone()["total"]
    
    cursor.execute("SELECT COUNT(*) as cnt FROM call_logs WHERE outcome = 'SUCCESS'")
    successful = cursor.fetchone()["cnt"]
    
    cursor.execute("SELECT COUNT(*) as cnt FROM call_logs WHERE outcome = 'FAILED'")
    failed = cursor.fetchone()["cnt"]
    
    cursor.execute("SELECT COUNT(*) as cnt FROM call_logs WHERE outcome = 'IN_PROGRESS'")
    in_progress = cursor.fetchone()["cnt"]
    
    # Failure breakdown
    cursor.execute("""
        SELECT failure_reason, COUNT(*) as cnt
        FROM call_logs WHERE outcome = 'FAILED' AND failure_reason != ''
        GROUP BY failure_reason ORDER BY cnt DESC
    """)
    failure_breakdown = [{"reason": r["failure_reason"], "count": r["cnt"]} for r in cursor.fetchall()]
    
    # Average duration of completed calls
    cursor.execute("""
        SELECT AVG(duration_seconds) as avg_dur
        FROM call_logs WHERE outcome IN ('SUCCESS', 'FAILED') AND duration_seconds > 0
    """)
    avg_row = cursor.fetchone()
    avg_duration = round(avg_row["avg_dur"], 1) if avg_row and avg_row["avg_dur"] else 0
    
    success_rate = round((successful / total) * 100, 1) if total > 0 else 0
    
    conn.close()
    return {
        "total_calls": total,
        "successful_calls": successful,
        "failed_calls": failed,
        "in_progress": in_progress,
        "success_rate": success_rate,
        "avg_duration_seconds": avg_duration,
        "failure_breakdown": failure_breakdown,
    }


def get_recent_calls(limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent call logs (no PII exposed)."""
    init_call_analytics_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, room_name, channel, start_time, end_time, duration_seconds,
               outcome, failure_reason, tools_used, tools_succeeded, language
        FROM call_logs ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        tools = []
        try:
            tools = json.loads(r["tools_used"])
        except Exception:
            pass
        result.append({
            "id": r["id"],
            "room_name": r["room_name"],
            "channel": r["channel"],
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "duration_seconds": round(r["duration_seconds"], 1) if r["duration_seconds"] else 0,
            "outcome": r["outcome"],
            "failure_reason": r["failure_reason"],
            "tools_used": tools,
            "language": r["language"],
        })
    return result


def get_daily_chart_data(days: int = 7) -> List[Dict[str, Any]]:
    """Get daily aggregated call data for charts."""
    init_call_analytics_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            DATE(start_time) as day,
            COUNT(*) as total,
            SUM(CASE WHEN outcome = 'SUCCESS' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN outcome = 'FAILED' THEN 1 ELSE 0 END) as failed
        FROM call_logs
        WHERE start_time >= datetime('now', ? || ' days')
        GROUP BY DATE(start_time)
        ORDER BY day ASC
    """, (f"-{days}",))
    rows = cursor.fetchall()
    conn.close()
    return [{"date": r["day"], "total": r["total"], "successful": r["successful"], "failed": r["failed"]} for r in rows]
