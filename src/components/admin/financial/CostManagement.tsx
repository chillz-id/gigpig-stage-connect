
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCostManagement } from '@/hooks/useCostManagement';
import { Plus, Building, Megaphone, Users } from 'lucide-react';
import VenueCostForm from './VenueCostForm';
import MarketingCostForm from './MarketingCostForm';

const CostManagement = () => {
  const [activeForm, setActiveForm] = useState<'venue' | 'marketing' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { venueCosts, marketingCosts, comedianCosts, isLoading } = useCostManagement();

  const filteredVenueCosts = venueCosts?.filter(cost =>
    cost.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cost.cost_type.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredMarketingCosts = marketingCosts?.filter(cost =>
    cost.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cost.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Cost Management</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setActiveForm('venue')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Building className="w-4 h-4 mr-2" />
            Add Venue Cost
          </Button>
          <Button 
            onClick={() => setActiveForm('marketing')} 
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Add Marketing Cost
          </Button>
        </div>
      </div>

      {activeForm && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              {activeForm === 'venue' ? 'Add Venue Cost' : 'Add Marketing Cost'}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveForm(null)}
                className="text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeForm === 'venue' ? (
              <VenueCostForm onSuccess={() => setActiveForm(null)} />
            ) : (
              <MarketingCostForm onSuccess={() => setActiveForm(null)} />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search costs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-white/10 border-white/20 text-white placeholder-gray-400"
        />
      </div>

      <Tabs defaultValue="venue" className="space-y-4">
        <TabsList className="bg-white/10 backdrop-blur-sm border-white/20">
          <TabsTrigger value="venue" className="data-[state=active]:bg-white/20">
            <Building className="w-4 h-4 mr-2" />
            Venue Costs
          </TabsTrigger>
          <TabsTrigger value="marketing" className="data-[state=active]:bg-white/20">
            <Megaphone className="w-4 h-4 mr-2" />
            Marketing Costs
          </TabsTrigger>
          <TabsTrigger value="comedians" className="data-[state=active]:bg-white/20">
            <Users className="w-4 h-4 mr-2" />
            Comedian Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venue">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Venue Costs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVenueCosts.map((cost) => (
                    <div key={cost.id} className="p-4 bg-white/5 rounded border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">{cost.description || cost.cost_type}</h4>
                          <p className="text-sm text-gray-400">
                            {new Date(cost.cost_date).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${cost.amount.toLocaleString('en-AU')}</p>
                          <p className={`text-sm ${
                            cost.payment_status === 'paid' ? 'text-green-400' : 
                            cost.payment_status === 'overdue' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {cost.payment_status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredVenueCosts.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No venue costs found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Marketing Costs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMarketingCosts.map((cost) => (
                    <div key={cost.id} className="p-4 bg-white/5 rounded border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">{cost.campaign_name || 'Marketing Campaign'}</h4>
                          <p className="text-sm text-gray-400">
                            {cost.platform} • {new Date(cost.spend_date).toLocaleDateString('en-AU')}
                          </p>
                          {cost.impressions && (
                            <p className="text-xs text-gray-500">
                              {cost.impressions.toLocaleString()} impressions, {cost.clicks} clicks
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${cost.amount.toLocaleString('en-AU')}</p>
                          <p className="text-sm text-gray-400">{cost.cost_type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMarketingCosts.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No marketing costs found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comedians">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Comedian Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-white/10 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {comedianCosts?.map((cost) => (
                    <div key={cost.id} className="p-4 bg-white/5 rounded border border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">Comedian Payment</h4>
                          <p className="text-sm text-gray-400">
                            {cost.performance_notes || 'Performance fee'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${cost.performance_fee?.toLocaleString('en-AU') || '0'}</p>
                          <p className={`text-sm ${
                            cost.payment_status === 'paid' ? 'text-green-400' : 
                            cost.payment_status === 'overdue' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {cost.payment_status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!comedianCosts || comedianCosts.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No comedian payments found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CostManagement;
