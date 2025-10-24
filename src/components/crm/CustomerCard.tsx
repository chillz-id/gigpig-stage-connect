import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Customer } from '@/hooks/useCustomers';
import { formatCurrency, formatDate, formatPhone } from '@/utils/formatters';
import { Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  onClick?: (customer: Customer) => void;
}

const resolveName = (customer: Customer) => {
  const parts = [customer.first_name, customer.last_name].filter(Boolean);
  return parts.length ? parts.join(' ') : customer.email;
};

const segmentVariant = (segment: string) => {
  switch (segment.toLowerCase()) {
    case 'vip':
      return 'bg-purple-600 text-white';
    case 'regular':
      return 'bg-blue-600 text-white';
    case 'new':
      return 'bg-green-600 text-white';
    case 'inactive':
      return 'bg-gray-600 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getLeadScoreColor = (score: number | null) => {
  if (!score) return 'bg-gray-200 text-gray-800';
  if (score >= 20) return 'bg-gradient-to-r from-orange-500 to-red-500 text-white'; // Hot
  if (score >= 15) return 'bg-orange-500 text-white'; // Warm
  if (score >= 10) return 'bg-yellow-500 text-white'; // Cool
  return 'bg-blue-500 text-white'; // Cold
};

export const CustomerCard = ({ customer, onClick }: CustomerCardProps) => {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onClick?.(customer)}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">{resolveName(customer)}</CardTitle>
        <p className="text-sm text-muted-foreground">{customer.email}</p>
        <div className="flex flex-wrap gap-2">
          {customer.customer_segments?.map((segment) => (
            <Badge key={segment} className={`${segmentVariant(segment)} uppercase`}>
              {segment}
            </Badge>
          ))}
          {customer.lead_score && (
            <Badge className={getLeadScoreColor(customer.lead_score)}>
              Lead: {customer.lead_score}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {(customer.mobile || customer.phone) && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{formatPhone(customer.mobile ?? customer.phone)}</span>
          </div>
        )}
        {customer.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{customer.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-xs">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <div>
              <p className="font-medium text-foreground">{customer.total_orders ?? 0} orders</p>
              <p className="text-muted-foreground">
                {formatCurrency(Number(customer.total_spent) || 0)} lifetime value
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              window.open(`mailto:${customer.email}`, '_blank');
            }}
          >
            <Mail className="mr-2 h-3.5 w-3.5" />
            Email
          </Button>
        </div>

        {customer.last_order_date && (
          <p className="text-xs">
            Last order:{' '}
            <span className="font-medium text-foreground">
              {formatDate(customer.last_order_date)}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
