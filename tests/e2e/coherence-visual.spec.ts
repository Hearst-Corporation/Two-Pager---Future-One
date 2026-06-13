import { test, expect } from '@playwright/test';

const COCKPIT_PAGES = [
  { path: '/admin/hearst/simulator', name: 'simulator' },
  { path: '/admin/hearst/simulator/results', name: 'results' },
  { path: '/admin/hearst/financial', name: 'financial' },
  { path: '/admin/hearst/sources', name: 'sources' },
  { path: '/admin/hearst/workspace', name: 'workspace' },
  { path: '/admin/hearst/deals', name: 'deals' },
  { path: '/admin/hearst/dossier', name: 'dossier' },
];

test.describe('coherence DS — cockpit shell', () => {
  for (const { path, name } of COCKPIT_PAGES) {
    test(`desktop: ${name} renders rail nav + docked chat`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const railItems = page.locator('[data-oracle-railnav-slot] .oracle-rail-nav-item');
      await expect(railItems).toHaveCount(6, { timeout: 20_000 });

      await expect(page.locator('.ct-rail-right')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('.cp-chat-drawer-fab')).toBeHidden();

      const pagePaddingRight = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('.ct-page-area') || document.body).paddingRight),
      );
      expect(pagePaddingRight).toBeGreaterThan(200);

      if (name === 'simulator') {
        await expect(page.locator('[data-sim-wrap]')).toBeVisible({ timeout: 20_000 });
      }

      if (name === 'results') {
        await expect(page.locator('[data-results-layout]')).toBeVisible({ timeout: 20_000 });
      }
    });
  }

  test('mobile: bottom nav + chat FAB', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/hearst/financial', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.ct-rail-left')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('.oracle-mobile-nav-root')).toBeVisible();
    await expect(page.locator('.oracle-mobile-nav .oracle-rail-nav-item')).toHaveCount(6);
    await expect(page.locator('.cp-chat-drawer-fab')).toBeVisible();
  });
});
