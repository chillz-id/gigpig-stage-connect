
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Navigate } from 'react-router-dom';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import EventManagement from '@/components/admin/EventManagement';
import UserManagement from '@/components/admin/UserManagement';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import SystemSettings from '@/components/admin/SystemSettings';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const { user, hasRole } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('analytics');

  // Check if user is admin
  if (!user || !hasRole('admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const getBackgroundStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900';
    }
    return 'bg-gradient-to-br from-gray-800 via-gray-900 to-red-900';
  };

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  return (
    <div className={cn("min-h-screen", getBackgroundStyles())}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className={cn(
            theme === 'pleasure' ? 'text-purple-100' : 'text-gray-300'
          )}>
            Manage your comedy platform and oversee all operations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn("grid w-full grid-cols-5", 
            theme === 'pleasure' 
              ? 'bg-white/[0.08] border-white/[0.15]' 
              : 'bg-gray-800 border-gray-600'
          )}>
            <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
            <TabsTrigger value="events" className="text-white">Events</TabsTrigger>
            <TabsTrigger value="users" className="text-white">Users</TabsTrigger>
            <TabsTrigger value="financial" className="text-white">Financial</TabsTrigger>
            <TabsTrigger value="settings" className="text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <EventManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <FinancialDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
