'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AgentStateBanner, type AgentState5 } from '@/components/app/agent-state-banner';
import { EscalationsDashboard } from '@/components/app/escalations-dashboard';
import {
  PhoneCall,
  Sparkles,
  ShieldAlert,
  Volume2,
  PhoneOff,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  HeartHandshake,
} from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  state?: AgentState5;
  hasEnded?: boolean;
}

const MURF_VOICES = [
  { name: 'Anisha', tag: 'Recommended • Warm Conversational' },
  { name: 'Samar', tag: 'Recommended • Deep & Reassuring' },
  { name: 'Pooja', tag: 'Recommended • Clear Professional' },
];

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  state = 'ready',
  hasEnded = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const currentState: AgentState5 = hasEnded ? 'call_ended' : state;
  const [activeTab, setActiveTab] = useState<'agent' | 'dashboard'>('agent');
  const [callerName, setCallerName] = useState<string>('रामेश्वर जी (Rameshwar)');

  return (
    <div
      ref={ref}
      className="w-full min-h-svh flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-zinc-950 via-emerald-950/20 to-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950"
    >
      {/* Top Header */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-950/50">
            <HeartHandshake className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                KrishiVani <span className="text-emerald-400 text-base font-semibold">(कृषिवाणी)</span>
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Day 7 Human Help
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Know When to Ask for Human Help — Farm & Field (#VoiceForBharat)
            </p>
          </div>
        </div>

        {/* View Mode Tab Switcher */}
        <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'agent'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>🎙️ Voice Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>🚨 Human Support Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'dashboard' ? (
        <main className="w-full max-w-6xl my-4 flex-1 flex flex-col justify-center">
          <EscalationsDashboard />
        </main>
      ) : (
        <main className="w-full max-w-5xl my-auto py-6 flex flex-col items-center space-y-6">
          <AgentStateBanner state={currentState} />

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Voice Agent Launch & Test Scenarios */}
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Voice Agent (Murf Falcon TTS)</span>
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Voice: Anisha
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-400">Caller Identity (User):</label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Connects to KrishiVani using LiveKit WebRTC, Deepgram Nova-3 STT, Gemini 2.5 Flash LLM, and Murf Falcon TTS.
                  </p>
                </div>

                {/* Test Paths Guide */}
                <div className="mt-5 space-y-2 border-t border-zinc-800 pt-4">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    🧪 Step 7: Test Both Paths
                  </p>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs space-y-1.5">
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Path A: Normal Inquiry (No Escalation)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-5">
                      Say: <em>&quot;आज करनाल में गेहूं का मंडी भाव क्या है?&quot;</em>
                      <br />
                      Agent answers directly using tools without creating any escalation ticket.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-rose-500/30 text-xs space-y-1.5">
                    <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Path B: Severe Crop Emergency (Triggers Escalation)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-5">
                      Say: <em>&quot;मेरी धान की फसल में गुलाबी सुंडी का भयानक कीड़ा लग गया है, फसल पूरी खराब हो रही है, मुझे कृषि विशेषज्ञ से बात करनी है!&quot;</em>
                      <br />
                      Agent identifies emergency, asks permission, creates escalation (e.g. <strong>REF-KV-8492</strong>), and updates Dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={onStartCall}
                  className="w-full h-14 rounded-2xl font-extrabold text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3"
                >
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <span>Start Live Voice Agent Session</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Day 7 Objective Checklist & Safeguards */}
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    <span>Day 7 Human Help Safeguards</span>
                  </h2>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Compliant
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <p className="font-bold text-amber-300">1. Clear Trigger Conditions</p>
                    <p className="text-[11px] text-zinc-400">
                      Escalates on missing market/weather data, severe pest/disease infestation, or explicit caller request.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <p className="font-bold text-emerald-300">2. Explicit Consent Protocol</p>
                    <p className="text-[11px] text-zinc-400">
                      Asks farmer: <em>&quot;क्या मैं आपकी समस्या की रिपोर्ट कृषि विशेषज्ञ के पास भेज दूँ?&quot;</em> Never creates ticket without permission.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <p className="font-bold text-blue-300">3. Privacy & PII Scrubbing</p>
                    <p className="text-[11px] text-zinc-400">
                      Automatically redacts passwords, OTPs, PINs, bank accounts before storing or sending to webhooks.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <p className="font-bold text-purple-300">4. Reference ID & Honest Next Steps</p>
                    <p className="text-[11px] text-zinc-400">
                      Generates reference ID (e.g. <code>REF-KV-8492</code>) and sets realistic 24-hour follow-up timeline.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                    <p className="font-bold text-pink-300">5. Native Script Enforcement</p>
                    <p className="text-[11px] text-zinc-400">
                      Hindi written strictly in Devanagari script (नमस्ते, not &quot;namaste&quot;).
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>View Open Escalations in Support Dashboard →</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center py-3 text-xs text-zinc-500 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Built for <strong>10 Days of Voice Agents — Day 7 Challenge</strong></p>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">#VoiceForBharat</span>
          <span>•</span>
          <span>Fastest TTS API: Murf Falcon</span>
          <span>•</span>
          <span className="text-indigo-400">LiveKit WebRTC</span>
        </div>
      </footer>
    </div>
  );
};
