/**
 * useSwipeGesture Hook
 *
 * Provides swipe gesture detection for mobile interfaces.
 * Supports swipe in all four directions with configurable thresholds.
 *
 * Usage:
 * ```tsx
 * const { ref, handlers } = useSwipeGesture({
 *   onSwipeLeft: () => navigate('/next'),
 *   onSwipeRight: () => navigate(-1),
 *   onSwipeDown: () => closeModal(),
 *   threshold: 50,
 * });
 *
 * return <div ref={ref} {...handlers}>Content</div>;
 * ```
 */

import { useRef, useCallback, useState, RefObject } from 'react';
import { useMobileLayout } from './useMobileLayout';

export interface SwipeGestureOptions {
  /** Callback when swiping left */
  onSwipeLeft?: () => void;
  /** Callback when swiping right */
  onSwipeRight?: () => void;
  /** Callback when swiping up */
  onSwipeUp?: () => void;
  /** Callback when swiping down */
  onSwipeDown?: () => void;
  /** Minimum distance (px) to trigger swipe (default: 50) */
  threshold?: number;
  /** Maximum time (ms) for swipe to be registered (default: 300) */
  maxTime?: number;
  /** Prevent default touch behavior (default: false) */
  preventDefault?: boolean;
  /** Only activate on touch devices (default: true) */
  touchOnly?: boolean;
  /** Disable the gesture (default: false) */
  disabled?: boolean;
}

export interface SwipeState {
  /** Whether a swipe is currently in progress */
  swiping: boolean;
  /** Current swipe direction */
  direction: 'left' | 'right' | 'up' | 'down' | null;
  /** Current swipe distance in pixels */
  distance: number;
  /** Swipe progress as percentage (0-1) based on threshold */
  progress: number;
}

export interface SwipeGestureReturn {
  /** Ref to attach to the swipeable element */
  ref: RefObject<HTMLDivElement>;
  /** Touch event handlers to spread on the element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onTouchCancel: () => void;
  };
  /** Current swipe state */
  state: SwipeState;
  /** Reset the swipe state */
  reset: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}): SwipeGestureReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    maxTime = 300,
    preventDefault = false,
    touchOnly = true,
    disabled = false,
  } = options;

  const { isTouchDevice } = useMobileLayout();
  const ref = useRef<HTMLDivElement>(null);
  const startPoint = useRef<TouchPoint | null>(null);

  const [state, setState] = useState<SwipeState>({
    swiping: false,
    direction: null,
    distance: 0,
    progress: 0,
  });

  const reset = useCallback(() => {
    startPoint.current = null;
    setState({
      swiping: false,
      direction: null,
      distance: 0,
      progress: 0,
    });
  }, []);

  const getDirection = useCallback((deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    }
    return deltaY > 0 ? 'down' : 'up';
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || (touchOnly && !isTouchDevice)) return;

    const touch = e.touches[0];
    if (!touch) return;

    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    setState(prev => ({ ...prev, swiping: true }));
  }, [disabled, touchOnly, isTouchDevice]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !startPoint.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    const direction = getDirection(deltaX, deltaY);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const progress = Math.min(distance / threshold, 1);

    // Prevent scrolling if we're swiping horizontally
    if (preventDefault && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }

    setState({
      swiping: true,
      direction,
      distance,
      progress,
    });
  }, [disabled, getDirection, threshold, preventDefault]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !startPoint.current) {
      reset();
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) {
      reset();
      return;
    }

    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    const deltaTime = Date.now() - startPoint.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if swipe meets criteria
    if (distance >= threshold && deltaTime <= maxTime) {
      const direction = getDirection(deltaX, deltaY);

      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    }

    reset();
  }, [disabled, threshold, maxTime, getDirection, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, reset]);

  const onTouchCancel = useCallback(() => {
    reset();
  }, [reset]);

  return {
    ref,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
    state,
    reset,
  };
}

/**
 * useSwipeToGoBack Hook
 *
 * Specialized hook for swipe-to-go-back navigation pattern.
 * Swipe right from the left edge to navigate back.
 *
 * Usage:
 * ```tsx
 * const { handlers, showIndicator } = useSwipeToGoBack();
 *
 * return (
 *   <div {...handlers}>
 *     {showIndicator && <BackSwipeIndicator />}
 *     <PageContent />
 *   </div>
 * );
 * ```
 */
export function useSwipeToGoBack(onBack: () => void, options: { edgeWidth?: number } = {}) {
  const { edgeWidth = 30 } = options;
  const isFromEdge = useRef(false);

  const { ref, handlers: baseHandlers, state } = useSwipeGesture({
    onSwipeRight: () => {
      if (isFromEdge.current) {
        onBack();
      }
    },
    threshold: 100,
    maxTime: 500,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch && touch.clientX <= edgeWidth) {
      isFromEdge.current = true;
      baseHandlers.onTouchStart(e);
    } else {
      isFromEdge.current = false;
    }
  }, [edgeWidth, baseHandlers]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    baseHandlers.onTouchEnd(e);
    isFromEdge.current = false;
  }, [baseHandlers]);

  return {
    ref,
    handlers: {
      ...baseHandlers,
      onTouchStart,
      onTouchEnd,
    },
    /** Show back indicator when swiping from edge */
    showIndicator: state.swiping && isFromEdge.current && state.direction === 'right',
    /** Progress of the swipe (0-1) */
    progress: state.progress,
  };
}

/**
 * useSwipeToDelete Hook
 *
 * Provides swipe-to-delete functionality for list items.
 * Swipe left to reveal delete action, with confirmation threshold.
 *
 * Usage:
 * ```tsx
 * const { handlers, translateX, isDeleting } = useSwipeToDelete({
 *   onDelete: () => removeItem(id),
 *   deleteThreshold: 150,
 * });
 *
 * return (
 *   <div {...handlers} style={{ transform: `translateX(${translateX}px)` }}>
 *     <ListItem />
 *   </div>
 * );
 * ```
 */
export function useSwipeToDelete(options: {
  onDelete: () => void;
  deleteThreshold?: number;
  maxSwipe?: number;
}) {
  const { onDelete, deleteThreshold = 100, maxSwipe = 150 } = options;
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      startX.current = touch.clientX;
      currentX.current = translateX;
    }
  }, [translateX]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startX.current;
    const newX = Math.max(-maxSwipe, Math.min(0, currentX.current + deltaX));

    setTranslateX(newX);
    setIsDeleting(Math.abs(newX) >= deleteThreshold);
  }, [maxSwipe, deleteThreshold]);

  const onTouchEnd = useCallback(() => {
    if (Math.abs(translateX) >= deleteThreshold) {
      // Animate out and delete
      setTranslateX(-maxSwipe * 2);
      setTimeout(onDelete, 200);
    } else {
      // Snap back
      setTranslateX(0);
    }
    setIsDeleting(false);
  }, [translateX, deleteThreshold, maxSwipe, onDelete]);

  const onTouchCancel = useCallback(() => {
    setTranslateX(0);
    setIsDeleting(false);
  }, []);

  const reset = useCallback(() => {
    setTranslateX(0);
    setIsDeleting(false);
  }, []);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
    /** Current X translation in pixels (negative = swiped left) */
    translateX,
    /** Whether delete threshold has been reached */
    isDeleting,
    /** Reset the swipe state */
    reset,
    /** Progress toward delete (0-1) */
    progress: Math.min(Math.abs(translateX) / deleteThreshold, 1),
  };
}

export default useSwipeGesture;
