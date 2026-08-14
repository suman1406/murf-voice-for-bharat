'use client';

import { useMemo, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { AnalyticsDashboard } from '@/components/app/analytics-dashboard';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const tokenSource = useMemo(() => {
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.custom(async () => {
          const callerId = (typeof window !== 'undefined' && localStorage.getItem('krishivani_caller_id')) || 'farmer_ramesh';
          const res = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: callerId }),
          });
          if (!res.ok) {
            throw new Error('Failed to fetch connection details');
          }
          return await res.json();
        });
  }, [appConfig]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  const [activeTab, setActiveTab] = useState<'agent' | 'analytics'>('agent');

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <div className="flex flex-col h-screen">
        {/* Tab Bar */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-2 px-4 z-30">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === 'agent'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-secondary text-muted-foreground hover:bg-accent'
            }`}
          >
            🎙️ Voice Agent
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-secondary text-muted-foreground hover:bg-accent'
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'agent' ? (
            <main className="grid h-full grid-cols-1 place-content-center">
              <ViewController appConfig={appConfig} />
            </main>
          ) : (
            <AnalyticsDashboard />
          )}
        </div>
      </div>
      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}
