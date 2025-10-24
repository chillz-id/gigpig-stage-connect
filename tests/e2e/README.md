# Playwright E2E Testing Setup

## Overview

This directory contains end-to-end tests for the Stand Up Sydney platform using Playwright. Tests are organized by feature area and use authenticated sessions for different user roles.

## ✅ Fixed Issues

### React Hydration Issue - RESOLVED
The React hydration issue that was preventing the auth page from rendering correctly has been **completely fixed**:

1. **Missing React imports**: Added proper imports to `AuthContext.tsx` and `UserContext.tsx`
2. **Port configuration**: Aligned Playwright config to use port 8080 (matching Vite)
3. **Environment variables**: Added dotenv loading to Playwright config
4. **Validation**: Added environment variable validation in global setup

The auth page now renders correctly with all form elements visible!

## Required Environment Variables

### For E2E Tests to Run

Add these to your `.env` file:

```bash
# Required - Already configured
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Required - Needs to be added for E2E tests
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting the Service Role Key

The `SUPABASE_SERVICE_ROLE_KEY` is required for E2E test account seeding because:
- It bypasses Row-Level Security (RLS) policies
- It auto-confirms email addresses for test accounts
- It allows admin operations like creating users programmatically

**To get your service role key:**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key in the **Project API keys** section
4. Copy the key and add it to your `.env` file

⚠️ **Security Note**: The service role key has full admin access to your Supabase project. Never commit it to version control and only use it in secure environments.

## Test Account Configuration

Test accounts are automatically created during test setup with these roles:

```typescript
{
  admin: 'standupsydney.e2e.admin@gmail.com',
  manager: 'standupsydney.e2e.manager@gmail.com',
  promoter: 'standupsydney.e2e.promoter@gmail.com',
  venue: 'standupsydney.e2e.venue@gmail.com'
}
```

All accounts use the password: `TestPassword123!`

### Valid User Roles

The following roles are valid in the database:
- `admin` - Full platform access
- `promoter` - Event management and lineup control
- `comedian` - Performer profile and gig applications
- `member` - Basic platform access
- `co_promoter` - Event collaboration

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/crm/authenticated-crm.spec.ts

# Run with specific project (role)
npm run test:e2e -- --project=crm-admin

# Run with visible browser
npm run test:e2e:headed

# Debug mode with Playwright Inspector
npm run test:e2e:debug

# Interactive UI mode
npm run test:e2e:ui
```

## Test Structure

```
tests/e2e/
├── .auth/                    # Saved authentication states
│   ├── admin.json
│   ├── manager.json
│   ├── promoter.json
│   └── venue.json
├── crm/                      # CRM-related tests
├── setup/
│   └── seed-test-accounts.ts # Test account seeding logic
├── helpers/
│   └── auth-helper.ts        # Authentication utilities
├── global-setup.ts           # Pre-test setup (seeding, login)
└── global-teardown.ts        # Post-test cleanup
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in your `.env` file

### Issue: "Email not confirmed" errors during login
**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file (see above)

### Issue: "Email address invalid" errors
**Solution**: Test accounts now use Gmail addresses which are universally accepted by Supabase

### Issue: "Invalid enum value" errors for roles
**Solution**: Test accounts now use valid role values from the database enum

### Issue: Port conflicts
**Solution**: Tests run on port 8080 (not 8083). Ensure no other process is using this port.

## Next Steps

Once you add the `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file:

1. Run the tests: `npm run test:e2e`
2. Test accounts will be created with confirmed emails
3. Authentication sessions will be saved to `.auth/` directory
4. Tests will run with proper role-based access

## Files Modified

### Core Fixes (React Hydration)
- `/root/agents/src/contexts/AuthContext.tsx` - Added React imports
- `/root/agents/src/contexts/UserContext.tsx` - Added React imports

### Test Configuration
- `/root/agents/playwright.config.ts` - Port 8080, dotenv loading
- `/root/agents/tests/e2e/helpers/auth-helper.ts` - Port 8080 base URL
- `/root/agents/tests/e2e/global-setup.ts` - Environment validation
- `/root/agents/tests/e2e/setup/seed-test-accounts.ts` - Admin API, valid roles, Gmail addresses
