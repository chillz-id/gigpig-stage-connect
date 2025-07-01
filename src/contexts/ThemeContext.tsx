
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'pleasure' | 'business';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme-preference');
    return (saved as Theme) || 'pleasure'; // Default to Pleasure theme
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove any existing theme classes
    root.classList.remove('theme-pleasure', 'theme-business');
    body.classList.remove('theme-pleasure', 'theme-business');
    
    // Add new theme class
    root.classList.add(`theme-${theme}`);
    body.classList.add(`theme-${theme}`);
    
    // Apply theme-specific styles
    if (theme === 'pleasure') {
      body.style.background = 'linear-gradient(135deg, #BE185D, #7C3AED, #581C87)';
      body.style.color = 'white';
      body.className = `theme-pleasure bg-gradient-to-br from-pink-700 via-purple-600 to-purple-800 text-white min-h-screen`;
    } else {
      body.style.background = 'linear-gradient(135deg, #1F2937, #111827, #450A0A)';
      body.style.color = '#F3F4F6';
      body.className = `theme-business bg-gradient-to-br from-gray-800 via-gray-900 to-red-900 text-gray-100 min-h-screen`;
    }
    
    // Set CSS custom properties for theme variables
    if (theme === 'pleasure') {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #BE185D, #7C3AED, #581C87)');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--accent-primary', '#E91E63');
      root.style.setProperty('--accent-secondary', '#7C3AED');
    } else {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #1F2937, #111827, #450A0A)');
      root.style.setProperty('--card-bg', '#374151');
      root.style.setProperty('--accent-primary', '#DC2626');
      root.style.setProperty('--accent-secondary', '#6B7280');
    }
    
    root.style.colorScheme = 'dark';
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
