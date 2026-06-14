// Localization guard for the dangerous HTML render path.
//
// After M.5-A, `dangerouslySetInnerHTML` must appear in EXACTLY two files:
//   • the pre-existing chat renderer (cockpit-shell/src/chat/ChatPanel.tsx), and
//   • the new isolated render gate (cockpit-shell/src/asset/SafeHtmlPreview.tsx).
// If a third file introduces it, this test fails — keeping dangerous rendering
// localized to vetted, sanitizing call sites.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["cockpit-shell/src", "app", "components", "lib"];
const SOURCE_EXT = /\.(t|j)sx?$/;

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (SOURCE_EXT.test(entry)) acc.push(full);
  }
  return acc;
}

describe("dangerouslySetInnerHTML stays localized (M.5-A render gate)", () => {
  it("is used only by ChatPanel and the SafeHtmlPreview gate", () => {
    const hits = [];
    for (const root of ROOTS) {
      let files = [];
      try {
        files = walk(root, []);
      } catch {
        /* a root may not exist; skip */
      }
      for (const file of files) {
        if (readFileSync(file, "utf-8").includes("dangerouslySetInnerHTML")) {
          hits.push(file.replace(/\\/g, "/"));
        }
      }
    }

    expect(hits.sort()).toEqual([
      "cockpit-shell/src/asset/SafeHtmlPreview.tsx",
      "cockpit-shell/src/chat/ChatPanel.tsx",
    ]);
  });
});
