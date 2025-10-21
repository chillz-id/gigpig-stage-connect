import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

type SubscriptionHandler = () => void | Promise<void>;

const createChannel = (prefix: string) => {
  const channelName = `${prefix}_${Date.now()}`;
  return supabaseClient.channel(channelName);
};

const subscribeToTable = (prefix: string, table: string, handler: SubscriptionHandler) => {
  const channel = createChannel(prefix)
    .on('postgres_changes', { event: '*', schema: 'public', table }, handler)
    .subscribe();

  return channel;
};

export const eventSubscriptionService = {
  subscribeToEvents(handler: SubscriptionHandler) {
    return subscribeToTable('events_changes', 'events', handler);
  },

  subscribeToTicketSales(handler: SubscriptionHandler) {
    return subscribeToTable('ticket_sales_changes', 'ticket_sales', handler);
  },

  subscribeToComedianBookings(handler: SubscriptionHandler) {
    return subscribeToTable('comedian_bookings_changes', 'comedian_bookings', handler);
  },

  unsubscribe(channel: any) {
    if (channel) {
      supabaseClient.removeChannel(channel);
    }
  },
};

export type EventSubscriptionService = typeof eventSubscriptionService;
