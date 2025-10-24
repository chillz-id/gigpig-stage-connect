import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

import { TEST_ACCOUNTS } from './seed-test-accounts';

const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'] as const;

const resolveServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = resolveServiceKey();

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for CRM E2E setup (SUPABASE_URL / SUPABASE_SERVICE_KEY)');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const nowIso = () => new Date().toISOString();

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

type Role = string;

export const ensureCrmTestUsers = async () => {
  for (const account of Object.values(TEST_ACCOUNTS)) {
    const email = account.email;
    const password = account.password;
    const roles: Role[] = account.roles;

    const existingUser = await fetchUserByEmail(email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (updateError) {
        throw new Error(`Failed to update Supabase user "${email}": ${updateError.message}`);
      }
    } else {
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !createdUser?.user) {
        throw new Error(`Failed to create Supabase user "${email}": ${createError?.message}`);
      }

      userId = createdUser.user.id;
    }

    const profilePayload = {
      id: userId,
      email,
      name: `${account.firstName} ${account.lastName}`,
      first_name: account.firstName,
      last_name: account.lastName,
      updated_at: nowIso(),
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      throw new Error(`Failed to upsert profile for "${email}": ${profileError.message}`);
    }

    if (roles.length > 0) {
      const roleRows = roles.map((role) => ({
        user_id: userId,
        role,
        created_at: nowIso(),
      }));

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert(roleRows, { onConflict: 'user_id,role' });

      if (roleError) {
        throw new Error(`Failed to upsert roles for "${email}": ${roleError.message}`);
      }
    }
  }
};
