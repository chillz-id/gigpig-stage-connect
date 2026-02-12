/**
 * ComedianDirectoryPage
 *
 * Admin page for managing comedian directory profiles - profiles that exist
 * independently of authenticated users. Supports bulk import, photo management,
 * and CRM integration.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { DirectoryBrowser } from '@/components/admin/directory/DirectoryBrowser';
import { DirectoryImportWizard } from '@/components/admin/directory/DirectoryImportWizard';

export function ComedianDirectoryPage() {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('browse');

  // Check if user is admin
  if (!user || !hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const getBackgroundStyles = () => {
    return 'bg-[#131b2b]';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Comedian Directory</h1>
          <p className={cn(
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            Manage comedian profiles for marketing, event lineups, and promotions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn(
            "grid w-full max-w-md grid-cols-2",
            theme === 'pleasure'
              ? 'bg-white/[0.08] border-white/[0.15]'
              : 'bg-gray-800 border-gray-600'
          )}>
            <TabsTrigger value="browse" className="text-white">
              Browse Directory
            </TabsTrigger>
            <TabsTrigger value="import" className="text-white">
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <DirectoryBrowser />
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <DirectoryImportWizard
              onComplete={() => {
                // Switch to browse tab after import completes
                setActiveTab('browse');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ComedianDirectoryPage;
