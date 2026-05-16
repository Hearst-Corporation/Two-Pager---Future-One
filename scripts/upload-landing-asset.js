// One-shot uploader for the FUTUR-ONE-FINAL video.
// Usage: node scripts/upload-landing-asset.js
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local — service role bypasses RLS,
// which is fine for a one-shot admin script. NEVER ship this key client-side.

require('dotenv').config({ path: '.env.local' });
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'landing-assets';
const FILE_PATH = path.resolve(__dirname, '../public/FUTUR-ONE-FINAL.mp4');
const REMOTE_PATH = 'FUTUR-ONE-FINAL.mp4';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE env vars. Aborting.');
    process.exit(1);
  }
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`File not found: ${FILE_PATH}`);
    process.exit(1);
  }
  const stat = fs.statSync(FILE_PATH);
  console.log(`Source: ${FILE_PATH} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);

  const supabase = createClient(url, key);

  // Ensure bucket exists and is public
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('listBuckets failed:', listErr);
    process.exit(1);
  }
  const exists = buckets.some((b) => b.name === BUCKET);
  if (!exists) {
    console.log(`Creating bucket ${BUCKET}...`);
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 200 * 1024 * 1024, // 200 MB
      allowedMimeTypes: ['video/mp4'],
    });
    if (createErr) {
      console.error('createBucket failed:', createErr);
      process.exit(1);
    }
  } else {
    console.log(`Bucket ${BUCKET} already exists.`);
    // Ensure public access
    const { error: updateErr } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
    });
    if (updateErr) {
      console.warn('updateBucket warn (non-fatal):', updateErr.message);
    }
  }

  // Upload (overwrite if exists)
  console.log(`Uploading to ${BUCKET}/${REMOTE_PATH}...`);
  const fileBuffer = fs.readFileSync(FILE_PATH);
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(REMOTE_PATH, fileBuffer, {
      contentType: 'video/mp4',
      cacheControl: '31536000', // 1 year
      upsert: true,
    });
  if (uploadErr) {
    console.error('upload failed:', uploadErr);
    process.exit(1);
  }

  // Get public URL
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(REMOTE_PATH);
  console.log('SUCCESS');
  console.log('PUBLIC_URL=' + pub.publicUrl);
}

main().catch((err) => {
  console.error('Unexpected:', err);
  process.exit(1);
});
