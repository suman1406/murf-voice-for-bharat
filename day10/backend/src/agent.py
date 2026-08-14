import asyncio
import json
import logging
import sys
from typing import Optional

# Ensure UTF-8 output encoding for Windows logging of Devanagari characters
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
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
from livekit.plugins import deepgram, google, murf, silero

from db import (
    create_escalation_db,
    forget_caller_profile as db_forget,
    get_caller_profile as db_get,
    init_db,
    save_caller_profile as db_save,
)
from call_analytics_db import (
    create_call_log,
    init_call_analytics_db,
    update_call_outcome,
)
from discord import send_discord_webhook
from privacy import sanitize_summary
from tools import fetch_mandi_prices_sync, fetch_weather_forecast_sync

logger = logging.getLogger("krishivani-day10-agent")

load_dotenv(".env.local")

SYSTEM_PROMPT = """
IDENTITY:
You are KrishiVani, an AI Kisan Mitra (agricultural voice advisor) for farmers in India, built for the Farm & Field track of #VoiceForBharat using Murf Falcon TTS. You are respectful, empathetic, clear, and speak like a knowledgeable agricultural expert.

OBJECTIVES:
1. Provide real-time mandi prices, weather forecasts, and crop advisories.
2. Greet returning farmers by name and follow up on their stored crop and district facts.
3. Automatically call domain data tools (`lookup_mandi_rates`, `lookup_weather`) whenever farmers ask about market prices, weather, rain, or crop spraying conditions.
4. HAND OFF TO CROP DOCTOR SPECIALIST: If the farmer describes a specific crop problem, pest/insect attack, leaf yellowing/spots, plant disease, or requests a crop doctor or expert, tell the caller you are connecting them to the crop specialist, and immediately call `transfer_to_crop_doctor`.
5. KNOW WHEN TO ASK FOR HUMAN HELP: For non-crop issues that require human expert intervention (e.g. data missing, insurance dispute, subsidy problems), ask for explicit permission and call `create_escalation`.

HUMAN HELP & ESCALATION WORKFLOW:
- STEP 1 (ASK PERMISSION): When a human-help situation occurs, BEFORE creating an escalation request, tell the caller what information you want to send and ask for explicit permission:
  "क्या मैं आपकी समस्या की रिपोर्ट और संपर्क विवरण कृषि विशेषज्ञ (Kisan Expert) के पास भेज दूँ ताकि वे आपसे संपर्क कर सकें?"
- STEP 2 (CALL TOOL): If the user agrees, call `create_escalation` with `user_consented=True`.
- STEP 3 (CLEAR NEXT STEP): Once created, speak the returned reference ID (e.g. "REF-KV-8492") and give the caller a clear, honest next step:
  "आपका संदर्भ कोड REF-KV-8492 दर्ज कर लिया गया है। हमारे कृषि विशेषज्ञ अगले 24 घंटों में आपके फोन पर संपर्क करेंगे।"
- STEP 4 (REFUSAL): If the caller says NO to human help, do NOT call `create_escalation` and confirm respectfully.

LANGUAGE & SCRIPT:
Always write every language in its own native script.
Hindi → Devanagari (नमस्ते), never romanized (never "namaste").
Same rule for all non-English languages.
If the user speaks Hindi, reply in clean Devanagari Hindi. If the user speaks English, reply in English.

MEMORY & PRIVACY GUARDRAILS:
- Do NOT send passwords, OTPs, PINs, bank numbers, or private credentials in escalation summaries.
- Save farmer facts ONLY when explicit permission is granted (`save_caller_profile` with `user_consented=True`).
- If asked to forget ("Forget me", "मेरा डेटा डिलीट कर दो"), call `forget_caller_profile` immediately.

STYLE:
- Keep all responses short (1-3 sentences maximum), natural, concise, and suitable for audio TTS.
- Do NOT use markdown symbols, bullet points, numbers in lists, asterisks, or emojis in audio text.
"""

SPECIALIST_SYSTEM_PROMPT = """
IDENTITY:
You are the KrishiVani Crop Specialist (फ़सल डॉक्टर - Crop Doctor). You are an expert in diagnosing plant diseases, managing pests (such as Pink Bollworm, Locusts, Fall Armyworm), treating leaf yellowing, root rot, and recommending exact pesticide/fertilizer applications.

OBJECTIVES:
1. Diagnose the farmer's crop health symptoms (insects, leaf spots, rot, slow growth).
2. Recommend immediate, actionable organic or chemical treatments suitable for Indian farmers.
3. Be reassuring, technical but easy to understand, and highly empathetic.
4. Keep the conversation context from the main agent in mind. Do not ask for the crop or basic facts if already provided.
5. If the farmer changes the topic to general weather or mandi rates, politely remind them that you are the Crop Doctor and advise on crop health only.

LANGUAGE & SCRIPT:
Always write every language in its own native script.
Hindi → Devanagari (नमस्ते), never romanized (never "namaste").
Same rule for all non-English languages.
If the user speaks Hindi, reply in clean Devanagari Hindi. If the user speaks English, reply in English.

STYLE:
- Keep all responses short (1-3 sentences maximum), natural, concise, and suitable for audio TTS.
- Do NOT use markdown symbols, bullet points, numbers in lists, asterisks, or emojis in audio text.
"""


class CropSpecialistAgent(Agent):
    def __init__(self, current_user_id: Optional[str] = None, chat_ctx: Optional[llm.ChatContext] = None) -> None:
        kwargs = {}
        if chat_ctx is not None:
            kwargs["chat_ctx"] = chat_ctx.copy(exclude_instructions=True)
        super().__init__(instructions=SPECIALIST_SYSTEM_PROMPT, **kwargs)
        self.current_user_id = current_user_id

    async def on_enter(self) -> None:
        name = "किसान भाई"
        if self.current_user_id:
            prof = db_get(self.current_user_id)
            if prof and prof.get("name"):
                name = prof["name"]
        
        greeting = f"नमस्कार {name} जी! मैं कृषिवाणी फ़सल डॉक्टर हूँ। आपकी फसल में कीट या बीमारी की समस्या की जांच करने में मैं आपकी पूरी मदद करूँगा। कृपया अपनी समस्या विस्तार से बताएँ।"
        await self.session.say(greeting, add_to_chat_ctx=True)


class KrishiVaniAssistant(Agent):
    def __init__(self, current_user_id: Optional[str] = None) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.current_user_id = current_user_id

    @llm.function_tool
    async def create_escalation(
        self,
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
    ) -> str:
        """
        Create a human help request (escalation ticket) for a senior agricultural specialist or Kisan Call Center.
        MUST ONLY be called when user_consented is True (caller gave permission).

        - issue_category: 'severe_crop_problem', 'out_of_scope_query', 'missing_data', or 'human_expert_requested'.
        - urgency: 'LOW', 'MEDIUM', 'HIGH', or 'EMERGENCY'.
        - summary: Concise summary of what happened, caller's crop/district issue, and what was checked. Do NOT include passwords/OTPs/private numbers.
        """
        target_id = user_id or self.current_user_id or "default_user"

        if not user_consented:
            return json.dumps(
                {
                    "status": "refused",
                    "message": "User declined permission to share information with a human expert.",
                    "reference_id": None,
                },
                ensure_ascii=False,
            )

        # Apply PII scrubbing
        clean_summary = sanitize_summary(summary)

        res = create_escalation_db(
            user_id=target_id,
            caller_name=caller_name,
            caller_phone=caller_phone,
            preferred_contact_method=preferred_contact_method,
            language=language,
            issue_category=issue_category,
            urgency=urgency,
            summary=clean_summary,
            checked_by_agent=checked_by_agent,
            user_consented=user_consented,
        )

        ref_id = res.get("reference_id")

        # Async Discord webhook dispatch
        escalation_payload = {
            "reference_id": ref_id,
            "user_id": target_id,
            "caller_name": caller_name,
            "caller_phone": caller_phone,
            "preferred_contact_method": preferred_contact_method,
            "language": language,
            "issue_category": issue_category,
            "urgency": urgency,
            "summary": clean_summary,
            "checked_by_agent": checked_by_agent,
        }
        asyncio.create_task(send_discord_webhook(escalation_payload))

        next_steps_msg = f"संदर्भ कोड {ref_id}। हमारे वरिष्ठ कृषि विशेषज्ञ अगले 24 घंटों में आपसे संपर्क करेंगे।"

        return json.dumps(
            {
                "status": res["status"],
                "reference_id": ref_id,
                "urgency": urgency,
                "is_duplicate_updated": res.get("is_duplicate_updated", False),
                "next_steps": next_steps_msg,
                "message": res["message"],
            },
            ensure_ascii=False,
        )

    @llm.function_tool
    async def transfer_to_crop_doctor(self) -> Agent:
        """
        Connect the farmer to our specialized Crop Doctor (फ़सल विशेषज्ञ / फ़सल डॉक्टर) for diagnosing crop diseases, plant pests, leaf spots, insect attacks, crop decay, or crop damage.
        Use this tool ONLY when the user mentions crop diseases, pests, insects, crop damage, leaf yellowing, or explicitly requests a crop specialist/doctor.
        """
        logger.info("Main agent is transferring call to CropSpecialistAgent")
        return CropSpecialistAgent(current_user_id=self.current_user_id, chat_ctx=self.chat_ctx)

    @llm.function_tool
    async def lookup_mandi_rates(
        self,
        crop: str,
        district: Optional[str] = None,
        state: Optional[str] = None,
        simulate_error: bool = False,
    ) -> str:
        """
        Fetch real-time market prices (mandi rates) in Indian Rupees per quintal (₹/quintal) for crops in an Indian district or state.
        Use this tool whenever the user asks about crop prices, mandi rates, market rates, or selling prices.
        """
        target_district = district
        if not target_district and self.current_user_id:
            prof = db_get(self.current_user_id)
            if prof and prof.get("facts", {}).get("district") != "Not specified":
                target_district = prof["facts"]["district"]

        target_district = target_district or "करनाल (Karnal)"
        res = fetch_mandi_prices_sync(
            crop=crop, district=target_district, state=state, simulate_error=simulate_error
        )
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def lookup_weather(
        self,
        district: Optional[str] = None,
        state: Optional[str] = None,
        simulate_error: bool = False,
    ) -> str:
        """
        Fetch real live weather forecast and agricultural weather advisory for a district in India.
        Use this tool when a user asks about rain, weather, temperature, storm, irrigation timing, or crop spraying conditions.
        """
        target_district = district
        if not target_district and self.current_user_id:
            prof = db_get(self.current_user_id)
            if prof and prof.get("facts", {}).get("district") != "Not specified":
                target_district = prof["facts"]["district"]

        target_district = target_district or "करनाल (Karnal)"
        res = fetch_weather_forecast_sync(
            district=target_district, state=state, simulate_error=simulate_error
        )
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def lookup_caller(self, user_id: str) -> str:
        """Look up caller's saved profile and farming facts in the database by user_id or name."""
        target_id = user_id or self.current_user_id or "default_user"
        profile = db_get(target_id)
        if profile:
            return json.dumps(profile, ensure_ascii=False)
        return json.dumps(
            {"status": "not_found", "message": f"No stored profile found for '{target_id}'."},
            ensure_ascii=False,
        )

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
        """Save or update caller profile and farming facts ONLY IF user_consented is True."""
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
        return json.dumps(res, ensure_ascii=False)

    @llm.function_tool
    async def forget_caller_profile(self, user_id: str) -> str:
        """Permanently delete caller profile and all stored facts from the database when requested."""
        target_id = user_id or self.current_user_id or "default_user"
        res = db_forget(target_id)
        return json.dumps(res, ensure_ascii=False)


server = AgentServer()


def prewarm(proc: JobProcess):
    init_db()
    init_call_analytics_db()
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.1,
        min_silence_duration=0.3,
        prefix_padding_duration=0.2,
    )


server.setup_fnc = prewarm


@server.rtc_session(agent_name="krishivani-day10-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    participant_identity = "default_user"
    for participant in ctx.room.remote_participants.values():
        if participant.identity:
            participant_identity = participant.identity
            break

    # Determine channel type
    channel = "browser"
    for participant in ctx.room.remote_participants.values():
        if participant.kind and str(participant.kind).lower().find("sip") != -1:
            channel = "sip"
            break

    # Create call log entry
    call_id = create_call_log(
        room_name=ctx.room.name,
        participant_identity=participant_identity,
        channel=channel,
    )
    logger.info(f"Call log created: id={call_id}, room={ctx.room.name}, user={participant_identity}")

    # Track tools used during the session
    tools_used = []
    tools_succeeded = []

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
        vad=ctx.proc.userdata["vad"],
    )

    agent_instance = KrishiVaniAssistant(current_user_id=participant_identity)

    # Hook into function tool calls to track which tools are used
    @session.on("function_calls_finished")
    def on_function_calls_finished(event):
        for fn_call in event.function_calls:
            tool_name = fn_call.function_info.name if hasattr(fn_call, 'function_info') else str(fn_call)
            if tool_name not in tools_used:
                tools_used.append(tool_name)
            # If the call didn't error, mark as succeeded
            if not (hasattr(fn_call, 'error') and fn_call.error):
                if tool_name not in tools_succeeded:
                    tools_succeeded.append(tool_name)
        logger.info(f"Tools used so far: {tools_used}, succeeded: {tools_succeeded}")

    # Always provide a valid RoomOptions (required by livekit-agents 1.6.9+)
    room_options = room_io.RoomOptions()

    await session.start(
        agent=agent_instance,
        room=ctx.room,
        room_options=room_options,
    )

    await ctx.connect()

    if profile:
        name = profile["name"]
        greeting = f"नमस्ते {name} जी! कृषिवाणी में आपका स्वागत है। आज मैं मंडी भाव, मौसम या किसी फसल समस्या में आपकी क्या मदद कर सकता हूँ?"
    else:
        greeting = "नमस्ते किसान भाई! मैं कृषिवाणी, आपका AI किसान मित्र। मंडी भाव, मौसम या किसी फसल समस्या में आज मैं आपकी क्या मदद कर सकता हूँ?"

    await session.say(
        greeting,
        add_to_chat_ctx=True,
    )

    # Wait for the session to end (participant disconnects)
    try:
        await ctx.wait_for_shutdown()
    except Exception as e:
        logger.warning(f"Session ended with exception: {e}")
    finally:
        # Evaluate success or failure
        success_tools = {"lookup_mandi_rates", "lookup_weather", "create_escalation", "transfer_to_crop_doctor"}
        used_success_tools = [t for t in tools_succeeded if t in success_tools]

        if used_success_tools:
            outcome = "SUCCESS"
            failure_reason = ""
            summary = f"Farmer received help via: {', '.join(used_success_tools)}"
        else:
            outcome = "FAILED"
            if not tools_used:
                failure_reason = "no_tools_invoked"
                summary = "User disconnected before receiving any actionable information."
            else:
                failure_reason = "tools_failed"
                summary = f"Tools called but none succeeded: {', '.join(tools_used)}"

        update_call_outcome(
            call_id=call_id,
            outcome=outcome,
            failure_reason=failure_reason,
            tools_used=tools_used,
            tools_succeeded=tools_succeeded,
            summary=summary,
        )
        logger.info(f"Call {call_id} ended: outcome={outcome}, tools_used={tools_used}")


if __name__ == "__main__":
    cli.run_app(server)
