# Day 1: Farm & Field Track — KrishiVani Voice Agent

Welcome to **Day 1** of **10 Days of Voice Agents (#VoiceForBharat Edition)** by Murf AI!

## Chosen Track: Farm & Field

- **Track Name:** Farm & Field
- **Agent Name:** KrishiVani (Voice Advisory for Farmers)
- **Target Audience:** Indian farmers needing real-time crop advisory, mandi prices, weather alerts, and farming guidance.
- **Voice Selection:** Indian English (`en-IN-anisha`) powered by **Murf Falcon TTS** — chosen for its clear, natural Indian accent and warm conversational tone suitable for rural voice interfaces.

---

## Capabilities (Day 1)

- [x] Speaks with Indian voice (`en-IN-anisha` via Murf Falcon TTS)
- [x] Listens and responds to farmer voice queries using LiveKit Agents + Deepgram STT + Gemini 2.5 Flash LLM
- [x] Modern, intuitive web interface for voice interaction

---

## Setup & Running Day 1 Agent

### 1. Environment Variables

Create `.env.local` in `day1/backend/` and `day1/frontend/`:

#### `day1/backend/.env.local`
```env
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
MURF_API_KEY=your-murf-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
GOOGLE_API_KEY=your-google-gemini-api-key
```

#### `day1/frontend/.env.local`
```env
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

---

### 2. Install Dependencies

#### Backend (Python)
```bash
cd day1/backend
uv sync
uv run python src/agent.py download-files
```

#### Frontend (Next.js)
```bash
cd day1/frontend
pnpm install
```

---

### 3. Run Locally

#### Terminal 1: LiveKit Local Server (or Cloud)
```bash
livekit-server --dev
```

#### Terminal 2: Agent Backend
```bash
cd day1/backend
uv run python src/agent.py dev
```

#### Terminal 3: Web Frontend
```bash
cd day1/frontend
pnpm dev
```

Open `http://localhost:3000` to interact with **KrishiVani**.

---

## Day 1 Submission Checklist

- [x] **Track Picked:** Farm & Field
- [x] **Indian Voice Configured:** `en-IN-anisha` (Murf Falcon TTS)
- [x] **Connected & Tested:** Voice pipeline working end-to-end
- [ ] **Record Video:** Record a short video stating the track ("Farm & Field") out loud and having a conversation.
- [ ] **LinkedIn Post:** Post video with `#VoiceForBharat`, tag **Murf AI**, and mention **Murf Falcon**.
- [ ] **Google Form:** Submit LinkedIn post link on Discord form.
