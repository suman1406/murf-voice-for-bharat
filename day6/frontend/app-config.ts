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
  pageTitle: 'Day 6: KrishiVani Outbound Alert Agent',
  pageDescription: 'Make Outbound Calls for Farm & Field using Murf Falcon TTS (Voices: Anisha, Samar, Pooja) & Telephony Service',

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/murf-logo.svg',
  accent: '#16a34a',
  logoDark: '/murf-logo-dark.svg',
  accentDark: '#22c55e',
  startButtonText: '📞 Dispatch Outbound Call',

  agentName: process.env.AGENT_NAME ?? 'krishivani-agent',
  sandboxId: undefined,
};
