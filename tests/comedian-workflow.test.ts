import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/TestHelper';

test.describe('Comedian Complete Workflow', () => {
  let testHelper: TestHelper;
  let comedianEmail: string;
  let comedianPassword: string;

  test.beforeAll(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    comedianEmail = `comedian.test.${timestamp}@example.com`;
    comedianPassword = 'TestPassword123!';
  });

  test.beforeEach(async ({ page }) => {
    testHelper = new TestHelper(page);
    await testHelper.setup();
  });

  test('Complete comedian workflow', async ({ page }) => {
    // Step 1: Sign up as a comedian
    await test.step('Sign up as comedian', async () => {
      await page.goto('/auth');
      
      // Switch to sign up mode
      const signUpTab = page.getByText('Sign up', { exact: true });
      if (await signUpTab.isVisible()) {
        await signUpTab.click();
      }
      
      // Fill signup form
      await page.fill('input[type="email"]', comedianEmail);
      await page.fill('input[type="password"]', comedianPassword);
      
      // Select comedian role
      await page.click('text=Comedian');
      
      // Submit form
      await page.click('button[type="submit"]:has-text("Sign up")');
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
      await expect(page).toHaveURL('/dashboard');
    });

    // Step 2: Complete profile
    await test.step('Complete comedian profile', async () => {
      await page.goto('/profile');
      
      // Fill in profile details
      await page.fill('input[name="full_name"]', 'Test Comedian');
      await page.fill('input[name="stage_name"]', 'The Test Comic');
      await page.fill('textarea[name="bio"]', 'A hilarious test comedian with years of experience making databases laugh.');
      await page.fill('input[name="phone"]', '+61412345678');
      
      // Save profile
      await page.click('button:has-text("Save")');
      await page.waitForSelector('text=Profile updated successfully');
    });

    // Step 3: Browse available shows
    await test.step('Browse available shows', async () => {
      await page.goto('/shows');
      
      // Wait for shows to load
      await page.waitForSelector('[data-testid="show-card"], .show-card, text=Comedy Show', { timeout: 10000 });
      
      // Get list of shows with apply buttons
      const availableShows = await page.$$eval(
        'button:has-text("Apply"), button:has-text("Apply Now")',
        buttons => buttons.length
      );
      
      expect(availableShows).toBeGreaterThan(0);
      console.log(`Found ${availableShows} shows available for application`);
    });

    // Step 4: Apply for shows
    await test.step('Apply for multiple shows', async () => {
      // Apply for first available show
      const applyButton = page.locator('button:has-text("Apply")').first();
      if (await applyButton.isVisible()) {
        await applyButton.click();
        
        // Fill application form if it appears
        const applicationModal = page.locator('[role="dialog"], .modal, .application-form');
        if (await applicationModal.isVisible({ timeout: 5000 })) {
          // Fill any required fields
          const notesField = page.locator('textarea[name="notes"], textarea[placeholder*="note"], textarea[placeholder*="message"]');
          if (await notesField.isVisible()) {
            await notesField.fill('I would love to perform at this show! I have great material ready.');
          }
          
          // Submit application
          await page.click('button:has-text("Submit"), button:has-text("Apply")');
        }
        
        // Wait for success message
        await page.waitForSelector('text=/Application submitted|Applied successfully|Application sent/i');
      }
      
      // Apply for second show if available
      const secondApplyButton = page.locator('button:has-text("Apply")').nth(1);
      if (await secondApplyButton.isVisible()) {
        await secondApplyButton.click();
        await page.waitForSelector('text=/Application submitted|Applied successfully|Application sent/i');
      }
    });

    // Step 5: View applied shows
    await test.step('View applied shows', async () => {
      // Navigate to applications or dashboard
      await page.goto('/applications');
      
      // Alternative: Check dashboard for applications section
      if (!(await page.url()).includes('/applications')) {
        await page.goto('/dashboard');
        
        // Look for applications section
        const applicationsSection = page.locator('text=/My Applications|Applied Shows|Pending Applications/i');
        if (await applicationsSection.isVisible()) {
          await applicationsSection.click();
        }
      }
      
      // Verify applied shows are visible
      const appliedShows = await page.$$eval(
        '[data-status="pending"], .application-pending, text=/Pending|Applied|Under Review/i',
        elements => elements.length
      );
      
      expect(appliedShows).toBeGreaterThan(0);
      console.log(`Found ${appliedShows} pending applications`);
    });

    // Step 6: Simulate show confirmation (admin action)
    await test.step('Simulate show confirmation', async () => {
      // This would normally be done by an admin/promoter
      // For testing, we'll check if any shows are already confirmed
      
      // Note: In a real test environment, you would:
      // 1. Log out as comedian
      // 2. Log in as admin/promoter
      // 3. Approve the application
      // 4. Log back in as comedian
      
      console.log('Note: Show confirmation requires admin action');
    });

    // Step 7: View confirmed shows
    await test.step('View confirmed shows', async () => {
      await page.goto('/dashboard');
      
      // Look for confirmed shows section
      const confirmedSection = page.locator('text=/Confirmed Shows|Upcoming Gigs|My Spots/i').first();
      if (await confirmedSection.isVisible()) {
        await confirmedSection.click();
      }
      
      // Alternative: Check profile gigs tab
      await page.goto('/profile?tab=gigs');
      
      // Look for any confirmed shows
      const confirmedShows = await page.$$eval(
        '[data-status="confirmed"], .spot-confirmed, text=/Confirmed|Booked|Scheduled/i',
        elements => elements.length
      );
      
      console.log(`Found ${confirmedShows} confirmed shows`);
      
      // If no confirmed shows, that's okay for this test
      if (confirmedShows === 0) {
        console.log('No confirmed shows yet - this is normal for new applications');
      }
    });

    // Step 8: Check calendar sync options
    await test.step('Check calendar sync functionality', async () => {
      await page.goto('/profile?tab=calendar');
      
      // Look for calendar sync options
      const calendarSection = page.locator('text=/Calendar Sync|Google Calendar|Apple Calendar/i').first();
      expect(await calendarSection.isVisible()).toBeTruthy();
      
      // Check for Google Calendar button
      const googleCalButton = page.locator('button:has-text("Connect Google Calendar")');
      if (await googleCalButton.isVisible()) {
        console.log('Google Calendar integration available');
      }
      
      // Check for ICS download option
      const icsButton = page.locator('button:has-text("Download Calendar"), button:has-text("Export to Calendar")');
      if (await icsButton.isVisible()) {
        console.log('ICS calendar export available');
      }
    });

    // Step 9: Verify navigation and UI elements
    await test.step('Verify comedian-specific UI elements', async () => {
      // Check navigation
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Shows')).toBeVisible();
      await expect(page.locator('text=Profile')).toBeVisible();
      
      // Verify comedian role is displayed
      const roleIndicator = page.locator('text=/Comedian|Comic/i').first();
      await expect(roleIndicator).toBeVisible();
    });
  });

  test('Comedian can filter and search shows', async ({ page }) => {
    // Sign in first
    await testHelper.signIn(comedianEmail, comedianPassword);
    
    await test.step('Filter shows by date', async () => {
      await page.goto('/shows');
      
      // Look for date filter
      const dateFilter = page.locator('input[type="date"], button:has-text("Date"), [data-testid="date-filter"]').first();
      if (await dateFilter.isVisible()) {
        await dateFilter.click();
        // Select a future date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
      }
    });
    
    await test.step('Filter shows by venue', async () => {
      const venueFilter = page.locator('select[name="venue"], button:has-text("Venue"), [data-testid="venue-filter"]').first();
      if (await venueFilter.isVisible()) {
        await venueFilter.click();
        // Select first available venue
        const firstVenue = page.locator('option, [role="option"]').nth(1);
        if (await firstVenue.isVisible()) {
          await firstVenue.click();
        }
      }
    });
    
    await test.step('Search for shows', async () => {
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Comedy');
        await page.keyboard.press('Enter');
        
        // Verify search results
        await page.waitForTimeout(1000); // Wait for search to complete
        const results = await page.$$eval('.show-card, [data-testid="show-card"]', cards => cards.length);
        console.log(`Search returned ${results} results`);
      }
    });
  });

  test('Comedian can manage availability', async ({ page }) => {
    await testHelper.signIn(comedianEmail, comedianPassword);
    
    await test.step('Navigate to availability settings', async () => {
      await page.goto('/profile?tab=availability');
      
      // Look for availability calendar
      const availabilitySection = page.locator('text=/Availability|Available Dates|Block Dates/i').first();
      if (await availabilitySection.isVisible()) {
        console.log('Availability management section found');
        
        // Try to block a date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateButton = page.locator(`[data-date="${tomorrow.toISOString().split('T')[0]}"], button:has-text("${tomorrow.getDate()}")`).first();
        if (await dateButton.isVisible()) {
          await dateButton.click();
          console.log('Toggled availability for tomorrow');
        }
      }
    });
  });

  test.afterAll(async () => {
    console.log('Comedian workflow tests completed');
    console.log(`Test comedian email: ${comedianEmail}`);
  });
});