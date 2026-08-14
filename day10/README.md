# KrishiVani (कृषिवाणी) — AI Voice Agent for Indian Farmers
### 10 Days of Voice Agents · #VoiceForBharat · Farm & Field Track

> **Built with Murf Falcon** — the fastest TTS API — powering natural Hindi voice with Deepgram Nova-3 STT, Google Gemini 2.5 Flash LLM, and LiveKit real-time transport.

---

## The Problem and the Users

India has **140 million farming households**. Most rely on WhatsApp voice notes and word-of-mouth to get crop prices, weather alerts, and pest control advice. By the time accurate information reaches a farmer in a remote village, it is often stale, incomplete, or wrong.

Agriculture extension officers cover hundreds of villages each. A farmer with a diseased crop cannot wait days for a visit.

**KrishiVani** (कृषिवाणी — "voice of agriculture") solves this directly:

- A farmer calls or opens a browser tab
- Speaks in natural Hindi
- Gets **live mandi (market) rates, weather forecasts, crop disease diagnosis, and human expert escalation** — in seconds

Voice is the right interface here. Farmers who struggle with typing can speak naturally. The agent listens, thinks, and replies in native **Devanagari Hindi** — no romanized transliteration, no English defaults.

---

## What the Agent Does

KrishiVani is a **multi-agent voice system** with two agents:

| Agent | Role |
|---|---|
| **KrishiVani AI Kisan Mitra** | General triage: mandi rates, weather, memory, escalation, routing |
| **फ़सल डॉक्टर (Crop Doctor)** | Specialist: crop disease diagnosis, pest control, pesticide advice |

### Sample Interaction

> **Farmer:** "नमस्ते! मेरी धान की पत्तियाँ पीली पड़ रही हैं और भूरे धब्बे आ गए हैं।"  
>
> **KrishiVani:** "मैं आपको हमारे फ़सल डॉक्टर से जोड़ रहा हूँ।"  
>
> **Crop Doctor:** "नमस्कार जी! मैं फ़सल डॉक्टर हूँ। यह ब्राउन स्पॉट रोग के लक्षण हैं। ट्राईसाइक्लाज़ोल 75% WP का 0.6 ग्राम प्रति लीटर पानी में घोल बनाकर छिड़काव करें।"

---

## System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  BROWSER / SIP PHONE                       │
└─────────────────────┬──────────────────────────────────────┘
                      │ WebRTC Audio (real-time)
                      ▼
┌─────────────────────────────────────┐
│           LiveKit Cloud             │
│  (Real-time audio transport layer)  │
└─────────────────────┬───────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│           Python Agent Worker (livekit-agents 1.6.9)            │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ Deepgram STT │─►│ Gemini 2.5    │─►│  Murf Falcon TTS   │  │
│  │ Nova-3 Multi │  │ Flash LLM     │  │  Voice: Anisha     │  │
│  └──────────────┘  └──────┬────────┘  └────────────────────┘  │
│                            │ Function Tools                      │
│           ┌────────────────┼────────────────────┐               │
│           ▼                ▼                    ▼               │
│  ┌──────────────┐ ┌──────────────┐  ┌──────────────────────┐  │
│  │lookup_mandi  │ │lookup_weather│  │transfer_to_crop_doctor│  │
│  │_rates        │ │              │  │  (agent handoff)      │  │
│  └──────────────┘ └──────────────┘  └──────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SQLite (call_logs + profiles + escalations)
                       ▼
        ┌──────────────────────────────┐
        │  FastAPI Server (port 8000)  │
        │  /api/analytics              │
        │  /api/escalations            │
        └──────────────┬───────────────┘
                       │ REST (polling every 10s)
                       ▼
        ┌──────────────────────────────┐
        │  Next.js 15 Frontend         │
        │  🎙️ Voice Agent tab          │
        │  📊 Analytics Dashboard tab  │
        │  🚨 Escalations tab          │
        └──────────────────────────────┘
```

**Core Pipeline:**
- **STT:** Deepgram Nova-3 with `language="multi"` — seamless Hindi/English
- **LLM:** Google Gemini 2.5 Flash — fast, multilingual, excellent at Hindi
- **TTS:** Murf Falcon (Voice: Anisha, style: Conversation) — lowest latency Indian TTS
- **Transport:** LiveKit WebRTC real-time audio cloud

---

## Features Built Over 10 Days

### ✅ Day 1–2: Hindi Voice + Safety Guardrails

KrishiVani has a strict personality enforced at the system prompt level:

```python
SYSTEM_PROMPT = """
LANGUAGE & SCRIPT:
Always write every language in its own native script.
Hindi → Devanagari (नमस्ते), never romanized (never "namaste").

STYLE:
Keep all responses short (1-3 sentences), natural, suitable for audio TTS.
Do NOT use markdown symbols, bullet points, asterisks, or emojis.
"""
```

The no-markdown, no-emoji rule is **critical for TTS** — these characters break natural speech output.

---

### ✅ Day 3: Live Agricultural Tools

Two function tools connect to real data:

```python
@llm.function_tool
async def lookup_mandi_rates(self, crop: str, district: Optional[str] = None) -> str:
    """Fetch real-time market prices (mandi rates) in ₹/quintal."""
    res = fetch_mandi_prices_sync(crop=crop, district=district)
    return json.dumps(res, ensure_ascii=False)

@llm.function_tool
async def lookup_weather(self, district: Optional[str] = None) -> str:
    """Fetch 5-day weather forecast with crop-spray advisory."""
    res = fetch_weather_forecast_sync(district=district)
    return json.dumps(res, ensure_ascii=False)
```

---

### ✅ Day 4: Caller Memory (SQLite)

Returning farmers are greeted by name and their profile is fetched:

```python
profile = db_get(participant_identity)
if profile:
    greeting = f"नमस्ते {profile['name']} जी! आज क्या मदद करूँ?"
```

Farmers can save their district, crops grown, land size, and irrigation type. All data is stored locally with explicit consent checks.

---

### ✅ Day 5–6: Outbound Calls + Human Escalation

When a problem is too severe for AI, the agent asks permission and creates a ticket:

```python
@llm.function_tool
async def create_escalation(self, summary: str, user_consented: bool = True) -> str:
    """Create a human help request for a senior agricultural specialist."""
    if not user_consented:
        return json.dumps({"status": "refused"})
    clean_summary = sanitize_summary(summary)  # PII scrubbing
    res = create_escalation_db(...)
    return json.dumps({"reference_id": res["reference_id"]})
```

---

### ✅ Day 7: Discord Human-in-the-Loop

An async Discord webhook fires when an escalation is created — the team is notified in real time with the reference ID, urgency, and sanitized summary.

---

### ✅ Day 8: Call Analytics Dashboard

Every call is logged to SQLite with outcome, tools used, duration, and channel. The Next.js dashboard polls every 10s:

```
📊 Total: 47  |  ✅ Success: 38  |  ❌ Failed: 9  |  Success Rate: 80.9%
Avg Duration: 142s  |  Most Used Tool: lookup_mandi_rates (31 calls)
```

---

### ✅ Day 9: Agent Handoff to Crop Doctor Specialist

The centerpiece feature. When a farmer reports crop problems, the main agent executes a **LiveKit native agent handoff**:

```python
@llm.function_tool
async def transfer_to_crop_doctor(self) -> Agent:
    """
    Connect farmer to Crop Doctor (फ़सल डॉक्टर) for crop disease / pest diagnosis.
    Use ONLY when user mentions crop diseases, pests, or requests a specialist.
    """
    return CropSpecialistAgent(
        current_user_id=self.current_user_id,
        chat_ctx=self.chat_ctx   # ← full conversation history passed through
    )
```

The `CropSpecialistAgent` receives the full `chat_ctx` so the farmer **never has to repeat themselves**. The specialist immediately greets by name and dives into diagnosis.

```python
class CropSpecialistAgent(Agent):
    async def on_enter(self) -> None:
        profile = db_get(self.current_user_id)
        name = profile["name"] if profile else "किसान भाई"
        await self.session.say(
            f"नमस्कार {name} जी! मैं कृषिवाणी फ़सल डॉक्टर हूँ। "
            "आपकी फसल में क्या समस्या है, कृपया बताएँ।",
            add_to_chat_ctx=True
        )
```

---

## Challenges and How I Overcame Them

### 1. `RoomOptions` crash in livekit-agents 1.6.9

The agent crashed on startup with a `TypeError` because the newer SDK version requires an explicit `RoomOptions` object.

**Error:**
```
TypeError: argument 'options': 'NoneType' object cannot be interpreted as a mapping
```

**Fix:**
```python
# Wrong (old code):
await session.start(agent=agent_instance, room=ctx.room)

# Fixed:
from livekit.agents import room_io
room_options = room_io.RoomOptions()
await session.start(agent=agent_instance, room=ctx.room, room_options=room_options)
```

### 2. Hindi Romanization in TTS Output

Without an explicit instruction, the LLM sometimes replied `"Namaste kisan bhai"` instead of `"नमस्ते किसान भाई"`. The fix: a hard non-negotiable script rule in the system prompt, plus testing with real Hindi questions before each day's submission.

### 3. Agent Handoff: Preserving Context

Key insight: `chat_ctx.copy(exclude_instructions=True)` preserves conversation history **without** leaking the triage agent's private system prompt into the specialist agent.

```python
class CropSpecialistAgent(Agent):
    def __init__(self, chat_ctx=None, ...):
        kwargs = {}
        if chat_ctx is not None:
            kwargs["chat_ctx"] = chat_ctx.copy(exclude_instructions=True)
        super().__init__(instructions=SPECIALIST_SYSTEM_PROMPT, **kwargs)
```

### 4. Devanagari Encoding on Windows

Python's default Windows console encoding breaks Devanagari in logs. Fix:

```python
import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
```

---

## How to Build and Run KrishiVani

### Prerequisites

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 20+ |
| [LiveKit Cloud](https://cloud.livekit.io) | Free tier |
| [Murf API Key](https://murf.ai) | Falcon TTS |
| [Deepgram API Key](https://deepgram.com) | Nova-3 STT |
| [Google API Key](https://ai.google.dev) | Gemini 2.5 Flash |

### Step 1: Clone

```bash
git clone https://github.com/suman1406/murf-voice-for-bharat.git
cd murf-voice-for-bharat/day10
```

### Step 2: Backend

```bash
cd backend
pip install -e .
```

Create `backend/.env.local`:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
MURF_API_KEY=your_murf_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
GOOGLE_API_KEY=your_google_api_key
DB_PATH=krishivani.db
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

In **two separate terminals:**

```bash
# Terminal 1 – FastAPI server
python src/server.py

# Terminal 2 – LiveKit agent worker
python src/agent.py dev
```

### Step 3: Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env.local`:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
AGENT_NAME=krishivani-day10-agent
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

```bash
npm run dev
```

Open **http://localhost:3000** and click **🎙️ Start Voice Session**.

> ⚠️ Never commit `.env.local` files. They are in `.gitignore`.

### Testing Both Agent Paths

**Normal path (main agent):**
> *"भाई, आज करनाल मंडी में गेहूं का भाव क्या है?"*

**Handoff path (Crop Doctor takes over):**
> *"मेरी धान की फसल में गुलाबी सुंडी लग गई है, मुझे फसल डॉक्टर चाहिए।"*

---

## What I Would Improve Next

1. **Real Agmarknet / Kisan Suvidha API** — live official mandi data instead of simulated
2. **Regional language support** — Punjabi, Telugu, Marathi via Murf's multilingual voices
3. **WhatsApp/SIP inbound calling** — so farmers can dial a regular phone number
4. **Crop photo analysis** — multimodal upgrade: farmer shares a photo of diseased leaf for visual diagnosis
5. **Offline fallback** — shorter TTS response for 2G/low-signal areas

---

## Repository Structure

```
murf-voice-for-bharat/
├── day1/   # Basic voice agent with guardrails
├── day2/   # Hindi personality & safety rules
├── day3/   # Mandi rates + weather tools
├── day4/   # Caller memory (SQLite)
├── day5/   # Outbound calling
├── day6/   # Human escalation
├── day7/   # Discord human-in-the-loop webhook
├── day8/   # Call analytics dashboard
├── day9/   # Agent handoff to Crop Doctor specialist
└── day10/  # Capstone — full production-ready stack ← You are here
    ├── backend/
    │   └── src/
    │       ├── agent.py          # Main + Crop Doctor agents, handoff
    │       ├── server.py         # FastAPI: analytics, escalations APIs
    │       ├── db.py             # Caller profile SQLite store
    │       ├── call_analytics_db.py  # Call logging SQLite store
    │       ├── tools.py          # Mandi rates + weather tool logic
    │       ├── privacy.py        # PII scrubbing for escalation summaries
    │       └── discord.py        # Discord webhook for human escalations
    └── frontend/
        ├── app/                  # Next.js 15 App Router pages
        ├── components/
        │   └── app/
        │       ├── analytics-dashboard.tsx   # 📊 Call analytics charts
        │       ├── escalations-dashboard.tsx # 🚨 Human escalation viewer
        │       └── welcome-view.tsx          # 🎙️ Voice agent UI
        └── .env.local            # (create this — never commit)
```

---

## Links

- 📦 **GitHub:** https://github.com/suman1406/murf-voice-for-bharat
- 🎙️ **Murf Falcon TTS Docs:** https://murf.ai/api/docs/text-to-speech-models/falcon-2
- 🔌 **LiveKit Agents Quickstart:** https://docs.livekit.io/agents/start/voice-ai/
- 📖 **Challenge Repository:** https://github.com/murf-ai/voice-for-bharat-challenge-2026
- 🚀 **Murf LiveKit Starter:** https://github.com/murf-ai/murf-livekit-starter

---

*Built during Murf AI — 10 Days of Voice Agents: VoiceForBharat Edition (August 2026)*  
*Track: Farm & Field | Stack: Murf Falcon + Deepgram Nova-3 + Gemini 2.5 Flash + LiveKit + Next.js 15 + FastAPI*

**#VoiceForBharat #MurfFalcon #VoiceAgents #MultiAgent #LiveKit #BuildInPublic #IndiaAI**
