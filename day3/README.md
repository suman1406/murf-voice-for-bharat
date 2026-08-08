# Day 3: Personalise Your Agent's Frontend — KrishiVani Voice Agent

Welcome to **Day 3** of **10 Days of Voice Agents (#VoiceForBharat Edition)** by Murf AI!

## Chosen Track: Farm & Field

- **Track Name:** Farm & Field
- **Agent Name:** KrishiVani (AI Kisan Mitra / कृषिवाणी)
- **Target Audience:** Indian farmers needing real-time crop advisory, pest guidance, weather advisories, and agricultural tips.
- **Voice Selection:** Voice `Anisha` powered by **Murf Falcon TTS** with `MultilingualModel` turn detection and Deepgram `nova-3` (`language="multi"`) STT.

---

## Day 3 Implementation & Personalization Highlights

### 1. Product Personalised Frontend (Step 1)
- Custom agricultural design system with emerald green / gold accents, farm icons, sample farming question chips, and clean responsive layout tailored for farmers.
- Prominent branding for **#VoiceForBharat**, **Murf Falcon TTS**, and **Day 3 Challenge**.

### 2. 5 Explicit Agent States (Step 2)
The frontend clearly tracks and displays the 5 required agent states:
1. **Ready** — Agent has not started yet; shows prominent `Start Call with KrishiVani` button and `🟢 Ready` badge.
2. **Connecting** — Agent is joining the call; shows `⏳ Connecting to KrishiVani... Please wait` spinner.
3. **Listening** — Agent is listening to the user; shows `🎙️ Listening to You...` with active user audio indicator.
4. **Speaking** — Agent is replying to the user; shows `🔊 KrishiVani is Speaking...` with Murf Falcon TTS audio visualizer.
5. **Call Ended** — Conversation is over; shows `🔴 Call Ended` badge and option to `Start New Conversation`.

### 3. Clear Active Speaker Indicator (Step 3)
- Dedicated speaker badge explicitly indicating **"Who is speaking: Farmer (You)"** vs **"Who is speaking: KrishiVani (AI Advisor)"**.
- Live audio visualizer (`aura` / `wave`) synchronized with agent voice output.

### 4. Microphone Permission Error Handling (Step 4)
- Detects blocked or denied microphone permissions immediately.
- Displays `MicPermissionModal` with clear explanation and 4 step-by-step browser unblock instructions (Click lock icon -> Allow Microphone -> Retry Connection).

### 5. Backend Configuration Updates (Announcement Compliance)
- STT: `deepgram.STT(model="nova-3", language="multi")`
- LLM: `google.LLM(model="gemini-2.5-flash")`
- TTS: `murf.TTS(voice="Anisha", style="Conversation", tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2), text_pacing=True)`
- Turn Detection: `turn_detection=MultilingualModel()`

---

## Setup & Running Day 3 Agent

### 1. Environment Variables

Check `.env.local` in `day3/backend/` and `day3/frontend/`:

#### `day3/backend/.env.local`
```env
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
MURF_API_KEY=your-murf-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
GOOGLE_API_KEY=your-google-gemini-api-key
```

#### `day3/frontend/.env.local`
```env
LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
AGENT_NAME=krishivani-agent
```

---

## 2. Running Locally

### Terminal 1: Agent Backend
```bash
cd day3/backend
uv run python src/agent.py dev
```

### Terminal 2: Web Frontend
```bash
cd day3/frontend
pnpm dev
```

Open `http://localhost:3000` to view and interact with **KrishiVani**.

---

## Day 3 Submission Checklist

- [x] **Personalised Frontend:** Customized agricultural interface matching Farm & Field track.
- [x] **5 Agent States:** Explicitly shows Ready, Connecting, Listening, Speaking, and Call Ended states.
- [x] **Speaker Indicator:** Clear visual badge showing who is currently speaking.
- [x] **Microphone Error Handling:** User-friendly permission denial modal with unblock steps.
- [x] **Multilingual Backend:** Configured `nova-3` multi-language STT, `Anisha` TTS, and `MultilingualModel` turn detector.
- [ ] **Record Video:** Record a short video showing:
  1. Page load & Ready state
  2. Connection & Connecting state
  3. Short conversation showing Listening and Speaking states
  4. Disconnecting and Call Ended state
- [ ] **LinkedIn Post:** Post video with `#VoiceForBharat`, tag **Murf AI**, mention **Murf Falcon TTS**, and **10 Days of Voice Agents**.
- [ ] **Google Form:** Submit post link on Discord submission form.
