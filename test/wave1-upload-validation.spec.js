// Wave 1 — upload controls (C15).
import { describe, it, expect } from 'vitest';
import { validateUpload, MAX_UPLOAD_BYTES } from '../lib/upload-validation.js';

const PDF = Buffer.from('255044462d312e34', 'hex');   // %PDF-1.4
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');
const ZIP = Buffer.from('504b0304140006', 'hex');     // xlsx/docx/pptx

describe('C15 — upload validation', () => {
  it('rejects files over the size cap', () => {
    const r = validateUpload({ size: MAX_UPLOAD_BYTES + 1, type: 'application/pdf' });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(413);
  });
  it('rejects a disallowed MIME type', () => {
    const r = validateUpload({ size: 100, type: 'application/x-msdownload', buffer: PDF });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(415);
  });
  it('rejects a content-type spoof (magic-byte mismatch)', () => {
    // Declares PDF but bytes are PNG → must be rejected.
    const r = validateUpload({ size: 100, type: 'application/pdf', buffer: PNG });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(415);
    expect(r.error).toMatch(/magic-byte/i);
  });
  it('accepts a genuine PDF', () => {
    expect(validateUpload({ size: 100, type: 'application/pdf', buffer: PDF }).ok).toBe(true);
  });
  it('accepts a genuine xlsx (zip magic)', () => {
    const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    expect(validateUpload({ size: 100, type: mime, buffer: ZIP }).ok).toBe(true);
  });
  it('accepts text/csv without a magic signature', () => {
    expect(validateUpload({ size: 100, type: 'text/csv', buffer: Buffer.from('a,b,c') }).ok).toBe(true);
  });
});
