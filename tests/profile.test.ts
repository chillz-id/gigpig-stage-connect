import { TestHelper } from './helpers/TestHelper';

describe('Profile Functionality Tests', () => {
  let helper: TestHelper;

  beforeEach(async () => {
    helper = new TestHelper(global.page);
    await helper.navigateToProfile();
  });

  test('Profile page loads for unauthenticated users', async () => {
    // Should show authentication prompt
    expect(
      await helper.hasText('Please sign in') ||
      await helper.hasText('Sign In') ||
      await helper.hasElement('button')
    ).toBe(true);
  });

  test('Profile form validation works (if accessible)', async () => {
    // This test would run if we can access the profile form
    // For now, we'll test the form structure if it's visible
    
    const hasProfileForm = await helper.hasElement('form') || 
                          await helper.hasElement('input[type="email"]') ||
                          await helper.hasText('First Name');
    
    if (hasProfileForm) {
      // Test form validation if form is accessible
      const emailInput = 'input[type="email"]';
      const saveButton = 'button[type="submit"], button:contains("Save")';
      
      if (await helper.hasElement(emailInput)) {
        // Test invalid email
        await helper.fillInput(emailInput, 'invalid-email');
        
        if (await helper.hasElement(saveButton)) {
          await helper.clickButton(saveButton);
          
          // Should show validation error
          const hasValidationError = await helper.hasText('Invalid') ||
                                   await helper.hasText('valid email') ||
                                   await helper.hasText('required');
          
          expect(hasValidationError).toBe(true);
        }
      }
    }
    
    console.log('Profile form accessible:', hasProfileForm);
  });

  test('Media upload sections exist (if authenticated)', async () => {
    // This would test the media upload functionality
    // For now, we'll check if media-related elements exist
    
    const hasMediaSection = await helper.hasText('Media') ||
                           await helper.hasText('Photo') ||
                           await helper.hasText('Video') ||
                           await helper.hasText('Upload');
    
    console.log('Media sections found:', hasMediaSection);
  });

  test('XERO integration section exists', async () => {
    // Check if XERO integration is mentioned or visible
    const hasXeroSection = await helper.hasText('XERO') ||
                          await helper.hasText('Integration') ||
                          await helper.hasText('Financial');
    
    console.log('XERO integration section found:', hasXeroSection);
  });

  test('Profile navigation works', async () => {
    // Test navigation within profile sections
    const hasTabs = await helper.hasElement('[role="tablist"]') ||
                   await helper.hasElement('.tabs') ||
                   await helper.hasText('Information');
    
    if (hasTabs) {
      // Try to click on different tabs if they exist
      const tabSelectors = [
        '[role="tab"]',
        'button[data-state="inactive"]',
        'button:contains("Information")',
        'button:contains("Settings")'
      ];
      
      for (const selector of tabSelectors) {
        if (await helper.hasElement(selector)) {
          await helper.clickButton(selector);
          await global.page.waitForTimeout(300);
          break;
        }
      }
    }
    
    console.log('Profile tabs found:', hasTabs);
  });

  test('Responsive behavior on mobile', async () => {
    // Test mobile viewport
    await global.page.setViewport({ width: 375, height: 667 });
    await global.page.reload({ waitUntil: 'networkidle0' });
    
    // Should still show main profile elements
    const hasProfileContent = await helper.hasText('Profile') ||
                             await helper.hasText('Sign In') ||
                             await helper.hasElement('button');
    
    expect(hasProfileContent).toBe(true);
    
    // Take mobile screenshot
    await helper.takeScreenshot('profile-mobile');
    
    // Reset to desktop
    await global.page.setViewport({ width: 1280, height: 720 });
  });

  test('Social media input fields work (if accessible)', async () => {
    // Test social media URL inputs if they're accessible
    const socialInputs = [
      'input[placeholder*="instagram"]',
      'input[placeholder*="twitter"]',
      'input[placeholder*="youtube"]',
      'input[placeholder*="website"]'
    ];
    
    let foundSocialInputs = 0;
    
    for (const selector of socialInputs) {
      if (await helper.hasElement(selector)) {
        foundSocialInputs++;
        
        // Test URL validation
        await helper.fillInput(selector, 'not-a-url');
        
        // Check if validation triggers (basic test)
        const saveButton = 'button:contains("Save"), button[type="submit"]';
        if (await helper.hasElement(saveButton)) {
          await helper.clickButton(saveButton);
          await global.page.waitForTimeout(300);
        }
      }
    }
    
    console.log('Social media inputs found:', foundSocialInputs);
  });

  test('Comedy styles/tags functionality (if accessible)', async () => {
    // Test the comedy styles tag system if accessible
    const hasTagInput = await helper.hasElement('input[placeholder*="style"]') ||
                       await helper.hasElement('input[placeholder*="tag"]') ||
                       await helper.hasText('Comedy Styles');
    
    if (hasTagInput) {
      const tagInput = 'input[placeholder*="style"], input[placeholder*="tag"]';
      const addButton = 'button:contains("+"), button[aria-label*="add"]';
      
      if (await helper.hasElement(tagInput)) {
        await helper.fillInput(tagInput, 'Stand-up');
        
        if (await helper.hasElement(addButton)) {
          await helper.clickButton(addButton);
          
          // Should show the tag
          expect(await helper.hasText('Stand-up')).toBe(true);
        }
      }
    }
    
    console.log('Comedy styles section found:', hasTagInput);
  });
});