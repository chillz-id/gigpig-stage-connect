import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  // Wait for the server to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the server to respond
    await page.goto(baseURL!);
    console.log('✅ Dev server is ready');
  } catch (error) {
    console.error('❌ Dev server is not ready:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;