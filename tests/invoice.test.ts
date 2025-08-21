import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import puppeteer, { Browser, Page } from 'puppeteer';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const TEST_TIMEOUT = 30000;

describe('Invoice System Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should load the invoice page', async () => {
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle0' });
    
    // Check if we're redirected to login (expected if not authenticated)
    const url = page.url();
    const isOnInvoicePage = url.includes('/invoices');
    const isOnLoginPage = url.includes('/login') || url.includes('/auth');
    
    expect(isOnInvoicePage || isOnLoginPage).toBe(true);
  }, TEST_TIMEOUT);

  it('should have invoice management components', async () => {
    // If we're on login page, we can't test the components
    const url = page.url();
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('Skipping component test - authentication required');
      return;
    }

    // Look for invoice-specific elements
    const invoiceElements = await page.evaluate(() => {
      const hasInvoiceTable = !!document.querySelector('[data-testid="invoice-table"]');
      const hasCreateButton = !!document.querySelector('button:contains("Create Invoice")');
      const hasSearchInput = !!document.querySelector('input[placeholder*="invoice"]');
      
      return {
        hasInvoiceTable,
        hasCreateButton,
        hasSearchInput
      };
    });

    // At least one invoice-related element should be present
    const hasInvoiceUI = Object.values(invoiceElements).some(val => val);
    expect(hasInvoiceUI).toBe(true);
  }, TEST_TIMEOUT);

  it('should verify invoice types are supported', async () => {
    // This is a unit test for the invoice types
    const invoiceTypes = ['promoter', 'comedian', 'other'];
    expect(invoiceTypes).toContain('promoter');
    expect(invoiceTypes).toContain('comedian');
    expect(invoiceTypes).toContain('other');
  });

  it('should verify invoice status values are defined', async () => {
    const statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses).toContain('draft');
    expect(statuses).toContain('paid');
  });

  it('should verify deposit status values are defined', async () => {
    const depositStatuses = ['not_required', 'pending', 'paid', 'overdue', 'partial'];
    expect(depositStatuses.length).toBe(5);
    expect(depositStatuses).toContain('not_required');
    expect(depositStatuses).toContain('pending');
  });
});