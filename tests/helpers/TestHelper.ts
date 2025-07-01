import { Page, ElementHandle } from 'puppeteer';

export class TestHelper {
  constructor(private page: Page) {}

  // Navigation helpers
  async navigateToHome() {
    await this.page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
  }

  async navigateToProfile() {
    await this.page.goto('http://localhost:8080/profile', { waitUntil: 'networkidle0' });
  }

  async navigateToDesignSystem() {
    await this.page.goto('http://localhost:8080/design-system', { waitUntil: 'networkidle0' });
  }

  // Wait helpers
  async waitForElement(selector: string, timeout = 5000): Promise<ElementHandle<Element> | null> {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async waitForText(text: string, timeout = 5000) {
    return await this.page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      { timeout },
      text
    );
  }

  // Form helpers
  async fillInput(selector: string, value: string) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.up('Control');
    await this.page.type(selector, value);
  }

  async clickButton(selector: string) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
  }

  async selectOption(selector: string, value: string) {
    await this.page.waitForSelector(selector);
    await this.page.select(selector, value);
  }

  // Verification helpers
  async hasText(text: string): Promise<boolean> {
    try {
      await this.waitForText(text, 2000);
      return true;
    } catch {
      return false;
    }
  }

  async hasElement(selector: string): Promise<boolean> {
    try {
      await this.waitForElement(selector, 2000);
      return true;
    } catch {
      return false;
    }
  }

  async getElementText(selector: string): Promise<string> {
    await this.waitForElement(selector);
    return await this.page.$eval(selector, (el) => el.textContent || '');
  }

  async getElementAttribute(selector: string, attribute: string): Promise<string | null> {
    await this.waitForElement(selector);
    return await this.page.$eval(selector, (el, attr) => el.getAttribute(attr), attribute);
  }

  // Screenshot helper for debugging
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `tests/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  // Toast notification helper
  async waitForToast(expectedText?: string, timeout = 5000) {
    try {
      if (expectedText) {
        await this.page.waitForFunction(
          (text) => {
            const toasts = Array.from(document.querySelectorAll('[data-radix-toast-viewport] [role="status"]'));
            return toasts.some(toast => toast.textContent?.includes(text));
          },
          { timeout },
          expectedText
        );
      } else {
        await this.page.waitForSelector('[data-radix-toast-viewport] [role="status"]', { timeout });
      }
      return true;
    } catch {
      return false;
    }
  }

  // Theme helpers
  async switchTheme(_theme: 'business' | 'pleasure') {
    const themeButton = '[data-testid="theme-toggle"], button[aria-label*="theme"]';
    if (await this.hasElement(themeButton)) {
      await this.clickButton(themeButton);
    }
  }

  // Design System helpers
  async adjustBlurIntensity(value: number) {
    const blurSlider = 'input[type="range"][min="0"][max="24"]';
    await this.page.waitForSelector(blurSlider);
    
    // Set slider value
    await this.page.$eval(blurSlider, (slider: any, val) => {
      slider.value = val;
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  }

  // Authentication helpers (for future use)
  async mockLogin(email: string = 'test@example.com') {
    // This would be used with a test user account
    // For now, we'll focus on testing public pages
    console.log(`Mocking login for ${email}`);
  }

  // Performance monitoring
  async measurePageLoad() {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    return performanceMetrics;
  }
}