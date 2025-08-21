import { chromium } from 'playwright';

async function debugDetailed() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER-${msg.type()}]: ${msg.text()}`);
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log(`[PAGE-ERROR]: ${error.message}`);
  });
  
  // Listen for request failures
  page.on('requestfailed', request => {
    console.log(`[REQUEST-FAILED]: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('Navigating to page...');
    await page.goto('http://localhost:8083/', { 
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    console.log('Waiting for React to render...');
    await page.waitForTimeout(5000);
    
    // Check React root
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 500) : 'No root element';
    });
    console.log('Root content:', rootContent);
    
    // Check for any errors in the DOM
    const errors = await page.locator('[class*="error"], [data-testid*="error"]').count();
    console.log(`Error elements: ${errors}`);
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
  } catch (error) {
    console.error('Navigation error:', error.message);
  } finally {
    await browser.close();
  }
}

debugDetailed();