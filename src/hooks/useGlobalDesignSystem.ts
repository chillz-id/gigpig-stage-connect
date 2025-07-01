import { useEffect } from 'react';
import { useDesignSystemPersistence } from './useDesignSystemPersistence';
import { applyCSSVariables } from '@/utils/designSystem/cssVariables';
import { DEFAULT_DESIGN_SETTINGS } from '@/utils/designSystem/defaultSettings';

/**
 * Hook to globally initialize the design system across the application
 * This should be called once at the app level to apply saved design settings
 */
export const useGlobalDesignSystem = () => {
  const { loadSettings } = useDesignSystemPersistence();

  useEffect(() => {
    const initializeDesignSystem = async () => {
      try {
        console.log('🎨 Initializing global design system...');
        const settings = await loadSettings();
        console.log('✅ Design system settings loaded:', settings);
        applyCSSVariables(settings);
        console.log('✅ CSS variables applied to document');
      } catch (error) {
        console.error('❌ Failed to initialize design system:', error);
        // Fallback to default settings
        console.log('🔄 Applying default design settings as fallback');
        applyCSSVariables(DEFAULT_DESIGN_SETTINGS);
      }
    };

    initializeDesignSystem();
  }, [loadSettings]);
};