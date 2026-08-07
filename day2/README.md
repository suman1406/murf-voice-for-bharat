# Day 2: Give Your Agent a Personality, a Job, and Limits — KrishiVani Voice Agent

Welcome to **Day 2** of **10 Days of Voice Agents (#VoiceForBharat Edition)** by Murf AI!

## Chosen Track: Farm & Field

- **Track Name:** Farm & Field
- **Agent Name:** KrishiVani (AI Kisan Mitra)
- **Target Audience:** Indian farmers needing real-time crop advisory, weather alerts, and agricultural guidance.
- **Voice Selection:** Indian English (`en-IN-anisha`) powered by **Murf Falcon TTS** — chosen for its clear, natural Indian accent and warm conversational tone suitable for rural voice interfaces.

---

## Day 2 Implementation Highlights

### 1. Call Objectives (Step 1)
1. **Crop Health & Advisory:** Provide actionable guidance on crop disease prevention (e.g. yellow rust in wheat, stem borer in rice), soil health, and seasonal sowing.
2. **Weather & Farming Practices:** Offer localized weather advisory and sustainable farming tips.
3. **Helpline & KVK Escalation:** Direct complex, out-of-scope, or official financial queries to official support helplines (Kisan Call Centre 1800-180-1551 / local Krishi Vigyan Kendra).

### 2. Guardrails & Refusals (Step 2)
| Guardrail Type | Specification | Escalation / Response |
| --- | --- | --- |
| **Live Mandi Rates** | Never state market prices as guaranteed current live facts without disclaimer | "Mai ek AI Krishi Mitra hoon aur is par guarantee ya exact live mandi rate nahi de sakta. Kripya apne sthaniya KVK ya Kisan Call Centre helpline 1800-180-1551 par sampark karein." |
| **Health & Medical** | Never diagnose human/animal medical issues or recommend toxic restricted chemicals | Refuse & direct to licensed medical practitioner / veterinarian |
| **Financial / Personal** | Never ask for or accept OTP, PIN, bank account numbers, or Aadhaar details | Hard refusal & safety warning |
| **Yield & Scheme Claims** | Never guarantee exact percentage yield increases or scheme approvals | Refuse & direct to government portal / KVK |

### 3. Code-Mixed Language Support (Step 3)
- Supports Hinglish, Hindi, and English fluently.
- Mirrors the user's register and language mix (e.g. responds in Hinglish when spoken to in Hinglish).

### 4. First-Turn Greeting (Step 4)
- Greets the user immediately on connection:
  *"Namaste Kisan Bhai! Mai KrishiVani, aapka AI Kisan Mitra. Fasal, mausam ya kheti ke baare me aaj mai aapki kya madad kar sakta hoon?"*

---

## Setup & Running Day 2 Agent

### 1. Environment Variables

Check `.env.local` in `day2/backend/` and `day2/frontend/`:

#### `day2/backend/.env.local`
```env
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
MURF_API_KEY=your-murf-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
GOOGLE_API_KEY=your-google-gemini-api-key
```

#### `day2/frontend/.env.local`
```env
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
AGENT_NAME=krishivani-agent
```

---

### 2. Install Dependencies

#### Backend (Python)
```bash
cd day2/backend
uv sync
```

#### Frontend (Next.js)
```bash
cd day2/frontend
pnpm install
```

---

### 3. Run Locally

#### Terminal 1: Agent Backend
```bash
cd day2/backend
uv run python src/agent.py dev
```

#### Terminal 2: Web Frontend
```bash
cd day2/frontend
pnpm dev
```

Open `http://localhost:3000` to interact with **KrishiVani**.

---

## Day 2 Submission Checklist

- [x] **Objectives Defined:** Defined 3 call objectives for Farm & Field advisor.
- [x] **Guardrails & Escalation Script:** Hard refusals for live mandi rates, medical advice, personal data, and yield guarantees.
- [x] **Code-Mixed Language Support:** Code-mixed Hinglish/Hindi/English mirror support.
- [x] **First-Turn Greeting:** Automated initial voice greeting on session start.
- [ ] **Record Video:** Record a short video showing:
  1. The agent's first-turn greeting
  2. A code-mixed exchange (e.g. asking in Hinglish about crop advisory)
  3. Triggering a guardrail on camera (e.g. asking for live mandi rate or OTP) and agent declining + giving escalation path.
- [ ] **LinkedIn Post:** Post video with `#VoiceForBharat`, tag **Murf AI**, mention **Murf Falcon** fast TTS API, and **10 Days of Voice Agents**.
- [ ] **Google Form:** Submit post link on Discord submission form.
