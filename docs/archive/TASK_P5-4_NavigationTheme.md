# P5.4: Navigation & Theme Improvements

## **🎯 TASK OVERVIEW**
**Priority:** MEDIUM - UI/UX polish and branding
**Component:** Navigation system and theme improvements
**Current Issue:** Missing enhanced navigation features and theme toggle

## **🔍 PROBLEM DETAILS**
- Need Business/Pleasure toggle with rose icon (filled/outlined)
- Missing animated hover text for theme toggle
- No profile picture in navigation
- Need Magic UI Dock implementation for navigation
- Navigation needs modernization and better UX

## **📁 FILES TO CHECK**
- `src/components/Navigation/` - Navigation components directory
- `src/components/Navigation/ThemeToggle.tsx` - Business/Pleasure toggle
- `src/components/Navigation/Dock.tsx` - Magic UI Dock component
- `src/components/Navigation/ProfileMenu.tsx` - Profile navigation
- `src/lib/theme.ts` - Theme management

## **✅ ACCEPTANCE CRITERIA**
1. Business/Pleasure toggle with rose icon (filled for business, outlined for pleasure)
2. Animated text that slides up on hover for theme toggle
3. Profile picture displays in navigation circle
4. Magic UI Dock implementation for main navigation
5. Smooth animations and transitions
6. Responsive navigation for mobile
7. Theme state persists across sessions

## **🔧 TECHNICAL REQUIREMENTS**
1. **Business/Pleasure theme toggle:**
   ```typescript
   interface ThemeState {
     mode: 'business' | 'pleasure';
     colors: {
       primary: string;
       secondary: string;
       background: string;
     };
   }
   
   const THEME_CONFIGS = {
     business: {
       primary: '#1f2937', // Dark gray
       secondary: '#6b7280',
       background: '#f9fafb',
       rose: 'filled' // Filled rose icon
     },
     pleasure: {
       primary: '#8b5cf6', // Purple
       secondary: '#a78bfa',
       background: '#faf5ff',
       rose: 'outlined' // Outlined rose icon
     }
   };
   ```

2. **Magic UI Dock component:**
   ```typescript
   interface DockItem {
     id: string;
     icon: React.ComponentType;
     label: string;
     href?: string;
     onClick?: () => void;
     badge?: number;
   }
   ```

3. **Profile picture in navigation:**
   ```typescript
   const ProfileCircle = ({ user }) => (
     <div className="profile-circle">
       {user.avatar_url ? (
         <img 
           src={user.avatar_url} 
           alt={user.full_name}
           className="rounded-full w-8 h-8"
         />
       ) : (
         <div className="avatar-placeholder">
           {user.full_name?.charAt(0) || user.email?.charAt(0)}
         </div>
       )}
     </div>
   );
   ```

## **🔍 IMPLEMENTATION STRATEGY**
1. **Business/Pleasure toggle:**
   ```typescript
   // src/components/Navigation/ThemeToggle.tsx
   const ThemeToggle = () => {
     const [theme, setTheme] = useTheme();
     const [isHovered, setIsHovered] = useState(false);
     
     const toggleTheme = () => {
       setTheme(theme === 'business' ? 'pleasure' : 'business');
     };
     
     return (
       <div 
         className="theme-toggle"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
       >
         <button
           onClick={toggleTheme}
           className="rose-toggle"
           aria-label={`Switch to ${theme === 'business' ? 'pleasure' : 'business'} mode`}
         >
           {theme === 'business' ? (
             <RoseFilledIcon className="rose-icon" />
           ) : (
             <RoseOutlinedIcon className="rose-icon" />
           )}
         </button>
         
         <div className={`hover-text ${isHovered ? 'show' : ''}`}>
           {theme === 'business' ? 'Switch to Pleasure' : 'Switch to Business'}
         </div>
       </div>
     );
   };
   ```

2. **Magic UI Dock implementation:**
   ```typescript
   // src/components/Navigation/Dock.tsx
   const Dock = ({ items }) => {
     const [hoveredItem, setHoveredItem] = useState(null);
     
     return (
       <div className="dock">
         <div className="dock-container">
           {items.map((item, index) => (
             <DockItem
               key={item.id}
               item={item}
               index={index}
               isHovered={hoveredItem === item.id}
               onHover={() => setHoveredItem(item.id)}
               onLeave={() => setHoveredItem(null)}
             />
           ))}
         </div>
       </div>
     );
   };
   
   const DockItem = ({ item, index, isHovered, onHover, onLeave }) => (
     <div
       className={`dock-item ${isHovered ? 'hovered' : ''}`}
       onMouseEnter={onHover}
       onMouseLeave={onLeave}
     >
       <Link to={item.href} className="dock-link">
         <item.icon className="dock-icon" />
         {item.badge && (
           <span className="dock-badge">{item.badge}</span>
         )}
       </Link>
       
       <div className="dock-tooltip">
         {item.label}
       </div>
     </div>
   );
   ```

## **🎨 ANIMATED HOVER TEXT**
```css
/* src/styles/animations.css */
.hover-text {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-text.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.hover-text::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
}
```

## **🌹 ROSE ICON IMPLEMENTATION**
```typescript
// src/components/Icons/RoseIcon.tsx
const RoseFilledIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    {/* Additional rose petals for filled version */}
  </svg>
);

const RoseOutlinedIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeWidth="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    {/* Additional rose petals for outlined version */}
  </svg>
);
```

## **🎯 MAGIC UI DOCK CONFIGURATION**
```typescript
// src/config/dockItems.ts
export const DOCK_ITEMS: DockItem[] = [
  {
    id: 'dashboard',
    icon: HomeIcon,
    label: 'Dashboard',
    href: '/dashboard'
  },
  {
    id: 'shows',
    icon: MicrophoneIcon,
    label: 'Shows',
    href: '/shows'
  },
  {
    id: 'calendar',
    icon: CalendarIcon,
    label: 'Calendar',
    href: '/profile/calendar'
  },
  {
    id: 'messages',
    icon: ChatIcon,
    label: 'Messages',
    href: '/messages',
    badge: unreadMessageCount
  },
  {
    id: 'notifications',
    icon: BellIcon,
    label: 'Notifications',
    href: '/notifications',
    badge: unreadNotificationCount
  },
  {
    id: 'profile',
    icon: UserIcon,
    label: 'Profile',
    href: '/profile'
  }
];
```

## **📱 MOBILE RESPONSIVE DOCK**
```css
/* Mobile dock styling */
@media (max-width: 768px) {
  .dock {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
  
  .dock-container {
    display: flex;
    justify-content: space-around;
    padding: 8px;
  }
  
  .dock-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    max-width: 60px;
  }
  
  .dock-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
  
  .dock-tooltip {
    font-size: 10px;
    text-align: center;
  }
}

/* Desktop dock styling */
@media (min-width: 769px) {
  .dock {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  
  .dock-container {
    display: flex;
    gap: 4px;
    padding: 8px;
  }
  
  .dock-item {
    position: relative;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .dock-item.hovered {
    transform: translateY(-10px) scale(1.2);
  }
}
```

## **🎨 THEME SYSTEM INTEGRATION**
```typescript
// src/lib/theme.ts
export const useTheme = () => {
  const [theme, setThemeState] = useState<'business' | 'pleasure'>('pleasure');
  
  const setTheme = (newTheme: 'business' | 'pleasure') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update CSS custom properties
    const config = THEME_CONFIGS[newTheme];
    Object.entries(config).forEach(([key, value]) => {
      if (key !== 'rose') {
        document.documentElement.style.setProperty(`--${key}`, value);
      }
    });
  };
  
  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'business' | 'pleasure';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  return [theme, setTheme] as const;
};
```

## **🧪 TESTING INSTRUCTIONS**
1. **Test theme toggle:**
   - Click rose icon to switch themes
   - Verify icon changes from filled to outlined
   - Hover to see animated text appear
   - Verify theme persists after page refresh

2. **Test dock functionality:**
   - Hover over dock items for scaling effect
   - Click items to navigate to correct pages
   - Verify tooltips appear on hover
   - Test on mobile for bottom dock layout

3. **Test profile picture:**
   - Verify profile picture displays in navigation
   - Test with users who have/don't have profile pictures
   - Verify fallback initials work correctly

4. **Test responsive behavior:**
   - Desktop: Floating dock at bottom center
   - Mobile: Fixed dock at bottom of screen
   - Verify touch interactions work on mobile

## **📋 DEFINITION OF DONE**
- [ ] Business/Pleasure toggle with rose icon implemented
- [ ] Animated hover text slides up smoothly
- [ ] Profile picture displays in navigation circle
- [ ] Magic UI Dock implemented with hover effects
- [ ] Theme state persists across sessions
- [ ] Mobile-responsive dock layout
- [ ] Smooth animations and transitions
- [ ] Accessibility features for navigation
- [ ] Touch-friendly interactions on mobile
- [ ] Performance optimized animations