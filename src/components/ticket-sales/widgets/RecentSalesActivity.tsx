import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  User, 
  Mail, 
  ShoppingCart,
  Clock,
  ExternalLink
} from 'lucide-react';
import type { TicketSale } from '@/types/ticketSales';

interface RecentSalesActivityProps {
  sales: TicketSale[];
}

const RecentSalesActivity: React.FC<RecentSalesActivityProps> = ({ sales }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: amount < 100 ? 2 : 0
    }).format(amount);
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      humanitix: 'bg-green-500/10 text-green-700 border-green-500/20',
      eventbrite: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
      manual: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      default: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
    };
    return colors[platform.toLowerCase()] || colors.default;
  };

  if (sales.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Sales Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>No recent sales activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Sales Activity</span>
          <Badge variant="secondary" className="font-normal">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-0 divide-y">
            {sales.map((sale) => (
              <div 
                key={sale.id} 
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{sale.customer_name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPlatformColor(sale.platform)}`}
                        >
                          {sale.platform}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{sale.customer_email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(sale.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(sale.purchase_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3 text-muted-foreground" />
                        <span>{sale.ticket_quantity} × {sale.ticket_type}</span>
                      </div>
                      {sale.platform_order_id && (
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {sale.platform_order_id.slice(0, 8)}...
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(sale.purchase_date), 'HH:mm')}</span>
                    </div>
                  </div>

                  {/* Status */}
                  {sale.refund_status !== 'none' && (
                    <div className="pt-2">
                      <Badge variant="destructive" className="text-xs">
                        {sale.refund_status === 'requested' ? 'Refund Requested' : 'Refunded'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentSalesActivity;