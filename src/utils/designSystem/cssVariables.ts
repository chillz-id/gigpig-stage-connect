
import { DesignSystemSettings } from '@/types/designSystem';
import { hexToHsl } from './colorUtils';

/**
 * Applies design system settings as CSS custom properties to the document root
 * @param settings - The design system settings to apply
 */
export const applyCSSVariables = (settings: DesignSystemSettings): void => {
  const root = document.documentElement;
  
  // Apply color variables
  if (settings.colors) {
    Object.entries(settings.colors).forEach(([key, value]) => {
      const hsl = hexToHsl(value);
      root.style.setProperty(`--${key}`, hsl);
    });
  }

  // Apply button variables
  if (settings.buttons) {
    root.style.setProperty('--button-border-radius', `${settings.buttons.borderRadius || 8}px`);
    root.style.setProperty('--button-font-size', `${settings.buttons.fontSize || 14}px`);
    root.style.setProperty('--button-font-weight', (settings.buttons.fontWeight || 500).toString());
  }

  // Apply typography variables
  if (settings.typography) {
    root.style.setProperty('--heading-font', settings.typography.headingFont || 'Inter');
    root.style.setProperty('--body-font', settings.typography.bodyFont || 'Inter');
    root.style.setProperty('--h1-size', `${settings.typography.h1Size || 32}px`);
    root.style.setProperty('--h2-size', `${settings.typography.h2Size || 24}px`);
    root.style.setProperty('--h3-size', `${settings.typography.h3Size || 20}px`);
    root.style.setProperty('--body-size', `${settings.typography.bodySize || 16}px`);
    root.style.setProperty('--small-size', `${settings.typography.smallSize || 14}px`);
  }
  // Apply additional typography variables
  if (settings.typography) {
    root.style.setProperty('--line-height', (settings.typography.lineHeight || 1.5).toString());
    root.style.setProperty('--letter-spacing', `${settings.typography.letterSpacing || 0}px`);
  }

  // Apply layout variables
  if (settings.layout) {
    root.style.setProperty('--container-max-width', `${settings.layout.containerMaxWidth || 1200}px`);
    root.style.setProperty('--section-padding', `${settings.layout.sectionPadding || 24}px`);
    root.style.setProperty('--card-spacing', `${settings.layout.cardSpacing || 16}px`);
    root.style.setProperty('--grid-gap', `${settings.layout.gridGap || 16}px`);
  }

  // Apply effects variables
  if (settings.effects) {
    root.style.setProperty('--shadow-intensity', (settings.effects.shadowIntensity || 0.1).toString());
    root.style.setProperty('--blur-intensity', `${settings.effects.blurIntensity || 8}px`);
  }
  
  // Handle animation speed - support both enum values and direct string values
  if (settings.effects) {
    let animationSpeedValue: string;
    if (typeof settings.effects.animationSpeed === 'string') {
    if (settings.effects.animationSpeed.includes('ms') || settings.effects.animationSpeed.includes('s')) {
      // Direct CSS time value (e.g., "200ms", "0.3s")
      animationSpeedValue = settings.effects.animationSpeed;
    } else {
      // Enum value - convert to time
      switch (settings.effects.animationSpeed) {
        case 'slow': animationSpeedValue = '0.5s'; break;
        case 'normal': animationSpeedValue = '0.3s'; break;
        case 'fast': animationSpeedValue = '0.15s'; break;
        case 'instant': animationSpeedValue = '0.1s'; break;
        default: animationSpeedValue = '0.3s';
      }
    }
  } else {
    animationSpeedValue = '0.3s';
  }
  
    root.style.setProperty('--animation-speed', animationSpeedValue);
    root.style.setProperty('--hover-scale', (settings.effects.hoverScale || 1.05).toString());
  }
};
