# Day 7: Know When to Ask for Human Help — #VoiceForBharat Track: Farm & Field

Welcome to **Day 7** of the **10 Days of Voice Agents (#VoiceForBharat Edition)** challenge!

## 🌾 Project: KrishiVani — Human Help Escalation Voice Agent

KrishiVani is an AI Kisan Mitra (agricultural advisor) that knows its boundaries. When a farmer encounters a severe crop emergency (such as a pink bollworm infestation, severe flood/hail crop loss, or emergency financial dispute), missing data, or explicitly asks for a human expert, the agent asks for explicit permission, scrubs sensitive information, generates a tracking Reference ID (e.g., `REF-KV-8492`), saves the request to SQLite DB and Discord Webhooks, and provides an honest 24-hour follow-up next step.

---

## 🎯 Key Features & Requirements Checklist

| Step | Requirement | Implementation | Status |
|---|---|---|---|
| **Step 1** | Choose 2 Reasons for Human Help | 1. Severe crop disease/pest attack or emergency crop loss.<br>2. Missing/stale mandi or weather data or explicit user request for human. | ✅ Completed |
| **Step 2** | Build Human-Help Tool | `@llm.function_tool` `create_escalation` | ✅ Completed |
| **Step 3** | Short Structured Summary | Saves caller name, phone, language, issue category, urgency, clean summary & agent diagnostics. | ✅ Completed |
| **Step 4** | Privacy & Explicit Consent | Asks farmer for permission (*"क्या मैं आपकी रिपोर्ट कृषि विशेषज्ञ के पास भेज दूँ?"*). Scrubs PII, OTPs, PINs, bank accounts. | ✅ Completed |
| **Step 5** | Real Destination Dispatch | SQLite Database (`krishivani_day7.db`), Discord Webhook, and Live Next.js Support Dashboard. | ✅ Completed |
| **Step 6** | Reference ID & Honest Next Step | Returns unique code (e.g. `REF-KV-8492`) and realistic 24-hour expert follow-up timeframe. | ✅ Completed |
| **Step 7** | Test Both Paths | Normal inquiry (mandi prices/weather) vs. Crop Emergency escalation path. | ✅ Tested & Verified |
| **Language** | Devanagari Hindi Script | Hindi spoken/written in native Devanagari (नमस्ते), never romanized. | ✅ Completed |
| **TTS Engine** | Murf Falcon TTS | Voice: `Anisha` (Indian English), `Samar`, `Pooja`. | ✅ Completed |

---

## 🛠️ Architecture & File Structure

```
day7/
├── backend/
│   ├── src/
│   │   ├── agent.py          # LiveKit Voice Agent (Murf Falcon + Gemini + Deepgram Nova-3)
│   │   ├── db.py             # SQLite DB schema (profiles & escalations with duplicate prevention)
│   │   ├── privacy.py        # PII & sensitive data scrubber (sanitizes OTPs/PINs/accounts)
│   │   ├── discord.py        # Discord Webhook notification dispatcher
│   │   ├── tools.py          # Mandi price & weather tools
│   │   └── server.py         # FastAPI REST service for frontend Support Dashboard
│   ├── .env.local            # API keys (LiveKit, Murf, Deepgram, Gemini, Discord Webhook)
│   └── pyproject.toml
└── frontend/
    ├── app/
    │   ├── api/escalations/   # Next.js API proxy to SQLite backend
    │   └── page.tsx
    ├── components/app/
    │   ├── welcome-view.tsx  # Dual-tab view (Voice Agent & Support Dashboard)
    │   └── escalations-dashboard.tsx # Live Human Escalation Request Management UI
    ├── .env.local
    └── package.json
```

---

## 🚀 Quick Start Instructions

### 1. Run the Backend Agent & REST API

```bash
cd day7/backend

# Run LiveKit agent worker
python src/agent.py dev

# (Optional) Run FastAPI REST server for the Support Dashboard
uvicorn src.server:app --reload --port 8000
```

### 2. Run the Next.js Frontend Dashboard & WebRTC Agent UI

```bash
cd day7/frontend

# Install dependencies (if needed)
pnpm install

# Start Next.js development server
pnpm dev
```

Open `http://localhost:3000` in your browser.

---

## 🧪 Testing Both Paths

### Path A: Normal Inquiry (No Escalation Ticket)
- **User**: *"आज करनाल में गेहूं का मंडी भाव क्या है?"*
- **Agent**: Fetches live mandi rates using `lookup_mandi_rates` and replies out loud with current prices. No escalation ticket is created.

### Path B: Severe Crop Emergency (Triggers Escalation)
- **User**: *"मेरी धान की फसल में गुलाबी सुंडी का भयानक कीड़ा लग गया है, फसल पूरी खराब हो रही है, मुझे कृषि विशेषज्ञ से बात करनी है!"*
- **Agent**: Identifies emergency, asks: *"क्या मैं आपकी समस्या की रिपोर्ट और संपर्क विवरण वरिष्ठ कृषि विशेषज्ञ (Kisan Expert) के पास भेज दूँ?"*
- **User**: *"हाँ, भेज दो।"*
- **Agent**: Invokes `create_escalation`, generates reference ID `REF-KV-8492`, posts to Discord Webhook, and displays live ticket on the **Human Support Dashboard**!
