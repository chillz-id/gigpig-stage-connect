
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, CreditCard, TrendingUp, Users } from 'lucide-react';
import { SalesMetrics } from '@/types/ticketSales';

interface SalesMetricsCardsProps {
  salesMetrics: SalesMetrics;
}

const SalesMetricsCards = ({ salesMetrics }: SalesMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-300">Total Revenue</p>
              <p className="text-xl font-bold text-white">${salesMetrics.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-300">Total Tickets</p>
              <p className="text-xl font-bold text-white">{salesMetrics.totalTickets}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-sm text-gray-300">Avg. Price</p>
              <p className="text-xl font-bold text-white">${salesMetrics.averageTicketPrice.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm text-gray-300">Total Sales</p>
              <p className="text-xl font-bold text-white">{salesMetrics.totalSales}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesMetricsCards;
