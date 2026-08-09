# Day 4 – Give Your Agent a Memory That Lasts 🧠

Welcome to **Day 4** of the **10 Days of Voice Agents (#VoiceForBharat Edition)**!

Today's objective is to give **KrishiVani** (AI Kisan Mitra for the **Farm & Field track**) persistent memory using **SQLite**, **LiveKit Function Tools**, **Murf Falcon TTS (`Anisha`)**, **Deepgram Nova-3**, and **Google Gemini 2.5 Flash**.

---

## 🎯 Key Objectives & Features Implemented

1. **SQLite Database Storage (`farmer_memory.db`)**
   - Stores caller identities (`user_id`, `name`), `language_preference`, and track-specific facts (`crops_grown`, `land_size`, `district`, `irrigation_type`) along with `last_interaction` timestamps.
   - Data persists across server restarts.

2. **Function Tools (Not Prompt-Hacked)**
   - `@llm.function_tool` `lookup_caller`: Looks up caller facts from SQLite.
   - `@llm.function_tool` `save_caller_profile`: Saves caller facts ONLY if explicit user consent is granted.
   - `@llm.function_tool` `forget_caller_profile`: Permanently wipes caller memory upon request.

3. **Explicit Privacy Consent Rule (Hard Requirement)**
   - Before saving any facts, KrishiVani explicitly asks:  
     *"क्या मैं आपकी जानकारी जैसे आपका नाम, फसल और ज़िला याद रख सकता हूँ ताकि अगली बार आपकी बेहतर मदद कर सकूँ?"*
   - If the caller says NO, data is NOT saved.

4. **Dynamic Returning Caller Greeting**
   - **Call 1 (New Caller)**: Greeted as a new farmer.
   - **Call 2 (Returning Caller)**: KrishiVani looks up SQLite DB on connection and greets by name:  
     *"नमस्ते रमेश जी! स्वागत है आपका दोबारा। बठिंडा में आपकी कपास की फसल कैसी चल रही है?"*

5. **Multilocale & Native Script Formatting**
   - Deepgram Nova-3 STT with `language="multi"`.
   - Murf Falcon TTS with `voice="Anisha"`.
   - All Hindi LLM responses rendered in native **Devanagari script** (`नमस्ते`).

---

## 📁 Repository Structure

```
day4/
├── backend/
│   ├── src/
│   │   ├── agent.py        # LiveKit agent & function tools
│   │   └── db.py           # SQLite database helper & schema
│   ├── tests/
│   │   └── test_db.py      # Pytest unit tests for SQLite memory
│   ├── farmer_memory.db    # Auto-created SQLite database
│   ├── pyproject.toml
│   └── .env.local
├── frontend/
│   ├── app/
│   │   └── api/token/      # Token route supporting caller_id passing
│   ├── components/app/     # Day 4 UI with Caller ID simulator
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Instructions

### 1. Run Backend Agent
```bash
cd day4/backend
uv run python src/agent.py dev
```

### 2. Run Frontend Web App
```bash
cd day4/frontend
pnpm dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Testing the 2-Call Memory Flow

1. **Call 1 (New Caller)**:
   - Select `farmer_ramesh` in the UI.
   - Start the call. KrishiVani greets as a new farmer.
   - Tell KrishiVani: *"मेरा नाम रमेश है, मैं बठिंडा में 5 एकड़ में कपास उगाता हूँ।"*
   - KrishiVani asks permission to remember. Reply: *"हाँ, याद रख सकते हो।"*
   - KrishiVani calls `save_caller_profile` and confirms saving. Disconnect.

2. **Call 2 (Returning Caller)**:
   - Keep `farmer_ramesh` selected and start a new call.
   - KrishiVani recognizes Ramesh immediately: *"नमस्ते रमेश जी! स्वागत है आपका दोबारा। बठिंडा में आपकी कपास की फसल कैसी चल रही है?"*

3. **Forget Me Test (Optional Advanced)**:
   - Tell KrishiVani: *"मेरी सारी जानकारी डिलीट कर दो (Forget me)"*.
   - KrishiVani executes `forget_caller_profile` and confirms data deletion.

---

## 📢 LinkedIn Post Template

```text
🚀 Day 4 of #10DaysOfVoiceAgents: Giving My AI Voice Agent a Memory That Lasts! 🧠🌾

Today for the #VoiceForBharat challenge, I built persistent memory into KrishiVani (AI Kisan Mitra for Farm & Field track) using SQLite, LiveKit Function Tools, Deepgram Nova-3, and Google Gemini!

Key Features Built Today:
✅ Persistent SQLite Database for farmer profiles (crops grown, land size, district, irrigation).
✅ Agent Function Tools (lookup_caller, save_caller_profile, forget_caller_profile).
✅ Strict Caller Privacy Consent: KrishiVani explicitly asks for permission before saving anything!
✅ Dynamic Greetings: Returning callers are welcomed back by name with context from their last call.
✅ Native Devanagari Script for natural multilingual voice output.

Powered by Murf Falcon — the world's fastest TTS API! ⚡

Watch the video to see Call 1 (New Caller) vs Call 2 (Returning Caller greeted by name)!

#VoiceForBharat #MurfAI #VoiceAI #GenerativeAI #LiveKit #Python #Nextjs #AIForIndia
```
