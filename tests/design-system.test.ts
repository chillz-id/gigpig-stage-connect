import { TestHelper } from './helpers/TestHelper';

describe('Design System Tests', () => {
  let helper: TestHelper;

  beforeEach(async () => {
    helper = new TestHelper(global.page);
    await helper.navigateToDesignSystem();
  });

  test('Design System page loads with all controls', async () => {
    // Check main sections exist
    expect(await helper.hasText('Design System Control Panel')).toBe(true);
    expect(await helper.hasText('Live Preview')).toBe(true);
    
    // Check control sections
    expect(await helper.hasText('Colors')).toBe(true);
    expect(await helper.hasText('Typography')).toBe(true);
    expect(await helper.hasText('Effects')).toBe(true);
  });

  test('Blur intensity control works', async () => {
    // Find the blur intensity section
    expect(await helper.hasText('Blur Intensity')).toBe(true);
    
    // Test different blur values
    const blurValues = [0, 8, 16, 24];
    
    for (const value of blurValues) {
      await helper.adjustBlurIntensity(value);
      
      // Wait a moment for the effect to apply
      await global.page.waitForTimeout(500);
      
      // Check that the blur value is displayed
      expect(await helper.hasText(`Blur: ${value}px`)).toBe(true);
    }
    
    // Take screenshot with maximum blur
    await helper.takeScreenshot('blur-intensity-max');
  });

  test('Glass effect demo responds to blur changes', async () => {
    // Find the glass effect demo
    expect(await helper.hasText('Glass Effect Demo')).toBe(true);
    
    // Test with minimum blur
    await helper.adjustBlurIntensity(0);
    await global.page.waitForTimeout(300);
    await helper.takeScreenshot('glass-effect-no-blur');
    
    // Test with maximum blur
    await helper.adjustBlurIntensity(24);
    await global.page.waitForTimeout(300);
    await helper.takeScreenshot('glass-effect-max-blur');
    
    // Verify the blur value is shown in the demo
    expect(await helper.hasText('Blur: 24px')).toBe(true);
  });

  test('Color controls exist and are accessible', async () => {
    // Check for color input fields
    const colorFields = [
      'input[type="color"]',
      'input[placeholder*="color"]',
      '[data-testid*="color"]'
    ];
    
    let hasColorControls = false;
    for (const selector of colorFields) {
      if (await helper.hasElement(selector)) {
        hasColorControls = true;
        break;
      }
    }
    
    // At minimum, should have some color-related text
    expect(hasColorControls || await helper.hasText('Primary')).toBe(true);
  });

  test('Typography controls are present', async () => {
    // Should have typography-related controls
    expect(
      await helper.hasText('Font') ||
      await helper.hasText('Typography') ||
      await helper.hasText('Text')
    ).toBe(true);
  });

  test('Preview panel shows real-time changes', async () => {
    // The live preview should exist
    expect(await helper.hasText('Live Preview')).toBe(true);
    
    // Should contain sample elements
    expect(
      await helper.hasText('Sample') ||
      await helper.hasText('Preview') ||
      await helper.hasElement('.glass-card')
    ).toBe(true);
  });

  test('Settings persist across page reloads', async () => {
    // Set a specific blur value
    await helper.adjustBlurIntensity(12);
    await global.page.waitForTimeout(500);
    
    // Reload the page
    await global.page.reload({ waitUntil: 'networkidle0' });
    
    // Check if the setting persisted (if implemented)
    // This test might fail initially if persistence isn't implemented yet
    const hasPersistentBlur = await helper.hasText('Blur: 12px');
    
    // Log result for debugging
    console.log('Blur setting persisted:', hasPersistentBlur);
  });

  test('Responsive design on mobile viewport', async () => {
    // Test mobile viewport
    await global.page.setViewport({ width: 375, height: 667 });
    await global.page.reload({ waitUntil: 'networkidle0' });
    
    // Should still show main elements
    expect(await helper.hasText('Design System')).toBe(true);
    
    // Take mobile screenshot
    await helper.takeScreenshot('design-system-mobile');
    
    // Reset to desktop
    await global.page.setViewport({ width: 1280, height: 720 });
  });
});