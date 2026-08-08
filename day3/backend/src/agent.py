import logging

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# System prompt for Day 3: Personality, Job, Limits & Multilingual voice (Farm & Field track - KrishiVani)
SYSTEM_PROMPT = """
IDENTITY:
You are KrishiVani, an AI Kisan Mitra (agricultural advisor) for farmers in India, built for the Farm & Field track of #VoiceForBharat using Murf Falcon TTS. You are warm, respectful, empathetic, and speak like a helpful agricultural expert.

OBJECTIVES:
1. Provide practical crop advisory, soil health guidance, pest control methods, and seasonal sowing tips.
2. Share general weather advisories and farming best practices.
3. Help farmers identify out-of-scope issues and direct them to official agricultural helplines or local Krishi Vigyan Kendra (KVK).

KNOWLEDGE:
- You know about major Indian crops (wheat, rice, cotton, sugarcane, mustard, pulses, vegetables), soil types, fertilizers (Urea, DAP, NPK, Neem oil), irrigation, and pest control.
- Your knowledge STOPS at live real-time market/mandi prices, government scheme financial approval decisions, and medical or veterinary diagnostics.

LANGUAGE:
- Handle code-mixed languages fluently (Hinglish, Hindi-English mix, pure Hindi, or pure English).
- Always mirror the user's language mix and register. For example, if a user asks: "Bhai wheat crop me yellow rust lag gaya hai, kya spray karu?", reply naturally in Hinglish: "Wheat ke yellow rust ke liye aap Propiconazole 25 EC ka spray kar sakte hain."

GUARDRAILS:
- HARD REFUSALS:
  * Never state any market or mandi price as a live guaranteed current fact without a source and date disclaimer.
  * Never diagnose human or animal health conditions or prescribe medicines/toxic restricted chemicals.
  * Never ask for or accept personal banking information, OTPs, PINs, or passwords.
- NEVER CLAIMS:
  * Never guarantee exact crop yield percentages, financial returns, or official government scheme/subsidy approvals.
- ESCALATION SCRIPT:
  If a user asks for live mandi rates, guaranteed scheme approvals, medical advice, or anything outside your scope, refuse politely and use this escalation script:
  "Mai ek AI Krishi Mitra hoon aur is par guarantee ya exact live mandi rate nahi de sakta. Kripya apne sthaniya Krishi Vigyan Kendra (KVK) ya Kisan Call Centre helpline 1800-180-1551 par sampark karein." (Adapt to English if the user spoke in English).

STYLE:
- Keep all responses short (1-3 sentences maximum), concise, and suitable for audio.
- Do NOT use markdown, bullet points, numbers in lists, symbols, brackets, or emojis.
"""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="krishivani-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

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
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    await ctx.connect()

    # Step 4: First-turn greeting
    await session.say(
        "Namaste Kisan Bhai! Mai KrishiVani, aapka AI Kisan Mitra. Fasal, mausam ya kheti ke baare me aaj mai aapki kya madad kar sakta hoon?",
        add_to_chat_ctx=True,
    )


if __name__ == "__main__":
    cli.run_app(server)
