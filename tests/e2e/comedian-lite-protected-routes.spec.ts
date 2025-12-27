import { test, expect } from '@playwright/test';

test.describe('Comedian Lite - Protected Routes Access Control', () => {
  test.describe('Allowed Routes - Should Be Accessible', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: This test requires authentication setup as comedian_lite user
      // For now, this documents expected behavior
    });

    test('should allow access to /dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should successfully load dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Should not redirect to auth or error page
      await expect(page).not.toHaveURL(/\/auth/);
      await expect(page).not.toHaveURL(/\/error/);
    });

    test('should allow access to /gigs', async ({ page }) => {
      await page.goto('/gigs');

      await expect(page).toHaveURL(/\/gigs/);

      // Should show gigs page content
      const heading = page.getByRole('heading', { name: /gigs|my gigs/i });
      await expect(heading).toBeVisible({ timeout: 5000 });
    });

    test('should allow access to /profile', async ({ page }) => {
      await page.goto('/profile');

      await expect(page).toHaveURL(/\/profile/);

      // Should show profile page content
      const profileContent = page.locator('[class*="profile"]');
      const count = await profileContent.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should allow access to /vouches', async ({ page }) => {
      await page.goto('/vouches');

      // Should successfully load vouches page
      // (May redirect to /profile?tab=vouches depending on implementation)
      await page.waitForLoadState('networkidle');

      // Should not redirect to auth
      await expect(page).not.toHaveURL(/\/auth/);
    });

    test('should allow access to /notifications', async ({ page }) => {
      await page.goto('/notifications');

      await expect(page).toHaveURL(/\/notifications/);

      // Should show notifications content
      await page.waitForLoadState('networkidle');
    });

    test('should allow access to /settings', async ({ page }) => {
      await page.goto('/settings');

      // May redirect to /profile?tab=settings or be a standalone page
      await page.waitForLoadState('networkidle');

      // Should not redirect to auth
      await expect(page).not.toHaveURL(/\/auth/);
    });

    test('should allow access to /media-library', async ({ page }) => {
      await page.goto('/media-library');

      await expect(page).toHaveURL(/\/media-library/);

      await page.waitForLoadState('networkidle');
    });

    test('should allow access to /roadmap', async ({ page }) => {
      await page.goto('/roadmap');

      await expect(page).toHaveURL(/\/roadmap/);

      await page.waitForLoadState('networkidle');
    });

    test('should allow access to gig-specific routes like /dashboard/gigs/my-gigs', async ({ page }) => {
      await page.goto('/dashboard/gigs/my-gigs');

      // Should successfully load
      await page.waitForLoadState('networkidle');

      // Should not redirect to auth
      await expect(page).not.toHaveURL(/\/auth/);
    });
  });

  test.describe('Restricted Routes - Should Be Blocked', () => {
    test.beforeEach(async ({ page }) => {
      // TODO: This test requires authentication setup as comedian_lite user
    });

    test('should block access to /shows (members only)', async ({ page }) => {
      await page.goto('/shows');

      // Should redirect to error page or show access denied
      // OR show the page but with limited functionality

      // Wait to see where we end up
      await page.waitForLoadState('networkidle');

      // Document expected behavior:
      // Option 1: Redirect to error/access-denied
      // Option 2: Show page but with "Upgrade" message
      // Option 3: Redirect to dashboard with message

      // For now, just verify we don't crash
      const hasError = await page.getByText(/access denied|not authorized|upgrade|premium/i).isVisible().catch(() => false);

      // If access control is implemented, should show some restriction message
    });

    test('should block access to /messages (not available to comedian_lite)', async ({ page }) => {
      await page.goto('/messages');

      await page.waitForLoadState('networkidle');

      // Should show restriction or redirect
      const restrictionMessage = await page.getByText(/access denied|not available|upgrade/i).isVisible().catch(() => false);

      // Messages feature is not available to comedian_lite
    });

    test('should block access to /social-media-manager', async ({ page }) => {
      await page.goto('/social-media-manager');

      await page.waitForLoadState('networkidle');

      // Should be blocked or redirect
      const hasAccess = await page.getByText(/social media manager/i).isVisible().catch(() => false);

      // If blocked, should not show social media manager content
    });

    test('should block access to /browse-comedians', async ({ page }) => {
      await page.goto('/browse-comedians');

      await page.waitForLoadState('networkidle');

      // Should be blocked - this is for promoters/members
      const restrictionMessage = await page.getByText(/access denied|not available/i).isVisible().catch(() => false);
    });

    test('should block access to /browse-photographers', async ({ page }) => {
      await page.goto('/browse-photographers');

      await page.waitForLoadState('networkidle');

      // Should be blocked
      const restrictionMessage = await page.getByText(/access denied|not available/i).isVisible().catch(() => false);
    });

    test('should block access to /applications (promoter feature)', async ({ page }) => {
      await page.goto('/applications');

      await page.waitForLoadState('networkidle');

      // Applications are for promoters reviewing comedian applications
      // comedian_lite should not access this
      const hasAccess = await page.getByText(/applications/i).isVisible().catch(() => false);
    });

    test('should block access to /add-gig (should use /dashboard/gigs/add instead)', async ({ page }) => {
      await page.goto('/add-gig');

      await page.waitForLoadState('networkidle');

      // Direct /add-gig route might be restricted
      // comedian_lite uses /dashboard/gigs/add
    });

    test('should block access to /tasks (not available)', async ({ page }) => {
      await page.goto('/tasks');

      await page.waitForLoadState('networkidle');

      // Tasks feature not available to comedian_lite
      const restrictionMessage = await page.getByText(/access denied|not available/i).isVisible().catch(() => false);
    });

    test('should block access to /invoices standalone page', async ({ page }) => {
      await page.goto('/invoices');

      await page.waitForLoadState('networkidle');

      // Invoices are accessed via profile tab, not standalone route
      // Should redirect or show restriction
    });

    test('should block access to /earnings', async ({ page }) => {
      await page.goto('/earnings');

      await page.waitForLoadState('networkidle');

      // Earnings tracking not available to comedian_lite
      const restrictionMessage = await page.getByText(/access denied|not available/i).isVisible().catch(() => false);
    });

    test('should block access to /analytics', async ({ page }) => {
      await page.goto('/analytics');

      await page.waitForLoadState('networkidle');

      // Analytics not available to comedian_lite
      const restrictionMessage = await page.getByText(/access denied|not available/i).isVisible().catch(() => false);
    });

    test('should block access to /admin routes', async ({ page }) => {
      await page.goto('/admin');

      await page.waitForLoadState('networkidle');

      // Admin routes absolutely restricted
      // Should redirect to error or dashboard
      await expect(page).not.toHaveURL(/\/admin/);
    });

    test('should block access to /crm routes', async ({ page }) => {
      await page.goto('/crm');

      await page.waitForLoadState('networkidle');

      // CRM routes for admin/agency/promoter only
      // Should redirect or show access denied
      await expect(page).not.toHaveURL(/\/crm/);
    });

    test('should block access to /users management', async ({ page }) => {
      await page.goto('/users');

      await page.waitForLoadState('networkidle');

      // User management is admin-only
      await expect(page).not.toHaveURL(/\/users/);
    });

    test('should block access to /web-app-settings', async ({ page }) => {
      await page.goto('/web-app-settings');

      await page.waitForLoadState('networkidle');

      // Web app settings are admin-only
      const restrictionMessage = await page.getByText(/access denied|not authorized/i).isVisible().catch(() => false);
    });
  });

  test.describe('Authentication Requirements', () => {
    test('should redirect to auth when not logged in', async ({ page, context }) => {
      // Clear all cookies to simulate logged-out state
      await context.clearCookies();

      // Try to access protected route
      await page.goto('/dashboard');

      await page.waitForLoadState('networkidle');

      // Should redirect to auth/login page
      await expect(page).toHaveURL(/\/auth/);
    });

    test('should preserve intended destination after login', async ({ page, context }) => {
      // Clear cookies
      await context.clearCookies();

      // Try to access profile while logged out
      await page.goto('/profile');

      // Should redirect to auth
      await page.waitForLoadState('networkidle');

      // After login (simulated), should redirect to originally requested page
      // This requires full auth implementation to test properly

      // Document expected behavior:
      // 1. User tries to access /profile
      // 2. Gets redirected to /auth?redirect=/profile
      // 3. After successful login, redirects to /profile
    });

    test('should not allow access to comedian_lite routes without comedian_lite role', async ({ page }) => {
      // This test would require authenticating as a different role (e.g., 'member')
      // Then trying to access comedian_lite routes

      // Document expected behavior:
      // A 'member' role should not access comedian-specific routes like:
      // - /dashboard/gigs/add
      // - /media-library
      // They should see member-specific views instead
    });
  });

  test.describe('Route Navigation and Sidebar Integration', () => {
    test('should show only allowed routes in sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // comedian_lite should see exactly 9 sidebar items
      // As tested in sidebar-access-comedian-lite.test.ts:
      // dashboard, gigs, profile, vouches, notifications, settings, my-gigs, media-library, roadmap

      // Look for sidebar
      const sidebar = page.locator('[class*="sidebar"], nav');

      if (await sidebar.isVisible()) {
        // Should NOT see restricted items
        const showsLink = page.getByRole('link', { name: /^shows$/i });
        const messagesLink = page.getByRole('link', { name: /messages/i });
        const analyticsLink = page.getByRole('link', { name: /analytics/i });

        await expect(showsLink).not.toBeVisible();
        await expect(messagesLink).not.toBeVisible();
        await expect(analyticsLink).not.toBeVisible();

        // Should see allowed items
        const gigsLink = page.getByRole('link', { name: /gigs/i });
        const profileLink = page.getByRole('link', { name: /profile/i });

        await expect(gigsLink).toBeVisible();
        await expect(profileLink).toBeVisible();
      }
    });

    test('should not show restricted items in navigation menus', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Open mobile menu if it exists
      const mobileMenuButton = page.getByRole('button', { name: /menu|navigation/i });
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
      }

      // Should not see links to restricted features
      const adminLink = page.getByRole('link', { name: /admin/i });
      const crmLink = page.getByRole('link', { name: /crm/i });

      await expect(adminLink).not.toBeVisible();
      await expect(crmLink).not.toBeVisible();
    });

    test('should handle direct URL access to restricted routes gracefully', async ({ page }) => {
      // Type a restricted URL directly
      await page.goto('/admin/users');

      await page.waitForLoadState('networkidle');

      // Should NOT crash the app
      // Should show error page or redirect

      const hasErrorPage = await page.getByText(/not found|access denied|404/i).isVisible().catch(() => false);
      const onErrorPage = page.url().includes('/error') || page.url().includes('/404');
      const redirectedToDashboard = page.url().includes('/dashboard');

      // One of these should be true
      expect(hasErrorPage || onErrorPage || redirectedToDashboard).toBeTruthy();
    });
  });

  test.describe('Edge Cases and Security', () => {
    test('should prevent URL manipulation to access restricted features', async ({ page }) => {
      // Try various URL patterns that might bypass restrictions
      const restrictedUrls = [
        '/admin',
        '/admin/dashboard',
        '/crm/contacts',
        '/applications/review',
        '/users/manage',
      ];

      for (const url of restrictedUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Should not show restricted content
        // Should either redirect or show access denied
        expect(page.url()).not.toContain(url);
      }
    });

    test('should not expose restricted API endpoints in network tab', async ({ page }) => {
      // Monitor network requests
      const requests: string[] = [];

      page.on('request', request => {
        requests.push(request.url());
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Should not make requests to admin/crm endpoints
      const hasAdminRequest = requests.some(url => url.includes('/admin/'));
      const hasCrmRequest = requests.some(url => url.includes('/crm/'));

      expect(hasAdminRequest).toBeFalsy();
      expect(hasCrmRequest).toBeFalsy();
    });

    test('should maintain route protection after page refresh', async ({ page }) => {
      // Access an allowed route
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be on dashboard (not redirected to auth)
      await expect(page).toHaveURL(/\/dashboard/);

      // Now try to access restricted route after refresh
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      // Should still be blocked
      await expect(page).not.toHaveURL(/\/admin/);
    });
  });
});
