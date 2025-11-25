import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import type { CustomerActivity } from '@/hooks/useCustomerActivity';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge } from './StatusBadge';

interface OrderMetadata {
  // Existing fields
  order_reference?: string;
  total_cents?: number;
  status?: string;
  source?: 'humanitix' | 'eventbrite';
  purchaser_name?: string;

  // NEW fields from enhanced view
  session_name?: string;
  session_start_date?: string;
  venue_name?: string;
  ticket_count?: number;
  discount_code_used?: string;
  discount_amount?: number;
  order_name?: string;  // Humanitix identifier
  order_id?: string;     // Eventbrite identifier
  net_amount?: number;   // Primary amount display (what we keep after fees/taxes)
  gross_amount?: number; // Total amount customer paid
  ordered_at?: string;   // Order timestamp
}

interface OrderActivityProps {
  metadata: OrderMetadata;
}

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleString('en-US', options).replace(',', ' ·');
};

const getOrderIdentifier = (metadata: OrderMetadata): string => {
  if (metadata.source === 'humanitix') {
    return metadata.order_name || metadata.order_reference || metadata.order_id || 'N/A';
  }
  return metadata.order_id || metadata.order_reference || 'N/A';
};

export const OrderActivity = ({ metadata }: OrderActivityProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
      {/* Left: Order ID + Event Details + Location */}
      <div className="space-y-2">
        <code className="text-sm font-bold bg-muted py-1 rounded inline-block">
          {getOrderIdentifier(metadata)}
        </code>
        {metadata.session_name ? (
          <>
            <h4 className="font-bold text-lg truncate" title={metadata.session_name}>
              {metadata.session_name}
            </h4>
            {metadata.session_start_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(metadata.session_start_date)}</span>
              </div>
            )}
            {metadata.venue_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{metadata.venue_name}</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Event details pending sync
          </div>
        )}
      </div>

      {/* Right: Net Amount (large) → Gross (small) → Source → Status */}
      <div className="space-y-2 text-right">
        {/* Net amount (large text) */}
        <div className="text-2xl font-bold">
          {metadata.net_amount != null
            ? formatCurrency(metadata.net_amount)
            : formatCurrency((metadata.total_cents ?? 0) / 100)}
        </div>

        {/* Gross amount (small text under net) */}
        <div className="text-sm text-muted-foreground">
          {metadata.gross_amount != null
            ? `${formatCurrency(metadata.gross_amount)} gross`
            : metadata.total_cents != null
              ? `${formatCurrency(metadata.total_cents / 100)} gross`
              : '$0.00 gross'}
        </div>

        {/* Source badge (eventbrite/humanitix) */}
        <div className="flex justify-end">
          {metadata.source && (
            <Badge variant="secondary" className="text-xs capitalize">
              {metadata.source}
            </Badge>
          )}
        </div>

        {/* Status badge (completed) under source */}
        <div className="flex justify-end">
          {metadata.status && <StatusBadge status={metadata.status} />}
        </div>
      </div>
    </div>
  );
};
