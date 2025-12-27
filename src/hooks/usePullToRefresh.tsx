/**
 * usePullToRefresh Hook
 *
 * Provides pull-to-refresh functionality for mobile interfaces.
 * Includes visual indicator and optional haptic feedback.
 *
 * Usage:
 * ```tsx
 * const { containerRef, indicatorProps, isRefreshing } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await refetchData();
 *   },
 * });
 *
 * return (
 *   <div ref={containerRef}>
 *     <PullToRefreshIndicator {...indicatorProps} />
 *     <ScrollableContent />
 *   </div>
 * );
 * ```
 */

import { useRef, useCallback, useState, useEffect, RefObject } from 'react';
import { useMobileLayout } from './useMobileLayout';

export interface PullToRefreshOptions {
  /** Callback when refresh is triggered - must return a Promise */
  onRefresh: () => Promise<void>;
  /** Distance to pull before refresh triggers (default: 80) */
  threshold?: number;
  /** Maximum pull distance (default: 150) */
  maxPull?: number;
  /** Resistance factor - higher = harder to pull (default: 2.5) */
  resistance?: number;
  /** Enable haptic feedback if available (default: true) */
  haptic?: boolean;
  /** Disable the pull-to-refresh (default: false) */
  disabled?: boolean;
  /** Only work when scrolled to top (default: true) */
  onlyAtTop?: boolean;
}

export interface PullToRefreshState {
  /** Whether refresh is currently in progress */
  isRefreshing: boolean;
  /** Whether user is currently pulling */
  isPulling: boolean;
  /** Current pull distance in pixels */
  pullDistance: number;
  /** Progress toward refresh threshold (0-1) */
  progress: number;
  /** Whether threshold has been reached */
  canRelease: boolean;
}

export interface IndicatorProps {
  /** Whether the indicator should be visible */
  visible: boolean;
  /** Current pull distance for positioning */
  pullDistance: number;
  /** Progress toward threshold (0-1) */
  progress: number;
  /** Whether threshold reached and release will refresh */
  canRelease: boolean;
  /** Whether refresh is in progress */
  isRefreshing: boolean;
}

export interface PullToRefreshReturn {
  /** Ref to attach to the scrollable container */
  containerRef: RefObject<HTMLDivElement>;
  /** Props to pass to the indicator component */
  indicatorProps: IndicatorProps;
  /** Current refresh state */
  state: PullToRefreshState;
  /** Manually trigger refresh */
  refresh: () => Promise<void>;
}

export function usePullToRefresh(options: PullToRefreshOptions): PullToRefreshReturn {
  const {
    onRefresh,
    threshold = 80,
    maxPull = 150,
    resistance = 2.5,
    haptic = true,
    disabled = false,
    onlyAtTop = true,
  } = options;

  const { isTouchDevice } = useMobileLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startScrollTop = useRef<number>(0);
  const isPulling = useRef(false);
  const hasTriggeredHaptic = useRef(false);

  const [state, setState] = useState<PullToRefreshState>({
    isRefreshing: false,
    isPulling: false,
    pullDistance: 0,
    progress: 0,
    canRelease: false,
  });

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if (haptic && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Haptic not supported or permission denied
      }
    }
  }, [haptic]);

  // Perform refresh
  const refresh = useCallback(async () => {
    if (state.isRefreshing) return;

    setState(prev => ({ ...prev, isRefreshing: true }));

    try {
      await onRefresh();
    } finally {
      setState({
        isRefreshing: false,
        isPulling: false,
        pullDistance: 0,
        progress: 0,
        canRelease: false,
      });
    }
  }, [onRefresh, state.isRefreshing]);

  // Touch handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled || !isTouchDevice) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      // Only start if at top of scroll (or onlyAtTop is false)
      const scrollTop = container.scrollTop;
      if (onlyAtTop && scrollTop > 0) return;

      startY.current = touch.clientY;
      startScrollTop.current = scrollTop;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || state.isRefreshing) return;

      const touch = e.touches[0];
      if (!touch) return;

      // Only allow pull when at top
      if (onlyAtTop && container.scrollTop > 0) {
        isPulling.current = false;
        setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, progress: 0 }));
        return;
      }

      const deltaY = touch.clientY - startY.current;

      // Only activate on downward pull
      if (deltaY <= 0) {
        setState(prev => ({ ...prev, isPulling: false, pullDistance: 0, progress: 0 }));
        return;
      }

      // Apply resistance
      const pullDistance = Math.min(deltaY / resistance, maxPull);
      const progress = Math.min(pullDistance / threshold, 1);
      const canRelease = pullDistance >= threshold;

      // Prevent native scroll when pulling
      if (pullDistance > 10) {
        e.preventDefault();
      }

      // Haptic feedback when reaching threshold
      if (canRelease && !hasTriggeredHaptic.current) {
        triggerHaptic();
        hasTriggeredHaptic.current = true;
      } else if (!canRelease) {
        hasTriggeredHaptic.current = false;
      }

      setState({
        isRefreshing: false,
        isPulling: true,
        pullDistance,
        progress,
        canRelease,
      });
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (state.canRelease && !state.isRefreshing) {
        refresh();
      } else {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          progress: 0,
          canRelease: false,
        }));
      }
    };

    const handleTouchCancel = () => {
      isPulling.current = false;
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        progress: 0,
        canRelease: false,
      }));
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    disabled,
    isTouchDevice,
    onlyAtTop,
    resistance,
    maxPull,
    threshold,
    triggerHaptic,
    state.canRelease,
    state.isRefreshing,
    refresh,
  ]);

  const indicatorProps: IndicatorProps = {
    visible: state.isPulling || state.isRefreshing,
    pullDistance: state.pullDistance,
    progress: state.progress,
    canRelease: state.canRelease,
    isRefreshing: state.isRefreshing,
  };

  return {
    containerRef,
    indicatorProps,
    state,
    refresh,
  };
}

/**
 * PullToRefreshIndicator Component
 *
 * Default visual indicator for pull-to-refresh.
 * Can be customized or replaced with your own component.
 */
import React from 'react';
import { Loader2, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PullToRefreshIndicatorProps extends IndicatorProps {
  className?: string;
}

export function PullToRefreshIndicator({
  visible,
  pullDistance,
  progress,
  canRelease,
  isRefreshing,
  className,
}: PullToRefreshIndicatorProps) {
  if (!visible && !isRefreshing) return null;

  return (
    <div
      className={cn(
        'absolute left-0 right-0 flex justify-center pointer-events-none z-50 transition-transform duration-200',
        className
      )}
      style={{
        top: 0,
        transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-lg transition-all duration-200',
          canRelease && !isRefreshing && 'bg-primary border-primary',
          isRefreshing && 'bg-primary border-primary'
        )}
        style={{
          transform: `rotate(${progress * 180}deg)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
        ) : canRelease ? (
          <Check className="w-5 h-5 text-primary-foreground" />
        ) : (
          <ArrowDown
            className={cn(
              'w-5 h-5 transition-colors',
              progress > 0.5 ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        )}
      </div>
    </div>
  );
}

/**
 * withPullToRefresh HOC
 *
 * Higher-order component to add pull-to-refresh to any scrollable component.
 *
 * Usage:
 * ```tsx
 * const RefreshableList = withPullToRefresh(MyListComponent);
 *
 * <RefreshableList onRefresh={fetchData} />
 * ```
 */
export function withPullToRefresh<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithPullToRefresh(
    props: P & { onRefresh: () => Promise<void>; pullToRefreshOptions?: Omit<PullToRefreshOptions, 'onRefresh'> }
  ) {
    const { onRefresh, pullToRefreshOptions, ...rest } = props;
    const { containerRef, indicatorProps } = usePullToRefresh({
      onRefresh,
      ...pullToRefreshOptions,
    });

    return (
      <div ref={containerRef} className="relative overflow-auto">
        <PullToRefreshIndicator {...indicatorProps} />
        <WrappedComponent {...(rest as P)} />
      </div>
    );
  };
}

export default usePullToRefresh;
