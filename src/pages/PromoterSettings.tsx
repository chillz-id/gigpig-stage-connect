
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import BrandingCustomization from '@/components/BrandingCustomization';
import GroupManagement from '@/components/GroupManagement';
import OrganizationManagement from '@/components/OrganizationManagement';
import { Settings, Palette, Users, Crown, Building2 } from 'lucide-react';

const PromoterSettings = () => {
  const { user } = useUser();

  const [brandingSettings, setBrandingSettings] = useState({
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#F59E0B',
    logo: '',
    companyName: 'Comedy Central Venues',
    tagline: 'Where laughter comes alive'
  });

  const [groups, setGroups] = useState([
    {
      id: '1',
      name: 'Staff',
      description: 'Default staff group with basic permissions',
      color: '#8B5CF6',
      permissions: ['view_analytics', 'send_messages'],
      members: [
        {
          id: '1',
          name: 'John Smith',
          email: 'john@company.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          role: 'Staff Member',
          joinedDate: '2024-01-15'
        }
      ],
      isDefault: true
    },
    {
      id: '2',
      name: 'Event Managers',
      description: 'Manage events and applications',
      color: '#10B981',
      permissions: ['manage_events', 'manage_applications', 'view_analytics', 'send_messages'],
      members: [
        {
          id: '2',
          name: 'Sarah Wilson',
          email: 'sarah@company.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
          role: 'Event Manager',
          joinedDate: '2024-02-01'
        }
      ],
      isDefault: false
    }
  ]);

  if (!user || !user.roles.includes('promoter')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h1 className="text-2xl font-bold mb-4">Promoter Access Required</h1>
            <p className="text-purple-200">You need promoter permissions to access these settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveBranding = (branding: typeof brandingSettings) => {
    setBrandingSettings(branding);
    // In a real app, this would save to the backend
  };

  const handleCreateGroup = (group: Omit<typeof groups[0], 'id' | 'members'>) => {
    const newGroup = {
      ...group,
      id: Date.now().toString(),
      members: []
    };
    setGroups(prev => [...prev, newGroup]);
  };

  const handleUpdateGroup = (groupId: string, updates: Partial<typeof groups[0]>) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ));
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const handleAddMember = (groupId: string, memberId: string) => {
    // In a real app, this would add the member to the group
  };

  const handleRemoveMember = (groupId: string, memberId: string) => {
    setGroups(prev => prev.map(group =>
      group.id === groupId
        ? { ...group, members: group.members.filter(member => member.id !== memberId) }
        : group
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Promoter Settings</h1>
            <Badge className="bg-yellow-500 text-black">PRO</Badge>
          </div>
          <p className="text-purple-100">
            Customize your promoter dashboard and manage your business
          </p>
        </div>

        <Tabs defaultValue="organizations" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm mb-6">
            <TabsTrigger value="organizations" className="data-[state=active]:bg-purple-500">
              <Building2 className="w-4 h-4 mr-2" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-purple-500">
              <Palette className="w-4 h-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-purple-500">
              <Users className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <OrganizationManagement />
          </TabsContent>

          <TabsContent value="branding">
            <BrandingCustomization
              currentBranding={brandingSettings}
              onSave={handleSaveBranding}
            />
          </TabsContent>

          <TabsContent value="groups">
            <GroupManagement
              groups={groups}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PromoterSettings;
