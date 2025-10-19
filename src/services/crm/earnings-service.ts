import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export interface DateRange {
  start: Date;
  end: Date;
}

export type EarningsEntryType = 'performance' | 'booking' | 'other';

export interface EarningsEntry {
  eventTitle: string;
  amount: number;
  date: string;
  type: EarningsEntryType;
}

export interface EarningsSummary {
  totalEarnings: number;
  previousPeriodEarnings: number;
  changePercentage: number;
  earningsByEvent: EarningsEntry[];
}

const normalizeRange = (range?: Partial<DateRange>): DateRange => {
  const now = new Date();
  const start = range?.start ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const end = range?.end ?? new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

const fetchBookings = async (userId: string, startIso: string, endIso: string) => {
  const { data, error } = await supabaseClient
    .from('comedian_bookings')
    .select(`
      performance_fee,
      events!inner(title, event_date)
    `)
    .eq('comedian_id', userId);

  if (error) throw error;

  const rows = (data as Array<{ performance_fee?: number; events?: { title?: string; event_date?: string } }> | null) ?? [];

  // Filter by date range client-side since PostgREST doesn't support filtering by joined table columns
  return rows.filter(booking => {
    const eventDate = booking.events?.event_date;
    return eventDate && eventDate >= startIso && eventDate <= endIso;
  });
};

const fetchInvoices = async (userId: string, startIso: string, endIso: string) => {
  const { data, error } = await supabaseClient
    .from('invoices')
    .select('total_amount, issue_date')
    .eq('comedian_id', userId)
    .eq('status', 'paid')
    .gte('issue_date', startIso)
    .lte('issue_date', endIso);

  if (error) throw error;
  return (data as Array<{ total_amount?: number; issue_date?: string }> | null) ?? [];
};

const calculateSummary = (
  current: { bookings: ReturnType<typeof fetchBookings> extends Promise<infer T> ? T : never; invoices: ReturnType<typeof fetchInvoices> extends Promise<infer T> ? T : never },
  previousTotal: number
) => {
  const toNumber = (value: unknown) => Number(value ?? 0);

  const bookingEarnings = current.bookings.reduce((sum, booking) => sum + toNumber(booking.performance_fee), 0);
  const invoiceEarnings = current.invoices.reduce((sum, invoice) => sum + toNumber(invoice.total_amount), 0);
  const total = bookingEarnings + invoiceEarnings;

  const earningsByEvent: EarningsEntry[] = [
    ...current.bookings.map((booking) => ({
      eventTitle: booking.events?.title ?? 'Unknown Event',
      amount: toNumber(booking.performance_fee),
      date: booking.events?.event_date ?? '',
      type: 'performance' as EarningsEntryType,
    })),
    ...current.invoices.map((invoice) => ({
      eventTitle: 'Invoice Payment',
      amount: toNumber(invoice.total_amount),
      date: invoice.issue_date ?? '',
      type: 'other' as EarningsEntryType,
    })),
  ];

  const changePercentage = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : total > 0 ? 100 : 0;

  return {
    totalEarnings: total,
    previousPeriodEarnings: previousTotal,
    changePercentage,
    earningsByEvent,
  } satisfies EarningsSummary;
};

export const earningsService = {
  async getEarnings(userId: string, range?: Partial<DateRange>): Promise<EarningsSummary> {
    const { start, end } = normalizeRange(range);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const periodLength = end.getTime() - start.getTime();
    const previousStartIso = new Date(start.getTime() - periodLength).toISOString();
    const previousEndIso = new Date(start.getTime() - 1).toISOString();

    const [currentBookings, currentInvoices, previousBookings, previousInvoices] = await Promise.all([
      fetchBookings(userId, startIso, endIso),
      fetchInvoices(userId, startIso, endIso),
      fetchBookings(userId, previousStartIso, previousEndIso),
      fetchInvoices(userId, previousStartIso, previousEndIso),
    ]);

    const previousTotals = calculateSummary({ bookings: previousBookings, invoices: previousInvoices }, 0);
    return calculateSummary({ bookings: currentBookings, invoices: currentInvoices }, previousTotals.totalEarnings);
  },
};

export type EarningsService = typeof earningsService;
