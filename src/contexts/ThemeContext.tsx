

export type Theme = 'pleasure' | 'business';

interface ThemeSchedule {
  enabled: boolean;
  businessStart: string; // HH:MM format
  businessEnd: string;
  autoSwitch: boolean;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  autoTheme: boolean;
  setAutoTheme: (auto: boolean) => void;
  schedule: ThemeSchedule;
  setSchedule: (schedule: ThemeSchedule) => void;
  getRecommendedTheme: () => Theme;
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
    // Always use business theme for now
    return 'business';
  });
  
  const [autoTheme, setAutoTheme] = useState<boolean>(() => {
    // Auto theme disabled by default
    return false;
  });
  
  const [schedule, setScheduleState] = useState<ThemeSchedule>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('theme-schedule') : null;
      return saved ? JSON.parse(saved) : {
        enabled: false,
        businessStart: '09:00',
        businessEnd: '17:00',
        autoSwitch: true
      };
    } catch (error) {
      return {
        enabled: false,
        businessStart: '09:00',
        businessEnd: '17:00',
        autoSwitch: true
      };
    }
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
    
    // Apply theme-specific styles with solid backgrounds
    if (theme === 'pleasure') {
      body.style.background = 'linear-gradient(135deg, #6B46C1, #7C3AED, #8B5CF6)';
      body.style.color = 'white';
      body.className = `theme-pleasure bg-gradient-to-br from-violet-700 via-purple-700 to-purple-600 text-white min-h-screen`;
    } else {
      body.style.background = 'linear-gradient(135deg, #1F2937, #111827, #450A0A)';
      body.style.color = '#F3F4F6';
      body.className = `theme-business bg-gradient-to-br from-gray-800 via-gray-900 to-red-900 text-gray-100 min-h-screen`;
    }
    
    // Set CSS custom properties for theme variables with solid colors
    if (theme === 'pleasure') {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #6B46C1, #7C3AED, #8B5CF6)');
      root.style.setProperty('--card-bg', '#553C9A');
      root.style.setProperty('--card-hover-bg', '#6D28D9');
      root.style.setProperty('--accent-primary', '#C084FC');
      root.style.setProperty('--accent-secondary', '#A855F7');
    } else {
      root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #1F2937, #111827, #450A0A)');
      root.style.setProperty('--card-bg', '#374151');
      root.style.setProperty('--card-hover-bg', '#4B5563');
      root.style.setProperty('--accent-primary', '#DC2626');
      root.style.setProperty('--accent-secondary', '#6B7280');
    }
    
    root.style.colorScheme = 'dark';
  }, [theme]);

  // Function to get recommended theme based on time
  const getRecommendedTheme = (): Theme => {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [startHour, startMin] = schedule.businessStart.split(':').map(Number);
    const [endHour, endMin] = schedule.businessEnd.split(':').map(Number);
    const businessStart = startHour * 100 + startMin;
    const businessEnd = endHour * 100 + endMin;
    
    if (schedule.enabled && schedule.autoSwitch) {
      return (currentTime >= businessStart && currentTime <= businessEnd) ? 'business' : 'pleasure';
    }
    
    // Default time-based recommendation (9 AM - 5 PM business)
    return (currentTime >= 900 && currentTime <= 1700) ? 'business' : 'pleasure';
  };
  
  // Auto theme effect - DISABLED for now
  // useEffect(() => {
  //   if (autoTheme) {
  //     const recommended = getRecommendedTheme();
  //     if (recommended !== theme) {
  //       setThemeState(recommended);
  //     }
  //   }
  // }, [autoTheme, schedule]);
  
  // Check theme every minute when auto theme is enabled - DISABLED for now
  // useEffect(() => {
  //   if (!autoTheme) return;
  //   
  //   const interval = setInterval(() => {
  //     const recommended = getRecommendedTheme();
  //     if (recommended !== theme) {
  //       setThemeState(recommended);
  //     }
  //   }, 60000); // Check every minute
  //   
  //   return () => clearInterval(interval);
  // }, [autoTheme, theme, schedule]);
  
  const setTheme = (newTheme: Theme) => {
    // For now, always keep business theme
    setThemeState('business');
    localStorage.setItem('theme-preference', 'business');
  };
  
  const setAutoThemeHandler = (auto: boolean) => {
    // Auto theme functionality disabled for now
    setAutoTheme(false);
    localStorage.setItem('auto-theme', 'false');
    setThemeState('business');
    localStorage.setItem('theme-preference', 'business');
  };
  
  const setSchedule = (newSchedule: ThemeSchedule) => {
    setScheduleState(newSchedule);
    localStorage.setItem('theme-schedule', JSON.stringify(newSchedule));
    
    // Schedule switching disabled for now - always business theme
    setThemeState('business');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      autoTheme, 
      setAutoTheme: setAutoThemeHandler, 
      schedule, 
      setSchedule,
      getRecommendedTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
