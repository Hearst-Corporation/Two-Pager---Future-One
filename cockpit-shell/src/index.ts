/**
 * @hearst/cockpit-shell — exports publics (copie locale éditable de ce repo).
 *
 * Stylesheet importée une fois dans `app/layout.jsx` :
 *   `import "../cockpit-shell/tokens.css";`
 */

// Shell
export { CockpitShell } from "./shell/CockpitShell";
export { RailLeft } from "./shell/RailLeft";
export { CenterPanel } from "./shell/CenterPanel";
export { RailRight } from "./shell/RailRight";
export { ThemeAccent } from "./shell/ThemeAccent";
export { HearstMark } from "./shell/HearstMark";
export { useCockpit } from "./shell/context";
export { attachHubBridge, pushContext } from "./shell/hubBridge";
export type { HubContext } from "./shell/hubBridge";
export type {
  CockpitShellProps,
  CockpitProduct,
  CenterPanelProps,
} from "./shell/types";

// Chat
export { ChatAssistant } from "./chat/ChatAssistant";
export { ChatSettings } from "./chat/ChatSettings";
export { ChatHistory } from "./chat/ChatHistory";
export { useChat } from "./chat/useChat";
export type { UseChatOptions, UseChatReturn, DisplayMessage } from "./chat/useChat";
export type { ChatPersistence, ChatMessage, ChatConfig } from "./chat/types";

// Primitives
export {
  Eyebrow,
  Title,
  Sub,
  KpiGrid,
  KpiCard,
  Card,
} from "./primitives";

// Stores (pour les apps qui veulent piloter l'état du shell depuis l'extérieur)
export {
  subscribe as subscribeActiveProduct,
  setDefaultActive,
  getSnapshot as getActiveProduct,
  setActive as setActiveProduct,
} from "./stores/activeProductStore";
export { subscribe as subscribeRailRight, forceOpen as forceOpenRailRight } from "./stores/railOpenStore";
export { subscribe as subscribeLauncher } from "./stores/launcherStore";
export { setActiveChat } from "./stores/activeChatStore";
