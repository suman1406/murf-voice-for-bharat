'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AgentStateBanner, type AgentState5 } from '@/components/app/agent-state-banner';
import { EscalationsDashboard } from '@/components/app/escalations-dashboard';
import { AnalyticsDashboard } from '@/components/app/analytics-dashboard';
import {
  PhoneCall,
  Stethoscope,
  BarChart3,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Mic,
  CloudSun,
  Brain,
  PhoneOutgoing,
  BellRing,
  LineChart,
  GitBranch,
  ScrollText,
} from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  state?: AgentState5;
  hasEnded?: boolean;
}

const FEATURES = [
  { icon: <Mic className="w-4 h-4 text-emerald-400" />, label: 'Hindi Voice', desc: 'Murf Falcon TTS — Devanagari native script, zero romanization' },
  { icon: <ShieldAlert className="w-4 h-4 text-amber-400" />, label: 'Safety Guardrails', desc: 'No markdown, no emojis in TTS, strict topic control' },
  { icon: <CloudSun className="w-4 h-4 text-sky-400" />, label: 'Live Tools', desc: 'Mandi rates + 5-day weather forecast via real APIs' },
  { icon: <Brain className="w-4 h-4 text-purple-400" />, label: 'Caller Memory', desc: 'Persistent farmer profile: crops, district, land size' },
  { icon: <PhoneOutgoing className="w-4 h-4 text-blue-400" />, label: 'Outbound Calls', desc: 'Initiate SIP/WebRTC calls to farmers proactively' },
  { icon: <BellRing className="w-4 h-4 text-rose-400" />, label: 'Human Escalation', desc: 'Consent-gated escalation with REF-ID and 24hr callback' },
  { icon: <ScrollText className="w-4 h-4 text-orange-400" />, label: 'Discord Alerts', desc: 'Real-time webhook fires on every escalation ticket' },
  { icon: <LineChart className="w-4 h-4 text-teal-400" />, label: 'Analytics Dashboard', desc: 'Call outcomes, success rate, avg duration, tool usage' },
  { icon: <GitBranch className="w-4 h-4 text-pink-400" />, label: 'Agent Handoff', desc: 'Transfers to Crop Doctor specialist with full chat context' },
  { icon: <HeartHandshake className="w-4 h-4 text-emerald-300" />, label: 'Capstone (Day 10)', desc: 'Full production-ready voice agent for Indian farmers' },
];

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  state = 'ready',
  hasEnded = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const currentState: AgentState5 = hasEnded ? 'call_ended' : state;
  const [activeTab, setActiveTab] = useState<'agent' | 'analytics' | 'escalations'>('agent');
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black tracking-tight text-white">
                KrishiVani <span className="text-emerald-400 text-base font-semibold">(कृषिवाणी)</span>
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Day 10 · Capstone
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              10 Days · 10 Features · 1 Production-Ready AI Voice Agent for Indian Farmers
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'agent'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>🎙️ Voice Agent</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>📊 Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'escalations'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 Escalations</span>
          </button>
        </div>
      </header>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <main className="w-full max-w-6xl my-4 flex-1 flex flex-col justify-center">
          <AnalyticsDashboard />
        </main>
      )}

      {/* Escalations Tab */}
      {activeTab === 'escalations' && (
        <main className="w-full max-w-6xl my-4 flex-1 flex flex-col justify-center">
          <EscalationsDashboard />
        </main>
      )}

      {/* Voice Agent Tab */}
      {activeTab === 'agent' && (
        <main className="w-full max-w-6xl my-auto py-6 flex flex-col items-center space-y-6">
          <AgentStateBanner state={currentState} />

          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Left: Voice Agent launch */}
            <div className="lg:col-span-1 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 space-y-5 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Live Voice Agent</span>
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Murf Falcon · Anisha
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-400">Your Caller Identity:</label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-zinc-400">
                    WebRTC → Deepgram Nova-3 STT → Gemini 2.5 Flash → Murf Falcon TTS
                  </p>
                </div>

                {/* Test paths */}
                <div className="mt-5 space-y-2 border-t border-zinc-800 pt-4">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">🧪 Test Both Paths</p>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs space-y-1.5">
                    <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Normal → Main Agent</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-5">
                      <em>&quot;आज करनाल मंडी में सरसों का भाव क्या है?&quot;</em>
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-pink-500/30 text-xs space-y-1.5">
                    <div className="font-semibold text-pink-300 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-pink-400" />
                      <span>Disease → Crop Doctor Handoff</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-5">
                      <em>&quot;मेरी धान में गुलाबी सुंडी लग गई, फसल डॉक्टर से बात करनी है।&quot;</em>
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-2xl border border-rose-500/30 text-xs space-y-1.5">
                    <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Emergency → Human Escalation</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-5">
                      <em>&quot;फसल पूरी खराब हो रही है, मुझे कृषि विशेषज्ञ चाहिए!&quot;</em>
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
                  <span>Start Voice Agent Session</span>
                </Button>
              </div>
            </div>

            {/* Right: 10-Day Feature Grid */}
            <div className="lg:col-span-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <span>10 Days · 10 Features Shipped</span>
                </h2>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  #VoiceForBharat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {FEATURES.map((feature, i) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {feature.icon}
                      <span className="text-xs font-bold text-white">
                        <span className="text-zinc-500 font-mono mr-1">Day {i + 1}:</span>
                        {feature.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 pl-6">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-zinc-950 rounded-xl p-2.5 border border-zinc-800">
                  <p className="text-emerald-400 font-black text-base">10</p>
                  <p className="text-zinc-500 text-[10px]">Days</p>
                </div>
                <div className="bg-zinc-950 rounded-xl p-2.5 border border-zinc-800">
                  <p className="text-purple-400 font-black text-base">2</p>
                  <p className="text-zinc-500 text-[10px]">AI Agents</p>
                </div>
                <div className="bg-zinc-950 rounded-xl p-2.5 border border-zinc-800">
                  <p className="text-sky-400 font-black text-base">6</p>
                  <p className="text-zinc-500 text-[10px]">Tools</p>
                </div>
                <div className="bg-zinc-950 rounded-xl p-2.5 border border-zinc-800">
                  <p className="text-amber-400 font-black text-base">Hindi</p>
                  <p className="text-zinc-500 text-[10px]">Native Script</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center py-3 text-xs text-zinc-500 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Built for <strong>10 Days of Voice Agents — Capstone Day 10</strong></p>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">#VoiceForBharat</span>
          <span>•</span>
          <span>Fastest TTS API: Murf Falcon</span>
          <span>•</span>
          <a
            href="https://github.com/suman1406/murf-voice-for-bharat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
};
