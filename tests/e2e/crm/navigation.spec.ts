import { expect, test } from '@playwright/test';

const CRM_CUSTOMER_EMAIL = 'crm.customer.vip@example.com';
const CRM_DEAL_TITLE = 'Comedy Showcase at Town Hall';
const CRM_TASK_MATCHER = /Confirm venue logistics/i;

test.describe('CRM authenticated flows', () => {
  test('customers page lists seeded customer data', async ({ page }) => {
    await page.goto('/crm/customers');

    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
    await expect(page.getByText(CRM_CUSTOMER_EMAIL)).toBeVisible();
    await expect(page.getByText('VIP')).toBeVisible();
  });

  test('deal pipeline shows seeded deals', async ({ page }) => {
    await page.goto('/crm/deals');

    await expect(page.getByRole('heading', { name: 'Deal Pipeline' })).toBeVisible();
    await expect(page.getByText(CRM_DEAL_TITLE)).toBeVisible();
    await expect(page.getByText(/Total Pipeline Value/i)).toBeVisible();
  });

  test('task manager surfaces seeded tasks', async ({ page }) => {
    await page.goto('/crm/tasks');

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByText(CRM_TASK_MATCHER)).toBeVisible();
    await expect(page.getByText(/HIGH/i)).toBeVisible();
  });
});
