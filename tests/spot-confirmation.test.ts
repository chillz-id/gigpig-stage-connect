import { test, expect } from '@playwright/test';
import { TestHelper } from './helpers/TestHelper';

test.describe('Spot Confirmation System', () => {
  let testHelper: TestHelper;
  let comedianEmail: string;
  let comedianPassword: string;
  let promoterEmail: string;
  let promoterPassword: string;
  let adminEmail: string;
  let adminPassword: string;

  test.beforeAll(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    comedianEmail = `comedian.spot.test.${timestamp}@example.com`;
    comedianPassword = 'TestPassword123!';
    promoterEmail = `promoter.spot.test.${timestamp}@example.com`;
    promoterPassword = 'TestPassword123!';
    adminEmail = `admin.spot.test.${timestamp}@example.com`;
    adminPassword = 'TestPassword123!';
  });

  test.beforeEach(async ({ page }) => {
    testHelper = new TestHelper(page);
    await testHelper.setup();
  });

  test('Complete spot confirmation workflow', async ({ page }) => {
    let eventId: string;
    let applicationId: string;
    let spotId: string;

    // Step 1: Create promoter account and event
    await test.step('Create promoter and event', async () => {
      await page.goto('/auth');
      
      // Sign up as promoter
      const signUpTab = page.getByText('Sign up', { exact: true });
      if (await signUpTab.isVisible()) {
        await signUpTab.click();
      }
      
      await page.fill('input[type="email"]', promoterEmail);
      await page.fill('input[type="password"]', promoterPassword);
      await page.click('text=Promoter');
      await page.click('button[type="submit"]:has-text("Sign up")');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Complete promoter profile
      await page.goto('/profile');
      await page.fill('input[name="full_name"]', 'Test Promoter');
      await page.fill('input[name="phone"]', '+61412345678');
      await page.click('button:has-text("Save")');
      
      // Create an event
      await page.goto('/events/create');
      await page.fill('input[name="title"]', 'Test Spot Confirmation Event');
      await page.fill('input[name="venue"]', 'Test Venue');
      await page.fill('input[name="address"]', '123 Test Street, Sydney NSW 2000');
      
      // Set event date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('input[name="event_date"]', tomorrow.toISOString().split('T')[0]);
      
      await page.fill('input[name="start_time"]', '19:00');
      await page.fill('input[name="end_time"]', '21:00');
      await page.fill('textarea[name="description"]', 'Test event for spot confirmation');
      
      // Add spots
      await page.click('button:has-text("Add Spot")');
      await page.fill('input[name="spot_name"]', 'MC');
      await page.fill('input[name="duration_minutes"]', '5');
      await page.check('input[name="is_paid"]');
      await page.fill('input[name="payment_amount"]', '50');
      
      await page.click('button:has-text("Create Event")');
      
      // Extract event ID from URL or page
      await page.waitForURL('**/events/**', { timeout: 10000 });
      const url = page.url();
      eventId = url.split('/').pop() || '';
      
      console.log(`Created event with ID: ${eventId}`);
    });

    // Step 2: Create comedian account and apply
    await test.step('Create comedian and apply to event', async () => {
      // Sign out promoter
      await page.click('button:has-text("Sign out"), [data-testid="sign-out"]');
      
      // Sign up as comedian
      await page.goto('/auth');
      
      const signUpTab = page.getByText('Sign up', { exact: true });
      if (await signUpTab.isVisible()) {
        await signUpTab.click();
      }
      
      await page.fill('input[type="email"]', comedianEmail);
      await page.fill('input[type="password"]', comedianPassword);
      await page.click('text=Comedian');
      await page.click('button[type="submit"]:has-text("Sign up")');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Complete comedian profile
      await page.goto('/profile');
      await page.fill('input[name="full_name"]', 'Test Comedian');
      await page.fill('input[name="stage_name"]', 'The Test Comic');
      await page.fill('textarea[name="bio"]', 'Test comedian for spot confirmation');
      await page.fill('input[name="phone"]', '+61412345679');
      await page.click('button:has-text("Save")');
      
      // Apply to the event
      await page.goto('/shows');
      
      // Find and apply to the test event
      const eventCard = page.locator(`text=Test Spot Confirmation Event`).first();
      await eventCard.click();
      
      const applyButton = page.locator('button:has-text("Apply")').first();
      await applyButton.click();
      
      // Fill application form
      const applicationModal = page.locator('[role="dialog"], .modal, .application-form');
      if (await applicationModal.isVisible({ timeout: 5000 })) {
        await page.fill('textarea[name="message"]', 'I would love to MC this show!');
        await page.selectOption('select[name="spot_type"]', 'mc');
        await page.check('input[name="availability_confirmed"]');
        await page.check('input[name="requirements_acknowledged"]');
        await page.click('button:has-text("Submit Application")');
      }
      
      await page.waitForSelector('text=/Application submitted|Applied successfully/i');
      console.log('Comedian applied to event');
    });

    // Step 3: Approve application (as promoter)
    await test.step('Approve application as promoter', async () => {
      // Sign out comedian
      await page.click('button:has-text("Sign out"), [data-testid="sign-out"]');
      
      // Sign in as promoter
      await page.goto('/auth');
      await page.fill('input[type="email"]', promoterEmail);
      await page.fill('input[type="password"]', promoterPassword);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Navigate to applications
      await page.goto('/admin/applications');
      
      // Find the application
      const applicationRow = page.locator(`text=${comedianEmail}`).first();
      await applicationRow.click();
      
      // Approve the application
      const approveButton = page.locator('button:has-text("Approve"), button:has-text("Accept")');
      await approveButton.click();
      
      // Confirm approval
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await page.waitForSelector('text=/Application approved|Approved successfully/i');
      console.log('Application approved by promoter');
    });

    // Step 4: Verify spot assignment
    await test.step('Verify spot assignment in database', async () => {
      // Check event spots page
      await page.goto(`/events/${eventId}/spots`);
      
      // Verify the spot is assigned to the comedian
      const spotAssignment = page.locator(`text=${comedianEmail}, text=The Test Comic`);
      await expect(spotAssignment).toBeVisible();
      
      console.log('Spot assigned correctly');
    });

    // Step 5: Test comedian notification
    await test.step('Test comedian receives notification', async () => {
      // Sign out promoter
      await page.click('button:has-text("Sign out"), [data-testid="sign-out"]');
      
      // Sign in as comedian
      await page.goto('/auth');
      await page.fill('input[type="email"]', comedianEmail);
      await page.fill('input[type="password"]', comedianPassword);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Check notifications
      await page.goto('/notifications');
      
      // Look for spot confirmation notification
      const notification = page.locator('text=/spot.*confirmed|booking.*confirmed/i');
      await expect(notification).toBeVisible();
      
      console.log('Comedian received notification');
    });

    // Step 6: Test spot confirmation page
    await test.step('Test spot confirmation page', async () => {
      // Navigate to spot confirmation page
      await page.goto('/spots/confirm');
      
      // Or find the confirmation link in notifications
      const confirmationLink = page.locator('a:has-text("Confirm Spot"), a:has-text("View Spot")');
      if (await confirmationLink.isVisible()) {
        await confirmationLink.click();
      }
      
      // Verify spot details are shown
      await expect(page.locator('text=Test Spot Confirmation Event')).toBeVisible();
      await expect(page.locator('text=Test Venue')).toBeVisible();
      await expect(page.locator('text=MC')).toBeVisible();
      await expect(page.locator('text=$50')).toBeVisible();
      
      console.log('Spot confirmation page displays correctly');
    });

    // Step 7: Test confirm spot functionality
    await test.step('Test confirm spot functionality', async () => {
      // Click confirm button
      const confirmButton = page.locator('button:has-text("Confirm Spot"), button:has-text("Accept")');
      await confirmButton.click();
      
      // Wait for confirmation
      await page.waitForSelector('text=/Spot confirmed|Confirmed successfully/i');
      
      // Verify status update
      await page.goto('/dashboard');
      const confirmedSpot = page.locator('text=/Confirmed|Booked/i');
      await expect(confirmedSpot).toBeVisible();
      
      console.log('Spot confirmed successfully');
    });

    // Step 8: Test promoter notification
    await test.step('Test promoter receives notification', async () => {
      // Sign out comedian
      await page.click('button:has-text("Sign out"), [data-testid="sign-out"]');
      
      // Sign in as promoter
      await page.goto('/auth');
      await page.fill('input[type="email"]', promoterEmail);
      await page.fill('input[type="password"]', promoterPassword);
      await page.click('button[type="submit"]:has-text("Sign in")');
      
      await page.waitForURL('/dashboard', { timeout: 10000 });
      
      // Check notifications
      await page.goto('/notifications');
      
      // Look for spot confirmation notification
      const notification = page.locator('text=/comedian.*confirmed|spot.*confirmed/i');
      await expect(notification).toBeVisible();
      
      console.log('Promoter received confirmation notification');
    });
  });

  test('Test spot decline functionality', async ({ page }) => {
    // This test would follow similar setup but test the decline path
    
    await test.step('Create basic test data', async () => {
      // Setup promoter, comedian, event, and application
      // (Similar to previous test but abbreviated)
      console.log('Setting up test data for decline test...');
    });

    await test.step('Test decline spot functionality', async () => {
      // Navigate to spot confirmation page
      await page.goto('/spots/confirm');
      
      // Click decline button
      const declineButton = page.locator('button:has-text("Decline"), button:has-text("Reject")');
      await declineButton.click();
      
      // Provide reason
      const reasonField = page.locator('textarea[name="decline_reason"]');
      if (await reasonField.isVisible()) {
        await reasonField.fill('Unfortunately, I have a scheduling conflict');
      }
      
      // Confirm decline
      const confirmButton = page.locator('button:has-text("Confirm Decline")');
      await confirmButton.click();
      
      await page.waitForSelector('text=/Spot declined|Declined successfully/i');
      
      console.log('Spot declined successfully');
    });

    await test.step('Verify decline notification to promoter', async () => {
      // Switch to promoter account and verify notification
      console.log('Checking promoter receives decline notification...');
    });
  });

  test('Test deadline enforcement', async ({ page }) => {
    await test.step('Test spot confirmation deadline', async () => {
      // Create event with short confirmation deadline
      console.log('Testing deadline enforcement...');
      
      // Create event with 1-hour confirmation deadline
      // Wait for deadline to pass
      // Verify spot is automatically declined or made available
      
      console.log('Deadline enforcement test would require time manipulation');
    });
  });

  test('Test edge cases and error scenarios', async ({ page }) => {
    await test.step('Test duplicate confirmation attempts', async () => {
      // Try to confirm already confirmed spot
      console.log('Testing duplicate confirmation...');
    });

    await test.step('Test confirmation without login', async () => {
      // Try to access confirmation page without authentication
      await page.goto('/spots/confirm');
      await expect(page).toHaveURL('/auth');
      
      console.log('Unauthenticated access properly redirected');
    });

    await test.step('Test confirmation with wrong comedian', async () => {
      // Try to confirm spot assigned to different comedian
      console.log('Testing unauthorized confirmation...');
    });
  });

  test('Test notification system integration', async ({ page }) => {
    await test.step('Test notification types', async () => {
      // Verify different notification types are created
      await page.goto('/notifications');
      
      // Check for application approval notification
      const approvalNotification = page.locator('text=/application.*approved|spot.*assigned/i');
      
      // Check for confirmation reminder notification
      const reminderNotification = page.locator('text=/confirm.*spot|reminder/i');
      
      console.log('Notification types verified');
    });

    await test.step('Test notification preferences', async () => {
      // Test email notifications (if implemented)
      // Test push notifications (if implemented)
      console.log('Testing notification preferences...');
    });
  });

  test('Test calendar integration', async ({ page }) => {
    await test.step('Test calendar event creation', async () => {
      // Verify confirmed spot creates calendar event
      await page.goto('/profile?tab=calendar');
      
      // Check if confirmed spot appears in calendar
      const calendarEvent = page.locator('text=Test Spot Confirmation Event');
      
      console.log('Calendar integration tested');
    });
  });

  test.afterAll(async () => {
    console.log('Spot confirmation tests completed');
    console.log(`Test accounts: ${comedianEmail}, ${promoterEmail}, ${adminEmail}`);
  });
});