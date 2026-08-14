export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorDark?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;

  // agent dispatch configuration
  agentName?: string;
  sandboxId?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'KrishiVani (#VoiceForBharat)',
  pageTitle: 'Day 10: KrishiVani — Full Voice Agent Journey',
  pageDescription: 'Capstone: Multi-agent voice AI with mandi rates, weather, memory, escalation, analytics & Crop Doctor handoff — Murf Falcon TTS + LiveKit',

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/murf-logo.svg',
  accent: '#16a34a',
  logoDark: '/murf-logo-dark.svg',
  accentDark: '#22c55e',
  startButtonText: '🎙️ Start Voice Agent Session',

  agentName: process.env.AGENT_NAME ?? 'krishivani-day10-agent',
  sandboxId: undefined,
};
