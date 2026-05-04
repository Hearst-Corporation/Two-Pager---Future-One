/**
 * export.js — génère les PDFs 300 DPI + ZIP de la brochure Futur One.
 *
 * Prérequis : serveur Next.js sur localhost:5005 (`npm run dev`)
 * Usage     : node scripts/export.js
 * Sortie    : ./export/  +  futur-one-brochure.zip
 *
 * Calcul DPI :
 *   Spread CSS = 960 × 680 px  →  A3 paysage = 420 × 297 mm
 *   scale      = (420/25.4) / (960/96) = 16.535 / 10 = 1.6535
 *   deviceScaleFactor = 5  →  960×5 = 4800 px → 4800/16.535 in ≈ 290 DPI ≈ 300 DPI
 *   Page seule : idem avec 480 × 680 → A4 portrait (210 × 297 mm)
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');
const { execSync } = require('child_process');

const BASE       = 'http://localhost:5005';
const EXPORT_DIR = path.join(__dirname, '..', 'export');
const ZIP_PATH   = path.join(__dirname, '..', 'futur-one-brochure.zip');

/* ─── Scale constants ────────────────────────────────────────────────────── */
// A3 landscape → spread 960 × 680
const SCALE_A3  = (420 / 25.4) / (960 / 96); // ≈ 1.6535
// A4 portrait  → single page 480 × 680
const SCALE_A4  = (210 / 25.4) / (480 / 96); // ≈ 1.6535  (same ratio, different dims)

/* ─── Jobs ───────────────────────────────────────────────────────────────── */
const JOBS = [
  // --- VERSION NORMALE (Sans traits de coupe) ---
  {
    url:      '/print?view=exterior',
    file:     'RECTO_couverture-dos',
    label:    'RECTO (couverture + dos)',
    w: 960, h: 680,
    pw: '420mm', ph: '297mm',
    scale: SCALE_A3,
  },
  {
    url:      '/print?view=interior',
    file:     'VERSO_interieur',
    label:    'VERSO (intérieur P2 + P3)',
    w: 960, h: 680,
    pw: '420mm', ph: '297mm',
    scale: SCALE_A3,
  },
  // --- VERSION IMPRIMEUR (Avec traits de coupe + fond perdu) ---
  // On ajoute 30mm au format papier (15mm de chaque côté) pour les traits de coupe
  {
    url:      '/print?view=exterior&marks=1',
    file:     'IMPRIMEUR_RECTO_Avec_Traits_De_Coupe',
    label:    'RECTO IMPRIMEUR (Traits de coupe)',
    w: 960 + 68, h: 680 + 68, // +34px padding de chaque côté
    pw: '450mm', ph: '327mm', // 420+30, 297+30
    scale: SCALE_A3,
  },
  {
    url:      '/print?view=interior&marks=1',
    file:     'IMPRIMEUR_VERSO_Avec_Traits_De_Coupe',
    label:    'VERSO IMPRIMEUR (Traits de coupe)',
    w: 960 + 68, h: 680 + 68,
    pw: '450mm', ph: '327mm',
    scale: SCALE_A3,
  },
];

/* ─── README ─────────────────────────────────────────────────────────────── */
const README = `FUTUR ONE — Brochure A3 pliée en 2
====================================

FICHIERS POUR L'IMPRIMEUR (AVEC TRAITS DE COUPE)
------------------------------------------------
Ces fichiers sont spécialement formatés pour un imprimeur professionnel (quadrichromie, 350g pelliculé).
Le format du PDF est légèrement plus grand (450 × 327 mm) pour inclure les traits de coupe (crop marks) autour du format final A3 (420 × 297 mm).

  IMPRIMEUR_RECTO_Avec_Traits_De_Coupe.pdf
    → Face EXTÉRIEURE (P4 à gauche, P1 à droite)
  
  IMPRIMEUR_VERSO_Avec_Traits_De_Coupe.pdf
    → Face INTÉRIEURE (P2 à gauche, P3 à droite)

FICHIERS STANDARDS (SANS TRAITS DE COUPE)
-----------------------------------------
Format A3 exact (420 × 297 mm), coupe franche au bord. Idéal pour un affichage écran ou une impression bureautique.

  RECTO_couverture-dos.pdf
  VERSO_interieur.pdf

INSTRUCTIONS IMPRIMEUR
-----------------------
  Format papier final : A3 (420 × 297 mm), paysage
  Impression          : Recto-verso (Quadricolore CMJN)
  Finition            : Pliage au centre → format final A4 portrait
  Résolution          : 300 DPI
  Papier recommandé   : 350g/m² couché
  Pelliculage         : Pelliculage mat ou soft-touch recommandé
  Traits de coupe     : INCLUS dans les fichiers "IMPRIMEUR_"

Généré le : ${new Date().toLocaleString('fr-FR', { timeZone: 'Asia/Dubai' })}
`;

/* ─── Main ───────────────────────────────────────────────────────────────── */
async function run() {
  // Prep output dir
  if (fs.existsSync(EXPORT_DIR)) fs.rmSync(EXPORT_DIR, { recursive: true });
  fs.mkdirSync(EXPORT_DIR, { recursive: true });

  // Write README
  fs.writeFileSync(path.join(EXPORT_DIR, 'README-IMPRESSION.txt'), README, 'utf8');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('\n🖨  Futur One — Export PDF 300 DPI\n');

  for (const job of JOBS) {
    const page = await browser.newPage();
    await page.setViewport({ width: job.w, height: job.h, deviceScaleFactor: 5 });
    await page.goto(`${BASE}${job.url}`, { waitUntil: 'networkidle0', timeout: 30_000 });

    // Let fonts + images settle
    await new Promise(r => setTimeout(r, 1500));

    const outPath = path.join(EXPORT_DIR, `${job.file}.pdf`);
    await page.pdf({
      path: outPath,
      width: job.pw,
      height: job.ph,
      scale: job.scale,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    const size = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`  ✓  ${job.file}.pdf   (${size} KB)   ← ${job.label}`);
    await page.close();
  }

  await browser.close();

  // ZIP
  if (fs.existsSync(ZIP_PATH)) fs.rmSync(ZIP_PATH);
  execSync(`cd "${path.dirname(EXPORT_DIR)}" && zip -r "futur-one-brochure.zip" "export/"`, {
    stdio: 'inherit',
  });

  console.log(`\n  ✓  ZIP → ${ZIP_PATH}\n`);
  console.log('Done. Envoie futur-one-brochure.zip à ton imprimeur.\n');
}

run().catch(err => {
  console.error('\n❌ Erreur :', err.message);
  process.exit(1);
});
