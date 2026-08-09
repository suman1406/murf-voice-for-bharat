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
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero, turn_detector

from db import forget_caller_profile as db_forget
from db import get_caller_profile as db_get
from db import init_db
from db import save_caller_profile as db_save

logger = logging.getLogger("krishivani-agent")

load_dotenv(".env.local")

SYSTEM_PROMPT = """
IDENTITY:
You are KrishiVani, an AI Kisan Mitra (agricultural advisor) for farmers in India, built for the Farm & Field track of #VoiceForBharat using Murf Falcon TTS. You are warm, respectful, empathetic, and speak like a knowledgeable agricultural expert.

OBJECTIVES:
1. Provide practical crop advisory, soil health guidance, pest control methods, and seasonal sowing tips.
2. Greet returning farmers by name and follow up on their crops, land, and district from previous conversations.
3. Explicitly ask for consent before saving any caller information or facts into memory.
4. Save, lookup, or erase caller memory strictly via function tools.

KNOWLEDGE & SCOPE:
- You know about major Indian crops (wheat, rice, cotton, sugarcane, mustard, pulses, vegetables), soil types, fertilizers (Urea, DAP, NPK, Neem oil), irrigation methods, and pest control.
- SCOPE LIMITS: You CANNOT give live real-time market/mandi prices or official government scheme financial decisions. If asked, escalate politely:
  "मैं एक AI कृषि मित्र हूँ। लाइव मंडी भाव या गारंटीड स्कीम अप्रूवल के लिए कृपया किसान कॉल सेंटर हेल्पलाइन 1800-180-1551 पर संपर्क करें।"

LANGUAGE & SCRIPT:
- Always write every language in its own native script.
  * Hindi → Devanagari (नमस्ते), never romanized (never "namaste").
  * English → Standard English text.
- If the user speaks Hindi, reply in clean Devanagari Hindi. If the user speaks English, reply in English.

MEMORY & PRIVACY GUARDRAILS:
- When a caller tells you their name, crops grown, land size, district, or irrigation type, you MUST ask for permission BEFORE saving:
  "क्या मैं आपकी जानकारी जैसे आपका नाम, फसल और ज़िला याद रख सकता हूँ ताकि अगली बार आपकी बेहतर मदद कर सकूँ?"
- Call `save_caller_profile` with `user_consented=True` ONLY when the user explicitly agrees (says "हाँ", "yes", "sure", etc.).
- If the user says NO or refuses, DO NOT call `save_caller_profile` (or call with `user_consented=False`) and reply: "ठीक है, मैं आपकी जानकारी सेव नहीं करूँगा।"
- If the caller asks to forget them or delete their data ("Forget me", "मेरा डेटा डिलीट कर दो"), call `forget_caller_profile` immediately and confirm that their data has been erased.

STYLE:
- Keep all responses short (1-3 sentences maximum), natural, concise, and suitable for audio TTS.
- Do NOT use markdown symbols, bullet points, numbers in lists, asterisks, or emojis in audio text.
"""


class KrishiVaniAssistant(Agent):
    def __init__(self, current_user_id: Optional[str] = None) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.current_user_id = current_user_id

    @llm.function_tool
    async def lookup_caller(self, user_id: str) -> str:
        """Look up caller's saved profile and farming facts in the database by user_id or name."""
        target_id = user_id or self.current_user_id or "default_user"
        profile = db_get(target_id)
        if profile:
            logger.info(f"Tool lookup_caller found profile for {target_id}: {profile['name']}")
            return json.dumps(profile, ensure_ascii=False)
        return json.dumps({"status": "not_found", "message": f"No stored profile found for '{target_id}'."}, ensure_ascii=False)

    @llm.function_tool
    async def save_caller_profile(
        self,
        user_id: str,
        name: str,
        language_preference: str = "Hindi",
        crops_grown: str = "",
        land_size: str = "",
        district: str = "",
        irrigation_type: str = "",
        user_consented: bool = False,
    ) -> str:
        """Save or update caller profile and farming facts ONLY IF user_consented is True. You MUST ask the caller for permission before calling this."""
        target_id = user_id or self.current_user_id or "default_user"
        res = db_save(
            user_id=target_id,
            name=name,
            language_preference=language_preference,
            crops_grown=crops_grown,
            land_size=land_size,
            district=district,
            irrigation_type=irrigation_type,
            user_consented=user_consented,
        )
        logger.info(f"Tool save_caller_profile result for {target_id}: {res['status']}")
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def forget_caller_profile(self, user_id: str) -> str:
        """Permanently delete caller profile and all stored facts from the database when requested by the caller."""
        target_id = user_id or self.current_user_id or "default_user"
        res = db_forget(target_id)
        logger.info(f"Tool forget_caller_profile result for {target_id}: {res['status']}")
        return json.dumps(res, ensure_ascii=False)


server = AgentServer()


def prewarm(proc: JobProcess):
    init_db()
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="krishivani-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Extract participant identity if available
    participant_identity = "default_user"
    for participant in ctx.room.remote_participants.values():
        if participant.identity:
            participant_identity = participant.identity
            break

    logger.info(f"Session started for room '{ctx.room.name}', participant identity: '{participant_identity}'")

    # Retrieve caller profile from DB
    profile = db_get(participant_identity)

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.LLM(
            model="gemini-2.5-flash",
        ),
        tts=murf.TTS(
            voice="Anisha",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=turn_detector.EOUModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    agent_instance = KrishiVaniAssistant(current_user_id=participant_identity)

    await session.start(
        agent=agent_instance,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    await ctx.connect()

    # Dynamic first-turn greeting
    if profile:
        name = profile["name"]
        district = profile["facts"]["district"]
        crops = profile["facts"]["crops_grown"]

        if district != "Not specified" and crops != "Not specified":
            greeting = f"नमस्ते {name} जी! स्वागत है आपका दोबारा। {district} में आपकी {crops} की फसल कैसी चल रही है? आज मैं आपकी क्या मदद कर सकता हूँ?"
        else:
            greeting = f"नमस्ते {name} जी! कृषिवाणी में आपका स्वागत है दोबारा। आज मैं आपकी फसल या खेती के बारे में क्या मदद कर सकता हूँ?"
    else:
        greeting = "नमस्ते किसान भाई! मैं कृषिवाणी, आपका AI किसान मित्र। फसल, मौसम या खेती के बारे में आज मैं आपकी क्या मदद कर सकता हूँ?"

    await session.say(
        greeting,
        add_to_chat_ctx=True,
    )


if __name__ == "__main__":
    cli.run_app(server)
