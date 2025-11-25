import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Customer, CustomerFilters, CustomerSortOptions, SegmentCount } from '@/hooks/crm/customers/types';
import type { CustomerStatsSummary } from '@/types/crm';

const supabaseClient = supabase as any;

const DEFAULT_SORT_COLUMN: CustomerSortOptions['column'] = 'last_order_date';
export const CUSTOMER_EXPORT_HEADERS = [
  'Email',
  'First Name',
  'Last Name',
  'Phone',
  'Total Orders',
  'Total Spent',
  'Last Order Date',
  'Segment',
  'Source',
  'Created At',
] as const;

const buildCustomerQuery = (filters: CustomerFilters = {}) => {
  let query = supabaseClient.from('customers_crm_v').select('*', { count: 'exact' });

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`
    );
  }

  if (filters.segments?.length) {
    query = query.overlaps('customer_segments', filters.segments);
  }

  if (filters.source) {
    query = query.eq('source', filters.source);
  }

  if (filters.minSpent !== undefined) {
    query = query.gte('total_spent', filters.minSpent);
  }

  if (filters.maxSpent !== undefined) {
    query = query.lte('total_spent', filters.maxSpent);
  }

  if (filters.dateFrom) {
    query = query.gte('last_order_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('last_order_date', filters.dateTo);
  }

  return query;
};

const applySort = (query: any, sort?: CustomerSortOptions) => {
  if (sort) {
    return query.order(sort.column, { ascending: sort.ascending });
  }

  return query.order(DEFAULT_SORT_COLUMN, { ascending: false, nullsFirst: false });
};

const formatCsvValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '""';
  }

  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

const buildExportRow = (customer: Customer) => {
  return [
    customer.email,
    customer.first_name ?? '',
    customer.last_name ?? '',
    customer.mobile ?? customer.phone ?? '',
    customer.total_orders ?? 0,
    customer.total_spent ?? 0,
    customer.last_order_date ?? '',
    customer.customer_segment ?? '',
    customer.source ?? '',
    customer.created_at ?? '',
  ];
};

export const customerService = {
  async listCustomers(
    filters: CustomerFilters = {},
    sort: CustomerSortOptions | undefined,
    limit: number,
    offset: number
  ): Promise<{ customers: Customer[]; totalCount: number }> {
    const sanitizedLimit = Math.max(limit, 1);
    const sanitizedOffset = Math.max(offset, 0);

    const query = applySort(buildCustomerQuery(filters), sort).range(
      sanitizedOffset,
      sanitizedOffset + sanitizedLimit - 1
    );

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      customers: (data || []) as Customer[],
      totalCount: count ?? data?.length ?? 0,
    };
  },

  async getCustomerById(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabaseClient
      .from('customers_crm_v')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await supabaseClient
      .from('customers_crm_v')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data as Customer | null;
  },

  async listSegmentCounts(): Promise<SegmentCount[]> {
    const { data, error } = await supabaseClient
      .from('customer_segment_counts_v')
      .select('slug,name,color,count');

    if (error) throw error;

    return (data || []).map((row: Record<string, unknown>) => ({
      slug: row.slug as string,
      name: row.name as string,
      color: (row.color as string) ?? null,
      count: Number((row as Record<string, unknown>).count) || 0,
    })) as SegmentCount[];
  },

  async updateProfile(
    customerId: string,
    updates: Partial<Customer> & { segments?: string[] }
  ): Promise<Customer> {
    const normalize = (value: string | null | undefined) => {
      if (value === undefined || value === null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    if (updates.email === undefined || updates.email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const payload: Record<string, unknown> = {
      p_customer_id: customerId,
      p_first_name: normalize(updates.first_name),
      p_last_name: normalize(updates.last_name),
      p_email: updates.email.trim(),
      p_mobile: normalize(updates.mobile),
      p_landline: normalize(updates.landline),
      p_company: normalize(updates.company),
      p_address_line1: normalize(updates.address_line1),
      p_address_line2: normalize(updates.address_line2),
      p_suburb: normalize(updates.suburb),
      p_city: normalize(updates.city),
      p_state: normalize(updates.state),
      p_postcode: normalize(updates.postcode),
      p_country: normalize(updates.country),
      p_marketing_opt_in: updates.marketing_opt_in ?? null,
    };

    if (Object.prototype.hasOwnProperty.call(updates, 'segments')) {
      payload.p_segments = (updates.segments ?? []).filter((slug) => slug.trim().length > 0);
    }

    const { data, error } = await supabaseClient.rpc('update_customer_profile', payload);

    if (error) throw error;
    return data as Customer;
  },

  async listSources(): Promise<string[]> {
    const { data, error } = await supabaseClient
      .from('customers_crm_v')
      .select('source')
      .not('source', 'is', null);

    if (error) throw error;

    return [...new Set((data || []).map((row: { source?: string | null }) => row.source))]
      .filter(Boolean) as string[];
  },

  async getStats(): Promise<CustomerStatsSummary> {
    const { data, error } = await supabaseClient.rpc('get_customer_stats');
    if (error) throw error;
    return data as CustomerStatsSummary;
  },

  async refreshStats(): Promise<CustomerStatsSummary> {
    const { data, error } = await supabaseClient.rpc('refresh_customer_stats');
    if (error) throw error;
    return data as CustomerStatsSummary;
  },

  async fetchAllForExport(filters: CustomerFilters = {}): Promise<Customer[]> {
    const query = applySort(buildCustomerQuery(filters), undefined);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Customer[];
  },

  buildExportCsv(customers: Customer[]): string {
    const headerLine = CUSTOMER_EXPORT_HEADERS.join(',');
    const dataLines = customers.map((customer) =>
      buildExportRow(customer).map(formatCsvValue).join(',')
    );

    return [headerLine, ...dataLines].join('\n');
  },
};

export type CustomerServiceError = PostgrestError;
