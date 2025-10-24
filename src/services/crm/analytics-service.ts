import { supabase } from '@/integrations/supabase/client';
import { subMonths, startOfMonth, format } from 'date-fns';

const supabaseClient = supabase as any;

export interface SegmentDatum {
  segment: string;
  count: number;
}

export interface RevenueDatum {
  month: string;
  revenue: number;
}

export interface PipelineDatum {
  stage: string;
  count: number;
  value: number;
}

export interface EngagementMetrics {
  activeCustomers: number;
  activeDeals: number;
  tasksDueThisWeek: number;
  overdueFollowUps: number;
}

export interface CRMAnalytics {
  segments: SegmentDatum[];
  revenue: RevenueDatum[];
  pipeline: PipelineDatum[];
  engagement: EngagementMetrics;
}

const MONTH_RANGE = 6;

const monthKey = (date: Date) => format(date, 'MMM yyyy');

const buildMonthlyTemplate = () => {
  const now = new Date();
  const buckets: Record<string, number> = {};

  for (let offset = MONTH_RANGE - 1; offset >= 0; offset--) {
    const monthDate = startOfMonth(subMonths(now, offset));
    buckets[monthKey(monthDate)] = 0;
  }

  return buckets;
};

export const crmAnalyticsService = {
  async getAnalytics(): Promise<CRMAnalytics> {
    const [segmentResponse, revenueResponse, pipelineResponse, tasksResponse] = await Promise.all([
      supabaseClient
        .from('customers')
        .select('customer_segment')
        .not('customer_segment', 'is', null),
      supabaseClient
        .from('invoices')
        .select('issued_date,total_amount,status')
        .in('status', ['paid', 'completed'])
        .gte('issued_date', startOfMonth(subMonths(new Date(), MONTH_RANGE - 1)).toISOString()),
      supabaseClient
        .from('deal_negotiations')
        .select('status, proposed_fee')
        .in('status', [
          'proposed',
          'negotiating',
          'counter_offered',
          'accepted',
          'declined',
          'expired',
        ]),
      supabaseClient
        .from('tasks')
        .select('status, due_date')
        .gte('due_date', subMonths(new Date(), 1).toISOString()),
    ]);

    if (segmentResponse.error) throw segmentResponse.error;
    if (revenueResponse.error) throw revenueResponse.error;
    if (pipelineResponse.error) throw pipelineResponse.error;
    if (tasksResponse.error) throw tasksResponse.error;

    const segmentRows = (segmentResponse.data as Array<{ customer_segment?: string | null }> | null) ?? [];
    const segmentCounts = segmentRows.reduce((acc: Record<string, number>, row) => {
      const key = row.customer_segment ?? 'Uncategorized';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const segmentData: SegmentDatum[] = Object.entries(segmentCounts).map(([segment, count]) => ({
      segment,
      count,
    }));

    const revenueBuckets = buildMonthlyTemplate();
    const revenueRows = (revenueResponse.data as Array<{ issued_date?: string; total_amount?: number }> | null) ?? [];
    revenueRows.forEach((invoice) => {
      if (!invoice.issued_date) return;
      const key = monthKey(startOfMonth(new Date(invoice.issued_date)));
      if (!Object.prototype.hasOwnProperty.call(revenueBuckets, key)) return;
      revenueBuckets[key] = (revenueBuckets[key] || 0) + Number(invoice.total_amount || 0);
    });

    const revenueData: RevenueDatum[] = Object.entries(revenueBuckets).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    const pipelineRows = (pipelineResponse.data as Array<{ status?: string; proposed_fee?: number }> | null) ?? [];
    const pipelineBuckets = pipelineRows.reduce((acc: Record<string, PipelineDatum>, deal) => {
      const stage = deal.status ?? 'proposed';
      if (!acc[stage]) {
        acc[stage] = {
          stage,
          count: 0,
          value: 0,
        } satisfies PipelineDatum;
      }

      acc[stage].count += 1;
      acc[stage].value += Number(deal.proposed_fee || 0);
      return acc;
    }, {} as Record<string, PipelineDatum>);

    const pipelineData: PipelineDatum[] = Object.values(pipelineBuckets);

    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(now.getDate() + 7);

    const taskRows = (tasksResponse.data as Array<{ status?: string; due_date?: string }> | null) ?? [];

    const overdueFollowUps = taskRows.filter((task: { due_date?: string; status?: string }) => {
      if (!task.due_date) return false;
      const due = new Date(task.due_date);
      return task.status !== 'completed' && due < now;
    }).length;

    const tasksDueThisWeek = taskRows.filter((task: { due_date?: string }) => {
      if (!task.due_date) return false;
      const due = new Date(task.due_date);
      return due >= now && due <= weekAhead;
    }).length;

    const activeDealsCount = pipelineRows.filter(
      (deal: { status?: string }) => deal.status !== 'declined'
    ).length;

    const engagement: EngagementMetrics = {
      activeCustomers: segmentResponse.data?.length ?? 0,
      activeDeals: activeDealsCount,
      tasksDueThisWeek,
      overdueFollowUps,
    };

    return {
      segments: segmentData,
      revenue: revenueData,
      pipeline: pipelineData,
      engagement,
    };
  },
};

export type CRMAnalyticsService = typeof crmAnalyticsService;
