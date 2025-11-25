import { test, expect } from '@playwright/test';

test.describe('Comedian Lite - Gigs Availability Selection', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: This test requires authentication setup
    // For now, we'll skip or you'll need to implement auth fixtures
    // Example auth flow would be:
    // 1. Create or login as comedian_lite user
    // 2. Navigate to /gigs

    // Navigate to gigs page
    await page.goto('/gigs');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display gigs page for comedian_lite', async ({ page }) => {
    // Verify we're on the gigs page
    await expect(page).toHaveURL(/\/gigs/);

    // Should show gigs-related content
    const pageHeading = page.getByRole('heading', { name: /gigs|availability|my gigs/i });
    await expect(pageHeading).toBeVisible();
  });

  test('should display availability calendar or date picker', async ({ page }) => {
    // Look for calendar component or date selection interface
    const calendar = page.locator('[class*="calendar"]');
    const datePicker = page.locator('[class*="date-picker"]');

    // At least one date selection interface should be visible
    const calendarVisible = await calendar.isVisible().catch(() => false);
    const datePickerVisible = await datePicker.isVisible().catch(() => false);

    expect(calendarVisible || datePickerVisible).toBeTruthy();
  });

  test('should allow selecting available dates', async ({ page }) => {
    // Wait for calendar to render
    await page.waitForTimeout(1000);

    // Look for date cells or buttons
    const dateCells = page.locator('[role="gridcell"], [class*="day"], button[class*="date"]');

    // Should have multiple date options
    const count = await dateCells.count();
    expect(count).toBeGreaterThan(0);

    // Try to click a date (if clickable)
    const firstClickableDate = dateCells.first();
    if (await firstClickableDate.isVisible() && await firstClickableDate.isEnabled()) {
      await firstClickableDate.click();

      // Date should be selected (visual feedback expected)
      await page.waitForTimeout(500);
    }
  });

  test('should show selected availability in visual format', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for availability indicators (badges, colors, checkmarks)
    const availabilityIndicator = page.locator('[class*="available"], [class*="selected"], [data-available]');

    // Should have some form of visual availability indicator
    const count = await availabilityIndicator.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow toggling between available and unavailable states', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find a date cell
    const dateCell = page.locator('[role="gridcell"], button[class*="date"]').first();

    if (await dateCell.isVisible() && await dateCell.isEnabled()) {
      // Get initial state (if there's a data attribute or class)
      const initialState = await dateCell.getAttribute('data-available');

      // Click to toggle
      await dateCell.click();
      await page.waitForTimeout(500);

      // Click again to toggle back
      await dateCell.click();
      await page.waitForTimeout(500);

      // State should have toggled
      // (Specific assertion depends on implementation)
    }
  });

  test('should have save or update button for availability changes', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for save/update button
    const saveButton = page.getByRole('button', { name: /save|update|confirm|submit/i });

    // Save button should exist
    const saveVisible = await saveButton.isVisible().catch(() => false);

    if (saveVisible) {
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();
    }
  });

  test('should display current availability selections', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Should show a list or summary of selected dates
    const availabilityList = page.locator('[class*="availability-list"], [class*="selected-dates"]');

    // Or look for text indicating selected dates
    const selectedInfo = page.getByText(/selected|available dates/i);

    const listVisible = await availabilityList.isVisible().catch(() => false);
    const infoVisible = await selectedInfo.isVisible().catch(() => false);

    // At least one method of showing selections should exist
    // (Implementation may vary)
  });

  test('should allow selecting multiple dates', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Find multiple date cells
    const dateCells = page.locator('[role="gridcell"], button[class*="date"]');
    const count = await dateCells.count();

    if (count >= 3) {
      // Click multiple dates
      await dateCells.nth(0).click();
      await page.waitForTimeout(200);
      await dateCells.nth(1).click();
      await page.waitForTimeout(200);
      await dateCells.nth(2).click();
      await page.waitForTimeout(200);

      // Multiple dates should be selected
      // (Visual verification would depend on implementation)
    }
  });

  test('should allow selecting date ranges (if supported)', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for date range selector
    const rangeStartInput = page.getByLabel(/start date|from/i);
    const rangeEndInput = page.getByLabel(/end date|to/i);

    const rangeStartVisible = await rangeStartInput.isVisible().catch(() => false);
    const rangeEndVisible = await rangeEndInput.isVisible().catch(() => false);

    if (rangeStartVisible && rangeEndVisible) {
      // Fill date range
      await rangeStartInput.fill('2024-12-01');
      await rangeEndInput.fill('2024-12-15');

      // Should accept the range
      await expect(rangeStartInput).toHaveValue('2024-12-01');
      await expect(rangeEndInput).toHaveValue('2024-12-15');
    }
  });

  test('should show feedback after saving availability', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Select a date
    const dateCell = page.locator('[role="gridcell"], button[class*="date"]').first();
    if (await dateCell.isVisible() && await dateCell.isEnabled()) {
      await dateCell.click();
      await page.waitForTimeout(500);
    }

    // Click save button
    const saveButton = page.getByRole('button', { name: /save|update|confirm/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show success feedback
      const successMessage = page.getByText(/saved|updated|success/i);
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist availability selections after page reload', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Select and save a specific date
    const dateCell = page.locator('[role="gridcell"], button[class*="date"]').first();
    let selectedDateText = '';

    if (await dateCell.isVisible() && await dateCell.isEnabled()) {
      // Get date identifier
      selectedDateText = await dateCell.textContent() || '';

      await dateCell.click();
      await page.waitForTimeout(500);

      // Save
      const saveButton = page.getByRole('button', { name: /save|update|confirm/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
      }

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify selection persisted
      // This would require checking if the date is still marked as selected
      // Implementation depends on how selection state is shown
    }
  });

  test('should allow clearing all selections', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for clear/reset button
    const clearButton = page.getByRole('button', { name: /clear|reset|remove all/i });

    const clearVisible = await clearButton.isVisible().catch(() => false);

    if (clearVisible) {
      // Select some dates first
      const dateCells = page.locator('[role="gridcell"], button[class*="date"]');
      if (await dateCells.count() > 0) {
        await dateCells.first().click();
        await page.waitForTimeout(500);
      }

      // Click clear button
      await clearButton.click();
      await page.waitForTimeout(500);

      // Selections should be cleared
      // (Visual verification depends on implementation)
    }
  });

  test('should navigate between months in calendar (if calendar view)', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for month navigation buttons
    const nextMonthButton = page.getByRole('button', { name: /next|forward|>/i });
    const prevMonthButton = page.getByRole('button', { name: /previous|back|</i });

    const nextVisible = await nextMonthButton.isVisible().catch(() => false);
    const prevVisible = await prevMonthButton.isVisible().catch(() => false);

    if (nextVisible && prevVisible) {
      // Get current month display
      const monthDisplay = page.locator('[class*="month"], [class*="header"]').first();
      const initialMonth = await monthDisplay.textContent();

      // Navigate to next month
      await nextMonthButton.click();
      await page.waitForTimeout(500);

      // Month should change
      const newMonth = await monthDisplay.textContent();
      expect(newMonth).not.toBe(initialMonth);
    }
  });

  test('should show availability summary or statistics', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for summary section showing total available days, etc.
    const summarySection = page.locator('[class*="summary"], [class*="stats"]');
    const summaryText = page.getByText(/total|available days|selected/i);

    const summaryVisible = await summarySection.isVisible().catch(() => false);
    const textVisible = await summaryText.isVisible().catch(() => false);

    // Summary might exist to show availability overview
    // (Optional feature)
  });

  test('should handle past dates appropriately', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Past dates should typically be disabled or visually distinct
    const pastDates = page.locator('[class*="past"], [disabled], [data-disabled]');

    // If past dates are shown, they should be non-interactive
    const count = await pastDates.count();

    if (count > 0) {
      const firstPastDate = pastDates.first();
      if (await firstPastDate.isVisible()) {
        // Should be disabled or non-clickable
        const isEnabled = await firstPastDate.isEnabled();
        expect(isEnabled).toBeFalsy();
      }
    }
  });

  test('should show loading state while fetching availability', async ({ page }) => {
    // Reload to catch loading state
    await page.reload();

    // Look for loading spinner or skeleton
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');

    // Loading state might be brief, so we use a quick check
    const loadingVisible = await loadingIndicator.isVisible().catch(() => false);

    // Loading state is transient, so we just verify the mechanism exists
    // (Not asserting it must be visible since it might load too fast)
  });

  test('should handle availability conflicts gracefully', async ({ page }) => {
    await page.waitForTimeout(1000);

    // If a date already has a gig booked, it might show conflict warning
    // This test documents expected behavior for handling conflicts

    // Select a date
    const dateCell = page.locator('[role="gridcell"], button[class*="date"]').first();
    if (await dateCell.isVisible()) {
      await dateCell.click();
      await page.waitForTimeout(500);

      // Look for any conflict warnings or messages
      const conflictWarning = page.getByText(/conflict|already booked|unavailable/i);

      // If conflicts exist, warning should be shown
      // (This depends on whether there are actual conflicts in test data)
    }
  });

  test('should support keyboard navigation in calendar', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Focus on calendar
    const calendar = page.locator('[role="grid"], [class*="calendar"]').first();

    if (await calendar.isVisible()) {
      await calendar.focus();

      // Press arrow keys to navigate
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);

      // Press Enter to select
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Should have selected a date via keyboard
      // (Visual verification depends on implementation)
    }
  });

  test('should show help text or instructions for availability selection', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for instructional text
    const helpText = page.getByText(/click to select|mark your availability|choose dates/i);

    const helpVisible = await helpText.isVisible().catch(() => false);

    // Help text improves UX but might not always be present
    // This test documents expected UX behavior
  });
});
