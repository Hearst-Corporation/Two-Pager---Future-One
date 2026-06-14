// cockpit-shell/src/asset/sanitize-asset-html.ts
//
// Client-only sanitized-HTML render gate — pure logic (no React).
//
// Foundation for M.5: a future asset producer will emit `assetPreview.sanitizedHtml`.
// This module is the SINGLE security boundary that turns that (untrusted) HTML
// string into something renderable. It ALWAYS re-sanitizes on the client with
// DOMPurify (defense in depth, even though the field is named "sanitized"), and
// returns "" on the server (no DOM) or for missing/empty input — so callers
// render a fallback or nothing. It never returns unsanitized input.
//
// No server-side sanitizer dependency is introduced: sanitization runs CLIENT-SIDE
// only, mirroring the existing chat pattern (ChatPanel.tsx). DOMPurify's default
// config strips <script>, event handlers (on*), and javascript: URLs — NOT loosened.

import DOMPurify from "dompurify";

/** Smallest asset-preview contract consumed by the render gate. */
export interface AssetPreview {
  /** Pre-sanitized HTML from the producer. Re-sanitized client-side before render. */
  sanitizedHtml?: string | null;
  /** Optional plain-text label shown when no renderable HTML is available. */
  fallbackLabel?: string | null;
}

/**
 * Sanitize an HTML string for rendering.
 * Returns "" on the server (no `window` / no DOM) and for empty/nullish input,
 * so callers render a fallback or nothing. Never returns unsanitized input.
 */
export function sanitizeAssetHtml(html?: string | null): string {
  // Client-only: there is no DOM on the server, and we add no server sanitizer.
  if (typeof window === "undefined") return "";
  if (typeof html !== "string" || html.trim() === "") return "";
  return DOMPurify.sanitize(html);
}

/**
 * Resolve the renderable, sanitized HTML for an asset preview.
 * "" when there is nothing safe to render (missing/empty input, or server-side).
 */
export function resolveAssetPreviewHtml(preview?: AssetPreview | null): string {
  return sanitizeAssetHtml(preview?.sanitizedHtml);
}
