import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display signup button for unauthenticated users', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that signup button is visible
    const signupButton = page.locator('[data-testid="signup-button"]');
    await expect(signupButton).toBeVisible();
    await expect(signupButton).toHaveText('Sign Up Now');
    
    // Verify the button leads to auth page
    await signupButton.click();
    await expect(page).toHaveURL('/auth');
  });

  test('should display main page content correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render content - check for signup button first
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible({ timeout: 10000 });
    
    // Check main heading - it's actually in an h1 element
    await expect(page.locator('text=Sydney\'s Premier Comedy Community')).toBeVisible({ timeout: 5000 });
    
    // Check that the page has key sections
    await expect(page.locator('text=Everything You Need to Succeed')).toBeVisible();
    await expect(page.locator('text=Why Choose Stand Up Sydney?')).toBeVisible();
    await expect(page.locator('text=Ready to Take the Stage?')).toBeVisible();
  });

  test('should navigate to browse shows', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find and click browse shows button
    const browseButton = page.locator('text=Browse Shows').first();
    await expect(browseButton).toBeVisible();
    await browseButton.click();
    
    // Should redirect to /shows (since /browse redirects to /shows)
    await expect(page).toHaveURL('/shows');
  });
});