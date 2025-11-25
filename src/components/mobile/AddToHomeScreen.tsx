/**
 * AddToHomeScreen Component
 *
 * Smart, non-intrusive PWA install prompt with context-aware timing.
 * Shows at optimal moments based on user engagement.
 *
 * Timing Strategy:
 * - After 2nd visit (returning user)
 * - After successful booking/application
 * - After viewing 3+ events
 * - Never on first load
 *
 * Features:
 * - Bottom banner style (non-blocking)
 * - Dismiss permanently option
 * - Track install conversion
 * - iOS Safari "Add to Home Screen" instructions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pwaService } from '@/services/pwaService';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { cn } from '@/lib/utils';

// Storage keys
const STORAGE_KEYS = {
  VISIT_COUNT: 'pwa_visit_count',
  LAST_VISIT: 'pwa_last_visit',
  DISMISSED_PERMANENTLY: 'pwa_dismissed_permanently',
  DISMISSED_UNTIL: 'pwa_dismissed_until',
  EVENTS_VIEWED: 'pwa_events_viewed',
  INSTALL_PROMPTED: 'pwa_install_prompted',
  INSTALL_CONVERTED: 'pwa_install_converted',
} as const;

interface AddToHomeScreenProps {
  /** Force show the prompt (for testing) */
  forceShow?: boolean;
  /** Callback when prompt is shown */
  onShow?: () => void;
  /** Callback when prompt is dismissed */
  onDismiss?: (permanent: boolean) => void;
  /** Callback when install is initiated */
  onInstall?: () => void;
  /** Custom className */
  className?: string;
}

type TriggerReason =
  | 'returning_user'
  | 'successful_action'
  | 'events_viewed'
  | 'manual'
  | 'force';

interface PromptState {
  visible: boolean;
  reason: TriggerReason | null;
  showInstructions: boolean;
}

/**
 * Detect iOS Safari for custom instructions
 */
function isIOSSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isNotChrome = !/CriOS/.test(ua);
  const isNotFirefox = !/FxiOS/.test(ua);
  return isIOS && isWebkit && isNotChrome && isNotFirefox;
}

/**
 * Check if already installed as PWA
 */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function AddToHomeScreen({
  forceShow = false,
  onShow,
  onDismiss,
  onInstall,
  className,
}: AddToHomeScreenProps) {
  const { isMobile } = useMobileLayout();
  const [state, setState] = useState<PromptState>({
    visible: false,
    reason: null,
    showInstructions: false,
  });
  const [isInstalling, setIsInstalling] = useState(false);

  const capabilities = pwaService.getCapabilities();
  const showIOSInstructions = isIOSSafari() && !capabilities.isInstallable;

  // Check if should show prompt
  const shouldShowPrompt = useCallback((): TriggerReason | null => {
    // Never show on desktop
    if (!isMobile) return null;

    // Already installed
    if (isStandalone() || capabilities.isInstalled) return null;

    // User permanently dismissed
    if (localStorage.getItem(STORAGE_KEYS.DISMISSED_PERMANENTLY) === 'true') {
      return null;
    }

    // Temporarily dismissed (7 days)
    const dismissedUntil = localStorage.getItem(STORAGE_KEYS.DISMISSED_UNTIL);
    if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
      return null;
    }

    // Force show for testing
    if (forceShow) return 'force';

    // Check visit count (show after 2nd visit)
    const visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
    if (visitCount >= 2) return 'returning_user';

    // Check events viewed (show after 3+ events)
    const eventsViewed = parseInt(localStorage.getItem(STORAGE_KEYS.EVENTS_VIEWED) || '0', 10);
    if (eventsViewed >= 3) return 'events_viewed';

    return null;
  }, [isMobile, capabilities.isInstalled, forceShow]);

  // Track visit
  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);

    if (lastVisit !== today) {
      const visitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(visitCount + 1));
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, today);
    }
  }, []);

  // Check if should show prompt after a delay
  useEffect(() => {
    // Don't show immediately - wait for user to engage
    const timer = setTimeout(() => {
      const reason = shouldShowPrompt();
      if (reason) {
        setState({ visible: true, reason, showInstructions: false });
        onShow?.();
        localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPTED, new Date().toISOString());
      }
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, [shouldShowPrompt, onShow]);

  // Handle dismiss
  const handleDismiss = useCallback((permanent: boolean) => {
    if (permanent) {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_PERMANENTLY, 'true');
    } else {
      // Dismiss for 7 days
      const dismissUntil = new Date();
      dismissUntil.setDate(dismissUntil.getDate() + 7);
      localStorage.setItem(STORAGE_KEYS.DISMISSED_UNTIL, dismissUntil.toISOString());
    }

    setState({ visible: false, reason: null, showInstructions: false });
    onDismiss?.(permanent);
  }, [onDismiss]);

  // Handle install
  const handleInstall = useCallback(async () => {
    setIsInstalling(true);

    try {
      if (showIOSInstructions) {
        // Show iOS instructions
        setState(prev => ({ ...prev, showInstructions: true }));
      } else {
        // Standard PWA install
        const success = await pwaService.installApp();
        if (success) {
          localStorage.setItem(STORAGE_KEYS.INSTALL_CONVERTED, new Date().toISOString());
          setState({ visible: false, reason: null, showInstructions: false });
        }
      }
      onInstall?.();
    } finally {
      setIsInstalling(false);
    }
  }, [showIOSInstructions, onInstall]);

  if (!state.visible) return null;

  // iOS Safari Instructions View
  if (state.showInstructions) {
    return (
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-lg',
          'animate-in slide-in-from-bottom duration-300',
          'pb-safe',
          className
        )}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg">Add to Home Screen</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDismiss(false)}
              className="touch-target-44 -m-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">Tap the Share button</p>
                <p className="text-muted-foreground">
                  Look for <Share className="inline h-4 w-4 mx-1" /> at the bottom of Safari
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">Scroll and tap "Add to Home Screen"</p>
                <p className="text-muted-foreground">
                  Look for <Plus className="inline h-4 w-4 mx-1" /> Add to Home Screen
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium">Tap "Add"</p>
                <p className="text-muted-foreground">
                  The app will appear on your home screen
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setState(prev => ({ ...prev, showInstructions: false }))}
            className="w-full touch-target-44"
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }

  // Main Install Banner
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-lg',
        'animate-in slide-in-from-bottom duration-300',
        'pb-safe',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
            <span className="text-2xl font-bold text-white">S</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">Stand Up Sydney</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {showIOSInstructions
                ? 'Add to your home screen for quick access'
                : 'Install for offline access & faster loading'}
            </p>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDismiss(false)}
            className="touch-target-44 -m-2 shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 touch-target-44"
          >
            {showIOSInstructions ? (
              <>
                <Share className="h-5 w-5 mr-2" />
                How to Install
                <ChevronRight className="h-5 w-5 ml-1" />
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                {isInstalling ? 'Installing...' : 'Install'}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleDismiss(true)}
            className="touch-target-44 text-muted-foreground"
          >
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility: Trigger prompt after successful action
 * Call this after booking confirmations, applications, etc.
 */
export function triggerInstallAfterSuccess(): void {
  const capabilities = pwaService.getCapabilities();
  if (capabilities.isInstalled || isStandalone()) return;

  // Mark that a successful action occurred
  localStorage.setItem('pwa_trigger_after_success', 'true');
}

/**
 * Utility: Track event view for smart prompting
 * Call this when user views an event
 */
export function trackEventView(): void {
  const count = parseInt(localStorage.getItem(STORAGE_KEYS.EVENTS_VIEWED) || '0', 10);
  localStorage.setItem(STORAGE_KEYS.EVENTS_VIEWED, String(count + 1));
}

/**
 * Utility: Check if install was converted
 */
export function wasInstallConverted(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.INSTALL_CONVERTED);
}

/**
 * Utility: Reset all install tracking (for testing)
 */
export function resetInstallTracking(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

export default AddToHomeScreen;
