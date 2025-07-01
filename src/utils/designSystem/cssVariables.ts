
import { DesignSystemSettings } from '@/types/designSystem';
import { hexToHsl } from './colorUtils';

/**
 * Applies design system settings as CSS custom properties to the document root
 * @param settings - The design system settings to apply
 */
export const applyCSSVariables = (settings: DesignSystemSettings): void => {
  const root = document.documentElement;
  
  // Apply color variables
  Object.entries(settings.colors).forEach(([key, value]) => {
    const hsl = hexToHsl(value);
    root.style.setProperty(`--${key}`, hsl);
  });

  // Apply button variables
  root.style.setProperty('--button-border-radius', `${settings.buttons.borderRadius}px`);
  root.style.setProperty('--button-font-size', `${settings.buttons.fontSize}px`);
  root.style.setProperty('--button-font-weight', settings.buttons.fontWeight.toString());

  // Apply typography variables
  root.style.setProperty('--heading-font', settings.typography.headingFont);
  root.style.setProperty('--body-font', settings.typography.bodyFont);
  root.style.setProperty('--h1-size', `${settings.typography.h1Size}px`);
  root.style.setProperty('--h2-size', `${settings.typography.h2Size}px`);
  root.style.setProperty('--h3-size', `${settings.typography.h3Size}px`);
  root.style.setProperty('--body-size', `${settings.typography.bodySize}px`);
  root.style.setProperty('--small-size', `${settings.typography.smallSize}px`);
  root.style.setProperty('--line-height', settings.typography.lineHeight.toString());
  root.style.setProperty('--letter-spacing', `${settings.typography.letterSpacing}px`);

  // Apply layout variables
  root.style.setProperty('--container-max-width', `${settings.layout.containerMaxWidth}px`);
  root.style.setProperty('--section-padding', `${settings.layout.sectionPadding}px`);
  root.style.setProperty('--card-spacing', `${settings.layout.cardSpacing}px`);
  root.style.setProperty('--grid-gap', `${settings.layout.gridGap}px`);

  // Apply effects variables
  root.style.setProperty('--shadow-intensity', settings.effects.shadowIntensity.toString());
  root.style.setProperty('--blur-intensity', `${settings.effects.blurIntensity}px`);
  
  // Handle animation speed - support both enum values and direct string values
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
  root.style.setProperty('--hover-scale', settings.effects.hoverScale.toString());
};
