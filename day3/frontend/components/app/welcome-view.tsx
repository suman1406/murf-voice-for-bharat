'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AgentStateBanner, type AgentState5 } from '@/components/app/agent-state-banner';
import { Sprout, PhoneCall, Sparkles, Mic, HelpCircle, ShieldCheck, Languages, ArrowRight } from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  state?: AgentState5;
  hasEnded?: boolean;
}

const SAMPLE_QUESTIONS = [
  '🌾 Gehun ki fasal me yellow rust ka kya upchar hai?',
  '🌧️ Monsoon me dhan (paddy) ki buwai kab karni chahiye?',
  '🐛 Tamatar me kitni sinchai (irrigation) ki zarurat hoti hai?',
  '🌱 Jaivik khad (organic fertilizer) banane ka tarika kya hai?',
];

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  state = 'ready',
  hasEnded = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const currentState: AgentState5 = hasEnded ? 'call_ended' : state;

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
                Day 3
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              AI Kisan Mitra — Farm & Field Track (#VoiceForBharat)
            </p>
          </div>
        </div>

        {/* Tech Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Murf Falcon TTS (Anisha)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            Multilingual (Nova-3 STT)
          </span>
        </div>
      </header>

      {/* Hero Body */}
      <main className="w-full max-w-2xl my-auto py-6 flex flex-col items-center text-center space-y-6">
        {/* 5 Agent States Stepper Card */}
        <AgentStateBanner state={currentState} />

        {/* Action Button Area */}
        <div className="w-full flex flex-col items-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={onStartCall}
            className="w-full sm:w-80 h-14 rounded-full font-extrabold text-base tracking-wide bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <span>{hasEnded ? 'Start New Conversation' : 'Start Call with KrishiVani'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Microphone permission required for real-time voice advisory</span>
          </p>
        </div>

        {/* Sample Questions Box */}
        <div className="w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 text-left space-y-3 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Recommended Questions to Ask:</span>
            </span>
            <span className="text-zinc-500 font-mono text-[10px]">Voices: Anisha, Samar, Pooja</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-emerald-500/40 text-xs text-zinc-200 cursor-pointer transition-all flex items-center justify-between group"
                onClick={onStartCall}
              >
                <span className="line-clamp-1">{q}</span>
                <Mic className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 shrink-0 ml-1.5 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-3 text-xs text-zinc-500 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Built for <strong>10 Days of Voice Agents — Day 3 Challenge</strong></p>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">#VoiceForBharat</span>
          <span>•</span>
          <span>Fastest TTS API: Murf Falcon</span>
        </div>
      </footer>
    </div>
  );
};
