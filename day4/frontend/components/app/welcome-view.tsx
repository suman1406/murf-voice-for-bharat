'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AgentStateBanner, type AgentState5 } from '@/components/app/agent-state-banner';
import { Sprout, PhoneCall, Sparkles, Mic, HelpCircle, ShieldCheck, Languages, ArrowRight, Database, UserCheck, Trash2 } from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  state?: AgentState5;
  hasEnded?: boolean;
}

const MEMORY_PROMPTS = [
  {
    step: 'Call 1 - Give Facts & Consent',
    text: '🌾 "मेरा नाम रमेश है, मैं बठिंडा से हूँ और 5 एकड़ में कपास उगाता हूँ।"',
    desc: 'Say your details, then say "हाँ" when KrishiVani asks permission to remember.',
  },
  {
    step: 'Call 2 - Returning Caller',
    text: '👋 "नमस्ते कृषिवाणी! क्या आपको याद है मेरी फसल कौन सी है?"',
    desc: 'Disconnect Call 1 and reconnect. KrishiVani will greet you by name and recall Bathinda & Cotton!',
  },
  {
    step: 'Advanced - Forget Me',
    text: '🗑️ "मेरी सारी जानकारी डिलीट कर दो (Forget me)"',
    desc: 'Triggers the forget_caller_profile tool to wipe SQLite memory.',
  },
];

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  state = 'ready',
  hasEnded = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const currentState: AgentState5 = hasEnded ? 'call_ended' : state;
  const [callerId, setCallerId] = useState<string>('farmer_ramesh');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('krishivani_caller_id');
      if (saved) setCallerId(saved);
    }
  }, []);

  const handleSelectCaller = (id: string) => {
    setCallerId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('krishivani_caller_id', id);
    }
  };

  return (
    <div ref={ref} className="w-full min-h-svh flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-zinc-950 via-emerald-950/20 to-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navigation / Brand Bar */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-950/50">
            <Sprout className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                KrishiVani <span className="text-emerald-400 text-base font-semibold">(कृषिवाणी)</span>
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Day 4
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Persistent Memory & Consent — Farm & Field Track (#VoiceForBharat)
            </p>
          </div>
        </div>

        {/* Tech Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            SQLite DB Memory
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Murf Falcon TTS (Anisha)
          </span>
        </div>
      </header>

      {/* Hero Body */}
      <main className="w-full max-w-2xl my-auto py-4 flex flex-col items-center text-center space-y-5">
        {/* 5 Agent States Stepper Card */}
        <AgentStateBanner state={currentState} />

        {/* Caller ID Selector Bar */}
        <div className="w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Simulate Caller ID:</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleSelectCaller('farmer_ramesh')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs border transition-all ${
                callerId === 'farmer_ramesh'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              farmer_ramesh (Ramesh)
            </button>
            <button
              onClick={() => handleSelectCaller('farmer_suresh')}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs border transition-all ${
                callerId === 'farmer_suresh'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-md shadow-emerald-950/40'
                  : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              farmer_suresh (Suresh)
            </button>
          </div>
        </div>

        {/* Action Button Area */}
        <div className="w-full flex flex-col items-center gap-2 pt-1">
          <Button
            size="lg"
            onClick={onStartCall}
            className="w-full sm:w-80 h-14 rounded-full font-extrabold text-base tracking-wide bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <span>{hasEnded ? 'Start Call 2 (Returning Caller)' : 'Start Call with KrishiVani'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Asking caller consent before saving memory is strictly enforced</span>
          </p>
        </div>

        {/* Day 4 Test Prompts Box */}
        <div className="w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 text-left space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Day 4 Test Flow Prompts:</span>
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">Active ID: {callerId}</span>
          </div>

          <div className="space-y-2">
            {MEMORY_PROMPTS.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/40 text-xs text-zinc-200 cursor-pointer transition-all flex flex-col gap-1 group"
                onClick={onStartCall}
              >
                <div className="flex items-center justify-between font-bold text-emerald-400 text-[11px]">
                  <span>{item.step}</span>
                  <Mic className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-zinc-100 font-medium">{item.text}</p>
                <p className="text-[11px] text-zinc-400 italic">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-3 text-xs text-zinc-500 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Built for <strong>10 Days of Voice Agents — Day 4 Challenge</strong></p>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">#VoiceForBharat</span>
          <span>•</span>
          <span>Fastest TTS API: Murf Falcon</span>
        </div>
      </footer>
    </div>
  );
};
