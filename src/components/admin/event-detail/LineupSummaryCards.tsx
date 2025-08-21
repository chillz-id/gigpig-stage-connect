
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LineupSummaryCardsProps {
  totalComedians: number;
  totalFees: number;
  selectedCount: number;
  selectedTotal: number;
  eventRevenue: number;
}

const LineupSummaryCards: React.FC<LineupSummaryCardsProps> = ({
  totalComedians,
  totalFees,
  selectedCount,
  selectedTotal,
  eventRevenue,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="text-white/60 text-sm">Total Comedians</div>
          <div className="text-2xl font-bold text-white">{totalComedians}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="text-white/60 text-sm">Total Performance Fees</div>
          <div className="text-2xl font-bold text-white">${totalFees.toFixed(2)}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="text-white/60 text-sm">Selected ({selectedCount})</div>
          <div className="text-2xl font-bold text-white">${selectedTotal.toFixed(2)}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="text-white/60 text-sm">Event Revenue</div>
          <div className="text-2xl font-bold text-white">${eventRevenue.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LineupSummaryCards;
