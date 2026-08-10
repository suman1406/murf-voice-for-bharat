# Day 5 – The Tools: KrishiVani Domain Data Integration

Welcome to **Day 5** of the **10 Days of Voice Agents (#VoiceForBharat Edition)** challenge!

In Day 5, **KrishiVani** (AI Kisan Mitra for Farm & Field) learns to fetch real domain data from external tools: live market prices (mandi rates) and weather forecasts by district, equipped with graceful spoken error handling and timestamping.

---

## 🎯 Day 5 Task Objectives & Accomplishments

- [x] **Pick Primary Lookups:** Built `lookup_mandi_rates` (crop prices by district) and `lookup_weather` (live weather forecast and agricultural advisories by district).
- [x] **Real Data & Local Fallbacks:** Integrated **Open-Meteo Live API** for real-time weather forecasts and **Agmarknet Market Benchmarks** for Indian Mandi rates.
- [x] **Careful Tool Descriptions:** Formatted tool docstrings with exact trigger conditions so Gemini calls tools automatically without explicit user prompts.
- [x] **Spoken Failure Path:** When APIs time out or data sources are offline (`SIMULATE_DATA_SOURCE_DOWN=true` or network failure), KrishiVani speaks a helpful fallback message out loud rather than remaining silent or inventing data.
- [x] **Data Timestamping:** Explicitly includes the date (`"आज, 10 August 2026"`) in returned tool payloads, instructing the LLM to state the date when speaking to the farmer.
- [x] **Multilocale & Script Compliance:** Configured LiveKit `AgentSession` with Deepgram `language="multi"`, Murf Falcon `Anisha` TTS, and strict Devanagari script rules in system prompt.

---

## 🛠️ Domain Tools Summary

| Tool Name | Parameters | Data Source | Spoken Response Example | Failure Handling |
|---|---|---|---|---|
| `lookup_mandi_rates` | `crop`, `district`, `state`, `simulate_error` | Agmarknet Live Market Benchmarks | *"10 अगस्त 2026 को करनाल मंडी में गेहूँ का औसत भाव ₹2,360 प्रति क्विंटल रहा (न्यूनतम ₹2,250 - अधिकतम ₹2,480)।"* | *"माफ़ कीजिए, मंडी भाव सर्वर से कनेक्ट करने में समय लग रहा है। आप किसान हेल्पलाइन 1800-180-1551 पर संपर्क कर सकते हैं।"* |
| `lookup_weather` | `district`, `state`, `simulate_error` | Open-Meteo Live API | *"आज 10 अगस्त 2026 को करनाल का तापमान 28°C है, बारिश की संभावना 20% है। स्थिति सिंचाई के अनुकूल है।"* | *"माफ़ कीजिए, मौसम विज्ञान केंद्र का सर्वर अभी अपडेट नहीं हो पा रहा है। कृपया थोड़ी देर बाद प्रयास करें।"* |

---

## 📁 Project Structure

```
day5/
├── backend/
│   ├── src/
│   │   ├── agent.py          # LiveKit Agent worker with tools & multilocale session
│   │   ├── tools.py          # Mandi price & Open-Meteo Weather lookup functions
│   │   └── db.py             # SQLite caller memory & consent management
│   ├── tests/
│   │   └── test_tools.py     # Pytest suite for tools, live API, and failure paths
│   ├── .env.local            # Environment variables (LiveKit, Murf, Deepgram, Google)
│   └── pyproject.toml        # Backend dependencies & uv setup
├── frontend/                 # Next.js voice client with LiveKit components
└── README.md                 # Day 5 Documentation
```

---

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.10+ & `uv` package manager
- Node.js 18+ & `pnpm`

### 1. Run Backend Worker

```bash
cd day5/backend
uv sync
uv run src/agent.py dev
```

### 2. Run Frontend Client

```bash
cd day5/frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and click **Connect**.

---

## 🧪 Testing Graceful Fallbacks (Data Source Down)

To test the **failure path out loud** (Step 4 of Day 5 requirement):

Set the environment variable in `day5/backend/.env.local`:
```env
SIMULATE_DATA_SOURCE_DOWN=true
```
Or pass `simulate_error=True` when testing function tools.

When asking *"करनाल में सरसों का मंडी भाव क्या है?"*, KrishiVani will gracefully speak:
> *"माफ़ कीजिए, मंडी भाव सर्वर से कनेक्ट करने में समय लग रहा है। आप ताज़ा भाव जानने के लिए किसान हेल्पलाइन 1800-180-1551 पर कॉल कर सकते हैं।"*

---

## 📸 Demo Video & Submission Guide

- **Voice Engine:** Powered by **Murf Falcon TTS** (`Anisha` voice).
- **Hashtag:** `#VoiceForBharat`
- **Tag:** `@Murf AI`
