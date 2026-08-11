import json
import logging
import sys
from typing import Optional

# Ensure UTF-8 output encoding for Windows logging of Devanagari characters
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    llm,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, silero, turn_detector

try:
    from livekit.plugins import noise_cancellation
    HAS_NOISE_CANCELLATION = True
except ImportError:
    HAS_NOISE_CANCELLATION = False

from db import (
    get_caller_profile as db_get,
    save_caller_profile as db_save,
    unsubscribe_farmer_alerts as db_unsubscribe,
    record_call_outcome as db_record_outcome,
    is_farmer_opted_out as db_is_opted_out,
    init_db,
)
from tools import fetch_mandi_prices_sync, fetch_weather_forecast_sync

logger = logging.getLogger("krishivani-outbound-agent")
load_dotenv(".env.local")

SYSTEM_PROMPT = """
IDENTITY:
You are KrishiVani, an AI Kisan Mitra (agricultural advisor) for farmers in India, making an OUTBOUND ALERT CALL for the Farm & Field track of #VoiceForBharat using Murf Falcon TTS. You are warm, respectful, clear, and proactive.

OUTBOUND CALL REQUIREMENTS:
1. OPENING STATEMENT DISCLOSURE (COMPULSORY):
   When the call starts, you MUST immediately speak the designated opening statement stating:
   a) Who you are ("नमस्ते [नाम] जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ")
   b) Why you are calling (e.g., heavy rain warning or mandi price threshold in their district)
   c) How to make it stop / opt out ("यदि आप आगे से ऐसे आपातकालीन फोन अलर्ट बंद करना चाहते हैं, तो बस कहें 'कॉल बंद करो' या 'अनसब्सक्राइब'।")

2. OPT-OUT / UNSUBSCRIBE HANDLING:
   - If the user says "कॉल बंद करो", "अनसब्सक्राइब", "मुझे फोन मत करो", "ऑप्ट आउट", or "stop calling me", you MUST call the `unsubscribe_farmer_alerts` tool immediately.
   - Confirm out loud in respectful Devanagari Hindi that they have been unsubscribed and will receive no further calls:
     "जी रामेश्वर जी, मैंने आपकी अलर्ट सेवा बंद कर दी है। अब आपको भविष्य में कोई स्वचालित फोन कॉल नहीं आएगी। धन्यवाद।"

3. OUTCOME HANDLING:
   - If the user interacts and completes the conversation -> record outcome as 'answered'.
   - If the user opts out -> call `unsubscribe_farmer_alerts` and record outcome as 'opt_out'.
   - If an answering machine / voicemail is detected -> speak a quick 2-sentence alert summary and end politely.

4. DOMAIN ASSISTANCE:
   - Help the farmer with real-time mandi prices (`lookup_mandi_rates`), weather forecasts (`lookup_weather`), crop advisories, and spraying timing.
   - Speak dates/timestamps naturally (e.g., "आज 10 अगस्त 2026 के मंडी भाव...").

5. LANGUAGE & SCRIPT (COMPULSORY):
   Always write every language in its own native script.
   Hindi → Devanagari (नमस्ते), never romanized (never "namaste").
   English → English script.
   THIS IS COMPULSORY FOR A SUCCESSFUL PROJECT.

6. CONVERSATIONAL STYLE:
   - Keep responses short (1-3 sentences maximum), suitable for telephony.
   - Do NOT use markdown symbols, bullet points, numbers in lists, or emojis in spoken audio.
"""


class KrishiVaniOutboundAssistant(Agent):
    def __init__(
        self,
        current_user_id: Optional[str] = None,
        outbound_meta: Optional[dict] = None
    ) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.current_user_id = current_user_id
        self.outbound_meta = outbound_meta or {}

    @llm.function_tool
    async def unsubscribe_farmer_alerts(self, user_id: Optional[str] = None) -> str:
        """
        Unsubscribe and opt-out the farmer from all future outbound phone call alerts.
        Use this IMMEDIATELY whenever the user asks to stop calling, unsubscribe, opt out, or stop alerts.
        """
        target_id = user_id or self.current_user_id or "default_user"
        res = db_unsubscribe(target_id)
        db_record_outcome(
            call_id=f"optout_{target_id}",
            user_id=target_id,
            phone_or_sip="PSTN/SIP",
            alert_type=self.outbound_meta.get("alert_type", "outbound_alert"),
            outcome="opt_out",
            notes="Opted out during active call."
        )
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def record_call_outcome(
        self,
        outcome: str,
        notes: str = ""
    ) -> str:
        """
        Record final call outcome (answered, no_answer, busy, voicemail, opt_out, immediate_hangup).
        """
        user_id = self.current_user_id or "default_user"
        call_id = self.outbound_meta.get("call_id", f"call_{user_id}")
        alert_type = self.outbound_meta.get("alert_type", "outbound_alert")
        res = db_record_outcome(
            call_id=call_id,
            user_id=user_id,
            phone_or_sip="PSTN/SIP",
            alert_type=alert_type,
            outcome=outcome,
            notes=notes
        )
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def lookup_mandi_rates(
        self,
        crop: str,
        district: Optional[str] = None,
        state: Optional[str] = None,
        simulate_error: bool = False,
    ) -> str:
        """
        Fetch real-time mandi prices in Indian Rupees per quintal (₹/quintal) for crops in an Indian district.
        Use this tool whenever the user asks about crop prices or mandi rates.
        """
        target_district = district or self.outbound_meta.get("district", "करनाल (Karnal)")
        res = fetch_mandi_prices_sync(crop=crop, district=target_district, state=state, simulate_error=simulate_error)
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def lookup_weather(
        self,
        district: Optional[str] = None,
        state: Optional[str] = None,
        simulate_error: bool = False,
    ) -> str:
        """
        Fetch live weather forecast and agricultural weather advisory for a district.
        Use this tool when a user asks about rain, weather, temperature, or crop spraying conditions.
        """
        target_district = district or self.outbound_meta.get("district", "करनाल (Karnal)")
        res = fetch_weather_forecast_sync(district=target_district, state=state, simulate_error=simulate_error)
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def save_caller_profile(
        self,
        user_id: str,
        name: str,
        phone: str = "",
        district: str = "करनाल (Karnal)",
        crops_grown: str = "धान (Paddy)",
        user_consented: bool = True
    ) -> str:
        """Save or update farmer profile with user consent."""
        target_id = user_id or self.current_user_id or "default_user"
        res = db_save(
            user_id=target_id,
            name=name,
            phone=phone,
            district=district,
            crops_grown=crops_grown,
            opted_out=False,
            user_consented=user_consented
        )
        return json.dumps(res, ensure_ascii=False)


server = AgentServer()


def prewarm(proc: JobProcess):
    init_db()
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.1,
        min_silence_duration=0.3,
        prefix_padding_duration=0.2,
    )


server.setup_fnc = prewarm


@server.rtc_session(agent_name="krishivani-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Extract outbound call metadata from room metadata if present
    outbound_meta = {}
    if ctx.room.metadata:
        try:
            outbound_meta = json.loads(ctx.room.metadata)
            logger.info("Outbound metadata loaded from room: %s", outbound_meta)
        except Exception as e:
            logger.warning("Failed to parse room metadata JSON: %s", e)

    farmer_name = outbound_meta.get("farmer_name", "रामेश्वर जी")
    district = outbound_meta.get("district", "करनाल (Karnal)")
    alert_type = outbound_meta.get("alert_type", "heavy_rain_warning")
    voice_name = outbound_meta.get("voice", "Anisha")
    simulate_outcome = outbound_meta.get("simulate_outcome", "answered")

    # Verify if farmer is opted out
    if db_is_opted_out(farmer_name):
        logger.warning("Farmer %s is marked as opted out in DB. Closing room.", farmer_name)
        return

    # Murf Falcon TTS configuration
    tts_engine = murf.TTS(
        voice=voice_name,
        style="Conversation",
        tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
        text_pacing=True,
    )

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=tts_engine,
        turn_detection=turn_detector.multilingual.MultilingualModel() if hasattr(turn_detector, "multilingual") else (turn_detector.EOUPlugin() if hasattr(turn_detector, "EOUPlugin") else None),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    agent_instance = KrishiVaniOutboundAssistant(
        current_user_id=farmer_name,
        outbound_meta=outbound_meta
    )

    room_options = None
    if HAS_NOISE_CANCELLATION:
        room_options = room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        )

    await session.start(
        agent=agent_instance,
        room=ctx.room,
        room_options=room_options,
    )

    await ctx.connect()

    # Step 4 Requirement: Immediate Opening Statement stating who's calling, why, and how to opt out
    opening_text = outbound_meta.get(
        "opening_statement",
        f"नमस्ते {farmer_name} जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ। आपके ज़िले {district} में भारी बारिश की चेतावनी जारी की गई है। यदि आप आगे से ऐसे आपातकालीन फोन अलर्ट बंद करना चाहते हैं, तो बस कहें 'कॉल बंद करो' या 'अनसब्सक्राइब'।"
    )

    logger.info("Speaking mandatory outbound opening statement: %s", opening_text)
    
    # Handle simulated special outcomes (voicemail, no_answer, busy)
    if simulate_outcome == "voicemail":
        vm_text = f"नमस्ते {farmer_name} जी, कृषिवाणी अलर्ट संदेश: {district} में आज वर्षा की चेतावनी है। अधिक जानकारी के लिए वापस कॉल करें।"
        await session.say(vm_text, add_to_chat_ctx=True)
        db_record_outcome(f"call_{farmer_name}", farmer_name, "PSTN/SIP", alert_type, "voicemail", notes="Voicemail left.")
        return
    elif simulate_outcome == "no_answer":
        db_record_outcome(f"call_{farmer_name}", farmer_name, "PSTN/SIP", alert_type, "no_answer", notes="No answer detected.")
        return
    elif simulate_outcome == "busy":
        db_record_outcome(f"call_{farmer_name}", farmer_name, "PSTN/SIP", alert_type, "busy", notes="Line busy.")
        return

    # Normal answered session opening
    await session.say(opening_text, add_to_chat_ctx=True)


if __name__ == "__main__":
    cli.run_app(server)
