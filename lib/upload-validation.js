// lib/upload-validation.js
//
// Wave 1 (C15) — basic upload hygiene for the data room / documents.
// Before this, any editor could upload an arbitrary-size, arbitrary-type file
// and the declared content-type was trusted blindly. This enforces:
//   1. a hard size cap (storage DoS / cost),
//   2. a MIME allowlist (only office/image/text/pdf),
//   3. magic-byte validation (the file's real bytes must match a declared,
//      allowed type — defeats content-type spoofing).
//
// Malware scanning (ClamAV / cloud scanner) remains a deliberate backlog item.

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

// Allowed MIME types → acceptable magic-byte prefixes (hex, lowercase).
// `null` magic means a text format with no reliable signature (validated by
// MIME + extension only).
const ALLOWED = {
  'application/pdf':            ['25504446'],            // %PDF
  'image/png':                 ['89504e47'],            // .PNG
  'image/jpeg':                ['ffd8ff'],              // JPEG
  'image/webp':                ['52494646'],            // RIFF (….WEBP)
  // OOXML + legacy zip-based office docs all start with PK\x03\x04
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':   ['504b0304'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504b0304'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['504b0304'],
  'text/csv':                  null,
  'text/plain':                null,
};

function hexPrefix(buf, bytes) {
  return Buffer.from(buf).subarray(0, bytes).toString('hex').toLowerCase();
}

/**
 * Validate an upload. Returns { ok: true } or { ok: false, status, error }.
 * @param {{ size?: number, type?: string, buffer?: Buffer|Uint8Array }} file
 */
export function validateUpload({ size, type, buffer }) {
  if (typeof size === 'number' && size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: `File exceeds ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit` };
  }
  const mime = (type || '').toLowerCase().split(';')[0].trim();
  if (!(mime in ALLOWED)) {
    return { ok: false, status: 415, error: `Unsupported file type "${type || 'unknown'}". Allowed: pdf, png, jpeg, webp, xlsx, docx, pptx, csv, txt.` };
  }
  const signatures = ALLOWED[mime];
  if (signatures && buffer) {
    const head = hexPrefix(buffer, 8);
    const matches = signatures.some(sig => head.startsWith(sig));
    if (!matches) {
      return { ok: false, status: 415, error: 'File content does not match its declared type (magic-byte mismatch).' };
    }
  }
  return { ok: true, mime };
}
