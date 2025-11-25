import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Building2, 
  PlusCircle, 
  Users, 
  TrendingUp, 
  Settings,
  Crown,
  Briefcase
} from 'lucide-react';
import { useUserAgencies, useCurrentUserManagerProfile } from '../hooks/useAgency';
import AgencyManagerDashboard from '../components/agency/AgencyManagerDashboard';
import CreateAgencyModal from '../components/agency/CreateAgencyModal';
import DealNegotiationEngine from '../components/agency/DealNegotiationEngine';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../lib/utils';
import type { Agency } from '../types/agency';

const AgencyManagement: React.FC = () => {
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testState, setTestState] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: userAgencies, isLoading: agenciesLoading } = useUserAgencies();
  const { data: managerProfile } = useCurrentUserManagerProfile();

  // Auto-select first agency if none selected
  React.useEffect(() => {
    if (userAgencies && userAgencies.length > 0 && !selectedAgency) {
      setSelectedAgency(userAgencies[0].id);
    }
  }, [userAgencies, selectedAgency]);

  if (agenciesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // No agencies - first time user
  if (!userAgencies || userAgencies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Building2 className="h-20 w-20 mx-auto text-gray-400 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Agency Management</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first agency to start managing artists, negotiating deals, 
            and growing your talent management business.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => {
                console.log('Create agency button clicked');
                setShowCreateModal(true);
              }} 
              size="lg"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Create Your First Agency
            </Button>
            
            {/* Test state button */}
            <div className="text-center">
              <Button 
                onClick={() => {
                  console.log('Test button clicked, current testState:', testState);
                  setTestState(!testState);
                }}
                className="professional-button"
                size="sm"
              >
                Test State: {testState ? 'TRUE' : 'FALSE'}
              </Button>
              <p className="mt-2 text-sm text-gray-600">
                Modal state: {showCreateModal ? 'OPEN' : 'CLOSED'}
              </p>
            </div>
          </div>
        </div>

        <CreateAgencyModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      </div>
    );
  }

  const currentAgency = userAgencies.find(agency => agency.id === selectedAgency);

  const getAgencyStatusColor = (status: Agency['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'agency_owner': return <Crown className="h-4 w-4" />;
      case 'primary_manager': return <Briefcase className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Management</h1>
          <p className="text-gray-600">Manage your talent agencies and deal negotiations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Agency
        </Button>
      </div>

      {/* Agency Selector */}
      {userAgencies.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Agencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAgency === agency.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAgency(agency.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{agency.name}</h3>
                    <Badge className={getAgencyStatusColor(agency.status)}>
                      {agency.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{agency.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{agency.specialties?.join(', ') || 'No specialties'}</span>
                    <span>{formatDate(agency.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Agency Info */}
      {currentAgency && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {currentAgency.name}
                </CardTitle>
                <p className="text-gray-600 mt-1">{currentAgency.description}</p>
              </div>
              <div className="text-right">
                <Badge className={getAgencyStatusColor(currentAgency.status)}>
                  {currentAgency.status}
                </Badge>
                {managerProfile && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                    {getRoleIcon(managerProfile.role)}
                    <span className="capitalize">{managerProfile.role?.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Main Content */}
      {selectedAgency && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AgencyManagerDashboard agencyId={selectedAgency} />
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            {selectedDeal ? (
              <div>
                <Button
                  className="professional-button mb-4"
                  onClick={() => setSelectedDeal(null)}
                >
                  ← Back to Deals
                </Button>
                <DealNegotiationEngine 
                  dealId={selectedDeal} 
                  onClose={() => setSelectedDeal(null)} 
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Deal Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Deal management interface coming soon...</p>
                    <p className="text-sm">
                      This will show all deals, allow creating new negotiations, 
                      and provide advanced filtering options.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="artists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Artist Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <p>Artist management interface coming soon...</p>
                  <p className="text-sm">
                    This will show all managed artists, their performance metrics, 
                    contract details, and booking history.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Advanced analytics dashboard coming soon...</p>
                  <p className="text-sm">
                    This will provide detailed financial reports, performance trends, 
                    market analysis, and AI-driven insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      <CreateAgencyModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default AgencyManagement;