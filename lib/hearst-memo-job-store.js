// lib/hearst-memo-job-store.js
//
// Store global singleton pour le job "Strategic Memo".
//
// Pourquoi un store hors React :
//   Le fetch /strategic-memo prend 30-90s (Kimi K2.6 via Moonshot AI). Si la modale est
//   démontée (click backdrop, navigation, fermeture accidentelle), un state
//   local React serait perdu et le job continuerait fantôme côté serveur.
//
//   Ce store :
//     - persiste le job au-delà du cycle de vie de la modale
//     - publie elapsed_ms à chaque seconde (tick) pour timeline visible
//     - permet à n'importe quel composant (badge bottom-right, toast,
//       LeftRail) de subscribe via useSyncExternalStore
//     - supporte abort si l'utilisateur le demande explicitement
//
// Forme du job :
//   { id, status: 'idle'|'loading'|'done'|'error',
//     startedAt, finishedAt, elapsed_ms, scenario_label,
//     request: { payload, oracle, userQuestion, audience, title },
//     result, error, cascade: ['kimi-k2.6'] }

import { useSyncExternalStore } from 'react';

// Mirrors the server: lib/llm/kimi.ts calls Kimi K2.6 only, no fallback.
const CASCADE = ['kimi-k2.6'];
export const MEMO_CLIENT_TIMEOUT_MS = 300_000;

function makeEmptyJob() {
  return {
    id: null,
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    elapsed_ms: 0,
    scenario_label: null,
    request: null,
    result: null,
    error: null,
    cascade: CASCADE,
    modal_visible: false,
    seen_done: false,
  };
}

// IMPORTANT : getServerSnapshot et getSnapshot doivent retourner une référence
// STABLE quand rien n'a changé, sinon React déclenche un infinite re-render
// loop (cf. "The result of getServerSnapshot should be cached"). On garde donc
// l'objet `state` muté par référence stable + un objet `EMPTY_JOB` figé pour
// le SSR.
const EMPTY_JOB = Object.freeze(makeEmptyJob());

let state = makeEmptyJob();
const listeners = new Set();
let tickInterval = null;
let timeoutTimer = null;
let currentAbortController = null;

function notify() {
  for (const l of listeners) l();
}

function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

function startTicker() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    if (state.status === 'loading' && state.startedAt) {
      setState({ elapsed_ms: Date.now() - state.startedAt });
    }
  }, 1000);
}

function stopTicker() {
  if (tickInterval) clearInterval(tickInterval);
  tickInterval = null;
}

function clearTimeoutTimer() {
  if (timeoutTimer) clearTimeout(timeoutTimer);
  timeoutTimer = null;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function getServerSnapshot() {
  return EMPTY_JOB;
}

/**
 * Hook React : retourne le snapshot courant et re-render à chaque update.
 * Utilisable depuis n'importe quel composant client.
 */
export function useMemoJob() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Lance un nouveau job. Si un job loading existe déjà, on l'écrase (le précédent
 * était orphelin de toute façon). Le fetch tourne en background.
 *
 * @param {{ payload, oracle?, userQuestion?, audience?, title?, scenarioLabel? }} req
 */
export function startMemoJob(req) {
  // Si un job loading existe → abort
  if (currentAbortController && state.status === 'loading') {
    try { currentAbortController.abort(); } catch {}
  }
  clearTimeoutTimer();
  currentAbortController = new AbortController();

  const id = `memo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  setState({
    ...makeEmptyJob(),
    id,
    status: 'loading',
    startedAt: Date.now(),
    elapsed_ms: 0,
    scenario_label: req.scenarioLabel || 'Simulator scenario',
    request: req,
    modal_visible: true,
    seen_done: false,
  });
  startTicker();

  const signal = currentAbortController.signal;
  let timedOut = false;
  timeoutTimer = setTimeout(() => {
    if (state.id !== id || state.status !== 'loading') return;
    timedOut = true;
    try { currentAbortController?.abort(); } catch {}
  }, MEMO_CLIENT_TIMEOUT_MS);
  fetch('/api/admin/hearst/strategic-memo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: req.payload,
      oracle: req.oracle,
      user_question: req.userQuestion,
      audience: req.audience,
      // Preserve the Scenario → Memo → Dossier linkage. The persistence layer
      // (strategic-memo-store) already stores these; only the caller was missing them.
      scenario_id: req.scenarioId ?? null,
      project_id: req.projectId ?? null,
    }),
    signal,
  })
    .then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const msg = r.status === 429
          ? 'Rate limited. Wait a minute and retry.'
          : body.error || `HTTP ${r.status}`;
        throw new Error(msg);
      }
      return r.json();
    })
    .then((data) => {
      // Ne pas écraser si entretemps un nouveau job a été lancé
      if (state.id !== id) return;
      clearTimeoutTimer();
      stopTicker();
      setState({
        status: 'done',
        finishedAt: Date.now(),
        elapsed_ms: state.startedAt ? Date.now() - state.startedAt : 0,
        result: {
          memo: data.memo,
          meta: {
            model_used: data.model_used,
            generated_at: data.generated_at,
            // Persisted DB row ({ id, version, status, created_at }) so the
            // success state can route straight to the Dossier Decision Canvas.
            persisted: data.persisted || null,
            oracle_ctx: data.oracle_ctx,
            intelligence_brief: data.intelligence_brief || null,
            live_intelligence: data.live_intelligence || null,
            visualization: data.visualization || null,
            explainability_seed: data.explainability_seed || null,
            audience: data.audience || req.audience || 'investor',
          },
        },
        error: null,
        seen_done: state.modal_visible,
      });
    })
    .catch((e) => {
      if (state.id !== id) return;
      clearTimeoutTimer();
      stopTicker();
      const wasClientTimeout = timedOut || signal?.reason === 'client_timeout';
      setState({
        status: 'error',
        finishedAt: Date.now(),
        elapsed_ms: state.startedAt ? Date.now() - state.startedAt : 0,
        error: wasClientTimeout
          ? 'Memo generation timed out after 300s. Try again, or reduce the scenario context.'
          : e?.name === 'AbortError'
            ? 'Memo generation was cancelled.'
            : e?.message || 'Unknown error',
      });
    });

  return id;
}

/**
 * Ferme la modale visuellement mais NE TUE PAS le job en cours.
 * Le badge bottom-right + toast prennent le relais.
 */
export function hideMemoModal() {
  setState({ modal_visible: false });
}

/**
 * Ré-affiche la modale (au click sur le badge ou le toast).
 * Marque le job comme "vu" pour planquer le toast done.
 */
export function showMemoModal() {
  setState({ modal_visible: true, seen_done: true });
}

/**
 * Marque la notification "done" comme vue (toast auto-dismiss).
 */
export function markSeenDone() {
  setState({ seen_done: true });
}

/**
 * Reset complet : annule fetch en cours + clear le state.
 * À appeler depuis un bouton "Discard" explicite.
 */
export function clearMemoJob() {
  if (currentAbortController) {
    try { currentAbortController.abort(); } catch {}
  }
  currentAbortController = null;
  clearTimeoutTimer();
  stopTicker();
  state = makeEmptyJob();
  notify();
}

/**
 * Helper UI : format elapsed millisec en "1m23s" ou "23s".
 */
export function formatElapsed(ms) {
  if (!ms || ms < 1000) return '0s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m${(s % 60).toString().padStart(2, '0')}s`;
}

// estimateCurrentStage() retiré au Sprint 3.2 — c'était une heuristique
// cliente (25s par modèle) qui mentait sur la vraie position dans la cascade
// serveur. Le vrai modèle utilisé est révélé via meta.model_used au retour
// du job. Pour un vrai stage live, il faudrait passer l'endpoint en SSE.
