import { Page } from '@playwright/test';

export class TestHelper {
  constructor(private page: Page) {}

  // Setup and navigation
  async setup() {
    // Set up any necessary test state
    await this.page.goto('/');
  }

  // Authentication helpers
  async signIn(email: string, password: string) {
    await this.page.goto('/auth');
    
    // Make sure we're on sign in tab
    const signInTab = this.page.getByText('Sign in', { exact: true });
    if (await signInTab.isVisible()) {
      await signInTab.click();
    }
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]:has-text("Sign in")');
    
    // Wait for redirect after successful login
    await this.page.waitForURL((url) => !url.pathname.includes('/auth'), { 
      timeout: 10000 
    });
  }

  async signUp(email: string, password: string, role: 'comedian' | 'promoter') {
    await this.page.goto('/auth');
    
    // Switch to sign up tab
    const signUpTab = this.page.getByText('Sign up', { exact: true });
    if (await signUpTab.isVisible()) {
      await signUpTab.click();
    }
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    
    // Select role
    await this.page.click(`text=${role.charAt(0).toUpperCase() + role.slice(1)}`);
    
    await this.page.click('button[type="submit"]:has-text("Sign up")');
    
    // Wait for redirect
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }

  async signOut() {
    // Look for sign out button in navigation or profile menu
    const signOutButton = this.page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await this.page.waitForURL('/auth');
    }
  }

  // Form helpers
  async fillForm(fields: Record<string, string>) {
    for (const [name, value] of Object.entries(fields)) {
      const input = this.page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  async selectOption(selector: string, value: string) {
    const select = this.page.locator(selector).first();
    await select.selectOption(value);
  }

  // Verification helpers
  async waitForToast(text?: string) {
    if (text) {
      await this.page.waitForSelector(`text=/${text}/i`);
    } else {
      await this.page.waitForSelector('[data-radix-toast-viewport] [role="status"], .toast, .notification');
    }
  }

  async hasElement(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async hasText(text: string): Promise<boolean> {
    return await this.page.locator(`text=${text}`).isVisible();
  }

  // Navigation helpers
  async navigateToTab(tabName: string) {
    const tab = this.page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`).first();
    if (await tab.isVisible()) {
      await tab.click();
      await this.page.waitForTimeout(500); // Wait for tab content to load
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
    await this.page.waitForLoadState('networkidle');
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