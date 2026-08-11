import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from datetime import datetime
from dotenv import load_dotenv

from livekit import api
from db import init_db, record_call_outcome, get_caller_profile, save_caller_profile, is_farmer_opted_out

load_dotenv(".env.local")
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s - %(message)s")
logger = logging.getLogger("krishivani-outbound-cli")


def build_alert_metadata(
    farmer_name: str,
    district: str,
    alert_type: str,
    crop: str = "धान (Paddy)",
    voice: str = "Anisha",
    simulate_outcome: str = "answered"
) -> dict:
    """Construct structured JSON metadata for outbound call dispatch."""
    alert_descriptions = {
        "heavy_rain_warning": "आज रात करनाल जिले में भारी बारिश और 50km/h की आंधी की गंभीर चेतावनी जारी की गई है।",
        "mandi_price_surge": f"करनाल मंडी में आज {crop} का भाव ₹2,400 से बढ़कर ₹2,680 प्रति क्विंटल हो गया है।",
        "pest_advisory": f"{crop} की फसल में तना छेदक कीट (Stem Borer) का प्रकोप देखा गया है, तुरंत नीम तेल का छिड़काव करें।",
        "routine_practice": "आपकी साप्ताहिक फसल समीक्षा का समय हो गया है।"
    }
    
    details = alert_descriptions.get(alert_type, alert_descriptions["heavy_rain_warning"])
    
    # Mandatory Opening Statement according to Step 4 requirements:
    # Sentence 1 & 2: Say who's calling, why, and how to opt out!
    opening_statement = (
        f"नमस्ते {farmer_name} जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ। "
        f"आपके ज़िले {district} के लिए {details} "
        f"यदि आप आगे से ऐसे आपातकालीन फोन अलर्ट प्राप्त नहीं करना चाहते हैं, तो आप बस 'कॉल बंद करो' या 'अनसब्सक्राइब' कह सकते हैं।"
    )
    
    return {
        "outbound_call": True,
        "farmer_name": farmer_name,
        "district": district,
        "crop": crop,
        "alert_type": alert_type,
        "alert_details": details,
        "opening_statement": opening_statement,
        "voice": voice,
        "simulate_outcome": simulate_outcome,
        "timestamp": datetime.now().isoformat()
    }


async def initiate_outbound_call(
    phone_or_sip: str,
    farmer_name: str = "रामेश्वर जी",
    district: str = "करनाल (Karnal)",
    alert_type: str = "heavy_rain_warning",
    crop: str = "धान (Paddy)",
    voice: str = "Anisha",
    simulate_outcome: str = "answered",
    sip_trunk_id: str = None
) -> dict:
    """
    Trigger an outbound call using LiveKit SIP or Agent Dispatch.
    """
    init_db()
    
    # Step 1: Check opt-out status
    if is_farmer_opted_out(phone_or_sip) or is_farmer_opted_out(farmer_name):
        logger.warning("Farmer %s (%s) has opted out from outbound calls. Aborting call.", farmer_name, phone_or_sip)
        call_id = f"call_{uuid.uuid4().hex[:8]}"
        record_call_outcome(call_id, farmer_name, phone_or_sip, alert_type, "opt_out", notes="Farmer already opted out.")
        return {
            "status": "opted_out",
            "message": f"किसान {farmer_name} ने पहले से आउटबाउंड अलर्ट अनसब्सक्राइब किया हुआ है।",
            "call_id": call_id
        }

    lk_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    trunk_id = sip_trunk_id or os.getenv("SIP_OUTBOUND_TRUNK_ID")
    
    if not lk_url or not api_key or not api_secret:
        raise ValueError("LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET must be set in .env.local")

    room_name = f"outbound_{alert_type}_{uuid.uuid4().hex[:6]}"
    metadata_dict = build_alert_metadata(farmer_name, district, alert_type, crop, voice, simulate_outcome)
    metadata_json = json.dumps(metadata_dict, ensure_ascii=False)
    
    call_id = f"call_{uuid.uuid4().hex[:8]}"
    logger.info("Initiating Outbound Call [%s] to '%s' (%s) - Alert: %s", call_id, farmer_name, phone_or_sip, alert_type)

    async with api.LiveKitAPI(lk_url, api_key, api_secret) as lk:
        # If SIP trunk ID is available and phone/SIP target looks like phone or SIP URI
        if trunk_id and trunk_id != "ST_EXAMPLE_OUTBOUND_TRUNK" and (phone_or_sip.startswith("+") or "sip:" in phone_or_sip):
            logger.info("Using LiveKit SIP Outbound Trunk '%s' to dial '%s'", trunk_id, phone_or_sip)
            sip_req = api.CreateSIPParticipantRequest(
                sip_trunk_id=trunk_id,
                sip_call_to=phone_or_sip,
                room_name=room_name,
                participant_identity=f"sip_{call_id}",
                participant_name=farmer_name,
                participant_metadata=metadata_json,
                wait_until_answered=False
            )
            participant = await lk.sip.create_sip_participant(sip_req)
            logger.info("SIP Participant created: %s", participant.sid)
        else:
            logger.info("Dispatching Agent worker to room '%s' for outbound call simulation", room_name)
            dispatch_req = api.CreateAgentDispatchRequest(
                agent_name="krishivani-agent",
                room=room_name,
                metadata=metadata_json
            )
            dispatch = await lk.agent_dispatch.create_dispatch(dispatch_req)
            logger.info("Agent Dispatch created successfully: ID=%s, Room=%s", dispatch.id, room_name)

    # Log initial outcome attempt
    record_call_outcome(
        call_id=call_id,
        user_id=farmer_name,
        phone_or_sip=phone_or_sip,
        alert_type=alert_type,
        outcome=simulate_outcome,
        notes=f"Dispatched to room {room_name} using voice {voice}"
    )

    return {
        "status": "success",
        "call_id": call_id,
        "room_name": room_name,
        "farmer_name": farmer_name,
        "phone_or_sip": phone_or_sip,
        "alert_type": alert_type,
        "opening_statement": metadata_dict["opening_statement"],
        "simulated_outcome": simulate_outcome
    }


def main():
    parser = argparse.ArgumentParser(description="KrishiVani Outbound Call Dispatcher CLI")
    parser.add_argument("--phone", default="+919876543210", help="Phone number or SIP URI (e.g. sip:krishivani@sip.linphone.org)")
    parser.add_argument("--name", default="रामेश्वर जी", help="Farmer name")
    parser.add_argument("--district", default="करनाल (Karnal)", help="Farmer district")
    parser.add_argument("--alert", default="heavy_rain_warning", choices=["heavy_rain_warning", "mandi_price_surge", "pest_advisory", "routine_practice"], help="Alert trigger type")
    parser.add_argument("--crop", default="धान (Paddy)", help="Target crop")
    parser.add_argument("--voice", default="Anisha", choices=["Anisha", "Samar", "Pooja"], help="Murf Falcon TTS Voice")
    parser.add_argument("--outcome", default="answered", choices=["answered", "no_answer", "busy", "voicemail", "opt_out", "immediate_hangup"], help="Simulated call outcome")
    parser.add_argument("--trunk", help="SIP Outbound Trunk ID")
    
    args = parser.parse_args()
    
    # Ensure Windows console encoding
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
        
    res = asyncio.run(initiate_outbound_call(
        phone_or_sip=args.phone,
        farmer_name=args.name,
        district=args.district,
        alert_type=args.alert,
        crop=args.crop,
        voice=args.voice,
        simulate_outcome=args.outcome,
        sip_trunk_id=args.trunk
    ))
    
    print("\n==========================================")
    print("📞 KRISHIVANI OUTBOUND CALL DISPATCH RESULT")
    print("==========================================")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
