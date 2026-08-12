# 10 Days of Voice Agents — #VoiceForBharat Edition

Welcome to **10 Days of Voice Agents (#VoiceForBharat Edition)** repository!

## Selected Track: Farm & Field

- **Project Name:** KrishiVani — AI Voice Advisory for Farmers
- **Target Use-Case:** Delivering real-time crop advisory, market prices (mandi rates), weather updates, and human expert escalations to farmers in India via natural voice interaction.
- **Speech Engine:** [Murf Falcon TTS](https://murf.ai/falcon) (Indian English voice: `Anisha`)

---

## Daily Challenges Progress

| Day | Task | Status | Directory |
|---|---|---|---|
| **Day 1** | Get Your Voice Agent Talking (Indian Voice, Murf Falcon) | Completed | [`day1/`](./day1) |
| **Day 2** | Coming Soon | Pending | `day2/` |
| **Day 3** | Coming Soon | Pending | `day3/` |
| **Day 4** | Give Your Agent a Memory That Lasts (SQLite & Function Tools) | Completed | [`day4/`](./day4) |
| **Day 5** | Adding The Tools (Mandi Prices & Weather Function Calls) | Completed | [`day5/`](./day5) |
| **Day 6** | Outbound Call Voice AI Agent for Farm & Field | Completed | [`day6/`](./day6) |
| **Day 7** | Know When to Ask for Human Help (Human Escalation & Dashboard) | Completed | [`day7/`](./day7) |
| **Day 8** | Coming Soon | Pending | `day8/` |
| **Day 9** | Coming Soon | Pending | `day9/` |
| **Day 10**| Final Ship & Deployed Agent | Pending | `day10/` |

---

## Tech Stack

- **TTS:** Murf Falcon (`livekit-murf`)
- **STT:** Deepgram Nova-3 (`livekit-agents[deepgram]`)
- **LLM:** Google Gemini 2.5 Flash (`livekit-agents[google]`)
- **Real-time Transport:** LiveKit WebRTC
- **Frontend:** Next.js, Tailwind CSS, TypeScript
- **Package Managers:** `uv` (Python), `pnpm` (Node)

---

## Quick Start

- **Day 7 (Human Help Escalations):** See [`day7/README.md`](./day7/README.md) for full setup instructions.
- **Day 6 (Outbound Calls):** See [`day6/README.md`](./day6/README.md) for outbound call instructions.
- **Day 1:** See [`day1/README.md`](./day1/README.md) for basic voice setup.
