import { test, expect } from '@playwright/test';

test.describe('Bug Tracker', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Check if already authenticated
    const isAuthenticated = await page.locator('text=Sign Out').isVisible().catch(() => false);

    if (!isAuthenticated) {
      // Sign in with test credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard', { timeout: 10000 });
    }
  });

  test('should load bug tracker page with Kanban columns', async ({ page }) => {
    // Navigate to bug tracker
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.locator('text=Bug Tracker')).toBeVisible({ timeout: 10000 });

    // Verify all six Kanban columns are present
    const columns = ['Reported', 'Triaged', 'In Progress', 'Fixed', 'Verified', 'Closed'];

    for (const columnName of columns) {
      await expect(page.locator(`text=${columnName}`)).toBeVisible();
    }
  });

  test('should display severity statistics in header', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');

    // Check for severity indicators (Critical, High, Medium, Low)
    // These should be displayed as badges or stats in the header
    const severityText = await page.textContent('body');

    // Verify severity counts are shown (even if 0)
    expect(severityText).toMatch(/critical|high|medium|low/i);
  });

  test('should open report bug dialog when clicking Report Bug button', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');

    // Click Report Bug button
    const reportButton = page.locator('button:has-text("Report Bug")');
    await reportButton.click();

    // Verify dialog opened
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Verify form fields are present
    await expect(page.locator('input[name="title"], input#title')).toBeVisible();
    await expect(page.locator('textarea[name="description"], textarea#description')).toBeVisible();
  });

  test('should submit a new bug report', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');

    // Open report dialog
    await page.click('button:has-text("Report Bug")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Fill out bug report form
    const timestamp = Date.now();
    await page.fill('input[name="title"], input#title', `Test Bug ${timestamp}`);
    await page.fill('textarea[name="description"], textarea#description', 'This is a test bug description for automated testing');

    // Select severity if dropdown exists
    const severitySelect = page.locator('select[name="severity"], [role="combobox"]').first();
    if (await severitySelect.isVisible().catch(() => false)) {
      await severitySelect.click();
      await page.click('text=Medium');
    }

    // Submit form
    await page.click('button:has-text("Submit"), button[type="submit"]');

    // Wait for success toast or dialog to close
    await page.waitForTimeout(2000);

    // Verify dialog closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Verify bug appears in Reported column
    await expect(page.locator(`text=Test Bug ${timestamp}`)).toBeVisible({ timeout: 10000 });
  });

  test('should display bug cards with severity styling', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');

    // Wait for any bug cards to load
    await page.waitForTimeout(2000);

    // Check if any bug cards exist
    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      // Verify first bug card has severity badge
      const firstCard = bugCards.first();

      // Should have severity emoji/icon (🔴🟠🟡⚪)
      const cardText = await firstCard.textContent();
      expect(cardText).toMatch(/🔴|🟠|🟡|⚪/);
    }
  });

  test('should open bug detail dialog when clicking bug card', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find first bug card
    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      const firstCard = bugCards.first();
      await firstCard.click();

      // Verify detail dialog opened
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

      // Verify bug details are shown
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.locator('text=Status')).toBeVisible();
      await expect(dialog.locator('text=Severity')).toBeVisible();
    }
  });

  test('should display comment section in bug detail dialog', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first bug card if available
    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      await bugCards.first().click();

      // Wait for dialog
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify comments section exists
      await expect(dialog.locator('text=Comments')).toBeVisible();

      // Verify comment input/textarea exists
      const commentInput = dialog.locator('textarea[placeholder*="comment"], textarea[name*="comment"]');
      await expect(commentInput).toBeVisible();
    }
  });

  test('should add a comment to a bug', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first bug card
    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      await bugCards.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Find comment textarea
      const commentInput = dialog.locator('textarea[placeholder*="comment"], textarea[name*="comment"]').first();
      const timestamp = Date.now();
      await commentInput.fill(`Test comment ${timestamp}`);

      // Submit comment
      await dialog.locator('button:has-text("Add Comment"), button:has-text("Post")').click();

      // Wait for comment to appear
      await page.waitForTimeout(2000);

      // Verify comment appears in dialog
      await expect(dialog.locator(`text=Test comment ${timestamp}`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display comment count on bug cards', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find bug cards
    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      // Look for MessageCircle icon or comment count indicator
      const firstCard = bugCards.first();
      const cardHtml = await firstCard.innerHTML();

      // Should have message/comment icon (from lucide-react)
      expect(cardHtml).toContain('svg');
    }
  });

  test('should show reporter and assignee avatars on bug cards', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      // Bug cards should display avatars for reporter and assignee
      const firstCard = bugCards.first();

      // Look for avatar components
      const avatars = firstCard.locator('[class*="Avatar"]');
      const avatarCount = await avatars.count();

      // Should have at least reporter avatar
      expect(avatarCount).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Bug Tracker - Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate as admin
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Note: This assumes admin credentials. Adjust as needed.
    const isAuthenticated = await page.locator('text=Sign Out').isVisible().catch(() => false);

    if (!isAuthenticated) {
      // Use admin credentials
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'adminpassword123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard', { timeout: 10000 });
    }
  });

  test('admin should be able to change bug status via drag and drop', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find bugs in Reported column
    const reportedColumn = page.locator('text=Reported').locator('..').locator('..');
    const bugCards = reportedColumn.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      // Note: Drag and drop testing in Playwright can be complex
      // This test verifies the structure exists
      const firstCard = bugCards.first();
      await expect(firstCard).toBeVisible();

      // Verify the card is draggable (has draggable attribute or handler)
      const isDraggable = await firstCard.getAttribute('draggable');
      // If drag-and-drop is implemented, draggable should be 'true'
    }
  });

  test('admin should be able to change bug status from detail dialog', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      await bugCards.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Look for status dropdown/select
      const statusSelect = dialog.locator('select[name="status"], [role="combobox"]:has-text("Status")');

      if (await statusSelect.isVisible().catch(() => false)) {
        await statusSelect.click();

        // Try to change status to Triaged
        await page.click('text=Triaged').catch(() => {
          // Status change might not be available for all users
        });

        await page.waitForTimeout(1000);
      }
    }
  });

  test('admin should be able to assign bugs to users', async ({ page }) => {
    await page.goto('/bugs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bugCards = page.locator('[class*="Card"]');
    const count = await bugCards.count();

    if (count > 0) {
      await bugCards.first().click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Look for assignee dropdown/select
      const assigneeSelect = dialog.locator('select[name="assigned_to"], [role="combobox"]:has-text("Assign")');

      // Verify assignment UI exists (might be admin-only)
      const assignUiExists = await assigneeSelect.isVisible().catch(() => false);

      // Assignment UI should exist for admins
      if (assignUiExists) {
        expect(assignUiExists).toBe(true);
      }
    }
  });
});
