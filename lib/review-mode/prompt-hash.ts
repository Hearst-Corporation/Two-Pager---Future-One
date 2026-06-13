// lib/review-mode/prompt-hash.ts
// Pre-computed sha256 hashes of the assembled system prompts.
// Used as `system_prompt_hash` in the `llm_runs` table for observability —
// stable across requests so latency/cost drift correlates with prompt edits.
//
// We use Oracle-specific prompts (lib/review-mode/oracle-prompts.ts) instead
// of the @hearst/review-mode package defaults. The package's defaults produce
// product-review checklists; Oracle needs IC-style memos grounded in the deal
// corpus.

import { sha256Hex } from "@/lib/review-mode/hash";
import { DOMAIN_CONTEXT } from "@/lib/oracle-product-context";
import { buildConversationalPrompt } from "@/lib/review-mode/prompts";
import {
  buildOracleFacilitatorPrompt,
  buildOracleDocumentInstructions,
} from "@/lib/review-mode/oracle-prompts";

export const CONVERSATIONAL_PROMPT = buildConversationalPrompt({ domainContext: DOMAIN_CONTEXT });
export const FACILITATOR_PROMPT = buildOracleFacilitatorPrompt({ domainContext: DOMAIN_CONTEXT });
export const DOCUMENT_INSTRUCTIONS = buildOracleDocumentInstructions({ domainContext: DOMAIN_CONTEXT });

export const CONVERSATIONAL_PROMPT_HASH = sha256Hex(CONVERSATIONAL_PROMPT);
export const FACILITATOR_PROMPT_HASH = sha256Hex(FACILITATOR_PROMPT);
export const DOCUMENT_INSTRUCTIONS_HASH = sha256Hex(DOCUMENT_INSTRUCTIONS);
