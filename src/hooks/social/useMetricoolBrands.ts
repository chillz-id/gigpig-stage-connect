/**
 * Hook for fetching Metricool brands (profiles) for the account.
 */

import { useQuery } from '@tanstack/react-query';
import { getBrands } from '@/services/social/metricool-posts';

export interface MetricoolBrand {
  id: number;
  label: string;
  picture: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  threads: string | null;
  bluesky: string | null;
}

export function useMetricoolBrands() {
  return useQuery({
    queryKey: ['metricool-brands'],
    queryFn: async () => {
      const data = await getBrands() as MetricoolBrand[];
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour — brands rarely change
  });
}
