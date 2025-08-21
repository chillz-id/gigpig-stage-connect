
import React from 'react';
import { Paintbrush } from 'lucide-react';
import DesignSystemContent from '@/components/admin/DesignSystemContent';
import { ThemeProvider } from '@/contexts/ThemeContext';

const DesignSystem = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Paintbrush className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Design System Control Panel</h1>
                <p className="text-muted-foreground">Customize the visual appearance of iD Comedy in real-time</p>
              </div>
            </div>
          </div>

          <DesignSystemContent />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default DesignSystem;
