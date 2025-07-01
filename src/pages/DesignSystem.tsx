
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Settings, Paintbrush } from 'lucide-react';
import DesignSystemContent from '@/components/admin/DesignSystemContent';

const DesignSystem = () => {
  const { user, hasRole } = useAuth();

  // Block access for non-admins
  if (!user || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Palette className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="text-muted-foreground">Only administrators can access the design system controls.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Paintbrush className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Design System Control Panel</h1>
              <p className="text-muted-foreground">Customize the visual appearance of Stand Up Sydney in real-time</p>
            </div>
          </div>
        </div>

        <DesignSystemContent />
      </div>
    </div>
  );
};

export default DesignSystem;
