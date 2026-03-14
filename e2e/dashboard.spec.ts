import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@financialtracker.com');
    await page.getByLabel('Password').fill('demo123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('shows dashboard tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /accounts/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /stocks/i })).toBeVisible();
  });

  test('can navigate to accounts tab', async ({ page }) => {
    await page.getByRole('tab', { name: /accounts/i }).click();
    await expect(page.getByRole('tab', { name: /accounts/i })).toHaveAttribute('data-state', 'active');
  });
});
