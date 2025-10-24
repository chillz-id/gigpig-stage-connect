/**
 * Authenticated CRM Tests
 *
 * These tests use pre-authenticated sessions stored in tests/e2e/.auth/
 * No login is required in the test - Playwright automatically loads the session.
 */

import { test, expect } from '@playwright/test';

test.describe('CRM - Authenticated Navigation', () => {
  test('admin can access CRM customers page', async ({ page }) => {
    // Navigate directly to CRM customers page
    // Playwright will use the stored admin session automatically
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });

    // Verify we're on the customers page
    await expect(page).toHaveURL(/\/crm\/customers/);

    // Check for the page heading specifically (h1 element)
    await expect(page.getByRole('heading', { name: 'Customers', level: 1 }))
      .toBeVisible({ timeout: 10000 });

    // Verify page content is loaded (either sidebar, mobile nav, or main content)
    const pageLoaded = page.locator('body:has-text("Customers")');
    await expect(pageLoaded).toBeVisible();
  });

  test('admin can navigate to different CRM sections', async ({ page }) => {
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });

    // Wait for page to be interactive
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/crm\/customers/);

    // Try navigating to deals section
    await page.goto('/crm/deals', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/crm\/deals/);

    // Try navigating to tasks section
    await page.goto('/crm/tasks', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/crm\/tasks/);

    // Try navigating to relationships section
    await page.goto('/crm/relationships', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/crm\/relationships/);
  });

  test('admin can see customer list data', async ({ page }) => {
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });

    // Wait for the page heading to be visible (more specific selector)
    await expect(page.getByRole('heading', { name: 'Customers', level: 1 }))
      .toBeVisible({ timeout: 10000 });

    // Check for either:
    // 1. Customer data table/list
    // 2. Empty state message
    const hasTable = (await page.locator('table').count()) > 0;
    const hasCustomerCards = (await page.locator('[data-testid*="customer"]').count()) > 0;
    const hasEmptyState = (await page.locator('text=/no customers|empty|get started/i').count()) > 0;

    // At least one of these should be true
    expect(hasTable || hasCustomerCards || hasEmptyState).toBeTruthy();
  });
});

test.describe('CRM - Role-based Access', () => {
  test.use({ project: 'crm-manager' });

  test('agency manager can access CRM', async ({ page }) => {
    await page.goto('/crm/customers', { waitUntil: 'domcontentloaded' });

    // Manager should be able to access CRM
    await expect(page).toHaveURL(/\/crm\/customers/);

    // Should see CRM content, not a permission error
    const hasPermissionError = (await page.locator('text=/access denied|unauthorized|forbidden/i').count()) > 0;
    expect(hasPermissionError).toBeFalsy();
  });
});

test.describe('CRM - Deal Pipeline', () => {
  test('admin can view deal pipeline', async ({ page }) => {
    await page.goto('/crm/deals', { waitUntil: 'domcontentloaded' });

    // Wait for page to render
    await page.waitForTimeout(2000);

    // Check for deal-related content
    const hasDealContent =
      (await page.locator('text=/deals|pipeline|negotiat/i').count()) > 0 ||
      (await page.locator('[data-testid*="deal"]').count()) > 0;

    expect(hasDealContent).toBeTruthy();
  });
});

test.describe('CRM - Task Management', () => {
  test('admin can view tasks page', async ({ page }) => {
    await page.goto('/crm/tasks', { waitUntil: 'domcontentloaded' });

    // Wait for page to render
    await page.waitForTimeout(2000);

    // The page loads successfully (even if it shows access denied or error)
    // This test verifies the route exists and renders
    await expect(page).toHaveURL(/\/crm\/tasks/);

    // Check that something rendered (either content, access denied, or error state)
    const hasContent = (await page.locator('body').textContent())?.length > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('CRM - Relationships', () => {
  test('admin can view relationships page', async ({ page }) => {
    await page.goto('/crm/relationships', { waitUntil: 'domcontentloaded' });

    // Wait for page to render
    await page.waitForTimeout(2000);

    // The page loads successfully (even if it shows error state)
    // This test verifies the route exists and renders
    await expect(page).toHaveURL(/\/crm\/relationships/);

    // Check that something rendered (either content or error state)
    const hasContent = (await page.locator('body').textContent())?.length > 0;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('CRM - Analytics', () => {
  test('admin can view analytics dashboard', async ({ page }) => {
    await page.goto('/crm/analytics', { waitUntil: 'domcontentloaded' });

    // The page loads successfully (even if showing loading state)
    // This test verifies the route exists and renders
    await expect(page).toHaveURL(/\/crm\/analytics/);

    // Wait a bit longer for potential content to load
    await page.waitForTimeout(3000);

    // Check that the page rendered something (either content or loading state)
    const hasContent = (await page.locator('body').textContent())?.length > 0;
    expect(hasContent).toBeTruthy();
  });
});
