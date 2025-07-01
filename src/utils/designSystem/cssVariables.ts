
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
  root.style.setProperty('--animation-speed', 
    settings.effects.animationSpeed === 'slow' ? '0.5s' :
    settings.effects.animationSpeed === 'normal' ? '0.3s' :
    settings.effects.animationSpeed === 'fast' ? '0.15s' : '0.1s'
  );
  root.style.setProperty('--hover-scale', settings.effects.hoverScale.toString());
};
