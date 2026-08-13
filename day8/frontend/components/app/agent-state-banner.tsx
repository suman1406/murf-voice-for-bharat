'use client';

import React from 'react';
import { Mic, Volume2, Loader2, PhoneOff, PlayCircle, Sparkles, User, Radio, CheckCircle2, ShieldCheck } from 'lucide-react';

export type AgentState5 = 'ready' | 'connecting' | 'listening' | 'speaking' | 'call_ended';

interface AgentStateBannerProps {
  state: AgentState5;
  activeSpeaker?: 'user' | 'agent' | 'none';
  onStartCall?: () => void;
  onEndCall?: () => void;
  className?: string;
}

export function AgentStateBanner({
  state,
  activeSpeaker = 'none',
  onStartCall,
  onEndCall,
  className = '',
}: AgentStateBannerProps) {
  const getBannerContent = () => {
    switch (state) {
      case 'ready':
        return {
          stepNum: 1,
          title: 'Ready to Connect',
          subtitle: 'KrishiVani is ready. Click below to start your voice consultation.',
          speakerText: 'No Active Speaker',
          badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
          icon: PlayCircle,
        };
      case 'connecting':
        return {
          stepNum: 2,
          title: 'Connecting to KrishiVani...',
          subtitle: 'Establishing secure LiveKit audio session. Please wait...',
          speakerText: 'Connecting Audio Channel',
          badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
          dotColor: 'bg-amber-400 animate-pulse',
          icon: Loader2,
        };
      case 'listening':
        return {
          stepNum: 3,
          title: 'Listening to You...',
          subtitle: 'Speak your question in Hindi, Hinglish, or English.',
          speakerText: 'You are Speaking (Farmer)',
          badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
          dotColor: 'bg-blue-400 animate-ping',
          icon: Mic,
        };
      case 'speaking':
        return {
          stepNum: 4,
          title: 'KrishiVani is Speaking...',
          subtitle: 'Replying using Murf Falcon TTS (Voice: Anisha). Listen closely.',
          speakerText: 'KrishiVani (AI Advisor)',
          badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
          dotColor: 'bg-purple-400 animate-bounce',
          icon: Volume2,
        };
      case 'call_ended':
        return {
          stepNum: 5,
          title: 'Call Ended',
          subtitle: 'Session disconnected. Click below to start a new conversation.',
          speakerText: 'Call Disconnected',
          badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
          dotColor: 'bg-rose-400',
          icon: PhoneOff,
        };
    }
  };

  const content = getBannerContent();
  const IconComponent = content.icon;

  const STEPS = [
    { id: 'ready', num: 1, label: '1. Ready' },
    { id: 'connecting', num: 2, label: '2. Connecting' },
    { id: 'listening', num: 3, label: '3. Listening' },
    { id: 'speaking', num: 4, label: '4. Speaking' },
    { id: 'call_ended', num: 5, label: '5. Call Ended' },
  ];

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-zinc-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-emerald-950/20 text-left space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${content.dotColor}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${content.dotColor}`} />
            </span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-zinc-400">
              Agent State ({content.stepNum}/5)
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${content.badgeColor}`}>
            <IconComponent className={`w-3.5 h-3.5 ${state === 'connecting' ? 'animate-spin' : ''}`} />
            <span>{content.title}</span>
          </div>
        </div>

        {/* 5-Step Progress Bar */}
        <div className="grid grid-cols-5 gap-1.5">
          {STEPS.map((step) => {
            const isActive = state === step.id;
            const isCompleted = content.stepNum > step.num;
            return (
              <div
                key={step.id}
                className={`py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/30 scale-[1.02]'
                    : isCompleted
                    ? 'bg-zinc-800/80 text-emerald-400 border border-emerald-500/20'
                    : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800/40'
                }`}
              >
                {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 hidden sm:inline" />}
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Speaker & Status Detail Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/80 rounded-xl p-3 border border-zinc-800/80">
          <div className="flex items-start gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${content.badgeColor}`}>
              <IconComponent className={`w-4 h-4 ${state === 'connecting' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100 leading-tight">
                {content.title}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                {content.subtitle}
              </p>
            </div>
          </div>

          {/* Speaker Badge */}
          <div className="shrink-0 self-stretch sm:self-auto flex items-center justify-end">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-semibold text-zinc-200">
              {state === 'listening' ? (
                <User className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              ) : state === 'speaking' ? (
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>Who is speaking: <strong className="text-emerald-400">{content.speakerText}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
