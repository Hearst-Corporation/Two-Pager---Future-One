import { test, expect } from '@playwright/test';

test.describe('cockpit chat', () => {
  test('IC prompt posts deal + pathname to /api/cockpit-chat', async ({ page }) => {
    let postedBody: Record<string, unknown> | null = null;

    await page.route('**/api/cockpit-chat', async (route) => {
      if (route.request().method() === 'POST') {
        postedBody = route.request().postDataJSON() as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          headers: {
            'content-type': 'text/plain',
            'x-chat-id': 'e2e-chat-id',
          },
          body: 'E2E audit response',
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/admin/hearst/simulator', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await page.getByRole('button', { name: 'Why REVIEW?' }).click();
    await page.waitForTimeout(800);

    await expect.poll(() => (postedBody as { message?: string } | null)?.message).toBe('Why REVIEW?');

    const deal = (postedBody as { deal?: { projection?: { irr?: number } } })?.deal;
    expect(deal?.projection?.irr).toBeTruthy();

    const oracle = (postedBody as { oracle?: { pathname?: string } })?.oracle;
    expect(oracle?.pathname).toBe('/admin/hearst/simulator');

    const userMsg = page.locator('.ct-chat-msg.user').last();
    await expect(userMsg).toContainText('Why REVIEW?');
  });
});
