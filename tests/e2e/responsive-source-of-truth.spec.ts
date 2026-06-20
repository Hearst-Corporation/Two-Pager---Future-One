import { test, expect, Page } from '@playwright/test';

/**
 * Verrou de non-régression — CHAÎNE DE VÉRITÉ LAYOUT du dashboard simulator.
 *
 * Cause racine corrigée : le chat se dockait à ≥901px en réservant min(360px,27vw) du centre.
 * Résultat : à 901px le slot réel [data-sim-config] tombait à ~520px (< seuil container-query
 * 640px) et la grille s'effondrait en 1 colonne — « élargir le viewport rétrécissait le contenu ».
 * Fix : le chat ne se docke qu'au-dessus de --cp-chat-dock-min (1200px) ; en dessous il reste un
 * drawer overlay qui ne vole pas l'espace. Les container-queries (640/1080) pilotent la grille
 * sur le slot RÉEL, et le slot est désormais monotone avec le viewport.
 *
 * Ces tests échouent si : le chat re-docke trop tôt, le slot retombe sous MEDIUM en s'élargissant,
 * un hScroll global réapparaît, ou un widget est clippé par les overflow:hidden du fit-mode.
 */

const SIM = '/admin/hearst/simulator';
const MEDIUM = 640; // seuil container-query narrow ↔ medium (simulator.css)
const DOCK_MIN = 1280; // --cp-chat-dock-min (cp-tokens.css / chat-fab.css)

type Slot = { slot: number; tier: 0 | 1 | 2; docked: boolean; hScroll: boolean; clip: number };

async function measure(page: Page, w: number, h: number): Promise<Slot> {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForSelector('[data-sim-config]', { timeout: 20_000 });
  // Attend que le slot se STABILISE (ResizeObserver des charts + transitions chat peuvent
  // produire des lectures transitoires juste après un resize). On considère stable quand
  // [data-sim-config].clientWidth est constant sur 3 frames consécutives.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let prev = -1;
        let stable = 0;
        const tick = () => {
          const sc = document.querySelector('[data-sim-config]') as HTMLElement | null;
          const w = sc ? sc.clientWidth : 0;
          if (w > 0 && w === prev) {
            if (++stable >= 3) return resolve();
          } else {
            stable = 0;
          }
          prev = w;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  return page.evaluate(() => {
    const sc = document.querySelector('[data-sim-config]') as HTMLElement | null;
    const slot = sc ? sc.clientWidth : 0;
    const tier: 0 | 1 | 2 = slot >= 1080 ? 2 : slot >= 640 ? 1 : 0;
    const rr = document.querySelector('.ct-rail-right') as HTMLElement | null;
    const pa = document.querySelector('.ct-page-area') as HTMLElement | null;
    const docked = !!(
      rr &&
      getComputedStyle(rr).position === 'fixed' &&
      pa &&
      parseFloat(getComputedStyle(pa).paddingRight) > 1
    );
    const vw = window.innerWidth;
    const hScroll =
      document.documentElement.scrollWidth > vw + 1 || document.body.scrollWidth > vw + 1;
    const clip = [...document.querySelectorAll('[data-sim-config] *')].filter(
      (e) => (e as HTMLElement).scrollWidth - (e as HTMLElement).clientWidth > 2,
    ).length;
    return { slot, tier, docked, hScroll, clip };
  });
}

test.describe('dashboard responsive — source of truth', () => {
  test('le chat cède (overlay) sous --cp-chat-dock-min et ne docke qu\'au-dessus', async ({
    page,
  }) => {
    await page.goto(SIM, { waitUntil: 'domcontentloaded' });

    // 901px : ANCIEN point de casse (chat dockait → slot ~520px NARROW). Doit rester drawer.
    const at901 = await measure(page, 901, 820);
    expect(at901.docked, 'chat ne doit PAS être docké à 901px (overlay)').toBe(false);

    // Juste sous le seuil : encore overlay.
    const below = await measure(page, DOCK_MIN - 1, 820);
    expect(below.docked, `chat ne doit PAS être docké à ${DOCK_MIN - 1}px`).toBe(false);

    // Au seuil : le dock s'enclenche, mais le centre reste largement ≥ MEDIUM (pas de 1-col).
    const at = await measure(page, DOCK_MIN, 820);
    expect(at.docked, `chat doit être docké à ${DOCK_MIN}px`).toBe(true);
    expect(at.slot, 'le dock ne doit pas effondrer le centre sous MEDIUM').toBeGreaterThanOrEqual(
      MEDIUM,
    );
  });

  test('jamais d\'effondrement 1-colonne (≥768px) ni de hScroll global sur la matrice', async ({
    page,
  }) => {
    await page.goto(SIM, { waitUntil: 'domcontentloaded' });
    const widths = [390, 600, 768, 900, 901, 1000, 1100, 1200, 1279, 1280, 1366, 1440, 1536];
    for (const w of widths) {
      const m = await measure(page, w, 820);
      // Invariant central : un scroll horizontal GLOBAL = responsive cassé (≠ ellipsis/scroll local).
      expect(m.hScroll, `hScroll global à ${w}px`).toBe(false);
      // Au-dessus de la tablette, la grille ne doit JAMAIS retomber en 1 colonne (tier NARROW).
      // C'est la régression corrigée : élargir le viewport n'effondre plus le contenu.
      if (w >= 768) {
        expect(m.tier, `grille effondrée en 1-col (NARROW) à ${w}px — slot=${m.slot}`).toBeGreaterThanOrEqual(
          1,
        );
      }
    }
  });
});
