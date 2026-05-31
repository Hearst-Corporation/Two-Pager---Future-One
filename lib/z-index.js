// Z-index scale — single source of truth for all overlay layers.
// Mirrors cockpit.css / cp-tokens.css stacking order.
export const Z = {
  navSubpanel:   30,    // LeftContextPanel active glow, nav sub-layers
  ctaBar:        40,    // SimulatorCTABar sticky bottom bar
  drawer:        1000,  // chat-fab overlay backdrop
  fab:           1001,  // chat-fab button
  fabOpen:       1002,  // chat-fab button (open state), MemoJobBadge
  toast:         1003,  // MemoToast notification
  modal:         1010,  // StrategicMemoModal full-screen backdrop
};
