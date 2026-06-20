// lib/review-mode/prompt-hash.ts
// Pre-assembled base prompts (conversational + facilitator).
// Hashing is now done at runtime on the full assembled finalSystemPrompt
// (oraclePrefix + base + tuning + grounding) — see route.ts B4.
//
// We use Oracle-specific prompts (lib/review-mode/oracle-prompts.ts) instead
// of the @hearst/review-mode package defaults. The package's defaults produce
// product-review checklists; Oracle needs IC-style memos grounded in the deal
// corpus.

import { DOMAIN_CONTEXT } from "@/lib/oracle-product-context";
import { buildConversationalPrompt } from "@/lib/review-mode/prompts";
import { buildOracleFacilitatorPrompt } from "@/lib/review-mode/oracle-prompts";

export const CONVERSATIONAL_PROMPT = buildConversationalPrompt({ domainContext: DOMAIN_CONTEXT });
export const FACILITATOR_PROMPT = buildOracleFacilitatorPrompt({ domainContext: DOMAIN_CONTEXT });
