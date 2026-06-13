// lib/review-mode/hash.ts — sha256 pour observabilité llm_runs (system_prompt_hash).

import { createHash } from "node:crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
