// lib/review-mode/tokens.ts — estimation tokens (français, sidebar chat).

export const TOKENS_PER_CHAR_FR = 0.30;

export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length * TOKENS_PER_CHAR_FR);
}
