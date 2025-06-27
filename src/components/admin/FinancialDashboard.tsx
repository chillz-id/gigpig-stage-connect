
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Calendar, FileText } from 'lucide-react';
import FinancialOverview from './financial/FinancialOverview';
import EventProfitability from './financial/EventProfitability';
import XeroIntegration from './financial/XeroIntegration';
import CostManagement from './financial/CostManagement';

const FinancialDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Financial Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/10 backdrop-blur-sm border-white/20 w-full justify-start overflow-hidden">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 flex-shrink-0">
            <DollarSign className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Overview</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="profitability" className="data-[state=active]:bg-white/20 flex-shrink-0">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Event Profitability</span>
            <span className="sm:hidden">Events</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="data-[state=active]:bg-white/20 flex-shrink-0">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Cost Management</span>
            <span className="sm:hidden">Costs</span>
          </TabsTrigger>
          <TabsTrigger value="xero" className="data-[state=active]:bg-white/20 flex-shrink-0">
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">XERO Integration</span>
            <span className="sm:hidden">XERO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FinancialOverview selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
        </TabsContent>

        <TabsContent value="profitability">
          <EventProfitability />
        </TabsContent>

        <TabsContent value="costs">
          <CostManagement />
        </TabsContent>

        <TabsContent value="xero">
          <XeroIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
