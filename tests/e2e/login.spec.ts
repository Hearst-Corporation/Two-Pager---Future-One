import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/); // any title
  // no Next.js dev error overlay
  const errorOverlay = page.locator('[data-nextjs-dialog-overlay]');
  await expect(errorOverlay).toHaveCount(0);
});

test('/admin without auth redirects to /admin/login', async ({ page }) => {
  // Skip if dev autologin is active — the auth gate is intentionally bypassed.
  test.skip(!!process.env.ADMIN_DEV_AUTOLOGIN_EMAIL, 'dev autologin is on — auth gate bypassed');
  const response = await page.goto('/admin');
  expect(response?.url()).toContain('/admin/login');
});

test('/admin/login renders the login form', async ({ page }) => {
  await page.goto('/admin/login');
  // Form has at least one email input
  await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10_000 });
});
