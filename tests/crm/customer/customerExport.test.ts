import { customerService, CUSTOMER_EXPORT_HEADERS } from '@/services/crm/customer-service';
import type { Customer } from '@/hooks/useCustomers';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('customerService.buildExportCsv', () => {
  const baseCustomer: Customer = {
    id: 'cust-1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    canonical_full_name: 'Test User',
    mobile: '123456789',
    phone: '987654321',
    landline: null,
    location: null,
    marketing_opt_in: true,
    source: 'referral',
    total_orders: 3,
    total_spent: 150.5,
    last_order_date: '2024-10-01',
    last_event_id: null,
    last_event_name: null,
    customer_segment: 'vip',
    preferred_venue: null,
    brevo_contact_id: null,
    brevo_sync_status: null,
    brevo_last_sync: null,
    lead_score: null,
    rfm_recency: null,
    rfm_frequency: null,
    rfm_monetary: null,
    last_scored_at: null,
    created_at: '2023-01-01',
    updated_at: '2023-01-02',
    customer_since: null,
    date_of_birth: null,
    address: null,
    address_line1: null,
    address_line2: null,
    company: null,
    suburb: null,
    city: null,
    state: null,
    postcode: null,
    country: null,
    age_band: null,
    customer_segments: [],
  };

  it('builds a CSV string with headers and quoted values', () => {
    const csv = customerService.buildExportCsv([baseCustomer]);
    const [headerLine, customerLine] = csv.split('\n');

    expect(headerLine).toBe(CUSTOMER_EXPORT_HEADERS.join(','));
    expect(customerLine).toBe(
      [
        '"test@example.com"',
        '"Test"',
        '"User"',
        '"123456789"',
        '"3"',
        '"150.5"',
        '"2024-10-01"',
        '"vip"',
        '"referral"',
        '"2023-01-01"',
      ].join(',')
    );
  });

  it('escapes double quotes and falls back to alternate phone fields', () => {
    const trickyCustomer: Customer = {
      ...baseCustomer,
      id: 'cust-2',
      first_name: 'Sam "The Hammer"',
      mobile: null,
      phone: '(555) 123-4567',
      total_orders: null,
      total_spent: null,
      customer_segment: null,
      source: 'email, campaign',
    };

    const [, customerLine] = customerService.buildExportCsv([trickyCustomer]).split('\n');

    expect(customerLine).toContain('"Sam ""The Hammer"""');
    expect(customerLine).toContain('"0"'); // total_orders fallback
    expect(customerLine).toContain('"0"'); // total_spent fallback
    expect(customerLine).toContain('"(555) 123-4567"');
    expect(customerLine).toContain('"email, campaign"');
  });
});
