import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

test.describe('Profile Stage Name Feature', () => {
  test('should display stage name and name display preference fields', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:8080');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Navigate to login
    await page.click('text=Sign In');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to profile
    await page.waitForURL('**/profile', { timeout: 10000 });
    
    // Check if stage name field exists
    const stageNameField = page.locator('input#stage-name');
    await expect(stageNameField).toBeVisible();
    
    // Check if name display preference select exists
    const nameDisplaySelect = page.locator('select#name-display');
    await expect(nameDisplaySelect).toBeVisible();
    
    // Test filling in stage name
    await stageNameField.fill('The Comedy King');
    
    // Test selecting name display preference
    await nameDisplaySelect.selectOption('stage');
    
    // Verify the values are set correctly
    await expect(stageNameField).toHaveValue('The Comedy King');
    await expect(nameDisplaySelect).toHaveValue('stage');
  });
});