import puppeteer from 'puppeteer';

describe('Basic Puppeteer Test', () => {
  test('Can connect to the running server', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:8080/', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      
      // Check if the page loaded successfully
      const title = await page.title();
      console.log('Page title:', title);
      
      // Check for iD Comedy branding
      const hasIDComedy = await page.evaluate(() => {
        return document.body.innerText.includes('iD Comedy') || 
               document.body.innerText.includes('iD') ||
               document.querySelector('nav') !== null;
      });
      
      expect(hasIDComedy).toBe(true);
      
      // Take a screenshot for verification
      await page.screenshot({ 
        path: 'tests/screenshots/homepage-test.png',
        fullPage: true 
      });
      
    } finally {
      await page.close();
      await browser.close();
    }
  });
  
  test('Design System page loads', async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:8080/design-system', { 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
      
      // Check for Design System content
      const hasDesignSystem = await page.evaluate(() => {
        return document.body.innerText.includes('Design System') || 
               document.body.innerText.includes('Blur') ||
               document.body.innerText.includes('Glass Effect');
      });
      
      expect(hasDesignSystem).toBe(true);
      
      // Take a screenshot
      await page.screenshot({ 
        path: 'tests/screenshots/design-system-test.png',
        fullPage: true 
      });
      
    } finally {
      await page.close();
      await browser.close();
    }
  });
});