'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AgentStateBanner, type AgentState5 } from '@/components/app/agent-state-banner';
import {
  PhoneCall,
  Sparkles,
  CloudRain,
  TrendingUp,
  Bug,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Volume2,
  PhoneOff,
  UserCheck,
  Send,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  state?: AgentState5;
  hasEnded?: boolean;
}

const OUTBOUND_TRIGGERS = [
  {
    id: 'heavy_rain_warning',
    title: '⛈️ Heavy Rain & Weather Warning',
    desc: 'Alert farmer about rain probability > 70% & 50km/h winds',
    icon: CloudRain,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    id: 'mandi_price_surge',
    title: '📈 Mandi Price Threshold Breach',
    desc: 'Alert when Paddy/Wheat price crosses target rate (₹2,680/qtl)',
    icon: TrendingUp,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    id: 'pest_advisory',
    title: '🐛 Stem Borer Pest Advisory',
    desc: 'Urgent pest alert & organic neem oil spraying guidance',
    icon: Bug,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
  {
    id: 'routine_practice',
    title: '🌾 Daily Learning Practice Call',
    desc: 'Scheduled practice call at preferred learner time',
    icon: Calendar,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  },
];

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

  // Form states
  const [phone, setPhone] = useState<string>('+919876543210');
  const [farmerName, setFarmerName] = useState<string>('रामेश्वर जी');
  const [district, setDistrict] = useState<string>('करनाल (Karnal)');
  const [alertType, setAlertType] = useState<string>('heavy_rain_warning');
  const [voice, setVoice] = useState<string>('Anisha');
  const [outcome, setOutcome] = useState<string>('answered');

  // API Dispatch status states
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleDispatchCall = async () => {
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await fetch('/api/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          farmer_name: farmerName,
          district,
          alert_type: alertType,
          voice,
          simulate_outcome: outcome,
        }),
      });
      const data = await res.json();
      setDispatchResult(data);
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const copyCLICommand = () => {
    const cmd = `python src/outbound_call.py --phone "${phone}" --name "${farmerName}" --district "${district}" --alert "${alertType}" --voice "${voice}" --outcome "${outcome}"`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={ref}
      className="w-full min-h-svh flex flex-col items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-zinc-950 via-emerald-950/20 to-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950"
    >
      {/* Top Header */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-950/50">
            <PhoneCall className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                KrishiVani <span className="text-emerald-400 text-base font-semibold">(कृषिवाणी)</span>
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Day 6 Outbound
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Make Outbound Calls & Telephony Integration — Farm & Field (#VoiceForBharat)
            </p>
          </div>
        </div>

        {/* Tech Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Murf Falcon ({voice})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
            LiveKit Telephony / SIP
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="w-full max-w-4xl my-auto py-4 flex flex-col items-center space-y-6">
        <AgentStateBanner state={currentState} />

        {/* Control Panel Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Outbound Dispatch Form */}
          <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>1. Outbound Call Dispatch Form</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Step 1 & 2
              </span>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Target Phone / SIP URI:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  placeholder="+919876543210 or sip:..."
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Farmer Name:</label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* District & Voice */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">District (ज़िला):</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="करनाल (Karnal)">करनाल (Karnal)</option>
                  <option value="अंबाला (Ambala)">अंबाला (Ambala)</option>
                  <option value="हिसार (Hisar)">हिसार (Hisar)</option>
                  <option value="सिरसा (Sirsa)">सिरसा (Sirsa)</option>
                  <option value="लुधियाना (Ludhiana)">लुधियाना (Ludhiana)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Murf Falcon Voice:</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-emerald-400 font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {MURF_VOICES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.tag})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Outbound Trigger Selection */}
            <div>
              <label className="block text-zinc-400 font-medium mb-2 text-xs">Outbound Call Trigger:</label>
              <div className="grid grid-cols-1 gap-2">
                {OUTBOUND_TRIGGERS.map((trig) => {
                  const IconComp = trig.icon;
                  const isSelected = alertType === trig.id;
                  return (
                    <div
                      key={trig.id}
                      onClick={() => setAlertType(trig.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? `${trig.color} font-bold ring-1 ring-emerald-500/50 shadow-md`
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-zinc-950' : 'bg-zinc-900'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{trig.title}</div>
                        <div className="text-[11px] text-zinc-400">{trig.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outcome Simulator */}
            <div>
              <label className="block text-zinc-400 font-medium mb-1 text-xs">Simulate Outcome (Advanced Step):</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="answered">Answered (Full Interactive Call)</option>
                <option value="no_answer">No Answer (Schedule retry in 30m)</option>
                <option value="busy">Line Busy (Schedule retry in 15m)</option>
                <option value="voicemail">Voicemail (Leave brief voice message)</option>
                <option value="opt_out">Opt Out / Immediate Hangup (Unsubscribe)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleDispatchCall}
                disabled={isDispatching}
                className="w-full h-12 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching Outbound Call...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Outbound Call Request</span>
                  </>
                )}
              </Button>

              <button
                onClick={copyCLICommand}
                className="text-[11px] text-zinc-400 hover:text-emerald-400 font-mono flex items-center justify-center gap-1.5 py-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'CLI command copied!' : 'Copy equivalent Python CLI command'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Step 4 Opening Compliance & Simulator Console */}
          <div className="flex flex-col gap-4">
            {/* Step 4 Mandatory Opening Statement Card */}
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>2. Step 4 Mandatory Opening Disclosure</span>
                </h2>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  COMPULSORY
                </span>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-amber-500/20 text-xs space-y-2 text-zinc-200">
                <p className="font-semibold text-amber-300">Spoken in the first 2 sentences:</p>
                <blockquote className="italic border-l-2 border-amber-500/50 pl-3 py-1 text-zinc-300">
                  &quot;नमस्ते {farmerName} जी, मैं कृषिवाणी से एआई किसान मित्र बोल रहा हूँ। आपके ज़िले {district} के लिए भारी वर्षा की चेतावनी जारी की गई है। यदि आप आगे से ऐसे फोन अलर्ट बंद करना चाहते हैं, तो बस कहें &apos;कॉल बंद करो&apos; या &apos;अनसब्सक्राइब&apos;।&quot;
                </blockquote>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1. Say WHO is calling (KrishiVani AI Kisan Mitra)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>2. Say WHY (Heavy rain warning / Mandi alert in {district})</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>3. How to OPT OUT (&apos;कॉल बंद करो&apos; or &apos;अनसब्सक्राइब&apos;)</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-medium text-purple-300">Compulsory Devanagari Hindi Script (नमस्ते, not &apos;namaste&apos;)</span>
                </div>
              </div>
            </div>

            {/* Live Web Simulator / Connection Card */}
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>3. In-Browser Outbound Call Simulator</span>
                  </h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Step 3
                  </span>
                </div>

                {dispatchResult ? (
                  <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Outbound Call Dispatched!</span>
                      <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">{dispatchResult.roomName}</span>
                    </div>
                    <p className="text-zinc-300">Target: {dispatchResult.phoneOrSip} ({dispatchResult.farmerName})</p>
                    <p className="text-[11px] text-zinc-400">Click below to connect callee WebRTC audio and receive the call!</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-zinc-400">
                    Dispatch an outbound call above or click below to simulate answering the call in your browser.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={onStartCall}
                  className="w-full h-14 rounded-2xl font-extrabold text-sm tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-3"
                >
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                  <span>Answer & Join Live Call Session</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center py-3 text-xs text-zinc-500 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>Built for <strong>10 Days of Voice Agents — Day 6 Challenge</strong></p>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">#VoiceForBharat</span>
          <span>•</span>
          <span>Fastest TTS API: Murf Falcon</span>
          <span>•</span>
          <span className="text-indigo-400">LiveKit Telephony</span>
        </div>
      </footer>
    </div>
  );
};
