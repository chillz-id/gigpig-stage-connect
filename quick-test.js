import { chromium } from 'playwright';

async function quickTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to http://localhost:8083/...');
    await page.goto('http://localhost:8083/', { 
      waitUntil: 'networkidle',
      timeout: 10000
    });
    
    console.log('Page loaded. Checking elements...');
    
    // Check for signup button
    const signupButton = await page.locator('[data-testid="signup-button"]').count();
    console.log(`Signup buttons found: ${signupButton}`);
    
    // Check for any buttons
    const buttonCount = await page.locator('button').count();
    console.log(`Total buttons found: ${buttonCount}`);
    
    // Take screenshot
    await page.screenshot({ path: 'homepage-test.png', fullPage: true });
    console.log('Screenshot saved as homepage-test.png');
    
    if (signupButton > 0) {
      console.log('✅ SUCCESS: Signup button found!');
    } else {
      console.log('❌ FAIL: No signup button found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest();