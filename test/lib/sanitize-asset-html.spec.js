// Tests for the M.5-A sanitized-HTML render gate logic (client-only).
//
// No DOM env is available (vitest runs in node). DOMPurify needs `window`, so we:
//   • test the SERVER branch with window absent (gate returns ""), and
//   • test the CLIENT branch with window stubbed + DOMPurify mocked, asserting the
//     gate ALWAYS routes non-empty input through the sanitizer and never emits
//     unsanitized markup.
// Real DOMPurify stripping is delegated to the vetted library; exercising it
// against a live DOM is deferred (no jsdom dependency added in this pass).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Deterministic sanitizer stub: strips <script> blocks and on* handlers so the
// gate's routing can be asserted without a DOM.
vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((html) =>
      String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/\son\w+="[^"]*"/gi, ""),
    ),
  },
}));

import DOMPurify from "dompurify";
import {
  sanitizeAssetHtml,
  resolveAssetPreviewHtml,
} from "../../cockpit-shell/src/asset/sanitize-asset-html.ts";

describe("sanitizeAssetHtml — server (no window)", () => {
  it("returns '' even for real HTML, without calling the sanitizer (client-only gate)", () => {
    expect(typeof window).toBe("undefined");
    expect(sanitizeAssetHtml("<b>hi</b>")).toBe("");
    expect(DOMPurify.sanitize).not.toHaveBeenCalled();
  });
});

describe("sanitizeAssetHtml — client (window present)", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    DOMPurify.sanitize.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns '' for missing / empty / whitespace input without invoking the sanitizer", () => {
    expect(sanitizeAssetHtml(undefined)).toBe("");
    expect(sanitizeAssetHtml(null)).toBe("");
    expect(sanitizeAssetHtml("")).toBe("");
    expect(sanitizeAssetHtml("   ")).toBe("");
    expect(DOMPurify.sanitize).not.toHaveBeenCalled();
  });

  it("routes non-empty HTML through DOMPurify.sanitize and returns its output", () => {
    const out = sanitizeAssetHtml("<p>ok</p>");
    expect(DOMPurify.sanitize).toHaveBeenCalledWith("<p>ok</p>");
    expect(out).toBe("<p>ok</p>");
  });

  it("does not emit <script> or event-handler payloads (stripped by the sanitizer)", () => {
    const out = sanitizeAssetHtml(
      '<p>ok</p><script>alert(1)</script><img src="x" onerror="alert(2)">',
    );
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toMatch(/onerror=/i);
    expect(out).toContain("<p>ok</p>");
  });
});

describe("resolveAssetPreviewHtml — asset preview contract", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    DOMPurify.sanitize.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns '' when preview is null / has no sanitizedHtml (fallback path)", () => {
    expect(resolveAssetPreviewHtml(null)).toBe("");
    expect(resolveAssetPreviewHtml(undefined)).toBe("");
    expect(resolveAssetPreviewHtml({})).toBe("");
    expect(resolveAssetPreviewHtml({ sanitizedHtml: "" })).toBe("");
    expect(resolveAssetPreviewHtml({ fallbackLabel: "Unavailable" })).toBe("");
  });

  it("returns sanitized HTML when sanitizedHtml is present", () => {
    expect(resolveAssetPreviewHtml({ sanitizedHtml: "<b>v</b>" })).toBe("<b>v</b>");
  });
});
