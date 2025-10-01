import { supabase } from '@/integrations/supabase/client';
import {
  HumanitixOrder,
  humanitixApiService,
} from '@/services/humanitixApiService';
import {
  EventbriteOrder,
  eventbriteApiService,
} from '@/services/eventbriteApiService';
import { PlatformType } from '@/types/ticketSales';

import { LocalSale, PlatformSale } from './types';

export async function fetchLocalSalesData(eventId: string, platform: PlatformType): Promise<LocalSale[]> {
  const { data, error } = await supabase
    .from('ticket_sales')
    .select('*')
    .eq('event_id', eventId)
    .eq('platform', platform)
    .order('purchase_date', { ascending: true });

  if (error) throw error;
  return (data || []) as LocalSale[];
}

export async function fetchPlatformSalesData(
  platform: PlatformType,
  externalEventId: string
): Promise<PlatformSale[]> {
  switch (platform) {
    case 'humanitix':
      return normalizeHumanitixOrders(await humanitixApiService.getOrders(externalEventId));
    case 'eventbrite':
      return normalizeEventbriteOrders(await getAllEventbriteOrders(externalEventId));
    default:
      return [];
  }
}

async function getAllEventbriteOrders(eventId: string): Promise<EventbriteOrder[]> {
  const orders: EventbriteOrder[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await eventbriteApiService.getEventOrders(eventId, page);
    orders.push(...response.orders);
    hasMore = Boolean(response.pagination?.has_more_items);
    page += 1;
  }

  return orders;
}

function normalizeHumanitixOrders(orders: HumanitixOrder[]): PlatformSale[] {
  return orders.map(order => ({
    orderId: order.id,
    totalAmount: order.total_amount,
    purchaseDate: order.created_at,
    customerEmail: order.customer.email,
    customerName: `${order.customer.first_name} ${order.customer.last_name}`.trim(),
    ticketType: order.tickets[0]?.ticket_type_name ?? '',
    quantity: order.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0),
  }));
}

function normalizeEventbriteOrders(orders: EventbriteOrder[]): PlatformSale[] {
  return orders.map(order => ({
    orderId: order.id,
    totalAmount: order.costs?.gross?.value ?? 0,
    purchaseDate: order.created,
    customerEmail: order.email,
    customerName: order.name || `${order.first_name || ''} ${order.last_name || ''}`.trim(),
    ticketType: order.event_id,
    quantity: 1,
  }));
}

export function findDuplicateSales(sales: LocalSale[], duplicateWindowMinutes: number): LocalSale[] {
  const duplicates: LocalSale[] = [];
  const salesByCustomer = new Map<string, LocalSale[]>();

  for (const sale of sales) {
    const key = `${sale.customer_email || 'unknown'}_${sale.total_amount}`;
    const bucket = salesByCustomer.get(key) || [];
    bucket.push(sale);
    salesByCustomer.set(key, bucket);
  }

  for (const bucket of salesByCustomer.values()) {
    if (bucket.length < 2) continue;

    const sortedBucket = [...bucket].sort((a, b) => {
      const first = new Date(a.purchase_date).getTime();
      const second = new Date(b.purchase_date).getTime();
      return first - second;
    });

    for (let index = 1; index < sortedBucket.length; index++) {
      const previous = sortedBucket[index - 1];
      const current = sortedBucket[index];
      if (!previous || !current) continue;

      const timeDiff = new Date(current.purchase_date).getTime() -
        new Date(previous.purchase_date).getTime();

      if (Number.isNaN(timeDiff)) continue;

      if (timeDiff < duplicateWindowMinutes * 60 * 1000) {
        duplicates.push(current);
      }
    }
  }

  return duplicates;
}
