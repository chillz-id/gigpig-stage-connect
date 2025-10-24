import { expect, test } from '@playwright/test';

const CRM_TASK_MATCHER = /Confirm venue logistics/i;

test.describe('CRM Task Manager interactions', () => {
  test('supports switching between Kanban and List views', async ({ page }) => {
    await page.goto('/crm/tasks');

    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByText(CRM_TASK_MATCHER)).toBeVisible();

    await page.getByRole('tab', { name: 'List' }).click();
    await expect(page.getByRole('columnheader', { name: 'Task' })).toBeVisible();
    await expect(page.getByText(CRM_TASK_MATCHER)).toBeVisible();

    await page.getByRole('tab', { name: 'Kanban' }).click();
    await expect(page.getByText(CRM_TASK_MATCHER)).toBeVisible();
  });
});
