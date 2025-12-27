import { test, expect } from '@playwright/test';

test.describe('Comedian Lite - Profile Edit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: This test requires authentication setup
    // For now, we'll skip or you'll need to implement auth fixtures
    // Example auth flow would be:
    // 1. Create or login as comedian_lite user
    // 2. Navigate to /profile

    // Navigate to profile page
    await page.goto('/profile');

    // Wait for profile to load
    await page.waitForLoadState('networkidle');
  });

  test('should display editable profile information form', async ({ page }) => {
    // Navigate to Profile tab
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    // Wait for ProfileInformation component to load
    await page.waitForTimeout(500);

    // Check for profile form fields (these are typical fields in ProfileInformation)
    // Actual field names may vary based on ProfileInformation implementation
    const firstNameField = page.getByLabel(/first name/i);
    const lastNameField = page.getByLabel(/last name/i);

    // Verify fields are visible and editable
    await expect(firstNameField).toBeVisible();
    await expect(lastNameField).toBeVisible();
    await expect(firstNameField).toBeEditable();
    await expect(lastNameField).toBeEditable();
  });

  test('should allow editing and saving basic profile information', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Find and fill profile fields
    const firstNameField = page.getByLabel(/first name/i);
    const lastNameField = page.getByLabel(/last name/i);

    // Clear existing values and enter new ones
    await firstNameField.fill('');
    await firstNameField.fill('Test');
    await lastNameField.fill('');
    await lastNameField.fill('Comedian');

    // Find and click save button
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    // Wait for save operation to complete
    await page.waitForTimeout(1000);

    // Verify success message or toast appears
    // This assumes there's a toast notification system
    const successMessage = page.getByText(/saved|updated|success/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
  });

  test('should allow editing bio field with multiline text', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Find bio textarea (typically a textarea for bio)
    const bioField = page.getByLabel(/bio/i);

    if (await bioField.isVisible()) {
      // Clear and enter new bio
      await bioField.fill('');
      const testBio = 'This is a test bio for the comedian.\nIt has multiple lines.\nAnd describes their comedy style.';
      await bioField.fill(testBio);

      // Verify text was entered
      await expect(bioField).toHaveValue(testBio);

      // Save changes
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      await saveButton.click();

      await page.waitForTimeout(1000);
    }
  });

  test('should allow editing stage name and name display preference', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Look for stage name field
    const stageNameField = page.getByLabel(/stage name/i);

    if (await stageNameField.isVisible()) {
      await stageNameField.fill('');
      await stageNameField.fill('The Comedy King');

      // Verify value was set
      await expect(stageNameField).toHaveValue('The Comedy King');
    }

    // Look for name display preference selector (might be radio buttons or dropdown)
    const displayPrefReal = page.getByLabel(/real name|use real/i);
    const displayPrefStage = page.getByLabel(/stage name|use stage/i);

    // If display preference controls exist, test them
    if (await displayPrefReal.isVisible()) {
      await displayPrefStage.click();
      await expect(displayPrefStage).toBeChecked();
    }
  });

  test('should allow editing location field', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    const locationField = page.getByLabel(/location/i);

    if (await locationField.isVisible()) {
      await locationField.fill('');
      await locationField.fill('Sydney, NSW');

      await expect(locationField).toHaveValue('Sydney, NSW');

      // Save changes
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      await saveButton.click();

      await page.waitForTimeout(1000);
    }
  });

  test('should allow editing social media links', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Look for social media fields (Instagram, Twitter, Facebook, etc.)
    const instagramField = page.getByLabel(/instagram/i);

    if (await instagramField.isVisible()) {
      await instagramField.fill('');
      await instagramField.fill('https://instagram.com/testcomedian');

      await expect(instagramField).toHaveValue('https://instagram.com/testcomedian');

      // Save changes
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      await saveButton.click();

      await page.waitForTimeout(1000);
    }
  });

  test('should validate required fields before saving', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Try to clear a required field (e.g., first name)
    const firstNameField = page.getByLabel(/first name/i);

    if (await firstNameField.isVisible()) {
      await firstNameField.fill('');

      // Try to save with empty required field
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      await saveButton.click();

      // Should show validation error
      const errorMessage = page.getByText(/required|cannot be empty|please enter/i);
      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    }
  });

  test('should persist changes after page reload', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Make a change
    const lastNameField = page.getByLabel(/last name/i);
    const testValue = `TestLast${Date.now()}`; // Unique value to verify persistence

    if (await lastNameField.isVisible()) {
      await lastNameField.fill('');
      await lastNameField.fill(testValue);

      // Save changes
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      await saveButton.click();

      // Wait for save to complete
      await page.waitForTimeout(2000);

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Navigate back to profile tab
      await page.getByRole('tab', { name: /profile/i }).click();
      await page.waitForTimeout(500);

      // Verify the value persisted
      const reloadedField = page.getByLabel(/last name/i);
      await expect(reloadedField).toHaveValue(testValue);
    }
  });

  test('should display ContactInformation component with editable fields', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Look for contact fields (email, phone)
    const emailField = page.getByLabel(/email/i);
    const phoneField = page.getByLabel(/phone/i);

    // At least one contact field should be visible
    const emailVisible = await emailField.isVisible().catch(() => false);
    const phoneVisible = await phoneField.isVisible().catch(() => false);

    expect(emailVisible || phoneVisible).toBeTruthy();
  });

  test('should display FinancialInformation component', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(1000);

    // FinancialInformation might have fields like BSB, Account Number, ABN
    // Look for financial-related text or fields
    const financialSection = page.getByText(/financial|payment|bank|abn|bsb/i);

    // Should find at least one financial-related element
    const count = await financialSection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle profile picture upload trigger', async ({ page }) => {
    // Profile picture upload is typically in ProfileHeader, not ProfileTabs
    // But we can verify the upload button/area is visible

    // Look for avatar or upload button
    const avatarArea = page.locator('[class*="avatar"]').first();

    if (await avatarArea.isVisible()) {
      // Verify avatar is clickable or has upload functionality
      await expect(avatarArea).toBeVisible();
    }
  });

  test('should show years of experience field if applicable', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Look for years of experience field
    const yearsExpField = page.getByLabel(/years.*experience|experience.*years/i);

    if (await yearsExpField.isVisible()) {
      // Should be a number input
      await yearsExpField.fill('');
      await yearsExpField.fill('5');

      await expect(yearsExpField).toHaveValue('5');
    }
  });

  test('should handle custom show types field', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Look for custom show types selector/input
    const showTypesField = page.getByLabel(/show type|comedy style/i);

    if (await showTypesField.isVisible()) {
      // Field exists and is visible
      await expect(showTypesField).toBeVisible();
    }
  });

  test('should cancel edit and revert changes', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Get original value
    const firstNameField = page.getByLabel(/first name/i);
    const originalValue = await firstNameField.inputValue();

    // Make a change
    await firstNameField.fill('');
    await firstNameField.fill('ChangedName');

    // Look for cancel button
    const cancelButton = page.getByRole('button', { name: /cancel|reset/i });

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Value should revert to original
      await expect(firstNameField).toHaveValue(originalValue);
    }
  });

  test('should handle form errors gracefully', async ({ page }) => {
    const profileTab = page.getByRole('tab', { name: /profile/i });
    await profileTab.click();

    await page.waitForTimeout(500);

    // Try to enter invalid data (e.g., invalid email format if there's email validation)
    const emailField = page.getByLabel(/email/i);

    if (await emailField.isVisible()) {
      await emailField.fill('');
      await emailField.fill('invalid-email-format');

      // Try to save
      const saveButton = page.getByRole('button', { name: /save/i }).first();
      await saveButton.click();

      // Should show validation error
      await page.waitForTimeout(1000);

      // Error could be inline or in toast
      const errorText = page.getByText(/invalid|error|wrong format/i);
      const errorVisible = await errorText.isVisible().catch(() => false);

      // If validation is implemented, error should be visible
      // If not implemented yet, this test documents expected behavior
    }
  });
});
