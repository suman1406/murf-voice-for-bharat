'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';
import { MicPermissionModal } from '@/components/app/mic-permission-modal';
import type { AgentState5 } from '@/components/app/agent-state-banner';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const { resolvedTheme } = useTheme();

  const [hasStartedBefore, setHasStartedBefore] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isConnectingLocally, setIsConnectingLocally] = useState(false);
  const [micModalOpen, setMicModalOpen] = useState(false);

  // Track session lifecycle: when connected, mark started; when disconnected after start, mark ended
  useEffect(() => {
    if (isConnected) {
      setHasStartedBefore(true);
      setHasEnded(false);
      setIsConnectingLocally(false);
    } else if (hasStartedBefore && !isConnected) {
      setHasEnded(true);
      setIsConnectingLocally(false);
    }
  }, [isConnected, hasStartedBefore]);

  const handleStartCall = async () => {
    setIsConnectingLocally(true);
    setHasEnded(false);

    try {
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      await start();
    } catch (err: any) {
      console.error('Microphone permission check failed:', err);
      setIsConnectingLocally(false);
      setMicModalOpen(true);
    }
  };

  const getWelcomeState = (): AgentState5 => {
    if (isConnectingLocally) return 'connecting';
    if (hasEnded) return 'call_ended';
    return 'ready';
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* Welcome view */}
        {!isConnected && (
          <MotionWelcomeView
            key="welcome"
            {...VIEW_MOTION_PROPS}
            startButtonText={appConfig.startButtonText}
            onStartCall={handleStartCall}
            state={getWelcomeState()}
            hasEnded={hasEnded}
          />
        )}
        {/* Session view */}
        {isConnected && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            supportsChatInput={appConfig.supportsChatInput}
            supportsVideoInput={appConfig.supportsVideoInput}
            supportsScreenShare={appConfig.supportsScreenShare}
            isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
            audioVisualizerType={appConfig.audioVisualizerType ?? 'aura'}
            audioVisualizerColor={
              resolvedTheme === 'dark'
                ? appConfig.audioVisualizerColorDark ?? '#10b981'
                : appConfig.audioVisualizerColor ?? '#059669'
            }
            audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
            audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
            audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
            audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
            audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
            audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
            audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
            className="fixed inset-0"
          />
        )}
      </AnimatePresence>

      <MicPermissionModal
        isOpen={micModalOpen}
        onClose={() => setMicModalOpen(false)}
        onRetry={handleStartCall}
      />
    </>
  );
}
