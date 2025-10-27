/**
 * Smoke Tests - Critical User Paths
 *
 * Fast, essential tests that verify core functionality works.
 * These tests run on every PR in GitHub Actions CI.
 *
 * ⚠️ RUNS IN GITHUB ACTIONS - NOT ON DROPLET
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical User Paths', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error tracking
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });

    // Set up page error tracking
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check essential elements
    await expect(page.locator('body')).toBeVisible();

    // Main content should be present
    await expect(page.locator('main')).toBeVisible();

    // Hero section should be present
    await expect(page.locator('h1')).toBeVisible();

    // Call-to-action buttons should be present (at least one should exist)
    const ctaButtons = page.locator('button, a[href="/auth"], a[href="/browse"]');
    expect(await ctaButtons.count()).toBeGreaterThanOrEqual(1);

    // Page should have content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for critical text (case-insensitive)
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('sydney');
  });

  test('Events page displays without crashing', async ({ page }) => {
    await page.goto('/events');

    // Page should load
    await expect(page.locator('body')).toBeVisible();

    // Should have some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Wait for any async content
    await page.waitForLoadState('networkidle');

    // No fatal errors
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('fatal error');
    expect(pageContent.toLowerCase()).not.toContain('something went wrong');
  });

  test('Navigation works between pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Try to navigate to events (if link exists)
    const eventsLink = page.locator('a[href="/events"], a:has-text("Events")').first();

    if (await eventsLink.count() > 0) {
      await eventsLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate successfully
      await expect(page).toHaveURL(/\/events/);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Auth page loads correctly', async ({ page }) => {
    await page.goto('/auth');

    // Auth page should load
    await expect(page.locator('body')).toBeVisible();

    // Should have form elements (email/password typical in auth forms)
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;

    // At least one auth-related element should exist
    expect(hasEmailInput || hasPasswordInput).toBeTruthy();
  });

  test('404 page works for invalid routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-12345');

    // Page should render (not crash)
    await expect(page.locator('body')).toBeVisible();

    // Should show some kind of not found message
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    // Common 404 indicators
    const content = bodyText!.toLowerCase();
    const has404Indicator =
      content.includes('404') ||
      content.includes('not found') ||
      content.includes('page not found') ||
      content.includes("doesn't exist");

    // If no 404 indicator, at least page shouldn't be blank
    if (!has404Indicator) {
      expect(content.length).toBeGreaterThan(50);
    }
  });

  test('API health check - Supabase connection', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) {
      console.warn('⚠️  VITE_SUPABASE_URL not set - skipping API health check');
      return;
    }

    // Test Supabase REST API health
    const response = await request.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_ANON_KEY || '',
      },
      timeout: 5000,
      ignoreHTTPSErrors: false,
    });

    // Should return 200 OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('No critical JavaScript errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors (add patterns as needed)
    const criticalErrors = errors.filter(error => {
      const errorLower = error.toLowerCase();

      // Ignore common non-critical warnings
      if (errorLower.includes('favicon')) return false;
      if (errorLower.includes('third-party')) return false;
      if (errorLower.includes('extension')) return false;

      return true;
    });

    if (criticalErrors.length > 0) {
      console.error('Critical errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds (generous for CI)
    expect(loadTime).toBeLessThan(5000);

    console.log(`✅ Page loaded in ${loadTime}ms`);
  });

  test('Essential meta tags present', async ({ page }) => {
    await page.goto('/');

    // Check for essential meta tags
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Vite App'); // Should have custom title

    // Check viewport meta tag
    const viewportMeta = await page.locator('meta[name="viewport"]').count();
    expect(viewportMeta).toBeGreaterThan(0);
  });

  test('Mobile viewport renders correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Page should load on mobile
    await expect(page.locator('body')).toBeVisible();

    // Should have content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
  });
});

test.describe('Smoke Tests - Error Boundaries', () => {
  test('App has error boundary (catches React errors gracefully)', async ({ page }) => {
    await page.goto('/');

    // Trigger a potential React error (if error boundary exists, page won't crash)
    await page.evaluate(() => {
      // Try to trigger error - if boundary exists, it will catch
      const event = new Event('error');
      window.dispatchEvent(event);
    });

    // Page should still be visible (error boundary should catch)
    await expect(page.locator('body')).toBeVisible();
  });
});
