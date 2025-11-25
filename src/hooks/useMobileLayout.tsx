import { useEffect, useState } from "react";

export interface MobileLayoutState {
  isMobile: boolean;        // < 768px
  isSmallMobile: boolean;   // < 480px (iPhone SE)
  isTouchDevice: boolean;   // pointer: coarse
  isPortrait: boolean;      // orientation: portrait
}

const MOBILE_BREAKPOINT = 768;
const SMALL_MOBILE_BREAKPOINT = 480;

/**
 * Hook to detect mobile layout states
 *
 * @returns {MobileLayoutState} Object containing mobile state booleans
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isSmallMobile, isTouchDevice, isPortrait } = useMobileLayout();
 *
 *   return isMobile ? <MobileView /> : <DesktopView />;
 * }
 * ```
 */
export function useMobileLayout(): MobileLayoutState {
  const [state, setState] = useState<MobileLayoutState>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isSmallMobile: false,
        isTouchDevice: false,
        isPortrait: false,
      };
    }

    return {
      isMobile: window.innerWidth < MOBILE_BREAKPOINT,
      isSmallMobile: window.innerWidth < SMALL_MOBILE_BREAKPOINT,
      isTouchDevice: window.matchMedia("(pointer: coarse)").matches,
      isPortrait: window.matchMedia("(orientation: portrait)").matches,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateLayout = () => {
      setState({
        isMobile: window.innerWidth < MOBILE_BREAKPOINT,
        isSmallMobile: window.innerWidth < SMALL_MOBILE_BREAKPOINT,
        isTouchDevice: window.matchMedia("(pointer: coarse)").matches,
        isPortrait: window.matchMedia("(orientation: portrait)").matches,
      });
    };

    // Listen for resize
    window.addEventListener("resize", updateLayout);

    // Listen for orientation change
    const orientationQuery = window.matchMedia("(orientation: portrait)");
    const handleOrientationChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setState(prev => ({
        ...prev,
        isPortrait: e.matches,
      }));
    };

    // Modern browsers
    if (orientationQuery.addEventListener) {
      orientationQuery.addEventListener("change", handleOrientationChange);
    } else {
      // Fallback for older browsers
      orientationQuery.addListener(handleOrientationChange);
    }

    return () => {
      window.removeEventListener("resize", updateLayout);
      if (orientationQuery.removeEventListener) {
        orientationQuery.removeEventListener("change", handleOrientationChange);
      } else {
        orientationQuery.removeListener(handleOrientationChange);
      }
    };
  }, []);

  return state;
}
