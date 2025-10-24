/**
 * Test Account Seeding Script
 *
 * Creates and maintains test accounts in Supabase for E2E testing.
 * Uses Supabase admin API to create users with specific roles for CRM testing.
 */

export interface TestAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const TEST_ACCOUNTS: Record<string, TestAccount> = {
  admin: {
    email: 'standupsydney.e2e.admin@gmail.com',
    password: 'TestPassword123!',
    firstName: 'Admin',
    lastName: 'Tester',
    roles: ['admin'],
  },
  manager: {
    email: 'standupsydney.e2e.manager@gmail.com',
    password: 'TestPassword123!',
    firstName: 'Manager',
    lastName: 'Tester',
    roles: ['member'], // Using 'member' instead of 'agency_manager'
  },
  promoter: {
    email: 'standupsydney.e2e.promoter@gmail.com',
    password: 'TestPassword123!',
    firstName: 'Promoter',
    lastName: 'Tester',
    roles: ['promoter'],
  },
  venue: {
    email: 'standupsydney.e2e.venue@gmail.com',
    password: 'TestPassword123!',
    firstName: 'Venue',
    lastName: 'Manager',
    roles: ['member'], // Using 'member' instead of 'venue_manager'
  },
};

/**
 * Seed test accounts in Supabase
 *
 * This function:
 * 1. Checks if test accounts exist
 * 2. Creates accounts if they don't exist
 * 3. Upserts profiles
 * 4. Upserts roles
 */
export async function seedTestAccounts() {
  console.log('🌱 Seeding test accounts...');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }

  // Import supabase client dynamically
  const { createClient } = await import('@supabase/supabase-js');
  // Use service role key to bypass RLS and email confirmation
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  for (const [accountType, account] of Object.entries(TEST_ACCOUNTS)) {
    console.log(`  Setting up ${accountType}: ${account.email}`);

    try {
      // Try to sign up the user - if they already exist, we'll get an error we can ignore
      // Using admin client with service role key to bypass email confirmation
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email for test accounts
        user_metadata: {
          first_name: account.firstName,
          last_name: account.lastName,
          name: `${account.firstName} ${account.lastName}`,
        },
      });

      if (signUpError) {
        // If user already exists, that's okay - we'll retrieve their ID
        if (signUpError.message.includes('already been registered') || signUpError.message.includes('already exists')) {
          console.log(`    ℹ User already exists, retrieving ID...`);
        } else {
          throw signUpError;
        }
      } else if (signUpData.user) {
        console.log(`    ✓ User created: ${signUpData.user.id}`);
      }

      // Get user ID - either from signup or by querying the admin API
      let userId: string | null = signUpData?.user?.id || null;

      if (!userId) {
        // User exists, get their ID using admin API
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          throw new Error(`Failed to list users: ${listError.message}`);
        }

        const existingUser = users.find(u => u.email === account.email);
        if (existingUser) {
          userId = existingUser.id;
          console.log(`    ℹ Retrieved existing user ID: ${userId}`);

          // Ensure email is confirmed for existing users
          const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            email_confirm: true
          });

          if (updateError) {
            console.warn(`    ⚠ Failed to confirm email: ${updateError.message}`);
          } else {
            console.log(`    ✓ Email confirmed`);
          }
        }
      }

      if (!userId) {
        throw new Error('Failed to get user ID');
      }

      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: account.email,
          first_name: account.firstName,
          last_name: account.lastName,
          name: `${account.firstName} ${account.lastName}`,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.warn(`    ⚠ Profile upsert warning: ${profileError.message}`);
      } else {
        console.log(`    ✓ Profile configured`);
      }

      // Upsert roles
      for (const role of account.roles) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: role,
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,role'
          });

        if (roleError) {
          console.warn(`    ⚠ Role upsert warning for ${role}: ${roleError.message}`);
        } else {
          console.log(`    ✓ Role ${role} configured`);
        }
      }

      console.log(`    ✓ Account ${accountType} fully configured`);
    } catch (error: any) {
      console.error(`    ✗ Error setting up ${accountType}:`, error.message);
      throw error; // Re-throw to fail the setup if account creation fails
    }
  }

  console.log('✅ Test account seeding complete');
}

/**
 * Helper function to get test account credentials
 */
export function getTestAccount(role: 'admin' | 'manager' | 'promoter' | 'venue'): TestAccount {
  return TEST_ACCOUNTS[role];
}

/**
 * Helper function to create SQL for user seeding
 * This SQL can be executed via Supabase MCP
 */
export function generateSeedSQL(account: TestAccount): string {
  // Generate a deterministic UUID based on email for test accounts
  const userId = `00000000-0000-0000-0000-${account.email.split('@')[0].replace(/\./g, '').substring(0, 12).padEnd(12, '0')}`;

  const profileSQL = `
-- Upsert profile for ${account.email}
INSERT INTO public.profiles (id, email, first_name, last_name, name, created_at, updated_at)
VALUES (
  '${userId}',
  '${account.email}',
  '${account.firstName}',
  '${account.lastName}',
  '${account.firstName} ${account.lastName}',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  name = EXCLUDED.name,
  updated_at = now();
`;

  const rolesSQL = account.roles
    .map(
      (role) => `
-- Upsert role ${role} for ${account.email}
INSERT INTO public.user_roles (user_id, role, created_at)
VALUES ('${userId}', '${role}', now())
ON CONFLICT (user_id, role) DO NOTHING;
`
    )
    .join('\n');

  return `${profileSQL}\n${rolesSQL}`;
}

/**
 * SQL to create auth users (requires admin access)
 * This should be run via Supabase MCP with admin privileges
 */
export function generateAuthUserSQL(account: TestAccount): string {
  const userId = `00000000-0000-0000-0000-${account.email.split('@')[0].replace(/\./g, '').substring(0, 12).padEnd(12, '0')}`;

  return `
-- Note: This is a template. Use Supabase Admin API or Dashboard to create auth users
-- Email: ${account.email}
-- Password: ${account.password}
-- UUID: ${userId}
-- email_confirmed: true
`;
}
