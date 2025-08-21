import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/spot-confirmation*.test.ts',
  fullyParallel: false, // Run tests sequentially for database consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  projects: [
    {
      name: 'spot-confirmation-db',
      testMatch: '**/spot-confirmation-db.test.ts',
      timeout: 60000, // Longer timeout for database tests
    },
    {
      name: 'spot-confirmation-e2e',
      testMatch: '**/spot-confirmation.test.ts',
      timeout: 120000, // Longer timeout for E2E tests
    },
    {
      name: 'spot-confirmation-notifications',
      testMatch: '**/spot-confirmation-notifications.test.ts',
    },
    {
      name: 'spot-confirmation-deadlines',
      testMatch: '**/spot-confirmation-deadlines.test.ts',
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});