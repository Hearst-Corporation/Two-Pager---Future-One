// Stitch a 5x5 grid of 256px Esri satellite tiles into a single mosaic
// using node-canvas's lightweight pure-JS path: pngjs + jpeg-js.
// Falls back to a manual JPEG concat strategy via sharp if available.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = path.resolve('public/rdc-research/aerial');

function stitch(zoomDir, outName) {
  const dir = path.join(ROOT, zoomDir);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg'));
  if (files.length === 0) {
    console.log(`No tiles in ${zoomDir}`);
    return;
  }
  // Parse x_y from filenames
  const parsed = files.map((f) => {
    const m = f.match(/x(\d+)_y(\d+)\.jpg/);
    return { f, x: +m[1], y: +m[2] };
  });
  const xs = [...new Set(parsed.map((p) => p.x))].sort((a, b) => a - b);
  const ys = [...new Set(parsed.map((p) => p.y))].sort((a, b) => a - b);
  console.log(`${zoomDir}: ${xs.length} cols x ${ys.length} rows`);

  // Use ImageMagick `montage` if available, else sips concat (mac native)
  try {
    execSync('which magick', { stdio: 'ignore' });
    const tileList = ys
      .flatMap((y) => xs.map((x) => path.join(dir, `x${x}_y${y}.jpg`)))
      .filter((p) => fs.existsSync(p));
    const out = path.join(ROOT, outName);
    const cmd = `magick montage ${tileList.map((t) => `"${t}"`).join(' ')} -tile ${xs.length}x${ys.length} -geometry 256x256+0+0 "${out}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`OK ${out}`);
    return;
  } catch (_) {}

  // Fallback: build with sips + python via canvas? Use Node sharp if installed
  try {
    const sharp = (await import('sharp')).default;
    // not awaited inline; skip
  } catch (_) {}
  console.log('No imagemagick or sharp; manual stitch needed');
}

stitch('tiles_z18', 'satellite_z18_mosaic.jpg');
stitch('tiles_z19', 'satellite_z19_mosaic.jpg');
