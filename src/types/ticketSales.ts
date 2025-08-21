
export type PlatformType = 'manual' | 'humanitix' | 'eventbrite';

export interface NewSaleState {
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  ticket_type: string;
  total_amount: number;
  platform: PlatformType;
  platform_order_id: string;
}

export interface TicketSale {
  id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  ticket_quantity: number;
  ticket_type: string;
  total_amount: number;
  platform: string;
  platform_order_id?: string;
  refund_status: string;
  purchase_date: string;
  created_at: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalTickets: number;
  averageTicketPrice: number;
  totalSales: number;
}
