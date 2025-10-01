
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Calculator, TrendingUp, FileText, Download } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SettlementData {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  comedianFees: number;
  venueCosts: number;
  marketingCosts: number;
  ticketsSold: number;
  platformBreakdown: Array<{
    platform: string;
    revenue: number;
    tickets: number;
  }>;
}

interface EventSettlementsTabProps {
  eventId: string;
}

const EventSettlementsTab: React.FC<EventSettlementsTabProps> = ({ eventId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settlementData, setSettlementData] = useState<SettlementData>({
    totalRevenue: 0,
    totalCosts: 0,
    netProfit: 0,
    profitMargin: 0,
    comedianFees: 0,
    venueCosts: 0,
    marketingCosts: 0,
    ticketsSold: 0,
    platformBreakdown: []
  });
  const [eventStatus, setEventStatus] = useState('pending');

  const fetchSettlementData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch ticket sales revenue
      const { data: salesData, error: salesError } = await supabase
        .from('ticket_sales')
        .select('total_amount, ticket_quantity, platform')
        .eq('event_id', eventId);

      if (salesError) throw salesError;

      // Fetch comedian booking costs
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('comedian_bookings')
        .select('performance_fee')
        .eq('event_id', eventId);

      if (bookingsError) throw bookingsError;

      // Fetch venue costs
      const { data: venueData, error: venueError } = await supabase
        .from('venue_costs')
        .select('amount')
        .eq('event_id', eventId);

      if (venueError) throw venueError;

      // Fetch marketing costs
      const { data: marketingData, error: marketingError } = await supabase
        .from('marketing_costs')
        .select('amount')
        .eq('event_id', eventId);

      if (marketingError) throw marketingError;

      // Fetch event settlement status
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('settlement_status')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Calculate totals
      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalTickets = salesData?.reduce((sum, sale) => sum + sale.ticket_quantity, 0) || 0;
      const comedianFees = bookingsData?.reduce((sum, booking) => sum + Number(booking.performance_fee), 0) || 0;
      const venueCosts = venueData?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
      const marketingCosts = marketingData?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;
      
      const totalCosts = comedianFees + venueCosts + marketingCosts;
      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Calculate platform breakdown
      const platformBreakdown = salesData?.reduce((acc: any[], sale) => {
        const platform = sale.platform || 'Unknown';
        const existing = acc.find(p => p.platform === platform);
        
        if (existing) {
          existing.revenue += Number(sale.total_amount);
          existing.tickets += sale.ticket_quantity;
        } else {
          acc.push({
            platform,
            revenue: Number(sale.total_amount),
            tickets: sale.ticket_quantity
          });
        }
        
        return acc;
      }, []) || [];

      setSettlementData({
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        comedianFees,
        venueCosts,
        marketingCosts,
        ticketsSold: totalTickets,
        platformBreakdown
      });

      setEventStatus(eventData?.settlement_status || 'pending');

    } catch (error: any) {
      console.error('Error fetching settlement data:', error);
      toast({
        title: "Error",
        description: "Failed to load settlement data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    fetchSettlementData();
  }, [eventId, fetchSettlementData]);

  const updateSettlementStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ settlement_status: newStatus })
        .eq('id', eventId);

      if (error) throw error;

      setEventStatus(newStatus);
      toast({
        title: "Settlement Status Updated",
        description: `Settlement status changed to ${newStatus}`,
      });
    } catch (error: any) {
      console.error('Error updating settlement status:', error);
      toast({
        title: "Error",
        description: "Failed to update settlement status",
        variant: "destructive",
      });
    }
  };

  const generateFinancialReport = () => {
    const reportData = {
      eventId,
      generatedAt: new Date().toISOString(),
      ...settlementData
    };

    const csvContent = [
      ['Financial Settlement Report'],
      ['Generated:', new Date().toLocaleDateString()],
      [''],
      ['Revenue Summary'],
      ['Total Revenue', `$${settlementData.totalRevenue.toFixed(2)}`],
      ['Tickets Sold', settlementData.ticketsSold.toString()],
      [''],
      ['Cost Breakdown'],
      ['Comedian Fees', `$${settlementData.comedianFees.toFixed(2)}`],
      ['Venue Costs', `$${settlementData.venueCosts.toFixed(2)}`],
      ['Marketing Costs', `$${settlementData.marketingCosts.toFixed(2)}`],
      ['Total Costs', `$${settlementData.totalCosts.toFixed(2)}`],
      [''],
      ['Profitability'],
      ['Net Profit', `$${settlementData.netProfit.toFixed(2)}`],
      ['Profit Margin', `${settlementData.profitMargin.toFixed(1)}%`],
      [''],
      ['Platform Breakdown'],
      ...settlementData.platformBreakdown.map(p => [p.platform, `$${p.revenue.toFixed(2)}`, `${p.tickets} tickets`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-settlement-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Report Generated",
      description: "Financial settlement report has been downloaded",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-sm">Total Revenue</div>
                <div className="text-2xl font-bold text-white">
                  ${settlementData.totalRevenue.toFixed(2)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-sm">Total Costs</div>
                <div className="text-2xl font-bold text-white">
                  ${settlementData.totalCosts.toFixed(2)}
                </div>
              </div>
              <Calculator className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-sm">Net Profit</div>
                <div className={`text-2xl font-bold ${settlementData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${settlementData.netProfit.toFixed(2)}
                </div>
              </div>
              <TrendingUp className={`w-8 h-8 ${settlementData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-sm">Profit Margin</div>
                <div className={`text-2xl font-bold ${settlementData.profitMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {settlementData.profitMargin.toFixed(1)}%
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${settlementData.profitMargin >= 0 ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                %
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Status */}
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Settlement Status
            <Badge variant={getStatusBadgeVariant(eventStatus)}>
              {eventStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => updateSettlementStatus('pending')}
              variant={eventStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
            >
              Pending
            </Button>
            <Button
              onClick={() => updateSettlementStatus('processing')}
              variant={eventStatus === 'processing' ? 'default' : 'outline'}
              size="sm"
            >
              Processing
            </Button>
            <Button
              onClick={() => updateSettlementStatus('completed')}
              variant={eventStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
            >
              Completed
            </Button>
          </div>
          
          <Button
            onClick={generateFinancialReport}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Financial Report
          </Button>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Comedian Fees</span>
                <span className="text-white font-medium">${settlementData.comedianFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Venue Costs</span>
                <span className="text-white font-medium">${settlementData.venueCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Marketing Costs</span>
                <span className="text-white font-medium">${settlementData.marketingCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg border border-white/20">
                <span className="text-white font-medium">Total Costs</span>
                <span className="text-white font-bold">${settlementData.totalCosts.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlementData.platformBreakdown.map((platform, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{platform.platform}</div>
                    <div className="text-white/60 text-sm">{platform.tickets} tickets</div>
                  </div>
                  <div className="text-white font-medium">${platform.revenue.toFixed(2)}</div>
                </div>
              ))}
              {settlementData.platformBreakdown.length === 0 && (
                <div className="text-center py-4 text-white/60">
                  No revenue data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventSettlementsTab;
