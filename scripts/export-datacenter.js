/**
 * export-datacenter.js — exporte /datacenter en PDF 1 page sur le Desktop.
 *
 * Prérequis : serveur Next.js sur localhost:5005 (`npm run dev`)
 * Usage     : node scripts/export-datacenter.js
 * Sortie    : ~/Desktop/futur-one-datacenter.pdf
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');
const os        = require('os');

const BASE = 'http://localhost:5005';
const URL  = `${BASE}/datacenter?print=1`;
const OUT  = path.join(os.homedir(), 'Desktop', 'futur-one-datacenter.pdf');

// Taille exacte du composant en pixels CSS
const W = 480;
const H = 680;

// Conversion px → mm (à 96 DPI)
const pxToMm = px => `${(px * 25.4 / 96).toFixed(2)}mm`;

async function run() {
  console.log(`\n🖨  Export /datacenter → ${OUT}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  // deviceScaleFactor 4 = ~380 DPI sur 480px → haute qualité
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 4 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30_000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.pdf({
    path: OUT,
    // Page PDF = exactement la taille du composant (pas A4, pas de rescaling)
    width:  pxToMm(W),   // 127mm
    height: pxToMm(H),   // 179.92mm
    scale: 1,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    pageRanges: '1',
  });

  await browser.close();

  const sizeKb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`  ✓  PDF généré (${sizeKb} KB) — 1 page ${pxToMm(W)} × ${pxToMm(H)}\n  ↳  ${OUT}\n`);
}

run().catch(err => {
  console.error('\n❌ Erreur :', err.message);
  process.exit(1);
});
