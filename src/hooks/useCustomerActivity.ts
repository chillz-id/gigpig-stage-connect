import { useQuery } from '@tanstack/react-query';
import {
  customerActivityService,
  type CustomerActivity,
  type CustomerActivityType,
} from '@/services/crm/customer-activity-service';

/**
 * Hook to fetch customer activity timeline
 */
export const useCustomerActivity = (customerId: string | undefined, limit: number = 50) => {
  return useQuery({
    queryKey: ['customer-activity', customerId, limit],
    queryFn: async () => {
      if (!customerId) return [];

      return customerActivityService.list(customerId, limit);
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch activity by type for a customer
 */
export const useCustomerActivityByType = (
  customerId: string | undefined,
  activityType: CustomerActivityType
) => {
  return useQuery({
    queryKey: ['customer-activity', customerId, activityType],
    queryFn: async () => {
      if (!customerId) return [];

      return customerActivityService.listByType(customerId, activityType, 20);
    },
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000,
  });
};

export type { CustomerActivity, CustomerActivityType } from '@/services/crm/customer-activity-service';
