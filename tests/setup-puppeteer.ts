import puppeteer, { Browser, Page } from 'puppeteer';

declare global {
  var browser: Browser;
  var page: Page;
}

beforeAll(async () => {
  // Launch browser with appropriate settings
  global.browser = await puppeteer.launch({
    headless: true, // Use headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    timeout: 30000
  });

  // Create new page
  global.page = await global.browser.newPage();
  
  // Set viewport size
  await global.page.setViewport({ width: 1280, height: 720 });
  
  // Set user agent
  await global.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
}, 60000);

afterAll(async () => {
  if (global.page) {
    await global.page.close();
  }
  
  if (global.browser) {
    await global.browser.close();
  }
}, 30000);

beforeEach(async () => {
  // Clear any existing content before each test
  if (global.page) {
    try {
      await global.page.goto('about:blank');
    } catch (error) {
      console.warn('Could not navigate to blank page:', error);
    }
  }
});