// lib/llm/cost.ts — estimation coût indicative OpenAI (USD / 1M tokens).

const USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1": { input: 2, output: 8 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
};

function ratesForModel(model: string) {
  if (USD_PER_MTOK[model]) return USD_PER_MTOK[model];
  const base = Object.keys(USD_PER_MTOK).find((k) => model.startsWith(k));
  return base ? USD_PER_MTOK[base] : USD_PER_MTOK["gpt-4o"];
}

export function estimateOpenAICostUsd(
  usage: { prompt_tokens: number; completion_tokens: number },
  model = "gpt-4o",
): number {
  const rates = ratesForModel(model);
  const inputCost = (usage.prompt_tokens * rates.input) / 1_000_000;
  const outputCost = (usage.completion_tokens * rates.output) / 1_000_000;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}
