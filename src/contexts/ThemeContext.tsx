
import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'dark';

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
  const theme: Theme = 'dark';

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove any light theme classes
    root.classList.remove('light');
    root.classList.add('dark');
    
    // Set proper dark theme background and text colors
    body.style.backgroundColor = 'hsl(240 10% 3.9%)'; // --background from dark theme
    body.style.color = 'hsl(0 0% 98%)'; // --foreground from dark theme
    body.className = 'dark bg-background text-foreground';
    
    // Ensure proper theme variables are applied
    root.style.colorScheme = 'dark';
  }, []);

  const setTheme = () => {
    // No-op since we only support dark mode
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
