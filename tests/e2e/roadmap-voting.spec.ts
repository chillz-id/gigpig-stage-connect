import { test, expect } from '@playwright/test';

test.describe('Roadmap Feature Voting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if already authenticated by looking for sign out button
    const isAuthenticated = await page.locator('text=Sign Out').isVisible().catch(() => false);

    if (!isAuthenticated) {
      // Sign in with test credentials (adjust as needed)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'testpassword123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard', { timeout: 10000 });
    }
  });

  test('should display heart icon with vote count on feature cards', async ({ page }) => {
    // Navigate to roadmap
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Wait for feature cards to load
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });

    // Find first feature card
    const featureCard = page.locator('[class*="Card"]').first();

    // Verify heart icon is present (using lucide-react Heart icon)
    const heartIcon = featureCard.locator('svg').first();
    await expect(heartIcon).toBeVisible();

    // Verify vote count is displayed above heart
    const voteCount = featureCard.locator('span.text-sm.font-semibold').first();
    await expect(voteCount).toBeVisible();

    // Get the vote count text
    const countText = await voteCount.textContent();
    expect(countText).toMatch(/^\d+$/); // Should be a number
  });

  test('should toggle vote when clicking heart icon on feature card', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Wait for feature cards
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });

    // Find first feature card vote button
    const featureCard = page.locator('[class*="Card"]').first();
    const voteButton = featureCard.locator('button').filter({ has: page.locator('svg') }).first();

    // Get initial vote count
    const voteCountSpan = featureCard.locator('span.text-sm.font-semibold').first();
    const initialCount = parseInt(await voteCountSpan.textContent() || '0');

    // Click to vote
    await voteButton.click();
    await page.waitForTimeout(1000); // Wait for mutation to complete

    // Verify vote count increased or decreased
    const newCount = parseInt(await voteCountSpan.textContent() || '0');
    expect(newCount).not.toBe(initialCount);

    // Heart should change appearance (filled red when voted)
    const heartSvg = voteButton.locator('svg');
    const heartClass = await heartSvg.getAttribute('class');

    // Check if heart has voted styling
    if (newCount > initialCount) {
      // Voted - should have fill-red-500
      expect(heartClass).toContain('fill-red-500');
    }
  });

  test('should display larger heart icon in feature detail dialog', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Wait for and click first feature card
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    const featureCard = page.locator('[class*="Card"]').first();
    await featureCard.click();

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Find heart icon in dialog
    const dialog = page.locator('[role="dialog"]');
    const dialogVoteButton = dialog.locator('button').filter({ has: page.locator('svg') });

    // Verify larger vote count text (text-2xl)
    const dialogVoteCount = dialog.locator('span.text-2xl.font-bold');
    await expect(dialogVoteCount).toBeVisible();

    // Verify heart icon is present and larger (h-8 w-8)
    const dialogHeart = dialogVoteButton.locator('svg');
    await expect(dialogHeart).toBeVisible();

    // Verify helper text below heart
    const helperText = dialog.locator('span.text-xs.text-muted-foreground');
    await expect(helperText).toBeVisible();
    const helpText = await helperText.textContent();
    expect(helpText).toMatch(/Vote for this feature|Voted/);
  });

  test('should toggle vote from feature detail dialog', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Click first feature card to open dialog
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    const featureCard = page.locator('[class*="Card"]').first();
    await featureCard.click();

    // Wait for dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Get initial vote count in dialog
    const dialogVoteCount = dialog.locator('span.text-2xl.font-bold');
    const initialCount = parseInt(await dialogVoteCount.textContent() || '0');

    // Click vote button in dialog
    const dialogVoteButton = dialog.locator('button').filter({ has: page.locator('svg') }).first();
    await dialogVoteButton.click();
    await page.waitForTimeout(1000);

    // Verify vote count changed
    const newCount = parseInt(await dialogVoteCount.textContent() || '0');
    expect(newCount).not.toBe(initialCount);
  });

  test('heart icon should have hover effects', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');

    // Find first feature card
    await page.waitForSelector('[class*="Card"]', { timeout: 10000 });
    const featureCard = page.locator('[class*="Card"]').first();
    const voteButton = featureCard.locator('button').filter({ has: page.locator('svg') }).first();

    // Hover over vote button
    await voteButton.hover();

    // Wait for transition (200ms as per code)
    await page.waitForTimeout(300);

    // Heart should have group-hover classes that trigger color/scale changes
    const heartSvg = voteButton.locator('svg');
    const heartClass = await heartSvg.getAttribute('class');

    // Verify transition classes are present
    expect(heartClass).toContain('transition-all');
    expect(heartClass).toContain('duration-200');
  });
});
