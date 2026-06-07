import { test, expect } from '@playwright/test';

const COCKPIT_PAGES = [
  { path: '/admin/hearst/simulator', name: 'simulator' },
  { path: '/admin/hearst/financial', name: 'financial' },
  { path: '/admin/hearst/sources', name: 'sources' },
  { path: '/admin/hearst/workspace', name: 'workspace' },
  { path: '/admin/hearst/deals', name: 'deals' },
  { path: '/admin/hearst/dossier', name: 'dossier' },
];

test.describe('coherence DS — cockpit shell', () => {
  for (const { path, name } of COCKPIT_PAGES) {
    test(`desktop: ${name} renders rail nav + tokens`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      const railItems = page.locator('[data-oracle-railnav-slot] .oracle-rail-nav-item');
      await expect(railItems).toHaveCount(6, { timeout: 20_000 });

      const scrollClear = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--cp-scroll-clear').trim(),
      );
      expect(scrollClear).toBe('24px');

      if (name === 'simulator') {
        const wrapPadBottom = await page.evaluate(() => {
          for (const el of document.querySelectorAll('div')) {
            const s = getComputedStyle(el);
            if (s.maxWidth === '1280px' && s.flexDirection === 'column') {
              return s.paddingBottom;
            }
          }
          return null;
        });
        expect(wrapPadBottom).toBe('24px');
      }

      await page.screenshot({
        path: `coherence-final-${name}-desktop.png`,
        fullPage: false,
      });
    });
  }

  test('mobile: bottom nav visible when left rail hidden', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/hearst/financial', { waitUntil: 'domcontentloaded' });

    const leftRail = page.locator('.ct-rail-left');
    await expect(leftRail).toBeHidden({ timeout: 10_000 });

    const mobileNav = page.locator('.oracle-mobile-nav-root');
    await expect(mobileNav).toBeVisible();

    const mobileItems = page.locator('.oracle-mobile-nav .oracle-rail-nav-item');
    await expect(mobileItems).toHaveCount(6);

    const scrollClear = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--cp-scroll-clear').trim(),
    );
    expect(scrollClear).toMatch(/^calc\(/);

    await page.screenshot({
      path: 'coherence-final-financial-mobile.png',
      fullPage: false,
    });
  });

  test('no OpenClaw design-system imports at runtime', async ({ page }) => {
    await page.goto('/admin/hearst/simulator', { waitUntil: 'domcontentloaded' });
    const hasOcAccent = await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--oc-accent').trim();
      return v.length > 0;
    });
    expect(hasOcAccent).toBe(false);
  });
});
