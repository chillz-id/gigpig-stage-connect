import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

import { TEST_ACCOUNTS } from './seed-test-accounts';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials for CRM fixture seeding');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const fetchUserByEmail = async (email: string) => {
  const emailLower = email.toLowerCase();
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list Supabase users: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === emailLower);
    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
};

const CRM_CUSTOMERS = [
  {
    id: '8b5b445a-9d3e-4ce7-82ec-9d964547fa10',
    email: 'crm.customer.vip@example.com',
    first_name: 'Ava',
    last_name: 'Chen',
    mobile: '+61 411 111 111',
    location: 'Sydney',
    marketing_opt_in: true,
    source: 'humanitix',
    total_orders: 6,
    total_spent: 2150,
    last_order_date: '2025-09-12T00:00:00Z',
    last_event_name: 'Comedy Gala',
    customer_segment: 'VIP',
    created_at: '2024-05-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  {
    id: '64fe0e52-6aa9-4c8f-888b-2c0ef69f52af',
    email: 'crm.customer.regular@example.com',
    first_name: 'Leo',
    last_name: 'Patel',
    mobile: '+61 411 222 333',
    location: 'Melbourne',
    marketing_opt_in: false,
    source: 'referral',
    total_orders: 2,
    total_spent: 480,
    last_order_date: '2025-08-02T00:00:00Z',
    last_event_name: 'Late Night Showcase',
    customer_segment: 'Regular',
    created_at: '2024-09-12T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
];

const CRM_DEALS = [
  {
    id: 'cdd0cc5c-5892-4af9-be3d-1ddd19594c0a',
    deal_type: 'booking',
    status: 'proposed',
    negotiation_stage: 'initial',
    title: 'Comedy Showcase at Town Hall',
    proposed_fee: 3200,
    promoter_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '409cae8d-70a8-4a5f-90d0-79bd3a721001',
    deal_type: 'booking',
    status: 'negotiating',
    negotiation_stage: 'initial',
    title: 'Corporate Tour Package',
    proposed_fee: 7800,
    promoter_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c9a92e39-6e76-4f17-91dd-a87fafe8f669',
    deal_type: 'booking',
    status: 'accepted',
    negotiation_stage: 'initial',
    title: 'Festival Headline Slot',
    proposed_fee: 10500,
    promoter_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const createTask = (overrides: Partial<Record<string, unknown>>) => ({
  id: overrides.id ?? randomUUID(),
  title: overrides.title ?? 'Follow up',
  description: overrides.description ?? null,
  status: overrides.status ?? 'pending',
  priority: overrides.priority ?? 'medium',
  due_date: overrides.due_date ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: overrides.created_at ?? new Date().toISOString(),
  updated_at: overrides.updated_at ?? new Date().toISOString(),
  assignee_id: overrides.assignee_id ?? null,
  creator_id: overrides.creator_id ?? null,
  tags: overrides.tags ?? [],
  category: overrides.category ?? 'administrative',
  is_recurring: overrides.is_recurring ?? false,
  metadata: overrides.metadata ?? {},
});

export const ensureCrmFixtures = async () => {
  const adminAccount = TEST_ACCOUNTS.admin;
  const adminUser = await fetchUserByEmail(adminAccount.email);

  if (!adminUser) {
    throw new Error(`Unable to resolve admin user for CRM fixtures: ${adminAccount.email}`);
  }

  const adminId = adminUser.id;

  const { error: customerError } = await supabaseAdmin
    .from('customers')
    .upsert(CRM_CUSTOMERS, { onConflict: 'id' });

  if (customerError) {
    throw new Error(`Failed to seed CRM customers: ${customerError.message}`);
  }

  const dealsWithOwner = CRM_DEALS.map((deal) => ({
    ...deal,
    promoter_id: adminId,
  }));

  const { error: dealsError } = await supabaseAdmin
    .from('deal_negotiations')
    .upsert(dealsWithOwner, { onConflict: 'id' });

  if (dealsError) {
    throw new Error(`Failed to seed CRM deals: ${dealsError.message}`);
  }

  const tasks = [
    createTask({
      id: '8f956f7d-77d0-43a8-9081-3a744da9f1cc',
      title: 'Confirm venue logistics',
      description: 'Follow up with venue on revised load-in time.',
      status: 'in_progress',
      priority: 'high',
      assignee_id: adminId,
      creator_id: adminId,
      tags: ['venue'],
    }),
    createTask({
      id: '4a690f25-c8d7-4d54-96d3-7424f3b7b3f4',
      title: 'Draft sponsor recap',
      status: 'pending',
      priority: 'medium',
      assignee_id: adminId,
      creator_id: adminId,
      tags: ['sponsor'],
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  ];

  const { error: tasksError } = await supabaseAdmin
    .from('tasks')
    .upsert(tasks, { onConflict: 'id' });

  if (tasksError) {
    throw new Error(`Failed to seed CRM tasks: ${tasksError.message}`);
  }
};
