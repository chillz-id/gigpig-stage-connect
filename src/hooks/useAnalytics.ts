import { useQuery } from '@tanstack/react-query';
import {
  crmAnalyticsService,
  type CRMAnalytics,
  type SegmentDatum,
  type RevenueDatum,
  type PipelineDatum,
  type EngagementMetrics,
} from '@/services/crm/analytics-service';

export const useCRMAnalytics = () => {
  return useQuery<CRMAnalytics>({
    queryKey: ['crm-analytics'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      return crmAnalyticsService.getAnalytics();
    },
  });
};

export type { CRMAnalytics, SegmentDatum, RevenueDatum, PipelineDatum, EngagementMetrics } from '@/services/crm/analytics-service';
