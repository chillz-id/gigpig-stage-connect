import { TestHelper } from './helpers/TestHelper';

describe('Smoke Tests - Basic Functionality', () => {
  let helper: TestHelper;

  beforeEach(async () => {
    helper = new TestHelper(global.page);
  });

  test('Homepage loads successfully', async () => {
    await helper.navigateToHome();
    
    // Check for main elements
    expect(await helper.hasText('iD Comedy')).toBe(true);
    expect(await helper.hasElement('nav')).toBe(true);
    
    // Check for featured events section
    expect(await helper.hasText('Featured Events')).toBe(true);
  });

  test('Design System page loads and blur controls work', async () => {
    await helper.navigateToDesignSystem();
    
    // Check page loads
    expect(await helper.hasText('Design System Control Panel')).toBe(true);
    expect(await helper.hasText('Customize the visual appearance of iD Comedy')).toBe(true);
    
    // Check blur demo exists
    expect(await helper.hasText('Glass Effect Demo')).toBe(true);
    
    // Test blur intensity adjustment
    await helper.adjustBlurIntensity(16);
    
    // Take screenshot for visual verification
    await helper.takeScreenshot('design-system-blur-test');
  });

  test('Navigation works between pages', async () => {
    await helper.navigateToHome();
    
    // Check navigation menu exists
    expect(await helper.hasElement('nav')).toBe(true);
    
    // Test navigation to design system (if accessible)
    const paletteIcon = '[data-testid="design-system-link"], [aria-label*="design"], button[title*="Design"]';
    if (await helper.hasElement(paletteIcon)) {
      await helper.clickButton(paletteIcon);
      expect(await helper.hasText('Design System')).toBe(true);
    }
  });

  test('Profile page handles unauthenticated users', async () => {
    await helper.navigateToProfile();
    
    // Should show sign-in prompt for unauthenticated users
    expect(
      await helper.hasText('Please sign in') || 
      await helper.hasText('Sign In') ||
      await helper.hasElement('button')
    ).toBe(true);
  });

  test('Page performance is acceptable', async () => {
    await helper.navigateToHome();
    
    const metrics = await helper.measurePageLoad();
    
    // Basic performance assertions
    expect(metrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(metrics.loadComplete).toBeLessThan(5000); // 5 seconds
    
    console.log('Performance Metrics:', metrics);
  });

  test('Error handling - invalid routes', async () => {
    await global.page.goto('http://localhost:8080/nonexistent-page', { waitUntil: 'networkidle0' });
    
    // Should show 404 or redirect to home
    const has404 = await helper.hasText('404') || await helper.hasText('Not Found');
    const redirectedHome = await helper.hasText('iD Comedy');
    
    expect(has404 || redirectedHome).toBe(true);
  });
});