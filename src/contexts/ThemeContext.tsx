
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
    root.classList.remove('light');
    root.classList.add('dark');
    
    // Also ensure the body has the correct background
    document.body.style.backgroundColor = 'hsl(222.2 84% 4.9%)';
    document.body.style.color = 'hsl(210 40% 98%)';
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
