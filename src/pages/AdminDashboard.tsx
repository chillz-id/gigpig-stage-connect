
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Crown, Shield, Drama } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserManagement from '@/components/admin/UserManagement';
import EventManagement from '@/components/admin/EventManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import MetaPixelSettings from '@/components/admin/MetaPixelSettings';
import SystemSettings from '@/components/admin/SystemSettings';
import TicketSalesManagement from '@/components/admin/ticket-sales/TicketSalesManagement';

const AdminDashboard = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Block access for non-admins
  if (!user || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-md w-full">
          <CardContent className="p-6 md:p-8 text-center">
            <Shield className="w-12 md:w-16 h-12 md:h-16 mx-auto mb-4 text-red-400" />
            <h1 className="text-xl md:text-2xl font-bold mb-4">Admin Access Required</h1>
            <p className="text-purple-200 text-content">Only system administrators can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 overflow-hidden">
      <div className="container mx-auto px-4 py-4 md:py-8 h-screen overflow-y-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 md:w-8 h-6 md:h-8 text-yellow-400 flex-shrink-0" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-purple-200 text-content">Manage all aspects of Stand Up Sydney</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 md:mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg md:text-xl">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link to="/customization">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white min-h-[44px] text-base">
                    <Drama className="w-4 h-4 mr-2" />
                    Customize Website
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-white/10 backdrop-blur-sm min-w-fit">
              <TabsTrigger 
                value="overview" 
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900 min-h-[44px] text-xs md:text-sm whitespace-nowrap"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900 min-h-[44px] text-xs md:text-sm whitespace-nowrap"
              >
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900 min-h-[44px] text-xs md:text-sm whitespace-nowrap"
              >
                Events
              </TabsTrigger>
              <TabsTrigger 
                value="sales" 
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900 min-h-[44px] text-xs md:text-sm whitespace-nowrap"
              >
                Ticket Sales
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900 min-h-[44px] text-xs md:text-sm whitespace-nowrap"
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-900 min-h-[44px] text-xs md:text-sm whitespace-nowrap"
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-4 md:space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="events" className="space-y-4 md:space-y-6">
            <EventManagement />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4 md:space-y-6">
            <TicketSalesManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 md:space-y-6">
            <AnalyticsDashboard />
            <MetaPixelSettings />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 md:space-y-6">
            <SystemSettings />
            <MetaPixelSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
