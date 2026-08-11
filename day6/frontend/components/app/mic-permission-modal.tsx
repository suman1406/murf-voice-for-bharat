'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MicOff, Lock, RefreshCw, AlertCircle, X } from 'lucide-react';

interface MicPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function MicPermissionModal({ isOpen, onClose, onRetry }: MicPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 text-left">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-6">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20 shrink-0">
            <MicOff className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              Microphone Access Blocked
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              KrishiVani needs microphone permission to hear your voice questions.
            </p>
          </div>
        </div>

        {/* Instructions Box */}
        <div className="bg-muted/40 rounded-xl p-4 space-y-3 border border-border/60 text-xs text-foreground">
          <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>How to unblock microphone in your browser:</span>
          </div>

          <ol className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 shrink-0">1.</span>
              <span>Look at the browser address bar at the top of your screen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 shrink-0">2.</span>
              <span className="flex items-center gap-1 flex-wrap">
                Click the <strong>Lock icon</strong> <Lock className="w-3.5 h-3.5 inline text-muted-foreground" /> or site info button next to the URL.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 shrink-0">3.</span>
              <span>
                Find <strong>Microphone</strong> in permissions and set it to <strong>Allow</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 shrink-0">4.</span>
              <span className="flex items-center gap-1 flex-wrap">
                Click <strong>Retry Microphone Access</strong> below or refresh the page.
              </span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Dismiss
          </Button>
          <Button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="w-full sm:w-auto text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry Microphone Access
          </Button>
        </div>
      </div>
    </div>
  );
}
