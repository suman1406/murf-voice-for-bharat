import json
import logging
import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger("db")

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "farmer_memory.db")


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target_path = db_path or DEFAULT_DB_PATH
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[str] = None) -> None:
    """Initialize the SQLite database schema if it doesn't exist."""
    conn = get_connection(db_path)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS farmer_profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            language_preference TEXT DEFAULT 'Hindi',
            crops_grown TEXT,
            land_size TEXT,
            district TEXT,
            irrigation_type TEXT,
            last_interaction TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {db_path or DEFAULT_DB_PATH}")


def get_caller_profile(user_id: str, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Fetch a caller's memory profile by user_id or name."""
    init_db(db_path)
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM farmer_profiles WHERE user_id = ? OR LOWER(name) = LOWER(?)", 
        (user_id, user_id)
    )
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "user_id": row["user_id"],
        "name": row["name"],
        "language_preference": row["language_preference"] or "Hindi",
        "facts": {
            "crops_grown": row["crops_grown"] or "Not specified",
            "land_size": row["land_size"] or "Not specified",
            "district": row["district"] or "Not specified",
            "irrigation_type": row["irrigation_type"] or "Not specified",
        },
        "last_interaction": row["last_interaction"],
    }


def save_caller_profile(
    user_id: str,
    name: str,
    language_preference: str = "Hindi",
    crops_grown: str = "",
    land_size: str = "",
    district: str = "",
    irrigation_type: str = "",
    user_consented: bool = False,
    db_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Save or update a caller's profile. Strict requirement: user_consented must be True."""
    if not user_consented:
        logger.warning(f"Save attempt for user_id '{user_id}' aborted because user_consented is False.")
        return {
            "status": "denied",
            "saved": False,
            "message": "User consent was NOT granted. No data was saved to the database.",
        }

    init_db(db_path)
    conn = get_connection(db_path)
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()

    cursor.execute(
        """
        INSERT INTO farmer_profiles (user_id, name, language_preference, crops_grown, land_size, district, irrigation_type, last_interaction)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            name = excluded.name,
            language_preference = excluded.language_preference,
            crops_grown = excluded.crops_grown,
            land_size = excluded.land_size,
            district = excluded.district,
            irrigation_type = excluded.irrigation_type,
            last_interaction = excluded.last_interaction
        """,
        (
            user_id,
            name,
            language_preference,
            crops_grown,
            land_size,
            district,
            irrigation_type,
            now_iso,
        ),
    )
    conn.commit()
    conn.close()

    logger.info(f"Successfully saved profile for user_id '{user_id}' ({name}).")
    return {
        "status": "success",
        "saved": True,
        "message": f"Caller profile for {name} ({user_id}) successfully saved.",
        "profile": {
            "user_id": user_id,
            "name": name,
            "language_preference": language_preference,
            "facts": {
                "crops_grown": crops_grown,
                "land_size": land_size,
                "district": district,
                "irrigation_type": irrigation_type,
            },
            "last_interaction": now_iso,
        },
    }


def forget_caller_profile(user_id: str, db_path: Optional[str] = None) -> Dict[str, Any]:
    """Delete a caller's stored data permanently from the database."""
    init_db(db_path)
    conn = get_connection(db_path)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM farmer_profiles WHERE user_id = ? OR LOWER(name) = LOWER(?)", (user_id, user_id))
    rows_deleted = cursor.rowcount
    conn.commit()
    conn.close()

    if rows_deleted > 0:
        logger.info(f"Deleted profile for user_id '{user_id}'.")
        return {
            "status": "success",
            "deleted": True,
            "message": f"All memory and facts for '{user_id}' have been completely wiped.",
        }
    else:
        return {
            "status": "not_found",
            "deleted": False,
            "message": f"No profile found for user_id '{user_id}'.",
        }
