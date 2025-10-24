export interface CustomerStatsSummary {
  total_count: number;
  last_customer_since: string | null;
}

export interface DealStatsSummary {
  total: number;
  byStatus: Record<
    'proposed' | 'negotiating' | 'counter_offered' | 'accepted' | 'declined' | 'expired',
    number
  >;
  totalValue: number;
  acceptedValue: number;
}
