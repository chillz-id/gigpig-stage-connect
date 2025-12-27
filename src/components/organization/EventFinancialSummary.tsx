/**
 * EventFinancialSummary Component
 *
 * Displays financial data for synced events with:
 * - Total row at top (horizontal cards)
 * - Platform breakdown below (Humanitix left, Eventbrite right)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, DollarSign, Receipt, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { OrganizationEvent } from '@/hooks/organization/useOrganizationEvents';

interface EventFinancialSummaryProps {
  event: OrganizationEvent;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}

function StatCard({ label, value, icon, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface PlatformCardProps {
  platform: 'humanitix' | 'eventbrite';
  ticketCount: number | null | undefined;
  orderCount: number | null | undefined;
  gross: number | null | undefined;
  fees: number | null | undefined;
  tax: number | null | undefined;
  net: number | null | undefined;
}

function PlatformCard({
  platform,
  ticketCount,
  orderCount,
  gross,
  fees,
  tax,
  net,
}: PlatformCardProps) {
  const hasData = (ticketCount ?? 0) > 0 || (orderCount ?? 0) > 0;

  if (!hasData) {
    return (
      <Card className="flex-1 opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Badge variant="secondary">
              {platform === 'humanitix' ? 'Humanitix' : 'Eventbrite'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Badge
            variant={platform === 'humanitix' ? 'default' : 'secondary'}
            className={platform === 'humanitix' ? 'bg-teal-600' : 'bg-orange-500'}
          >
            {platform === 'humanitix' ? 'Humanitix' : 'Eventbrite'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Tickets</span>
          <span className="font-medium">{ticketCount ?? 0}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Orders</span>
          <span className="font-medium">{orderCount ?? 0}</span>
        </div>
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Net</span>
            <span className="font-bold text-green-600">{formatCurrency(net ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center border-t pt-2 mt-2">
            <span className="text-sm text-muted-foreground">Gross</span>
            <span className="font-medium">{formatCurrency(gross ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Fees</span>
            <span className="font-medium text-orange-600">-{formatCurrency(fees ?? 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Tax</span>
            <span className="font-medium text-muted-foreground">{formatCurrency(tax ?? 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventFinancialSummary({ event }: EventFinancialSummaryProps) {
  // Only show for synced events with financial data
  if (event.source === 'native') {
    return null;
  }

  const hasMergedData = (event.merged_sources?.length ?? 0) > 1;
  const hasHumanitixData = (event.humanitix_ticket_count ?? 0) > 0 || (event.humanitix_order_count ?? 0) > 0;
  const hasEventbriteData = (event.eventbrite_ticket_count ?? 0) > 0 || (event.eventbrite_order_count ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ticket Sales</h3>
        {hasMergedData && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Combined from {event.merged_sources?.join(' + ')}
          </Badge>
        )}
      </div>

      {/* Total Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Tickets"
          value={event.total_ticket_count ?? 0}
          icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
          subtitle={`${event.total_order_count ?? 0} orders`}
        />
        <StatCard
          label="Net Revenue"
          value={formatCurrency(event.total_net_dollars ?? 0)}
          icon={<Receipt className="h-4 w-4 text-green-500" />}
          subtitle="After fees"
        />
        <StatCard
          label="Gross Revenue"
          value={formatCurrency(event.total_gross_dollars ?? 0)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          subtitle="Before fees"
        />
        <StatCard
          label="Platform Fees"
          value={formatCurrency(event.total_fees_dollars ?? 0)}
          icon={<Percent className="h-4 w-4 text-orange-500" />}
          subtitle={`Tax: ${formatCurrency(event.total_tax_dollars ?? 0)}`}
        />
      </div>

      {/* Platform Breakdown */}
      {(hasHumanitixData || hasEventbriteData) && (
        <div className="grid gap-4 md:grid-cols-2">
          <PlatformCard
            platform="humanitix"
            ticketCount={event.humanitix_ticket_count}
            orderCount={event.humanitix_order_count}
            gross={event.humanitix_gross_dollars}
            fees={event.humanitix_fees_dollars}
            tax={event.humanitix_tax_dollars}
            net={event.humanitix_net_dollars}
          />
          <PlatformCard
            platform="eventbrite"
            ticketCount={event.eventbrite_ticket_count}
            orderCount={event.eventbrite_order_count}
            gross={event.eventbrite_gross_dollars}
            fees={event.eventbrite_fees_dollars}
            tax={event.eventbrite_tax_dollars}
            net={event.eventbrite_net_dollars}
          />
        </div>
      )}
    </div>
  );
}

export default EventFinancialSummary;
