
import React, { createContext, useContext, useState } from 'react';

type ViewMode = 'member' | 'comedian' | 'promoter';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMemberView: boolean;
  isComedianView: boolean;
  isPromoterView: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('member');

  const value = {
    viewMode,
    setViewMode,
    isMemberView: viewMode === 'member',
    isComedianView: viewMode === 'comedian',
    isPromoterView: viewMode === 'promoter',
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
};
