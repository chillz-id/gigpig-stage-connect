import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E Testing - Stand Up Sydney Platform', () => {
  test('Complete user journey - homepage to authentication', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify homepage loads correctly
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible();
    await expect(page.locator('text=Sydney\'s Premier Comedy Community')).toBeVisible();
    
    // Test navigation to auth page
    await page.locator('[data-testid="signup-button"]').click();
    await expect(page).toHaveURL('/auth');
    
    // Navigate back to homepage
    await page.goto('/');
    
    // Test browse shows functionality
    const browseButton = page.locator('text=Browse Shows').first();
    await expect(browseButton).toBeVisible();
    await browseButton.click();
    
    // Should redirect to shows page
    await expect(page).toHaveURL('/shows');
  });

  test('Page responsiveness and mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify mobile layout works
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible();
    await expect(page.locator('text=Sydney\'s Premier Comedy Community')).toBeVisible();
  });

  test('Page performance and loading', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verify page loads within reasonable time (10 seconds)
    expect(loadTime).toBeLessThan(10000);
    
    // Verify key elements are present
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible();
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/homepage-final.png', fullPage: true });
  });
});