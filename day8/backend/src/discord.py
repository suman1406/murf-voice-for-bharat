import logging
import os
from typing import Any, Dict
import httpx

logger = logging.getLogger("krishivani-discord")


async def send_discord_webhook(escalation_data: Dict[str, Any]) -> bool:
    """
    Sends a formatted rich embed to Discord webhook when an escalation is created.
    If DISCORD_WEBHOOK_URL is not set, logs the request gracefully without error.
    """
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        logger.info("DISCORD_WEBHOOK_URL not configured. Skipping Discord notification.")
        return False

    urgency = escalation_data.get("urgency", "MEDIUM").upper()

    # Color code by urgency: Red for HIGH/EMERGENCY, Orange for MEDIUM, Blue for LOW
    color_map = {
        "EMERGENCY": 0xFF0000,
        "HIGH": 0xFF4500,
        "MEDIUM": 0xFFA500,
        "LOW": 0x1E90FF,
    }
    color = color_map.get(urgency, 0xFFA500)

    embed = {
        "title": f"🚨 Human Help Escalation Request [{escalation_data.get('reference_id')}]",
        "description": escalation_data.get("summary", "No summary provided."),
        "color": color,
        "fields": [
            {
                "name": "👤 Caller Name",
                "value": escalation_data.get("caller_name", "Kisan"),
                "inline": True,
            },
            {
                "name": "📞 Contact / Method",
                "value": f"{escalation_data.get('caller_phone', 'Not provided')} ({escalation_data.get('preferred_contact_method', 'Call')})",
                "inline": True,
            },
            {
                "name": "⚡ Urgency Level",
                "value": urgency,
                "inline": True,
            },
            {
                "name": "🏷️ Issue Category",
                "value": escalation_data.get("issue_category", "severe_crop_problem"),
                "inline": True,
            },
            {
                "name": "🗣️ Language",
                "value": escalation_data.get("language", "Hindi"),
                "inline": True,
            },
            {
                "name": "🔍 Agent Diagnostics",
                "value": escalation_data.get("checked_by_agent", "None"),
                "inline": False,
            },
        ],
        "footer": {
            "text": "KrishiVani Voice AI Agent • Day 7 #VoiceForBharat • Murf Falcon TTS"
        },
    }

    payload = {
        "username": "KrishiVani Kisan Escalation Bot",
        "avatar_url": "https://murf.ai/favicon.ico",
        "embeds": [embed],
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(webhook_url, json=payload, timeout=5.0)
            if resp.status_code in (200, 204):
                logger.info(f"Successfully posted escalation {escalation_data.get('reference_id')} to Discord.")
                return True
            else:
                logger.error(f"Failed to post to Discord. Status: {resp.status_code}, body: {resp.text}")
                return False
    except Exception as e:
        logger.error(f"Error sending Discord webhook: {e}")
        return False
