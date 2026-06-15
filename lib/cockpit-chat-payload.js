// cockpit-chat-payload.js — voie A : deal + pathname + scope chat pour POST /api/cockpit-chat.

export const COCKPIT_CHAT_SEND_EVENT = 'oracle:cockpit-chat-send';


/**
 * @param {object|null|undefined} advisorContext — SimulationContext.advisorContext
 * @returns {{ scenario: object, projection: object, warnings: string[] }|null}
 */
export function buildChatDealPayload(advisorContext) {
  if (!advisorContext?.projection) return null;

  const scenario = advisorContext.scenario ?? {};
  const projection = advisorContext.projection;
  const fromSim = Array.isArray(advisorContext.simResult?.warnings)
    ? advisorContext.simResult.warnings
    : [];
  const fromProj = Array.isArray(projection.warnings) ? projection.warnings : [];
  const warnings = [...new Set([...fromSim, ...fromProj].filter(Boolean))];

  return { scenario, projection, warnings };
}

/**
 * Clé de scope pour isoler les conversations (scénario sauvé, live, mémo, page).
 * @param {object|null|undefined} advisorContext
 * @param {string} [pathname]
 * @param {string|null} [memoId]
 * @returns {string}
 */
export function resolveChatScope(advisorContext, pathname = '', memoId = null) {
  if (memoId) return `memo:${memoId}`;

  const scenarioId =
    advisorContext?.savedScenarioId ??
    advisorContext?.scenarioId ??
    null;
  if (scenarioId) return `scenario:${scenarioId}`;

  if (advisorContext?.surface === 'simulator' && advisorContext?.projection) {
    return 'live:simulator';
  }

  return `page:${pathname || '/admin/hearst'}`;
}

/** @param {string} scope */
export function getScopedChatStorageKey(scope) {
  return `oracle:chat-id:${scope}`;
}

/**
 * @param {string} scope
 * @returns {string|null}
 */
export function readScopedChatId(scope) {
  if (!scope) return null;
  try {
    return globalThis.localStorage?.getItem(getScopedChatStorageKey(scope)) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} scope
 * @param {string} chatId
 */
export function writeScopedChatId(scope, chatId) {
  if (!scope || !chatId) return;
  try {
    globalThis.localStorage?.setItem(getScopedChatStorageKey(scope), chatId);
  } catch {
    /* private mode / SSR */
  }
}

/**
 * Bascule le chat CockpitShell sur la conversation scopée (reload GET /api/cockpit-chats/:id).
 * @param {string} scope
 * @param {(id: string | null) => void} [setActiveChat] — export @hearst/cockpit-shell
 */
export function syncScopedChatToShell(scope, setActiveChat) {
  if (typeof setActiveChat !== 'function') {
    resetChatShellMessages();
    return;
  }
  const chatId = scope ? readScopedChatId(scope) : null;
  setActiveChat(chatId);
}

/** Vide l'historique visible du shell (fallback si setActiveChat indisponible). */
function resetChatShellMessages() {
  if (typeof document === 'undefined') return;
  const msgs = [...document.querySelectorAll('.ct-chat-msg')];
  if (msgs.length <= 1) return;
  msgs.forEach((el, i) => {
    if (i === 0 && el.classList.contains('assistant')) return;
    el.remove();
  });
}

/**
 * Envoie un message via le textarea contrôlé de CockpitShell (React onChange).
 * @param {string} message
 * @returns {boolean} true si le DOM chat était prêt
 */
export function injectChatMessageToShell(message) {
  if (typeof document === 'undefined') return false;
  const trimmed = message?.trim();
  if (!trimmed) return false;

  const textarea = document.querySelector('.ct-chat-input');
  const sendBtn = document.querySelector('.ct-chat-form .ct-chat-send');
  if (!textarea || !sendBtn) return false;

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value',
  )?.set;
  setter?.call(textarea, trimmed);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));

  requestAnimationFrame(() => {
    if (!sendBtn.disabled) sendBtn.click();
  });

  return true;
}
