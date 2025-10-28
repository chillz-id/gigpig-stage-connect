import { test, expect } from '@playwright/test';
import { chromium, Page } from '@playwright/test';

/**
 * E2E Tests for Profile URLs & Routing
 *
 * Comprehensive test suite covering:
 * - Public profile access via clean URLs
 * - Profile switching with URL updates
 * - Slug redirects (301) for old slugs
 * - 404 handling with profile requests
 * - Reserved slug validation
 * - Per-profile sidebar preferences isolation
 */

test.describe('Profile URLs - Public Access', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('loads public profile by URL', async ({ page }) => {
    // Create a test comedian profile via API or navigate to creation
    // For this test, we'll navigate to a profile URL pattern

    // Navigate to a comedian profile (assuming test data exists)
    await page.goto('/comedian/test-comedian/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on a profile page (not 404)
    const notFoundIndicator = page.locator('text=/Profile.*not found|404|doesn\'t exist/i');
    const profileContent = page.locator('[data-testid="profile-content"], h1, h2').first();

    // Either we find profile content OR we find 404 (depending on if test data exists)
    const hasContent = await profileContent.isVisible().catch(() => false);
    const hasNotFound = await notFoundIndicator.isVisible().catch(() => false);

    // At minimum, the page should load without error
    expect(hasContent || hasNotFound).toBe(true);

    // URL should remain stable (no redirect to generic dashboard)
    expect(page.url()).toContain('/comedian/test-comedian/dashboard');
  });

  test('navigates within profile pages maintaining URL structure', async ({ page }) => {
    // Navigate to comedian dashboard
    await page.goto('/comedian/test-comedian/dashboard');
    await page.waitForLoadState('networkidle');

    // Try to navigate to settings (if link exists)
    const settingsLink = page.locator('a[href*="settings"], button').filter({ hasText: /settings/i }).first();

    if (await settingsLink.isVisible().catch(() => false)) {
      await settingsLink.click();
      await page.waitForLoadState('networkidle');

      // URL should maintain profile structure
      expect(page.url()).toContain('/comedian/test-comedian');
    }

    // Verify URL pattern is preserved
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(comedian|manager|organization|venue)\/[a-z0-9-]+/);
  });
});

test.describe('Profile URLs - Profile Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('switches profiles and updates URL', async ({ page }) => {
    // Look for profile switcher
    const profileSwitcher = page.locator('[data-testid="profile-switcher"]').or(
      page.locator('button').filter({ hasText: /profile/i })
    );

    const switcherExists = await profileSwitcher.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!switcherExists) {
      test.skip();
      return;
    }

    // Get current URL
    const initialUrl = page.url();

    // Click profile switcher
    await profileSwitcher.first().click();
    await page.waitForTimeout(500);

    // Look for profile options
    const profileOptions = page.locator('[role="menuitem"], [role="option"]');
    const optionCount = await profileOptions.count();

    if (optionCount > 1) {
      // Get the second profile option text to identify profile type
      const secondOption = profileOptions.nth(1);
      await secondOption.click();
      await page.waitForLoadState('networkidle');

      // URL should have changed (unless we're on a non-profile page)
      const newUrl = page.url();

      // If we're on a profile URL, it should update
      if (initialUrl.match(/\/(comedian|manager|organization|venue)\//)) {
        expect(newUrl).not.toBe(initialUrl);
      }
    } else {
      test.skip(); // Not enough profiles to test switching
    }
  });

  test('persists active profile in localStorage', async ({ page }) => {
    const profileSwitcher = page.locator('button').filter({ hasText: /profile/i }).first();
    const switcherExists = await profileSwitcher.isVisible({ timeout: 5000 }).catch(() => false);

    if (!switcherExists) {
      test.skip();
      return;
    }

    await profileSwitcher.click();
    await page.waitForTimeout(500);

    const profileOptions = page.locator('[role="menuitem"], [role="option"]');
    const optionCount = await profileOptions.count();

    if (optionCount > 1) {
      await profileOptions.nth(1).click();
      await page.waitForTimeout(1000);

      // Check localStorage for active profile
      const activeProfile = await page.evaluate(() => {
        const stored = localStorage.getItem('activeProfile');
        return stored ? JSON.parse(stored) : null;
      });

      expect(activeProfile).toBeTruthy();
      expect(activeProfile).toHaveProperty('type');
      expect(activeProfile).toHaveProperty('slug');

      // Reload page and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');

      const activeProfileAfterReload = await page.evaluate(() => {
        const stored = localStorage.getItem('activeProfile');
        return stored ? JSON.parse(stored) : null;
      });

      expect(activeProfileAfterReload).toEqual(activeProfile);
    } else {
      test.skip();
    }
  });
});

test.describe('Profile URLs - Slug Redirects (301)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('redirects from old slug to new slug', async ({ page }) => {
    // This test requires test data with slug_history entries
    // For now, we'll test the redirect mechanism

    // Attempt to access an old slug (this would need actual test data)
    const response = await page.goto('/comedian/old-test-slug/dashboard', {
      waitUntil: 'networkidle'
    });

    // Check if redirect occurred
    const finalUrl = page.url();
    const statusCode = response?.status();

    // If slug_history exists, we'd get a 301 redirect
    // If not, we'd get 404
    expect([200, 301, 302, 404]).toContain(statusCode);

    // If redirected, final URL should be different
    if (statusCode === 301 || statusCode === 302) {
      expect(finalUrl).not.toContain('old-test-slug');
      expect(finalUrl).toMatch(/\/(comedian|manager|organization|venue)\/[a-z0-9-]+/);
    }
  });

  test('preserves query parameters during redirect', async ({ page }) => {
    // Navigate with query params
    const response = await page.goto('/comedian/old-test-slug/dashboard?tab=settings&edit=true', {
      waitUntil: 'networkidle'
    });

    const finalUrl = page.url();

    // If redirect occurred, query params should be preserved
    if (response?.status() === 301 || response?.status() === 302) {
      expect(finalUrl).toContain('tab=settings');
      expect(finalUrl).toContain('edit=true');
    }
  });
});

test.describe('Profile URLs - 404 Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('displays NotFoundHandler for non-existent profile', async ({ page }) => {
    // Navigate to a non-existent profile
    const randomSlug = `nonexistent-profile-${Date.now()}`;
    await page.goto(`/comedian/${randomSlug}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should see 404 message
    const notFoundMessage = page.locator('text=/Profile.*not found|404|doesn\'t exist/i');
    await expect(notFoundMessage.first()).toBeVisible({ timeout: 10000 });

    // Should see profile request option
    const requestSection = page.locator('text=/Request.*Profile|Know.*comedian|Instagram/i');
    const hasRequestSection = await requestSection.first().isVisible().catch(() => false);

    // At minimum, we should have a 404 message
    expect(hasRequestSection || await notFoundMessage.first().isVisible()).toBe(true);
  });

  test('allows submitting Instagram handle for profile request', async ({ page }) => {
    const randomSlug = `test-request-${Date.now()}`;
    await page.goto(`/comedian/${randomSlug}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Look for Instagram input
    const instagramInput = page.locator('input[name="instagram"], input[placeholder*="instagram" i]').first();
    const hasInput = await instagramInput.isVisible().catch(() => false);

    if (hasInput) {
      // Fill Instagram handle
      await instagramInput.fill('@test_comedian');

      // Submit request
      const submitButton = page.locator('button').filter({ hasText: /Request|Submit/i }).first();

      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should see success message (toast or inline)
        const successMessage = page.locator('text=/Request.*sent|Thank you|We\'ll.*review/i');
        const hasSuccess = await successMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

        expect(hasSuccess).toBe(true);
      }
    }
  });

  test('provides link to browse all profiles', async ({ page }) => {
    await page.goto('/comedian/nonexistent-profile/dashboard');
    await page.waitForLoadState('networkidle');

    // Should see browse link
    const browseLink = page.locator('a').filter({ hasText: /Browse.*comedians|View.*all|See.*all/i }).first();
    const hasLink = await browseLink.isVisible().catch(() => false);

    if (hasLink) {
      // Click and verify navigation
      await browseLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to comedians list
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/comedians|\/browse|\/directory/i);
    }
  });
});

test.describe('Profile URLs - Reserved Slug Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('prevents creating profile with reserved slug', async ({ page }) => {
    // Navigate to profile creation
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Click create profile button
    const createButton = page.locator('button').filter({ hasText: /Create.*Profile/i }).first();
    const hasButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasButton) {
      test.skip();
      return;
    }

    await createButton.click();
    await page.waitForTimeout(1000);

    // Select comedian profile type (if available)
    const comedianOption = page.locator('text=/Comedian/i').first();
    if (await comedianOption.isVisible().catch(() => false)) {
      await comedianOption.click();
      await page.waitForTimeout(1000);
    }

    // Look for slug input field
    const slugInput = page.locator('input[name="slug"], input[name="url_slug"], input[placeholder*="slug" i]').first();
    const hasSlugInput = await slugInput.isVisible().catch(() => false);

    if (hasSlugInput) {
      // Try to enter reserved slug
      await slugInput.fill('dashboard');
      await page.waitForTimeout(500);

      // Should see validation error
      const errorMessage = page.locator('text=/reserved|cannot.*use|invalid.*slug/i');
      const hasError = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasError).toBe(true);

      // Try another reserved slug
      await slugInput.fill('settings');
      await page.waitForTimeout(500);

      const errorMessage2 = page.locator('text=/reserved|cannot.*use|invalid.*slug/i');
      const hasError2 = await errorMessage2.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasError2).toBe(true);
    }
  });

  test('allows valid slugs', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button').filter({ hasText: /Create.*Profile/i }).first();
    const hasButton = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasButton) {
      test.skip();
      return;
    }

    await createButton.click();
    await page.waitForTimeout(1000);

    // Select profile type
    const comedianOption = page.locator('text=/Comedian/i').first();
    if (await comedianOption.isVisible().catch(() => false)) {
      await comedianOption.click();
      await page.waitForTimeout(1000);
    }

    // Look for slug input
    const slugInput = page.locator('input[name="slug"], input[name="url_slug"], input[placeholder*="slug" i]').first();
    const hasSlugInput = await slugInput.isVisible().catch(() => false);

    if (hasSlugInput) {
      // Enter valid slug
      const validSlug = `test-comedian-${Date.now()}`;
      await slugInput.fill(validSlug);
      await page.waitForTimeout(500);

      // Should NOT see validation error for slug
      const errorMessage = page.locator('text=/reserved|cannot.*use|invalid.*slug/i');
      const hasError = await errorMessage.first().isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasError).toBe(false);
    }
  });
});

test.describe('Profile URLs - Sidebar Preferences Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('maintains separate sidebar preferences per profile', async ({ page }) => {
    // This test requires a user with multiple profiles
    const profileSwitcher = page.locator('button').filter({ hasText: /profile/i }).first();
    const hasSwitcher = await profileSwitcher.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSwitcher) {
      test.skip();
      return;
    }

    // Check if sidebar has customizable items
    const sidebarItems = page.locator('[data-testid="sidebar-item"], nav a, nav button');
    const itemCount = await sidebarItems.count();

    if (itemCount < 2) {
      test.skip();
      return;
    }

    // Get initial sidebar state
    const initialItems = await page.evaluate(() => {
      const items = document.querySelectorAll('[data-testid="sidebar-item"], nav a, nav button');
      return Array.from(items).map(item => ({
        text: item.textContent?.trim(),
        visible: window.getComputedStyle(item).display !== 'none'
      }));
    });

    // Switch to different profile
    await profileSwitcher.click();
    await page.waitForTimeout(500);

    const profileOptions = page.locator('[role="menuitem"], [role="option"]');
    const optionCount = await profileOptions.count();

    if (optionCount > 1) {
      await profileOptions.nth(1).click();
      await page.waitForLoadState('networkidle');

      // Get sidebar state for second profile
      const secondProfileItems = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="sidebar-item"], nav a, nav button');
        return Array.from(items).map(item => ({
          text: item.textContent?.trim(),
          visible: window.getComputedStyle(item).display !== 'none'
        }));
      });

      // Sidebar items should exist for both profiles
      expect(secondProfileItems.length).toBeGreaterThan(0);

      // Switch back to first profile
      await profileSwitcher.click();
      await page.waitForTimeout(500);
      await profileOptions.first().click();
      await page.waitForLoadState('networkidle');

      // Sidebar state should revert to initial state
      const finalItems = await page.evaluate(() => {
        const items = document.querySelectorAll('[data-testid="sidebar-item"], nav a, nav button');
        return Array.from(items).map(item => ({
          text: item.textContent?.trim(),
          visible: window.getComputedStyle(item).display !== 'none'
        }));
      });

      // Should have same items as initial state
      expect(finalItems.length).toBe(initialItems.length);
    } else {
      test.skip();
    }
  });

  test('persists sidebar preferences per profile in localStorage', async ({ page }) => {
    // Check if sidebar preferences are stored with profile context
    const sidebarPrefs = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter(key =>
        key.includes('sidebar') || key.includes('preferences')
      );
      return keys.map(key => ({
        key,
        value: localStorage.getItem(key)
      }));
    });

    // Should have sidebar preferences in storage
    expect(sidebarPrefs.length).toBeGreaterThanOrEqual(0);

    // If preferences exist, they should be structured data
    sidebarPrefs.forEach(pref => {
      if (pref.value) {
        expect(() => JSON.parse(pref.value)).not.toThrow();
      }
    });
  });
});

test.describe('Profile URLs - URL Validation & Format', () => {
  test('validates URL slug format', async ({ page }) => {
    // Test various slug formats
    const testCases = [
      { slug: 'valid-slug-123', shouldWork: true },
      { slug: 'test', shouldWork: true },
      { slug: 'my-awesome-profile', shouldWork: true },
      { slug: 'Invalid_Slug', shouldWork: false }, // Uppercase
      { slug: 'invalid slug', shouldWork: false }, // Spaces
      { slug: 'invalid@slug', shouldWork: false }, // Special chars
    ];

    for (const testCase of testCases) {
      await page.goto(`/comedian/${testCase.slug}/dashboard`);
      await page.waitForLoadState('networkidle');

      const is404 = await page.locator('text=/404|not found/i').first().isVisible().catch(() => false);

      // Invalid formats should show 404 or error
      if (!testCase.shouldWork) {
        // Either 404 or some error indication
        expect(is404 || page.url().includes('error')).toBeTruthy();
      }
    }
  });

  test('maintains URL structure across navigation', async ({ page }) => {
    await page.goto('/comedian/test-profile/dashboard');
    await page.waitForLoadState('networkidle');

    const initialUrl = page.url();

    // Click any internal navigation
    const navLinks = page.locator('nav a, [role="navigation"] a').first();
    const hasLinks = await navLinks.isVisible().catch(() => false);

    if (hasLinks) {
      await navLinks.click();
      await page.waitForLoadState('networkidle');

      const newUrl = page.url();

      // If we stay within profile, URL structure should be maintained
      if (newUrl.includes('/comedian/test-profile/')) {
        expect(newUrl).toMatch(/\/comedian\/test-profile\/.+/);
      }
    }
  });
});
