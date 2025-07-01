// Global test setup
import puppeteer, { ConsoleMessage, HTTPRequest } from 'puppeteer';

// Extend Jest timeout for browser tests
jest.setTimeout(30000);

beforeAll(async () => {
  global.browser = await puppeteer.launch({
    headless: process.env.CI === 'true', // Run headful in development, headless in CI
    defaultViewport: { width: 1280, height: 720 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
});

beforeEach(async () => {
  global.page = await global.browser.newPage();
  
  // Set up console logging for debugging
  global.page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  // Set up network request monitoring
  global.page.on('requestfailed', (request: HTTPRequest) => {
    console.log('Failed Request:', request.url(), request.failure()?.errorText);
  });
});

afterEach(async () => {
  if (global.page) {
    await global.page.close();
  }
});

afterAll(async () => {
  if (global.browser) {
    await global.browser.close();
  }
});