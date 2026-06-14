"use client";

// cockpit-shell/src/asset/SafeHtmlPreview.tsx
//
// The render gate for sanitized asset HTML. Holds the ONLY new
// `dangerouslySetInnerHTML` in the codebase (besides the pre-existing one in
// ChatPanel.tsx). Re-sanitizes on the client via sanitizeAssetHtml and renders a
// plain-text fallback (or nothing) when there is no safe HTML. Intentionally
// hook-free: the decision/security logic lives in the tested pure helper, so this
// component stays a thin, localized wrapper around the dangerous render.

import { sanitizeAssetHtml } from "./sanitize-asset-html";
import type { AssetPreview } from "./sanitize-asset-html";

export type { AssetPreview };

export interface SafeHtmlPreviewProps {
  /** Pre-sanitized HTML; re-sanitized client-side before rendering. */
  sanitizedHtml?: string | null;
  /** Plain-text fallback shown when no renderable HTML is present. */
  fallbackLabel?: string | null;
  /** Optional wrapper className (no new design tokens introduced). */
  className?: string;
}

export function SafeHtmlPreview({
  sanitizedHtml,
  fallbackLabel,
  className,
}: SafeHtmlPreviewProps) {
  const html = sanitizeAssetHtml(sanitizedHtml);

  // Nothing safe to render (empty/missing input, or server-side): fallback or null.
  if (!html) {
    return fallbackLabel ? (
      <div className={className ?? "ct-asset-preview-fallback"}>{fallbackLabel}</div>
    ) : null;
  }

  return (
    <div
      className={className ?? "ct-asset-preview"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
