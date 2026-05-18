import { createCockpitChatHandler } from "@hearst/cockpit-shell/handler";
import { kimi, KIMI_MODEL } from "@/lib/llm/kimi";
import { cockpitChatPersistence } from "@/lib/cockpit-chat-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { POST } = createCockpitChatHandler({
  llmClient: kimi,
  model: KIMI_MODEL,
  systemPrompt:
    "Tu es l'assistant Kimi intégré à Hearst Oracle — projections & simulations d'investissement data center (IRR/NPV/MOIC/DSCR). Réponds en français.",
  persistence: cockpitChatPersistence,
});
