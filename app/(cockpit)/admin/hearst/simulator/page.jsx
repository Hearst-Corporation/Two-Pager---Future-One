'use client';

import { useReducer, useState, useEffect, useCallback, useDeferredValue, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  INITIAL_STATE, ACTIONS, simulatorReducer,
  buildSimulatePayload, serializeStateToUrl, parseStateFromUrl, QATAR_PRESETS,
} from '@/lib/hearst-simulator-state';
import { SCENARIO_WRITABLE_KEYS } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { useSimulation } from '@/lib/hearst-simulation-context';

import { SIMULATOR_PARAM_EVENT } from '@/lib/hearst-simulator-bridge';
import { UI } from '@/lib/ui-strings';
import { S as CP } from '@/lib/cp-styles';

import SimulatorHeader from '@/components/hearst/simulator/sections/SimulatorHeader';
import InvestmentBriefStep from '@/components/hearst/simulator/sections/InvestmentBriefStep';
import OperatingModelStep from '@/components/hearst/simulator/sections/OperatingModelStep';
import TechnologyStackStep from '@/components/hearst/simulator/sections/TechnologyStackStep';
import { Button, Card } from '@/components/hearst/ui';

// Valid viz tab ids — the chat bridge may set active_viz for the dedicated /results
// page (single source of truth: VIZ_META). This config page stays results-free.
const VIZ_TAB_IDS = new Set(['radar', 'network', 'matrix', 'sankey']);

// Highlights the active scenario card when the current config matches a preset.
function matchScenarioPreset(state) {
  const p = QATAR_PRESETS.find(q =>
    q.mode === state.mode &&
    q.primary_archetype_id === state.primary_archetype_id &&
    (q.mode === 'capital_first' ? q.capital_usd === state.capital_usd : q.total_mw === state.total_mw),
  );
  return p?.id || null;
}

export default function SimulatorPage() {
  const router = useRouter();
  const { setAdvisorContext } = useSimulation();

  const [state, dispatch] = useReducer(simulatorReducer, INITIAL_STATE);
  const deferredState = useDeferredValue(state);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const fromUrl = parseStateFromUrl(sp);
    if (fromUrl) dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: fromUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.classList.add('oracle-simulator-page');
    return () => document.body.classList.remove('oracle-simulator-page');
  }, []);

  // Mode 'pro' is now the only mode in Wave 1 (C17).

  // Chat → simulator bridge (SIMULATOR_PARAM_EVENT). NOTE: this is a ready-to-wire
  // CONTRACT, not a live feature in this repo — no chat currently emits the event
  // (ChatContainer isn't mounted; the CockpitShell rail hits /api/cockpit-chat, a
  // text proxy with no tools). The `default: return` guard makes unknown fields
  // no-ops. Test in isolation via:
  //   window.dispatchEvent(new CustomEvent('hearst.simulator.set_param', {detail:{field:'total_mw',value:120}}))
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handler(e) {
      const { field, value } = e.detail || {};
      if (!field) return;
      switch (field) {
        case 'total_mw':              return dispatch({ type: ACTIONS.SET_MW, value: Number(value) });
        case 'capital_usd':           return dispatch({ type: ACTIONS.SET_CAPITAL, value: Number(value) });
        case 'target_irr_pct':        return dispatch({ type: ACTIONS.SET_IRR_TARGET, value: Number(value) });
        case 'target_irr_lever':      return dispatch({ type: ACTIONS.SET_IRR_LEVER, value: String(value) });
        // Changing the model also applies its canonical buyer/product pair, exactly
        // like clicking an operating-model card → never an off-grid combo.
        case 'primary_archetype_id': {
          const def = MODEL_DEFAULTS[String(value)];
          return dispatch({ type: ACTIONS.APPLY_PRESET, value: { primary_archetype_id: String(value), ...(def || {}) } });
        }
        case 'compare_archetype_id':  return dispatch({ type: ACTIONS.TOGGLE_COMPARE_ARCHETYPE, value: String(value) });
        case 'business_model_id':     return dispatch({ type: ACTIONS.SET_BUSINESS_MODEL, value: String(value) });
        case 'client_type_id':        return dispatch({ type: ACTIONS.SET_CLIENT_TYPE, value: String(value) });
        case 'mode':                  return dispatch({ type: ACTIONS.SET_MODE, value: String(value) });
        case 'geography':             return dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: { geography: String(value) } });
        // Validate against VIZ_TAB_IDS so an out-of-catalogue value can't blank the panel.
        case 'active_viz':            return VIZ_TAB_IDS.has(value) ? dispatch({ type: ACTIONS.SET_ACTIVE_VIZ, value }) : undefined;
        // Whole-bundle apply (size + model + hardware in one shot) — the safe path
        // for multi-field changes; resolves a QATAR_PRESETS id.
        case 'apply_preset': {
          const p = QATAR_PRESETS.find(q => q.id === value);
          if (!p) return;
          const { id: _id, label: _label, ...payload } = p;
          return dispatch({ type: ACTIONS.APPLY_PRESET, value: payload });
        }
        case 'hardware_mix.classic_pct':
        case 'hardware_mix.liquid_pct':
        case 'hardware_mix.ai_pct':
        case 'hardware_mix.gpu_sku_id':
        case 'hardware_mix.num_racks':
        case 'hardware_mix.utilization_pct':
        case 'hardware_mix.gpu_hour_price': {
          const key = field.split('.')[1];
          return dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: { [key]: typeof value === 'number' ? value : Number(value) || value } });
        }
        default: return;
      }
    }
    window.addEventListener(SIMULATOR_PARAM_EVENT, handler);
    return () => window.removeEventListener(SIMULATOR_PARAM_EVENT, handler);
  }, []);

  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingState, setSavingState] = useState('idle');
  const [projectId, setProjectId] = useState(null);
  // Last saved scenario — carries the Scenario → Memo → Dossier linkage so a
  // generated memo is persisted with its scenario_id. Set on Save and on reopen.
  const [savedScenarioId, setSavedScenarioId] = useState(null);
  const [projectLoadError, setProjectLoadError] = useState(null);
  // dirtySinceSave: true whenever the config changed since the last successful
  // save. Gates re-save on Validate / Generate Memo so we never persist a
  // duplicate row nor build a memo on a stale scenario.
  const [dirtySinceSave, setDirtySinceSave] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const debounceRef = useRef(null);
  const saveTimerRef = useRef(null);
  const savingRef = useRef(false); // synchronous double-click guard for Validate
  const resultsNavigationRef = useRef(false); // prevents URL sync from racing results navigation
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  // Any config change marks the scenario dirty and invalidates the previous
  // projection. Without this, a fast preset → validate click can save stale
  // numbers from the prior configuration before the debounced /simulate returns.
  // Ref-guarded so that active_viz changes (which buildSimulatePayload omits)
  // are no-ops — preserves the synchronous stale-numbers guard.
  const prevSimKeyRef = useRef(null);
  useEffect(() => {
    const next = JSON.stringify(buildSimulatePayload(state)); // state, NOT deferredState
    if (next !== prevSimKeyRef.current) {
      prevSimKeyRef.current = next;
      setDirtySinceSave(true);
      setSimResult(null);
      setSimError(null);
    }
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) setProjectLoadError('Project load timed out — please refresh.');
    }, 8000);
    (async () => {
      try {
        const r = await fetch('/api/admin/hearst/project');
        clearTimeout(t);
        if (cancelled) return;
        if (r.ok) {
          const { project } = await r.json();
          setProjectId(project?.id);
        } else {
          setProjectLoadError(`Project unavailable (${r.status}) — please refresh.`);
        }
      } catch (e) {
        clearTimeout(t);
        if (!cancelled) setProjectLoadError(`Project load failed: ${e.message}`);
      }
    })();
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Reopen: Workspace links to /admin/hearst/simulator?scenario=<id>. Read the id
  // (client-only, no Suspense needed), fetch the persisted row, and hydrate the
  // reducer from input_mode / input_value / hardware_mix. Archetype has no column
  // → fall back to the default. The saved scenario id is kept so a memo generated
  // from the reopened scenario links straight back to it.
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('scenario');
    if (!sid) return;
    (async () => {
      try {
        const r = await fetch(`/api/admin/hearst/scenarios/${sid}`);
        if (!r.ok) return;
        const row = (await r.json())?.scenario;
        if (!row) return;
        const patch = {};
        if (row.input_mode) patch.mode = row.input_mode;
        if (row.geography) patch.geography = row.geography;
        const iv = row.input_value || {};
        if (row.input_mode === 'capital_first' && iv.total_capex_usd != null) patch.capital_usd = iv.total_capex_usd;
        else if (row.input_mode === 'target_irr_first') {
          if (iv.target_irr_pct != null) patch.target_irr_pct = iv.target_irr_pct;
          if (iv.lever) patch.target_irr_lever = iv.lever;
          if (iv.total_mw != null) patch.total_mw = iv.total_mw;
        } else if (iv.total_mw != null) patch.total_mw = iv.total_mw;
        if (row.hardware_mix) patch.hardware_mix = { ...INITIAL_STATE.hardware_mix, ...row.hardware_mix };
        if (row.primary_archetype_id) patch.primary_archetype_id = row.primary_archetype_id;
        dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: patch });
        setSavedScenarioId(sid);
      } catch (e) {
        console.warn('[simulator] failed to reopen scenario:', e.message);
      }
    })();
  }, []);

  // simKey: JSON of the simulate payload derived from deferredState.
  // buildSimulatePayload omits active_viz, so viz tab clicks leave simKey unchanged
  // → no redundant POST /simulate. The mark-dirty effect above uses state directly
  // (NOT simKey) to remain synchronous — two different keys by design (P0).
  const simKey = useMemo(() => JSON.stringify(buildSimulatePayload(deferredState)), [deferredState]);

  useEffect(() => {
    let ignore = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSimError(null);
      try {
        const payload = buildSimulatePayload(deferredState);
        const r = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, project_id: projectId || undefined }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          if (!ignore) {
            setSimError(body.error || `Simulate failed (${r.status})`);
            setSimResult(null);
          }
        } else {
          const data = await r.json();
          if (!ignore) {
            setSimResult(data);
            setSimError(null);
          }
        }
      } catch (e) {
        if (!ignore) setSimError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(debounceRef.current);
    };
  }, [simKey, projectId]);

  useEffect(() => {
    if (resultsNavigationRef.current) return;
    const params = new URLSearchParams(serializeStateToUrl(state));
    if (savedScenarioId) params.set('scenario', savedScenarioId);
    router.replace(`/admin/hearst/simulator?${params.toString()}`, { scroll: false });
  }, [state, savedScenarioId, router]);

  const projection = simResult?.projection;
  const scenario = simResult?.scenario;
  const archetypeOutcome = simResult?.archetype_outcome;

  useEffect(() => {
    setAdvisorContext?.({
      surface: 'simulator',
      state,
      scenario,
      projection,
      simResult,
      loading,
      error: simError,
      savedScenarioId,
    });
    return () => setAdvisorContext?.(null);
  }, [loading, projection, savedScenarioId, scenario, setAdvisorContext, simError, simResult, state]);

  const onModeChange = useCallback((v) => dispatch({ type: ACTIONS.SET_MODE, value: v }), []);
  const onSelectPrimary = useCallback((id) => {
    // Selecting an operating model also sets its canonical buyer/product pair
    // (MODEL_DEFAULTS) in one dispatch, so the B2B matrix stays on-grid and the
    // engine never gets an incoherent archetype × business_model combo.
    const def = MODEL_DEFAULTS[id];
    dispatch({ type: ACTIONS.APPLY_PRESET, value: { primary_archetype_id: id, ...(def || {}) } });
  }, []);
  const onPreset = useCallback((p) => {
    const { id: _id, label: _label, ...payload } = p;
    dispatch({ type: ACTIONS.APPLY_PRESET, value: payload });
  }, []);
  const onBootstrap = useCallback(() => {
    dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: { geography: 'qatar' } });
  }, []);
  const onHwChange = useCallback((next) => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: next }), []);

  const inputValue = state.mode === 'capital_first' ? state.capital_usd
    : state.mode === 'target_irr_first' ? state.target_irr_pct
    : state.total_mw;
  const onInputChange = useCallback((val) => {
    if (state.mode === 'capital_first') dispatch({ type: ACTIONS.SET_CAPITAL, value: val });
    else if (state.mode === 'target_irr_first') dispatch({ type: ACTIONS.SET_IRR_TARGET, value: val });
    else dispatch({ type: ACTIONS.SET_MW, value: val });
  }, [state.mode]);

  const onSetIrrLever = useCallback((id) => dispatch({ type: ACTIONS.SET_IRR_LEVER, value: id }), []);

  // Returns the saved scenario id (string) on success, null on failure.
  async function handleSave() {
    if (!projectId || !scenario) return null;
    setSavingState('saving');
    setSaveError(null);
    try {
      const writable = {};
      for (const k of SCENARIO_WRITABLE_KEYS) {
        if (scenario[k] !== undefined) writable[k] = scenario[k];
      }
      const name = `Plan — ${archetypeOutcome?.label || 'Custom'} ${state.total_mw || ''}MW (${new Date().toISOString().slice(0, 10)})`;
      const r = await fetch('/api/admin/hearst/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name,
          scenario_type: 'custom',
          ...writable,
          input_mode: state.mode,
          input_value: buildSimulatePayload(state).input_value,
          hardware_mix: state.hardware_mix,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }
      const data = await r.json();
      const newId = data.scenario?.id || null;
      setSavedScenarioId(newId);
      setDirtySinceSave(false);
      setSaveError(null);
      setSavingState('saved');
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSavingState('idle'), 2500);
      return newId;
    } catch (e) {
      setSavingState('idle');
      setSaveError(e.message || 'Save failed');
      return null;
    }
  }

  // Validate = persist THEN navigate to the dedicated results page. The graphs
  // live in /admin/hearst/simulator/results; this page stays configuration-only.
  // Synchronous savingRef guards
  // against a double-click creating two rows before the first re-render.
  async function handleValidateAndReveal() {
    if (savingRef.current) return;
    if (!projection || !projectId || loading || simError) return;
    savingRef.current = true;
    try {
      let id = savedScenarioId;
      if (!id || dirtySinceSave) id = await handleSave();
      if (!id) return; // save failed → stay on config, inline error already shown
      resultsNavigationRef.current = true;
      const params = new URLSearchParams({
        scenario: id,
        arch: state.primary_archetype_id,
        biz: state.business_model_id,
        client: state.client_type_id,
      });
      router.push(`/admin/hearst/simulator/results?${params.toString()}`);
    } finally {
      savingRef.current = false;
    }
  }

  const validateBlocked = !projection || !projectId || loading || !!simError || savingState === 'saving';
  const activeScenarioPreset = matchScenarioPreset(state);

  return (
    <>
    <style>{`
      @media (max-width: 900px) {
        /* Hardware grids own their breakpoints (HardwareMixer, 1100/1500px). */
        [data-brief-bar-row],
        [data-archetype-grid] {
          grid-template-columns: 1fr !important;
        }
        [data-sim-preset-grid] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
      @media (max-width: 600px) {
        [data-sim-preset-grid],
        [data-hardware-summary],
        [data-hardware-gpu-grid] {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
    <div className="oracle-page">
      <div data-sim-wrap style={S.wrap}>
        <SimulatorHeader loading={loading} />
        <InvestmentBriefStep
          mode={state.mode}
          inputValue={inputValue}
          activeScenarioPreset={activeScenarioPreset}
          projection={projection}
          scenario={scenario}
          derived={simResult?.derived}
          solver={simResult?.solver}
          targetIrrLever={state.target_irr_lever}
          onModeChange={onModeChange}
          onBootstrap={onBootstrap}
          onPreset={onPreset}
          onInputChange={onInputChange}
          onSetIrrLever={onSetIrrLever}
        />
        <OperatingModelStep primaryId={state.primary_archetype_id} onSelectPrimary={onSelectPrimary} />
        <TechnologyStackStep totalMw={scenario?.total_mw || state.total_mw} value={state.hardware_mix} onChange={onHwChange} />

        {projectLoadError && (
          <div className="cp-surface-accent-soft" style={{ ...CP.accentAlert, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--cp-space-3)' }} role="alert">
            <span>{projectLoadError}</span>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>{UI.ACTION_RETRY}</Button>
          </div>
        )}
        {simError && <div className="cp-surface-accent-soft" style={CP.accentAlert}>Error: {simError}</div>}

        {/* VALIDATE CONFIG → dedicated results page */}
        <Card style={S.validateBar} padding="md" surface={1}>
          <span style={S.validateHint}>
            {simError ? UI.SIM_FIX_ERROR
              : loading ? UI.STATE_CALCULATING
              : projectLoadError ? UI.SIM_PROJECT_UNAVAILABLE
              : !projectId ? UI.SIM_LOADING_PROJECT
              : savingState === 'saving' ? UI.SIM_SAVING_SCENARIO
              : projection ? UI.SIM_READY
              : UI.SIM_FILL}
          </span>
          <Button
            variant="primary"
            size="lg"
            disabled={validateBlocked}
            onClick={handleValidateAndReveal}
            style={{ textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wide)' }}
          >
            {savingState === 'saving' ? UI.SIM_SAVING : UI.SIM_VALIDATE}
          </Button>
        </Card>
        {saveError && (
          <div className="cp-surface-accent-soft" style={CP.accentAlert} role="alert">{UI.ERR_SAVE_DETAIL(saveError)}</div>
        )}
        {/* Modal/badge/toast montés globalement dans app/(cockpit)/admin/hearst/layout.jsx */}
      </div>
    </div>
    </>
  );
}

const S = {
  wrap: {
    width: '100%',
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-section-gap)',
    paddingBottom: 'var(--cp-scroll-clear)',
  },
  validateBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  validateHint: {
    fontSize: 'var(--cp-font-base)',
    color: 'var(--cp-text-muted)',
    fontWeight: 'var(--cp-weight-semibold)',
  },
};
