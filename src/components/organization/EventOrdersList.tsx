/**
 * EventOrdersList Component
 *
 * Displays recent orders for a synced event.
 * Orders are clickable to navigate to CRM customer profile (permission-gated).
 *
 * Features:
 * - Shows orders from both Humanitix and Eventbrite (via session linking)
 * - Displays actual ticket count per order
 * - Shows discount codes when used
 * - Net amount as primary, Gross as secondary
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { customerService } from '@/services/crm/customer-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShoppingCart,
  User,
  Ticket,
  Clock,
  ChevronRight,
  Lock,
  Loader2,
  Tag,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationEvent } from '@/hooks/organization/useOrganizationEvents';

interface EventOrdersListProps {
  event: OrganizationEvent;
  limit?: number;
}

interface OrderRecord {
  id: string;
  source: string;
  source_id: string;
  customer_name: string | null;
  customer_email: string | null;
  ticket_count: number;
  total_amount: number;
  net_amount: number;
  fees_amount: number;
  tax_amount: number;
  discount_amount: number;
  order_date: string;
  status: string;
  discount_code: string | null;
  customer_id?: string | null;
}

interface LinkedSession {
  source: string;
  source_session_id: string;
}

/**
 * Check if user has CRM customer data access
 */
function useCrmAccess() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['crm-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Check if user owns any organization - org owners can see their event customer data
      const { data: orgOwnership, error } = await supabase
        .from('organization_profiles')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (error) {
        console.error('Error checking org ownership:', error);
        return false;
      }

      // If user owns any organization, they can see customer data for their org's events
      return (orgOwnership && orgOwnership.length > 0);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch orders for a session from orders_htx and orders_eventbrite
 * Uses RPC to get linked session IDs for merged sessions
 */
function useEventOrders(event: OrganizationEvent, limit: number) {
  const sessionId = event.canonical_source_id;

  return useQuery({
    queryKey: ['event-orders', sessionId, limit],
    queryFn: async (): Promise<OrderRecord[]> => {
      if (!sessionId) return [];

      // Step 1: Get all linked session IDs (handles merged Humanitix + Eventbrite sessions)
      const { data: linkedSessions, error: linkError } = await supabase
        .rpc('get_linked_session_sources', { p_canonical_session_source_id: sessionId });

      if (linkError) {
        console.error('Error fetching linked sessions:', linkError);
      }

      console.log('[EventOrders] Canonical session ID:', sessionId);
      console.log('[EventOrders] Linked sessions:', linkedSessions);

      const sessions = (linkedSessions as LinkedSession[] | null) || [
        { source: 'humanitix', source_session_id: sessionId }
      ];

      console.log('[EventOrders] Sessions to query:', sessions);

      const htxSessionIds = sessions
        .filter(s => s.source === 'humanitix')
        .map(s => s.source_session_id);
      const ebSessionIds = sessions
        .filter(s => s.source === 'eventbrite')
        .map(s => s.source_session_id);

      // Step 2: Fetch Humanitix orders with ticket counts
      let htxOrders: OrderRecord[] = [];
      if (htxSessionIds.length > 0) {
        const { data: htxData, error: htxError } = await supabase
          .from('orders_htx')
          .select(`
            source_id,
            source,
            first_name,
            last_name,
            purchaser_email,
            total_cents,
            net_sales_cents,
            fees_cents,
            tax_cents,
            discount_cents,
            ordered_at,
            status,
            discount_code_used
          `)
          .in('session_source_id', htxSessionIds)
          .order('ordered_at', { ascending: false })
          .limit(limit);

        if (htxError) {
          console.error('Error fetching HTX orders:', htxError);
        }

        // Get ticket counts per order
        const orderSourceIds = (htxData || []).map(o => o.source_id);
        const ticketCounts: Record<string, number> = {};

        if (orderSourceIds.length > 0) {
          const { data: ticketData, error: ticketError } = await supabase
            .from('tickets_htx')
            .select('order_source_id')
            .in('order_source_id', orderSourceIds);

          if (ticketError) {
            console.error('Error fetching HTX tickets:', ticketError);
          } else if (ticketData) {
            // Count tickets per order
            ticketData.forEach(t => {
              ticketCounts[t.order_source_id] = (ticketCounts[t.order_source_id] || 0) + 1;
            });
          }
        }

        htxOrders = (htxData || []).map((o) => ({
          id: `htx-${o.source_id}`,
          source: 'humanitix',
          source_id: o.source_id,
          customer_name: [o.first_name, o.last_name].filter(Boolean).join(' ') || null,
          customer_email: o.purchaser_email,
          ticket_count: ticketCounts[o.source_id] || 1,
          total_amount: (o.total_cents || 0) / 100,
          net_amount: (o.net_sales_cents || 0) / 100,
          fees_amount: (o.fees_cents || 0) / 100,
          tax_amount: (o.tax_cents || 0) / 100,
          discount_amount: (o.discount_cents || 0) / 100,
          order_date: o.ordered_at,
          status: o.status || 'completed',
          discount_code: o.discount_code_used || null,
        }));
      }

      // Step 3: Fetch Eventbrite orders with ticket counts
      let ebOrders: OrderRecord[] = [];
      if (ebSessionIds.length > 0) {
        const { data: ebData, error: ebError } = await supabase
          .from('orders_eventbrite')
          .select(`
            source_id,
            source,
            purchaser_name,
            purchaser_email,
            total_cents,
            net_sales_cents,
            fees_cents,
            taxes_cents,
            discounts_cents,
            ordered_at,
            status
          `)
          .in('session_source_id', ebSessionIds)
          .order('ordered_at', { ascending: false })
          .limit(limit);

        console.log('[EventOrders] EB session IDs:', ebSessionIds);
        console.log('[EventOrders] EB orders found:', ebData?.length || 0, ebData);

        if (ebError) {
          console.error('Error fetching EB orders:', ebError);
        }

        // Get ticket counts per Eventbrite order
        const ebOrderSourceIds = (ebData || []).map(o => o.source_id);
        const ebTicketCounts: Record<string, number> = {};

        if (ebOrderSourceIds.length > 0) {
          const { data: ebTicketData, error: ebTicketError } = await supabase
            .from('tickets_eventbrite')
            .select('order_source_id')
            .in('order_source_id', ebOrderSourceIds);

          if (ebTicketError) {
            console.error('Error fetching EB tickets:', ebTicketError);
          } else if (ebTicketData) {
            ebTicketData.forEach(t => {
              ebTicketCounts[t.order_source_id] = (ebTicketCounts[t.order_source_id] || 0) + 1;
            });
          }
        }

        ebOrders = (ebData || []).map((o) => ({
          id: `eb-${o.source_id}`,
          source: 'eventbrite',
          source_id: o.source_id,
          customer_name: o.purchaser_name || null,
          customer_email: o.purchaser_email,
          ticket_count: ebTicketCounts[o.source_id] || 1,
          total_amount: (o.total_cents || 0) / 100,
          net_amount: (o.net_sales_cents || 0) / 100,
          fees_amount: (o.fees_cents || 0) / 100,
          tax_amount: (o.taxes_cents || 0) / 100,
          discount_amount: (o.discounts_cents || 0) / 100,
          order_date: o.ordered_at,
          status: o.status || 'completed',
          discount_code: null, // Eventbrite doesn't have discount_code_used in our schema yet
        }));
      }

      // Combine and sort by date
      const allOrders = [...htxOrders, ...ebOrders];
      allOrders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());

      return allOrders.slice(0, limit);
    },
    enabled: !!sessionId && event.source !== 'native',
    staleTime: 60 * 1000, // 1 minute
  });
}

export function EventOrdersList({ event, limit = 10 }: EventOrdersListProps) {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useEventOrders(event, limit);
  const { data: hasCrmAccess, isLoading: accessLoading } = useCrmAccess();
  const [navigatingOrderId, setNavigatingOrderId] = useState<string | null>(null);

  // Only show for synced events
  if (event.source === 'native') {
    return null;
  }

  const handleOrderClick = async (order: OrderRecord) => {
    if (!hasCrmAccess || !order.customer_email) return;

    setNavigatingOrderId(order.id);
    try {
      // Look up customer by email to get their ID
      const customer = await customerService.getCustomerByEmail(order.customer_email);
      if (customer?.id) {
        // Navigate directly to customer detail page
        navigate(`/crm/customers/${customer.id}`);
      } else {
        // Fall back to search if customer not found in CRM
        navigate(`/crm/customers?search=${encodeURIComponent(order.customer_email)}`);
      }
    } catch (error) {
      console.error('Error looking up customer:', error);
      // Fall back to search on error
      navigate(`/crm/customers?search=${encodeURIComponent(order.customer_email)}`);
    } finally {
      setNavigatingOrderId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Recent Orders
          {!accessLoading && !hasCrmAccess && (
            <Badge variant="secondary" className="ml-auto">
              <Lock className="h-3 w-3 mr-1" />
              CRM Access Required
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No Orders Yet</p>
            <p className="text-sm text-muted-foreground">
              Orders will appear here as tickets are sold
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    hasCrmAccess && !navigatingOrderId
                      ? 'cursor-pointer hover:bg-muted/50'
                      : 'cursor-default'
                  } ${navigatingOrderId === order.id ? 'bg-muted/50' : ''}`}
                  onClick={() => {
                    if (!navigatingOrderId) {
                      void handleOrderClick(order);
                    }
                  }}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {navigatingOrderId === order.id ? (
                      <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {hasCrmAccess
                          ? order.customer_name || 'Anonymous'
                          : '***'}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          order.source === 'humanitix'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}
                      >
                        {order.source === 'humanitix' ? 'HTX' : 'EB'}
                      </Badge>
                      {order.discount_code && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {order.discount_code}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {order.ticket_count} ticket{order.ticket_count !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(order.order_date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Amount - Total/Fees/Tax/Discounts in small grey, Net in big green */}
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground space-x-2">
                      <span>Total: {formatCurrency(order.total_amount)}</span>
                      {order.fees_amount > 0 && <span>Fees: {formatCurrency(order.fees_amount)}</span>}
                      {order.tax_amount > 0 && <span>Tax: {formatCurrency(order.tax_amount)}</span>}
                      {order.discount_amount > 0 && <span>Disc: -{formatCurrency(order.discount_amount)}</span>}
                    </div>
                    <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                      {formatCurrency(order.net_amount)}
                    </div>
                  </div>

                  {/* Arrow */}
                  {hasCrmAccess && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* View All Button */}
        {orders && orders.length > 0 && hasCrmAccess && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => navigate(`/crm/orders?event=${event.canonical_source_id}`)}
            >
              View All Orders
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventOrdersList;
