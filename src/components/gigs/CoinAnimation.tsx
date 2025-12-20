import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinAnimationProps {
  /** The time text to display (e.g., "7:30 PM") */
  timeText: string;
  /** Position coordinates where animation should originate */
  position: { x: number; y: number };
  /** Callback when animation completes */
  onComplete: () => void;
}

/**
 * CoinAnimation Component
 *
 * Super Mario-style coin animation for single-event availability marking.
 * The event time floats up from the tapped position and fades out.
 *
 * Uses framer-motion for smooth animations.
 */
export function CoinAnimation({
  timeText,
  position,
  onComplete,
}: CoinAnimationProps) {
  useEffect(() => {
    // Auto-dismiss after animation completes
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{
        opacity: 1,
        y: 0,
        scale: 0.8,
        x: position.x,
      }}
      animate={{
        opacity: 0,
        y: -80,
        scale: 1.2,
        x: position.x,
      }}
      transition={{
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1], // Ease out
      }}
      style={{
        position: 'fixed',
        top: position.y,
        left: 0,
        zIndex: 100,
        pointerEvents: 'none',
      }}
      className="font-bold text-lg text-green-500 drop-shadow-lg"
    >
      <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
        <span className="text-green-500">✓</span>
        <span>{timeText}</span>
      </div>
    </motion.div>
  );
}

/**
 * Hook to manage coin animation state
 */
interface CoinAnimationState {
  isVisible: boolean;
  timeText: string;
  position: { x: number; y: number };
}

export function useCoinAnimation() {
  const [animation, setAnimation] = useState<CoinAnimationState | null>(null);

  const triggerAnimation = (
    timeText: string,
    element: HTMLElement | { getBoundingClientRect: () => DOMRect }
  ) => {
    const rect = element.getBoundingClientRect();
    setAnimation({
      isVisible: true,
      timeText,
      position: {
        x: rect.left + rect.width / 2 - 50, // Center the animation
        y: rect.top,
      },
    });
  };

  const clearAnimation = () => {
    setAnimation(null);
  };

  return {
    animation,
    triggerAnimation,
    clearAnimation,
  };
}

/**
 * CoinAnimationPortal - Renders the coin animation at the document level
 */
interface CoinAnimationPortalProps {
  animation: CoinAnimationState | null;
  onComplete: () => void;
}

export function CoinAnimationPortal({
  animation,
  onComplete,
}: CoinAnimationPortalProps) {
  return (
    <AnimatePresence>
      {animation && animation.isVisible && (
        <CoinAnimation
          timeText={animation.timeText}
          position={animation.position}
          onComplete={onComplete}
        />
      )}
    </AnimatePresence>
  );
}
