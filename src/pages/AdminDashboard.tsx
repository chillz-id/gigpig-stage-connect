
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Shield } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import EventManagement from '@/components/admin/EventManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import MetaPixelSettings from '@/components/admin/MetaPixelSettings';
import SystemSettings from '@/components/admin/SystemSettings';

const AdminDashboard = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Block access for non-admins
  if (!user || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="text-purple-200">Only system administrators can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-purple-200">Manage all aspects of Stand Up Sydney</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Users
            </TabsTrigger>
            <TabsTrigger value="events" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <EventManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
            <MetaPixelSettings />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SystemSettings />
            <MetaPixelSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
