
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
        <TabsList className="bg-white/10 backdrop-blur-sm border-white/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
            <DollarSign className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="profitability" className="data-[state=active]:bg-white/20">
            <TrendingUp className="w-4 h-4 mr-2" />
            Event Profitability
          </TabsTrigger>
          <TabsTrigger value="costs" className="data-[state=active]:bg-white/20">
            <Calendar className="w-4 h-4 mr-2" />
            Cost Management
          </TabsTrigger>
          <TabsTrigger value="xero" className="data-[state=active]:bg-white/20">
            <FileText className="w-4 h-4 mr-2" />
            XERO Integration
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
