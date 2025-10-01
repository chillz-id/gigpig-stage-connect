// Use a generic Page type to work with both Puppeteer and Playwright
interface GenericPage {
  goto(url: string, options?: any): Promise<any>;
  fill?(selector: string, value: string): Promise<void>;
  type?(selector: string, text: string, options?: any): Promise<void>;
  click(selector: string): Promise<void>;
  waitForSelector(selector: string, options?: any): Promise<any>;
  locator?(selector: string): any;
  $(selector: string): Promise<any>;
  $$(selector: string): Promise<any[]>;
  screenshot(options?: any): Promise<any>;
  evaluate(pageFunction: any, ...args: any[]): Promise<any>;
  waitForTimeout?(timeout: number): Promise<void>;
  waitFor?(timeout: number): Promise<void>;
  url(): string;
}

export class TestHelper {
  constructor(private page: GenericPage) {}

  // Setup and navigation
  async setup() {
    // Set up any necessary test state
    await this.page.goto('/');
  }

  // Navigation methods for smoke tests
  async navigateToHome() {
    await this.page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
  }

  async navigateToDesignSystem() {
    await this.page.goto('http://localhost:8080/design-system', { waitUntil: 'networkidle0' });
  }

  async navigateToProfile() {
    await this.page.goto('http://localhost:8080/profile', { waitUntil: 'networkidle0' });
  }

  // Interaction methods
  async clickButton(selector: string) {
    await this.page.click(selector);
  }

  async adjustBlurIntensity(value: number) {
    // Find the blur intensity slider and adjust it
    const sliderSelector = 'input[type="range"][aria-label*="blur"], input[type="range"][name*="blur"]';
    try {
      await this.page.waitForSelector(sliderSelector, { timeout: 5000 });
      await this.page.evaluate((sel: string, val: number) => {
        const slider = document.querySelector(sel) as HTMLInputElement;
        if (slider) {
          slider.value = val.toString();
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, sliderSelector, value);
    } catch (error) {
      console.warn('Blur slider not found, skipping adjustment');
    }
  }

  // Performance measurement
  async measurePageLoad() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    return metrics;
  }

  // Authentication helpers
  async signIn(email: string, password: string) {
    await this.page.goto('/auth');
    
    // Make sure we're on sign in tab
    try {
      await this.page.click('text="Sign in"');
    } catch {
      // Already on sign in tab
    }
    
    // For Puppeteer compatibility
    await this.page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    // Type text (works with both Puppeteer and Playwright)
    if (this.page.type) {
      await this.page.type('input[type="email"]', email);
      await this.page.type('input[type="password"]', password);
    } else if (this.page.fill) {
      await this.page.fill('input[type="email"]', email);
      await this.page.fill('input[type="password"]', password);
    }
    
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation
    if (this.page.waitForTimeout) {
      await this.page.waitForTimeout(2000);
    } else if (this.page.waitFor) {
      await this.page.waitFor(2000);
    }
  }

  async signUp(_email: string, _password: string, _role: 'comedian' | 'promoter') {
    await this.page.goto('/auth');
    
    // Implementation simplified for Puppeteer compatibility
    console.log('SignUp method needs to be implemented for specific test framework');
  }

  async signOut() {
    // Implementation simplified for Puppeteer compatibility
    console.log('SignOut method needs to be implemented for specific test framework');
  }

  // Form helpers
  async fillForm(fields: Record<string, string>) {
    // Implementation simplified for Puppeteer compatibility
    for (const [name, value] of Object.entries(fields)) {
      try {
        if (this.page.type) {
          await this.page.type(`input[name="${name}"], textarea[name="${name}"]`, value);
        }
      } catch {
        console.warn(`Could not fill field: ${name}`);
      }
    }
  }

  async selectOption(selector: string, value: string) {
    await this.page.evaluate((sel: string, val: string) => {
      const select = document.querySelector(sel) as HTMLSelectElement;
      if (select) {
        select.value = val;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, selector, value);
  }

  // Verification helpers
  async waitForToast(text?: string) {
    if (text) {
      await this.page.waitForSelector(`*:contains("${text}")`, { timeout: 5000 });
    } else {
      await this.page.waitForSelector('[data-radix-toast-viewport] [role="status"], .toast, .notification');
    }
  }

  async hasElement(selector: string): Promise<boolean> {
    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch {
      return false;
    }
  }

  async hasText(text: string): Promise<boolean> {
    try {
      const elements = await this.page.evaluate((searchText: string) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.some(el => el.textContent?.includes(searchText));
      }, text);
      return elements;
    } catch {
      return false;
    }
  }

  // Navigation helpers
  async navigateToTab(tabName: string) {
    try {
      // Try to find and click tab by text content
      await this.page.evaluate((name: string) => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"], button'));
        const tab = tabs.find(el => el.textContent?.includes(name));
        if (tab) {
          (tab as HTMLElement).click();
        }
      }, tabName);
      
      // Wait for tab content to load
      if (this.page.waitForTimeout) {
        await this.page.waitForTimeout(500);
      } else if (this.page.waitFor) {
        await this.page.waitFor(500);
      }
    } catch (error) {
      console.warn(`Could not navigate to tab: ${tabName}`);
    }
  }

  // Screenshot helper for debugging
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `tests/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  // Wait helpers
  async waitForNetworkIdle() {
    // Puppeteer doesn't have waitForLoadState, use navigation wait instead
    try {
      await this.page.waitForSelector('body', { timeout: 5000 });
    } catch {
      // Page already loaded
    }
  }

  // Mock data helpers
  generateTestEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    return `${prefix}.${timestamp}@example.com`;
  }

  generateTestPhone(): string {
    const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    return `+6141${randomDigits}`;
  }
}