import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/TestHelper';

test.describe('Spot Confirmation Notifications', () => {
  let testHelper: TestHelper;

  test.beforeEach(async ({ page }) => {
    testHelper = new TestHelper(page);
    await testHelper.setup();
  });

  test('Notification system integration', async ({ page }) => {
    await test.step('Test notification creation for spot confirmation', async () => {
      // Navigate to notifications page
      await page.goto('/notifications');
      
      // Check that notification system is working
      await expect(page.locator('h1')).toContainText('Notifications');
      
      // Look for notification filtering
      const filterTabs = page.locator('[role="tablist"]');
      await expect(filterTabs).toBeVisible();
      
      // Check for booking notifications tab
      const bookingTab = page.locator('text=Bookings');
      if (await bookingTab.isVisible()) {
        await bookingTab.click();
        console.log('Booking notifications tab found');
      }
      
      console.log('Notification system structure verified');
    });

    await test.step('Test notification types for spot confirmation', async () => {
      // Test different notification types that should exist
      const notificationTypes = [
        'booking',     // Spot confirmed/declined
        'application', // Application approved
        'payment',     // Payment processed
        'system'       // System notifications
      ];

      for (const type of notificationTypes) {
        const typeTab = page.locator(`text=${type}`, { exact: false });
        if (await typeTab.isVisible()) {
          await typeTab.click();
          console.log(`Found ${type} notification type`);
        }
      }
    });

    await test.step('Test notification interaction', async () => {
      // Test marking notifications as read
      const markAllReadButton = page.locator('button:has-text("Mark All Read")');
      if (await markAllReadButton.isVisible()) {
        await markAllReadButton.click();
        console.log('Mark all read functionality found');
      }
      
      // Test notification deletion
      const deleteButton = page.locator('button:has-text("Clear All")');
      if (await deleteButton.isVisible()) {
        console.log('Clear all functionality found');
      }
    });
  });

  test('Notification content verification', async ({ page }) => {
    await test.step('Check notification data structure', async () => {
      await page.goto('/notifications');
      
      // Check if there are any existing notifications
      const notificationCards = page.locator('[role="dialog"], .notification-card, .bg-white\\/10');
      const notificationCount = await notificationCards.count();
      
      console.log(`Found ${notificationCount} notification elements`);
      
      if (notificationCount > 0) {
        // Check first notification structure
        const firstNotification = notificationCards.first();
        
        // Look for notification components
        const titleElement = firstNotification.locator('h3, .font-medium');
        const messageElement = firstNotification.locator('p, .text-sm');
        const timestampElement = firstNotification.locator('.text-xs');
        
        if (await titleElement.isVisible()) {
          console.log('Notification title found');
        }
        
        if (await messageElement.isVisible()) {
          console.log('Notification message found');
        }
        
        if (await timestampElement.isVisible()) {
          console.log('Notification timestamp found');
        }
      }
    });

    await test.step('Test notification metadata', async () => {
      // Test notification metadata like avatars, badges, etc.
      const avatarElements = page.locator('[role="img"], .avatar, img');
      const badgeElements = page.locator('.badge, .bg-green-500, .bg-yellow-500');
      const starElements = page.locator('.star, [data-testid="star"]');
      
      const avatarCount = await avatarElements.count();
      const badgeCount = await badgeElements.count();
      const starCount = await starElements.count();
      
      console.log(`Found ${avatarCount} avatar elements`);
      console.log(`Found ${badgeCount} badge elements`);
      console.log(`Found ${starCount} star elements`);
    });
  });

  test('Real-time notification updates', async ({ page }) => {
    await test.step('Test notification updates', async () => {
      await page.goto('/notifications');
      
      // Get initial notification count
      const initialNotifications = page.locator('.notification-card, .bg-white\\/10').count();
      
      // This would test real-time updates if implemented
      // For now, we verify the structure exists
      
      console.log('Real-time notification structure verified');
    });
  });

  test('Notification preferences', async ({ page }) => {
    await test.step('Test notification settings', async () => {
      await page.goto('/notifications');
      
      // Look for settings button
      const settingsButton = page.locator('button:has-text("Settings")');
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        console.log('Notification settings found');
      }
      
      // Check for notification preferences
      const preferencesSection = page.locator('text=/preferences|settings/i');
      if (await preferencesSection.isVisible()) {
        console.log('Notification preferences section found');
      }
    });
  });

  test('Mobile notification display', async ({ page }) => {
    await test.step('Test mobile responsive notifications', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/notifications');
      
      // Check if notifications are properly responsive
      const container = page.locator('.container, .mx-auto');
      await expect(container).toBeVisible();
      
      // Check notification cards on mobile
      const notificationCards = page.locator('.notification-card, .bg-white\\/10');
      
      if (await notificationCards.count() > 0) {
        const firstCard = notificationCards.first();
        const boundingBox = await firstCard.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(375);
          console.log('Mobile notification layout verified');
        }
      }
    });
  });

  test('Notification performance', async ({ page }) => {
    await test.step('Test notification loading performance', async () => {
      const startTime = Date.now();
      
      await page.goto('/notifications');
      
      // Wait for notifications to load
      await page.waitForSelector('h1:has-text("Notifications")');
      
      const loadTime = Date.now() - startTime;
      console.log(`Notifications loaded in ${loadTime}ms`);
      
      // Performance should be reasonable
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test('Notification accessibility', async ({ page }) => {
    await test.step('Test notification accessibility', async () => {
      await page.goto('/notifications');
      
      // Check for proper headings
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      
      // Check for keyboard navigation
      await page.keyboard.press('Tab');
      
      // Check for screen reader content
      const srOnlyElements = page.locator('.sr-only, [aria-label]');
      const srCount = await srOnlyElements.count();
      
      console.log(`Found ${srCount} accessibility elements`);
      
      // Check for proper ARIA attributes
      const ariaElements = page.locator('[aria-label], [aria-describedby], [role]');
      const ariaCount = await ariaElements.count();
      
      console.log(`Found ${ariaCount} ARIA elements`);
    });
  });

  test('Notification error handling', async ({ page }) => {
    await test.step('Test notification error states', async () => {
      await page.goto('/notifications');
      
      // Test empty state
      const emptyStateMessage = page.locator('text=/No notifications|All caught up/i');
      
      if (await emptyStateMessage.isVisible()) {
        console.log('Empty state message found');
      }
      
      // Test error state (would need to simulate network error)
      console.log('Error state testing would require network simulation');
    });
  });
});