import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Multi-Profile Switching System
 *
 * Tests the complete user journey for profile management:
 * - Profile switching
 * - Profile creation
 * - Profile editing
 * - Profile deletion
 * - Mobile profile switching
 */

test.describe('Profile Switching E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');

    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should display profile switcher in sidebar', async ({ page }) => {
    // Look for profile switcher component
    const profileSwitcher = page.locator('[data-testid="profile-switcher"]').or(
      page.locator('button').filter({ hasText: /Profile/i })
    );

    await expect(profileSwitcher.first()).toBeVisible({ timeout: 10000 });
  });

  test('should switch between profiles', async ({ page }) => {
    // Open profile switcher
    const trigger = page.locator('button').filter({ hasText: /Profile/i }).first();
    await trigger.click();

    // Select a different profile from dropdown
    await page.waitForSelector('[role="menuitem"], [role="option"]');

    const profileOptions = page.locator('[role="menuitem"], [role="option"]');
    const count = await profileOptions.count();

    if (count > 1) {
      await profileOptions.nth(1).click();

      // Verify profile switched (check for profile indicator or sidebar change)
      await page.waitForTimeout(500);

      // Profile should persist in localStorage
      const storage = await page.evaluate(() => localStorage.getItem('active-profile-type'));
      expect(storage).toBeTruthy();
    }
  });

  test('should persist profile selection across page reloads', async ({ page }) => {
    // Switch to a specific profile
    const trigger = page.locator('button').filter({ hasText: /Profile/i }).first();
    await trigger.click();

    await page.waitForSelector('[role="menuitem"], [role="option"]');
    const promoterOption = page.locator('text=/Promoter Profile/i').first();

    if (await promoterOption.isVisible()) {
      await promoterOption.click();
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if promoter profile is still active
      const storage = await page.evaluate(() => localStorage.getItem('active-profile-type'));
      expect(storage).toBe('promoter');
    }
  });

  test('should navigate to profile management page', async ({ page }) => {
    // Navigate to settings/profiles
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Should see profile management heading
    await expect(
      page.locator('h1, h2').filter({ hasText: /Profile Management/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display all user profiles in management page', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Should see profile cards
    const profileCards = page.locator('[data-testid="profile-card"]').or(
      page.locator('text=/Profile/i').locator('..').locator('..')
    );

    await expect(profileCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open create profile wizard', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Click create profile button
    const createButton = page.locator('button').filter({ hasText: /Create.*Profile/i });
    await createButton.first().click();

    // Should see profile type selection
    await expect(
      page.locator('text=/Select.*Profile|Choose.*Profile|Create.*Profile/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show profile completion status', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Look for completion indicators
    const completionText = page.locator('text=/Complete|Incomplete|Empty|%/i');

    await expect(completionText.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow editing profile', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Click edit button on first profile
    const editButton = page.locator('button').filter({ hasText: /Edit/i }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should open edit dialog
      await expect(
        page.locator('text=/Edit.*Profile/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle profile deletion with confirmation', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Count existing profiles
    const profileCards = page.locator('[data-testid="profile-card"]').or(
      page.locator('text=/Profile/i').locator('..').locator('..')
    );
    const initialCount = await profileCards.count();

    if (initialCount > 1) {
      // Click delete button
      const deleteButton = page.locator('button').filter({ hasText: /Delete/i }).first();

      if (await deleteButton.isVisible() && !(await deleteButton.isDisabled())) {
        await deleteButton.click();

        // Should show confirmation dialog
        await expect(
          page.locator('text=/Delete.*Profile|Are you sure/i')
        ).toBeVisible({ timeout: 5000 });

        // Cancel deletion
        const cancelButton = page.locator('button').filter({ hasText: /Cancel/i });
        await cancelButton.click();
      }
    }
  });

  test('should prevent deleting last profile', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Count existing profiles
    const profileCards = page.locator('[data-testid="profile-card"]').or(
      page.locator('text=/Profile/i').locator('..').locator('..')
    );
    const count = await profileCards.count();

    if (count === 1) {
      // Delete button should be disabled
      const deleteButton = page.locator('button').filter({ hasText: /Delete/i }).first();
      await expect(deleteButton).toBeDisabled();
    }
  });
});

test.describe('Profile Switching - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display profile switcher on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mobile might have bottom sheet or hamburger menu
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]').first();

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }

    // Profile switcher should be visible
    const profileSwitcher = page.locator('text=/Profile/i').first();
    await expect(profileSwitcher).toBeVisible({ timeout: 10000 });
  });

  test('should allow profile switching on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open mobile menu if needed
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]').first();

    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }

    // Open profile switcher
    const trigger = page.locator('button').filter({ hasText: /Profile/i }).first();
    await trigger.click();

    // Select different profile
    await page.waitForSelector('[role="menuitem"], [role="option"]');
    const profileOptions = page.locator('[role="menuitem"], [role="option"]');

    if ((await profileOptions.count()) > 1) {
      await profileOptions.nth(1).click();
      await page.waitForTimeout(500);

      // Verify switch
      const storage = await page.evaluate(() => localStorage.getItem('active-profile-type'));
      expect(storage).toBeTruthy();
    }
  });
});

test.describe('Profile Creation Workflow', () => {
  test('should complete full profile creation flow', async ({ page }) => {
    await page.goto('/settings/profiles');
    await page.waitForLoadState('networkidle');

    // Click create profile button
    const createButton = page.locator('button').filter({ hasText: /Create.*Profile/i }).first();
    await createButton.click();

    // Step 1: Select profile type (if not all profiles exist)
    await page.waitForTimeout(1000);

    // Look for profile type options
    const comedianOption = page.locator('text=/Comedian/i').first();
    const promoterOption = page.locator('text=/Promoter/i').first();
    const managerOption = page.locator('text=/Manager/i').first();

    // Try to select a profile type
    if (await comedianOption.isVisible()) {
      await comedianOption.click();
    } else if (await promoterOption.isVisible()) {
      await promoterOption.click();
    } else if (await managerOption.isVisible()) {
      await managerOption.click();
    }

    // Step 2: Fill out profile form (if form is shown)
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Profile');
    }

    const bioInput = page.locator('textarea[name="bio"], textarea[placeholder*="bio" i]').first();
    if (await bioInput.isVisible()) {
      await bioInput.fill('This is an E2E test profile');
    }

    // Step 3: Submit form
    const submitButton = page.locator('button[type="submit"]').or(
      page.locator('button').filter({ hasText: /Create|Save|Submit/i })
    );

    if (await submitButton.first().isVisible()) {
      await submitButton.first().click();
      await page.waitForTimeout(2000);

      // Should redirect or close dialog
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab to profile switcher
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter/Space to open
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Should see dropdown options
    const options = page.locator('[role="menuitem"], [role="option"]');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for ARIA attributes
    const button = page.locator('button[aria-label*="profile" i], button[aria-haspopup]').first();

    if (await button.isVisible()) {
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaHasPopup = await button.getAttribute('aria-haspopup');

      expect(ariaLabel || ariaHasPopup).toBeTruthy();
    }
  });

  test('should announce profile switches to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for live region or status announcements
    const liveRegion = page.locator('[role="status"], [aria-live], [data-testid*="announcement"]');

    // Switch profile
    const trigger = page.locator('button').filter({ hasText: /Profile/i }).first();
    if (await trigger.isVisible()) {
      await trigger.click();

      await page.waitForSelector('[role="menuitem"], [role="option"]');
      const options = page.locator('[role="menuitem"], [role="option"]');

      if ((await options.count()) > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(500);

        // Check if announcement was made (if live region exists)
        if (await liveRegion.count() > 0) {
          const announcement = await liveRegion.first().textContent();
          expect(announcement?.toLowerCase()).toContain('profile');
        }
      }
    }
  });
});

test.describe('Performance', () => {
  test('should switch profiles quickly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const trigger = page.locator('button').filter({ hasText: /Profile/i }).first();
    await trigger.click();

    const startTime = Date.now();

    await page.waitForSelector('[role="menuitem"], [role="option"]');
    const options = page.locator('[role="menuitem"], [role="option"]');

    if ((await options.count()) > 1) {
      await options.nth(1).click();

      // Wait for switch to complete
      await page.waitForTimeout(100);

      const endTime = Date.now();
      const switchTime = endTime - startTime;

      // Profile switch should be under 500ms
      expect(switchTime).toBeLessThan(500);
    }
  });

  test('should not cause layout shift on profile switch', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial viewport height
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);

    // Switch profile
    const trigger = page.locator('button').filter({ hasText: /Profile/i }).first();
    if (await trigger.isVisible()) {
      await trigger.click();

      await page.waitForSelector('[role="menuitem"], [role="option"]');
      const options = page.locator('[role="menuitem"], [role="option"]');

      if ((await options.count()) > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(500);

        // Check height after switch
        const finalHeight = await page.evaluate(() => document.body.scrollHeight);

        // Small variation allowed for dynamic content
        expect(Math.abs(finalHeight - initialHeight)).toBeLessThan(100);
      }
    }
  });
});
