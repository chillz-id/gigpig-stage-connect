import { supabase } from '@/integrations/supabase/client';

const supabaseClient = supabase as any;

export type CustomerActivityType = 'order' | 'message' | 'deal' | 'task';

export interface CustomerActivity {
  customer_id: string;
  activity_type: CustomerActivityType;
  created_at: string;
  activity_id: string;
  metadata: Record<string, unknown>;
}

const TABLE_NAME = 'customer_activity_timeline';

export const customerActivityService = {
  async list(customerId: string, limit: number = 50): Promise<CustomerActivity[]> {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as CustomerActivity[];
  },

  async listByType(
    customerId: string,
    activityType: CustomerActivityType,
    limit: number = 20
  ): Promise<CustomerActivity[]> {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('customer_id', customerId)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as CustomerActivity[];
  },
};

export type CustomerActivityService = typeof customerActivityService;
