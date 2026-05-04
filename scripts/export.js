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
  {
    url:      '/print?view=p1',
    file:     'P1_couverture',
    label:    'P1 — Couverture seule',
    w: 480, h: 680,
    pw: '210mm', ph: '297mm',
    scale: SCALE_A4,
  },
  {
    url:      '/print?view=p2',
    file:     'P2_interieur-gauche',
    label:    'P2 — Intérieur gauche seul',
    w: 480, h: 680,
    pw: '210mm', ph: '297mm',
    scale: SCALE_A4,
  },
  {
    url:      '/print?view=p3',
    file:     'P3_interieur-droit',
    label:    'P3 — Intérieur droit seul',
    w: 480, h: 680,
    pw: '210mm', ph: '297mm',
    scale: SCALE_A4,
  },
  {
    url:      '/print?view=p4',
    file:     'P4_dos',
    label:    'P4 — Dos seul',
    w: 480, h: 680,
    pw: '210mm', ph: '297mm',
    scale: SCALE_A4,
  },
];

/* ─── README ─────────────────────────────────────────────────────────────── */
const README = `FUTUR ONE — Brochure A3 pliée en 2
====================================

FICHIERS POUR L'IMPRIMEUR
--------------------------

  RECTO_couverture-dos.pdf
    → Face EXTÉRIEURE de la brochure (A3 paysage)
    • Côté gauche : P4 — Quatrième de couverture (dos)
    • Côté droit  : P1 — Couverture (première de couverture)

  VERSO_interieur.pdf
    → Face INTÉRIEURE de la brochure (A3 paysage)
    • Côté gauche : P2 — Intérieur gauche
    • Côté droit  : P3 — Intérieur droit

  P1_couverture.pdf / P2_interieur-gauche.pdf
  P3_interieur-droit.pdf / P4_dos.pdf
    → Pages individuelles en A4 portrait (contrôle qualité)


INSTRUCTIONS IMPRIMEUR
-----------------------

  Format papier : A3 (420 × 297 mm), paysage
  Impression    : Recto-verso
                  RECTO = couverture-dos
                  VERSO = intérieur
  Finition      : Pliage au centre → format final A4 portrait
  Résolution    : ≈ 300 DPI (290 DPI effectif)
  Couleurs      : sRGB — demander conversion CMYK à l'imprimeur si nécessaire
  Fond perdu    : aucun (coupe franche au bord)
  Grammage      : 170 g/m² ou plus recommandé


ORDRE DE MONTAGE
----------------

  Couché en 2 (vue de dessus, brochure fermée) :
  ┌──────────┬──────────┐
  │  P4 Dos  │  P1 Couv │  ← RECTO (extérieur)
  └──────────┴──────────┘
  └──────────┴──────────┘
  │  P2 Int. │  P3 Int. │  ← VERSO (intérieur)
  └──────────┴──────────┘

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
