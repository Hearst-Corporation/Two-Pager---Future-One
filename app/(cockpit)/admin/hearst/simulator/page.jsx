'use client';

import { useReducer, useState, useEffect, useCallback, useDeferredValue, useRef } from 'react';
import { useRouter } from 'next/navigation';

import {
  INITIAL_STATE, ACTIONS, simulatorReducer,
  buildSimulatePayload, serializeStateToUrl, parseStateFromUrl, QATAR_PRESETS,
} from '@/lib/hearst-simulator-state';
import { DEAL_ARCHETYPES, SCENARIO_WRITABLE_KEYS } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { useSimulation } from '@/lib/hearst-simulation-context';

import { SIMULATOR_PARAM_EVENT } from '@/lib/hearst-simulator-bridge';
import InputModeSwitcher from '@/components/hearst/simulator/InputModeSwitcher';
import InputFieldHero from '@/components/hearst/simulator/InputFieldHero';
import ArchetypePicker from '@/components/hearst/simulator/ArchetypePicker';
import HardwareMixer from '@/components/hearst/simulator/HardwareMixer';

const VIZ_TABS = [
  { id: 'radar',   label: 'Strengths' },
  { id: 'network', label: 'Industry players' },
  { id: 'matrix',  label: 'Who buys what' },
  { id: 'sankey',  label: 'Money flow' },
];

// The 4 operating models the real market actually runs at scale. The other 4
// (branded JV, in-house O&M, hidden operator, build & sell) are variants/exotic
// and stay in the data layer (engine, radar) but are hidden from the picker.
const PRIMARY_MODEL_IDS = ['powered_shell', 'neocloud_gpu', 'hyperscaler_self_build', 'sovereign_ai'];
const PRIMARY_ARCHETYPES = DEAL_ARCHETYPES.filter(a => PRIMARY_MODEL_IDS.includes(a.id));

// Highlights the active scenario card when the current config matches a preset.
function matchScenarioPreset(state) {
  const p = QATAR_PRESETS.find(q =>
    q.mode === state.mode &&
    q.primary_archetype_id === state.primary_archetype_id &&
    (q.mode === 'capital_first' ? q.capital_usd === state.capital_usd : q.total_mw === state.total_mw),
  );
  return p?.id || null;
}
// Human one-liner under each scenario card — never expose raw archetype ids.
function scenarioPresetSub(p) {
  if (p.mode === 'capital_first') return `$${(p.capital_usd / 1e9).toFixed(1)}B budget`;
  if (p.mode === 'target_irr_first') return `${p.target_irr_pct}% target return`;
  return `${p.total_mw} MW`;
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
        // Validate against VIZ_TABS so an out-of-catalogue value can't blank the panel.
        case 'active_viz':            return VIZ_TABS.some(t => t.id === value) ? dispatch({ type: ACTIONS.SET_ACTIVE_VIZ, value }) : undefined;
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
  useEffect(() => {
    setDirtySinceSave(true);
    setSimResult(null);
    setSimError(null);
  }, [state]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/hearst/project');
        if (r.ok) {
          const { project } = await r.json();
          setProjectId(project?.id);
        }
      } catch {}
    })();
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
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSimError(null);
      try {
        const payload = buildSimulatePayload(deferredState);
        const r = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setSimError(body.error || `Simulate failed (${r.status})`);
          setSimResult(null);
        } else {
          const data = await r.json();
          setSimResult(data);
          setSimError(null);
        }
      } catch (e) {
        setSimError(e.message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [deferredState]);

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
      @media (max-width: 1500px) {
        [data-sim-command-deck] {
          grid-template-columns: 1fr !important;
        }
        [data-sim-command-intro] {
          border-bottom: 1px solid var(--cp-border) !important;
          padding-bottom: var(--cp-space-5, 20px) !important;
          min-height: 0 !important;
          grid-template-columns: 1fr !important;
          align-items: start !important;
        }
        [data-sim-command-copy] {
          max-width: 720px !important;
        }
        [data-sim-command-grid],
        [data-hardware-stack],
        [data-archetype-grid] {
          grid-template-columns: 1fr !important;
        }
      }
      @media (max-width: 1120px) {
        body.oracle-simulator-page .ct-rail-right {
          width: 312px !important;
          min-width: 312px !important;
          flex: 0 0 312px !important;
        }
        [data-sim-preset-grid],
        [data-hardware-summary],
        [data-hardware-gpu-grid] {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
    <div style={S.wrap}>
      <header style={S.header}>
        <div style={S.headerText}>
          <span style={S.eyebrow}>Oracle capital cockpit</span>
          <h1 style={S.title}>Investment Simulator</h1>
          <p style={S.subtitle}>Shape a Qatar AI/data-center thesis from capital, operating model and GPU density.</p>
        </div>
        {loading && <div style={S.loadingBadge}>Calculating…</div>}
      </header>

      <section data-sim-command-deck style={S.commandDeck}>
        <div data-sim-command-intro style={S.commandIntro}>
          <div style={S.commandIntroTitleBlock}>
            <span style={S.stepPill}>01 · Build brief</span>
            <h2 style={S.commandTitle}>Set the investment constraint, then size the machine.</h2>
          </div>
          <p data-sim-command-copy style={S.commandCopy}>Pick how the IC wants to think first: budget, power capacity, or target return. The simulator keeps the downstream scenario coherent.</p>
        </div>
        <div data-sim-command-grid style={S.commandGrid}>
        <section style={S.commandPanel}>
          <header style={S.panelHead}>
            <span style={S.panelKicker}>Starting Point</span>
            <h3 style={S.panelTitle}>Choose the control variable</h3>
          </header>
          <InputModeSwitcher
            mode={state.mode}
            onChange={onModeChange}
            onBootstrap={onBootstrap}
          />
        </section>

        <section style={{ ...S.commandPanel, ...S.commandPanelPrimary }}>
          <header style={S.panelHead}>
            <span style={S.panelKicker}>Project Size / Targets</span>
            <h3 style={S.panelTitle}>Calibrate the initial scenario</h3>
          </header>
          <div data-sim-preset-grid style={S.presetCards} role="group" aria-label="Ready scenarios">
            {QATAR_PRESETS.map(p => {
              const active = activeScenarioPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPreset(p)}
                  style={{ ...S.presetCard, ...(active ? S.presetCardActive : {}) }}>
                  <span style={S.presetCardName}>{p.label}</span>
                  <span style={{ ...S.presetCardSub, ...(active ? S.presetCardSubActive : {}) }}>{scenarioPresetSub(p)}</span>
                </button>
              );
            })}
          </div>
          <InputFieldHero
            mode={state.mode}
            value={inputValue}
            onChange={onInputChange}
            derived={simResult?.derived}
            solver={simResult?.solver}
          />
          {state.mode === 'target_irr_first' && (
            <div style={S.leverPanel}>
              <span style={S.leverLabel}>What to change</span>
              <div style={S.leverPills}>
                {[
                  { id: 'pricing',      label: 'Pricing' },
                  { id: 'capex_per_mw', label: 'Build cost' },
                  { id: 'leverage',     label: 'Debt level' },
                  { id: 'mw',           label: 'Size (MW)' },
                ].map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => dispatch({ type: ACTIONS.SET_IRR_LEVER, value: l.id })}
                    style={{ ...S.leverBtn, ...(state.target_irr_lever === l.id ? S.leverBtnActive : {}) }}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        </div>
      </section>

      {/* 2. OPERATING MODEL */}
      <section style={S.boardSection}>
        <header style={S.boardHead}>
          <div>
            <span style={S.stepPill}>02 · Operating thesis</span>
            <h2 style={S.sectionTitle}>Operating Model</h2>
          </div>
          <span style={S.counterChip}>Choose one operating thesis</span>
        </header>
        <ArchetypePicker
          archetypes={PRIMARY_ARCHETYPES}
          primaryId={state.primary_archetype_id}
          onSelectPrimary={onSelectPrimary}
        />
      </section>

      {/* 4. HARDWARE ALLOCATION */}
      <section style={S.boardSection}>
        <header style={S.boardHead}>
          <div>
            <span style={S.stepPill}>03 · Technology stack</span>
            <h2 style={S.sectionTitle}>Hardware Allocation</h2>
          </div>
          <span style={S.sectionSubtitle}>Power mix, rack density and GPU economics</span>
        </header>
        <HardwareMixer
          totalMw={scenario?.total_mw || state.total_mw}
          value={state.hardware_mix}
          onChange={onHwChange}
        />
      </section>

      {simError && <div style={S.error}>Error: {simError}</div>}

      {/* VALIDATE CONFIG → dedicated results page */}
      <div style={S.validateBar}>
        <span style={S.validateHint}>
          {simError ? 'Fix the error above to continue.'
            : loading ? 'Calculating…'
            : !projectId ? 'Loading project…'
            : savingState === 'saving' ? 'Saving your scenario…'
            : projection ? 'Configuration ready.'
            : 'Fill in your numbers to run the simulation.'}
        </span>
        <button
          type="button"
          disabled={validateBlocked}
          onClick={handleValidateAndReveal}
          style={{ ...S.validateBtn, ...(validateBlocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}>
          {savingState === 'saving' ? 'Saving…' : 'Validate & see results →'}
        </button>
      </div>
      {saveError && (
        <div style={S.error} role="alert">Could not save: {saveError}</div>
      )}
      {/* Modal/badge/toast mountés globalement dans app/(cockpit)/admin/hearst/layout.jsx */}
    </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Design tokens — local
// spacing 4-base {4,8,16,24,32,48,96} · radius {8,12,999} · font {11,12,13,16,28,44}
// ────────────────────────────────────────────────────────────
const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-5, 20px)',
    maxWidth: 1280,
    margin: '0 auto',
    padding: 'var(--cp-space-6, 24px) var(--cp-space-8, 32px) 180px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 'var(--cp-space-4, 16px)',
    flexWrap: 'wrap',
    padding: 'var(--cp-space-5, 20px)',
    background: 'linear-gradient(135deg, color-mix(in srgb, var(--cp-accent-maroon) 22%, transparent), var(--cp-surface-2) 52%, var(--cp-surface-0))',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg, 14px)',
    boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--cp-text-strong) 8%, transparent)',
  },
  eyebrow: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro, 10px)',
    fontWeight: 900,
    letterSpacing: 'var(--cp-tracking-eyebrow, 0.14em)',
    textTransform: 'uppercase',
  },
  headerText: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1, 4px)' },
  title: {
    fontSize: 'clamp(30px, 3vw, 44px)',
    lineHeight: '0.98',
    fontWeight: 900,
    letterSpacing: -1.4,
    color: 'var(--cp-text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: 'var(--cp-font-base, 13px)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
    color: 'var(--cp-text-muted)',
    maxWidth: 560,
  },
  loadingBadge: {
    fontSize: 'var(--cp-font-sm)',
    padding: 'var(--cp-space-2, 8px) var(--cp-space-4, 16px)',
    background: 'var(--cp-accent-soft)',
    color: 'var(--cp-text-strong)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flexShrink: 0,
  },

  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 'var(--cp-space-4, 16px)',
    alignItems: 'stretch',
  },

  commandDeck: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--cp-space-4, 16px)',
    alignItems: 'start',
    padding: 'var(--cp-space-4, 16px)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg, 14px)',
    minWidth: 0,
  },
  commandIntro: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 0.55fr) minmax(280px, 0.45fr)',
    alignItems: 'end',
    columnGap: 'var(--cp-space-6, 24px)',
    rowGap: 'var(--cp-space-3, 12px)',
    paddingBottom: 'var(--cp-space-4, 16px)',
    borderBottom: '1px solid var(--cp-border)',
  },
  commandIntroTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3, 12px)',
  },
  stepPill: {
    width: 'fit-content',
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro, 10px)',
    fontWeight: 900,
    letterSpacing: 'var(--cp-tracking-eyebrow, 0.14em)',
    textTransform: 'uppercase',
  },
  commandTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'clamp(20px, 2vw, 26px)',
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: -0.8,
    maxWidth: 440,
  },
  commandCopy: {
    margin: 0,
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-base, 13px)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
    maxWidth: 460,
  },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--cp-space-4, 16px)',
    alignItems: 'start',
    justifyItems: 'stretch',
  },
  commandPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4, 16px)',
    minWidth: 0,
    alignSelf: 'start',
    width: '100%',
    padding: 'var(--cp-space-3, 12px)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 10px)',
  },
  commandPanelPrimary: {
    background: 'linear-gradient(180deg, var(--cp-surface-1), color-mix(in srgb, var(--cp-accent-maroon) 10%, var(--cp-surface-1)))',
  },
  panelHead: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1, 4px)' },
  panelKicker: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro, 10px)',
    fontWeight: 900,
    letterSpacing: 'var(--cp-tracking-eyebrow, 0.14em)',
    textTransform: 'uppercase',
  },
  panelTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg, 16px)',
    fontWeight: 800,
  },
  presetCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 'var(--cp-space-2, 8px)',
  },
  presetCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1, 4px)',
    minHeight: 64,
    padding: 'var(--cp-space-3, 12px)',
    background: 'var(--cp-surface-0)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'var(--cp-text-primary)',
    transition: 'all 0.15s ease',
  },
  presetCardActive: {
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-maroon)',
  },
  presetCardName: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 700,
    lineHeight: '16px',
  },
  presetCardSub: {
    fontSize: 'var(--cp-font-xs, 11px)',
    fontWeight: 600,
    color: 'var(--cp-text-muted)',
    letterSpacing: 0.2,
  },
  presetCardSubActive: { color: 'var(--cp-text-strong)', opacity: 0.85 },
  validateBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4, 16px)',
    padding: 'var(--cp-space-5, 20px) var(--cp-space-6, 24px)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 10px)',
    flexWrap: 'wrap',
  },
  validateHint: {
    fontSize: 'var(--cp-font-base, 13px)',
    color: 'var(--cp-text-muted)',
    fontWeight: 600,
  },
  validateBtn: {
    height: 44,
    padding: '0 var(--cp-space-6, 24px)',
    fontSize: 'var(--cp-font-base, 13px)',
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 'var(--cp-radius-md, 8px)',
    cursor: 'pointer',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4, 16px)',
    width: '100%',
    minWidth: 0,
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3, 12px)',
    minHeight: 32,
    flexWrap: 'wrap',
  },
  boardSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4, 16px)',
    width: '100%',
    minWidth: 0,
    padding: 'var(--cp-space-6, 24px)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg, 14px)',
  },
  boardHead: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4, 16px)',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 'var(--cp-font-xl, 20px)',
    lineHeight: 'var(--cp-leading-tight, 1.3)',
    fontWeight: 900,
    color: 'var(--cp-text-primary)',
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-muted)',
  },
  counterChip: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 600,
    padding: 'var(--cp-space-1, 4px) var(--cp-space-3, 12px)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    color: 'var(--cp-text-muted)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    letterSpacing: 0.5,
  },
  subsection: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2, 8px)', marginTop: 'var(--cp-space-2, 8px)', minHeight: 0, position: 'relative' },
  subTitle: {
    fontSize: 'var(--cp-font-base)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
    fontWeight: 600,
    color: 'var(--cp-text-primary)',
    margin: 0,
    letterSpacing: 0.2,
  },

  error: {
    padding: 'var(--cp-space-3, 12px) var(--cp-space-4, 16px)',
    background: 'var(--cp-accent-soft)',
    color: 'var(--cp-text-strong)',
    border: '1px solid var(--cp-accent)',
    borderRadius: 'var(--cp-radius-md, 10px)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 600,
  },

  leverPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-4, 16px)',
    padding: 'var(--cp-space-4, 16px) var(--cp-space-6, 24px)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 10px)',
    flexWrap: 'wrap',
  },
  leverLabel: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 600,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  leverPills: { display: 'flex', gap: 'var(--cp-space-2, 8px)', flexWrap: 'wrap' },
  leverBtn: {
    fontSize: 'var(--cp-font-sm)',
    height: 32,
    padding: '0 var(--cp-space-4, 16px)',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    cursor: 'pointer',
    fontWeight: 600,
  },
  leverBtnActive: {
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-accent-maroon)',
  },

};
