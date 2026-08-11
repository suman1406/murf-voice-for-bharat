# Day 6 – Make Outbound Calls: KrishiVani Telephony Agent

Welcome to **Day 6** of the **10 Days of Voice Agents (#VoiceForBharat Edition)** challenge!

Today, **KrishiVani** (AI Kisan Mitra for the **Farm & Field** track) shifts from waiting for inbound calls to proactively placing **outbound phone & SIP calls** to farmers with urgent weather warnings, mandi price threshold alerts, and pest advisories, powered by **Murf Falcon TTS** and **LiveKit Telephony**.

---

## 🎯 Day 6 Objectives & Accomplishments

- [x] **Outbound Use Case (Farm & Field):** Integrated proactive alerts when heavy rain probability exceeds 70%, mandi rates spike, or pest infestations threaten crops in Indian districts.
- [x] **Telephony & SIP Service Integration:** Implemented `outbound_call.py` with `LiveKitAPI` supporting LiveKit SIP Outbound Trunks (`create_sip_participant`) for PSTN numbers (Twilio) and SIP URIs (Linphone softphone), plus Agent Room Dispatch.
- [x] **Step 4 Mandatory Opening Statement Compliance:** Opens every outbound call within the first two sentences by stating:
  1. **Who is calling:** *"नमस्ते रामेश्वर जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ।"*
  2. **Why:** *"आपके ज़िले करनाल के लिए आज रात भारी वर्षा और 50km/h की आंधी की गंभीर चेतावनी जारी की गई है।"*
  3. **How to opt out / stop:** *"यदि आप आगे से ऐसे आपातकालीन फोन अलर्ट बंद करना चाहते हैं, तो आप बस 'कॉल बंद करो' या 'अनसब्सक्राइब' कह सकते हैं।"*
- [x] **Language & Script Rule (Compulsory):** Strict Devanagari Hindi script enforcement in LLM prompts and agent responses (Devanagari: `नमस्ते`, never romanized `namaste`).
- [x] **Murf Falcon TTS Voices:** Configured with Murf Falcon TTS using Indian voices: **Anisha** (Conversational), **Samar** (Reassuring), and **Pooja** (Professional).
- [x] **Advanced Call Outcome Handling:** Tracks and logs 6 call states (`answered`, `no_answer`, `busy`, `voicemail`, `opt_out`, `immediate_hangup`) with automatic retry scheduling (15m for busy, 30m for no-answer, 2h for hangup) and SQLite opt-out persistence.

---

## 📁 Project Structure

```
day6/
├── backend/
│   ├── src/
│   │   ├── agent.py          # LiveKit Agent worker handling outbound sessions & opt-out
│   │   ├── outbound_call.py  # Python CLI & API module for triggering SIP/PSTN outbound calls
│   │   ├── tools.py          # Mandi price, Open-Meteo weather & advisory tools
│   │   └── db.py             # SQLite database for profiles, opt-outs & call outcome logs
│   ├── tests/
│   │   └── test_outbound.py  # Pytest suite for opening compliance, script rules & outcomes
│   ├── .env.local            # API Keys (LiveKit, Murf, Deepgram, Google Gemini, SIP Trunk)
│   └── pyproject.toml        # Dependencies & package configuration
├── frontend/                 # Next.js Outbound Telephony Control Center UI
│   ├── app/api/outbound/     # REST API route for dispatching outbound call requests
│   └── components/app/       # Interactive control center & WebRTC call simulator
└── README.md                 # Day 6 Documentation
```

---

## 📞 Outbound Call Opening Statement Specification (Step 4 Requirement)

Outbound calls require explicit disclosure because the recipient did not initiate the call. KrishiVani adheres strictly to the following disclosure format in its initial greeting:

> **"नमस्ते रामेश्वर जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ। आपके ज़िले करनाल के लिए आज रात भारी वर्षा और 50km/h की आंधी की गंभीर चेतावनी जारी की गई है। यदि आप आगे से ऐसे आपातकालीन फोन अलर्ट बंद करना चाहते हैं, तो आप बस 'कॉल बंद करो' या 'अनसब्सक्राइब' कह सकते हैं।"**

| Requirement | Spoken Content | Status |
|---|---|---|
| **Who is calling** | *"मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ"* | ✅ Compliant |
| **Why calling** | *"आपके ज़िले करनाल में आज रात भारी वर्षा की चेतावनी"* | ✅ Compliant |
| **How to opt out** | *"आप बस 'कॉल बंद करो' या 'अनसब्सक्राइब' कह सकते हैं"* | ✅ Compliant |
| **Multilocale Script** | Devanagari Hindi (`नमस्ते`), strictly no romanization | ✅ Compulsory Rule Applied |

---

## 🔄 Call Outcome Handling & Retries (Advanced Extra Mile)

| Call Outcome | Defined Agent & System Behaviour | Retry Rule |
|---|---|---|
| `answered` | Speaks mandatory opening, provides domain advice, logs transcript | Completed |
| `no_answer` | Callee didn't pick up within ringing timeout | Retry in **30 minutes** (max 3 retries) |
| `busy` | Call rejected or line busy | Retry in **15 minutes** (max 3 retries) |
| `voicemail` | Answering machine detected; leaves concise 2-sentence alert | Logged, no immediate retry |
| `opt_out` | Callee says *"कॉल बंद करो"* or *"अनसब्सक्राइब"*; invokes `unsubscribe_farmer_alerts` tool | **Unsubscribed**; future calls blocked |
| `immediate_hangup` | Callee disconnects within < 5s | Retry once after **2 hours** |

---

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.10+ & `uv` package manager
- Node.js 18+ & `pnpm`

### 1. Run Backend Worker

```bash
cd day6/backend
uv sync
.venv\Scripts\python.exe src/agent.py dev
```

### 2. Trigger an Outbound Call via CLI

```bash
# Outbound Call to Phone Number / Linphone SIP URI
.venv\Scripts\python.exe src/outbound_call.py \
  --phone "+919876543210" \
  --name "रामेश्वर जी" \
  --district "करनाल (Karnal)" \
  --alert "heavy_rain_warning" \
  --voice "Anisha" \
  --outcome "answered"
```

### 3. Run Outbound Telephony Web Dashboard

```bash
cd day6/frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
1. Use the **Outbound Call Dispatch Form** to set target phone/SIP, farmer name, district, trigger type, and Murf voice (`Anisha`, `Samar`, `Pooja`).
2. Click **Dispatch Outbound Call Request**.
3. Click **Answer & Join Live Call Session** to test audio in your browser or connect your Linphone SIP client!

---

## 📱 Linphone & Twilio Setup Guide

### Using Linphone (Free SIP Softphone)
1. Download & install [Linphone](https://www.linphone.org/).
2. Create a free account (e.g. `username@sip.linphone.org`).
3. In `src/outbound_call.py` or the web dashboard, set target phone to `sip:username@sip.linphone.org`.
4. When `outbound_call.py` executes, Linphone will ring, allowing you to answer and speak directly to KrishiVani!

### Using Twilio PSTN
1. Set `SIP_OUTBOUND_TRUNK_ID` in `day6/backend/.env.local`.
2. Enter your verified Twilio phone number (`+91...` or `+1...`).
3. KrishiVani will place a direct PSTN call to your mobile phone.

---

## 🧪 Automated Testing

Run the pytest suite to verify opening statement compliance, script rules, opt-out functionality, and outcome handling:

```bash
cd day6/backend
.venv\Scripts\python.exe -m pytest tests/
```

---

## 📸 Demo Video & Submission Guide

When recording your video for LinkedIn submission:
1. Show the **outbound trigger** (CLI or Web Dashboard dispatching the call).
2. Show the phone ringing (Linphone softphone or mobile device).
3. Answer the call and record KrishiVani speaking the **mandatory opening statement** (*Who*, *Why*, *Opt-Out*).
4. Mention that you are building a voice agent using the fastest TTS API — **Murf Falcon** (Voice: `Anisha`).
5. Include the required tags and hashtag:
   - **Hashtag:** `#VoiceForBharat`
   - **Tag:** `@Murf AI`
