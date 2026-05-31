'use client';

import { useReducer, useState, useEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import {
  INITIAL_STATE, ACTIONS, simulatorReducer,
  buildSimulatePayload, serializeStateToUrl, parseStateFromUrl, QATAR_PRESETS,
} from '@/lib/hearst-simulator-state';
import { DEAL_ARCHETYPES, SCENARIO_WRITABLE_KEYS } from '@/lib/hearst-deal-structures';

import { SIMULATOR_PARAM_EVENT } from '@/components/hearst/ChatContainer';
import { startMemoJob } from '@/lib/hearst-memo-job-store';
import InputModeSwitcher from '@/components/hearst/simulator/InputModeSwitcher';
import InputFieldHero from '@/components/hearst/simulator/InputFieldHero';
import ArchetypePicker from '@/components/hearst/simulator/ArchetypePicker';
import HardwareMixer from '@/components/hearst/simulator/HardwareMixer';
import ArchetypeRadar from '@/components/hearst/simulator/ArchetypeRadar';
import B2BMatrix from '@/components/hearst/simulator/B2BMatrix';
import OutputKpiStrip from '@/components/hearst/simulator/OutputKpiStrip';
import ProjectionChart from '@/components/hearst/simulator/ProjectionChart';
import SimulatorCTABar from '@/components/hearst/simulator/SimulatorCTABar';

const EcosystemNetwork = dynamic(() => import('@/components/hearst/simulator/EcosystemNetwork'), {
  ssr: false,
  loading: () => <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cp-text-muted)' }}>Loading industry players…</div>,
});
const FinancialSankey = dynamic(() => import('@/components/hearst/simulator/FinancialSankey'), {
  ssr: false,
  loading: () => <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cp-text-muted)' }}>Loading money flow…</div>,
});
const GanttTimeline = dynamic(() => import('@/components/hearst/simulator/GanttTimeline'), {
  ssr: false,
  loading: () => <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cp-text-muted)' }}>Loading timeline…</div>,
});

const VIZ_TABS = [
  { id: 'radar',   label: 'Strengths' },
  { id: 'network', label: 'Industry players' },
  { id: 'matrix',  label: 'Who buys what' },
  { id: 'sankey',  label: 'Money flow' },
];

const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));

export default function SimulatorPage() {
  const router = useRouter();

  const [state, dispatch] = useReducer(simulatorReducer, INITIAL_STATE);
  const deferredState = useDeferredValue(state);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromUrl = parseStateFromUrl(new URLSearchParams(window.location.search));
    if (fromUrl) dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: fromUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mode 'pro' is now the only mode in Wave 1 (C17).

  // AgentRail bridge: agent set_simulator_param → reducer dispatch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handler(e) {
      const { field, value } = e.detail || {};
      if (!field) return;
      switch (field) {
        case 'total_mw':              return dispatch({ type: ACTIONS.SET_MW, value: Number(value) });
        case 'capital_usd':           return dispatch({ type: ACTIONS.SET_CAPITAL, value: Number(value) });
        case 'target_irr_pct':        return dispatch({ type: ACTIONS.SET_IRR_TARGET, value: Number(value) });
        case 'primary_archetype_id':  return dispatch({ type: ACTIONS.SET_PRIMARY_ARCHETYPE, value: String(value) });
        case 'business_model_id':     return dispatch({ type: ACTIONS.SET_BUSINESS_MODEL, value: String(value) });
        case 'client_type_id':        return dispatch({ type: ACTIONS.SET_CLIENT_TYPE, value: String(value) });
        case 'mode':                  return dispatch({ type: ACTIONS.SET_MODE, value: String(value) });
        case 'hardware_mix.classic_pct':
        case 'hardware_mix.liquid_pct':
        case 'hardware_mix.ai_pct':
        case 'hardware_mix.gpu_sku_id':
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
  // memo job piloté par le store global — plus de state local
  const [projectId, setProjectId] = useState(null);
  // Last saved scenario — carries the Scenario → Memo → Dossier linkage so a
  // generated memo is persisted with its scenario_id. Set on Save and on reopen.
  const [savedScenarioId, setSavedScenarioId] = useState(null);
  const debounceRef = useRef(null);
  const saveTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

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
    const qs = serializeStateToUrl(state);
    router.replace(`/admin/hearst/simulator?${qs}`, { scroll: false });
  }, [state, router]);

  const radarArchetypes = useMemo(() => {
    const ids = new Set([state.primary_archetype_id, ...(state.compare_archetype_ids || [])]);
    return Array.from(ids).map(id => ARCH_BY_ID[id]).filter(Boolean);
  }, [state.primary_archetype_id, state.compare_archetype_ids]);

  const projection = simResult?.projection;
  const scenario = simResult?.scenario;
  const archetypeOutcome = simResult?.archetype_outcome;

  const onModeChange = useCallback((v) => dispatch({ type: ACTIONS.SET_MODE, value: v }), []);
  const onSelectPrimary = useCallback((id) => dispatch({ type: ACTIONS.SET_PRIMARY_ARCHETYPE, value: id }), []);
  const onToggleCompare = useCallback((id) => dispatch({ type: ACTIONS.TOGGLE_COMPARE_ARCHETYPE, value: id }), []);
  const onPreset = useCallback((p) => {
    const { id, label, ...payload } = p;
    dispatch({ type: ACTIONS.APPLY_PRESET, value: payload });
  }, []);
  const onBootstrap = useCallback(() => {
    dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: { geography: 'qatar' } });
  }, []);
  const onHwChange = useCallback((next) => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: next }), []);
  const onCellClick = useCallback(({ businessModelId, clientTypeId }) => {
    dispatch({ type: ACTIONS.SET_BUSINESS_MODEL, value: businessModelId });
    dispatch({ type: ACTIONS.SET_CLIENT_TYPE, value: clientTypeId });
  }, []);

  const inputValue = state.mode === 'capital_first' ? state.capital_usd
    : state.mode === 'target_irr_first' ? state.target_irr_pct
    : state.total_mw;
  const onInputChange = useCallback((val) => {
    if (state.mode === 'capital_first') dispatch({ type: ACTIONS.SET_CAPITAL, value: val });
    else if (state.mode === 'target_irr_first') dispatch({ type: ACTIONS.SET_IRR_TARGET, value: val });
    else dispatch({ type: ACTIONS.SET_MW, value: val });
  }, [state.mode]);

  async function handleSave() {
    if (!projectId || !scenario) return;
    setSavingState('saving');
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
      setSavedScenarioId(data.scenario?.id || null);
      setSavingState('saved');
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSavingState('idle'), 2500);
    } catch (e) {
      setSavingState('idle');
      alert(`Save failed: ${e.message}`);
    }
  }

  function handleExportMd() {
    if (!scenario || !projection) return;
    const md = renderMemoMd(state, scenario, projection, archetypeOutcome);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulator-memo-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div style={S.headerText}>
          <h1 style={S.title}>Investment Simulator</h1>
        </div>
        {loading && <div style={S.loadingBadge}>Calculating…</div>}
      </header>

      {/* 1. STARTING POINT */}
      <section style={S.section}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Starting Point</h2>
        </header>
        <InputModeSwitcher
          mode={state.mode}
          onChange={onModeChange}
          presets={QATAR_PRESETS}
          onPreset={onPreset}
          onBootstrap={onBootstrap}
        />
      </section>

      {/* 2. OPERATING MODEL */}
      <section style={S.section}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Operating Model</h2>
          <span style={S.counterChip}>{radarArchetypes.length} compared</span>
        </header>
        <ArchetypePicker
          archetypes={DEAL_ARCHETYPES}
          primaryId={state.primary_archetype_id}
          compareIds={state.compare_archetype_ids}
          onSelectPrimary={onSelectPrimary}
          onToggleCompare={onToggleCompare}
        />
      </section>

      {/* 3. PROJECT SIZE / TARGETS */}
      <section style={S.section}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Project Size / Targets</h2>
        </header>
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

      {/* 4. HARDWARE ALLOCATION */}
      <section style={S.section}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Hardware Allocation</h2>
        </header>
        <HardwareMixer
          totalMw={scenario?.total_mw || state.total_mw}
          value={state.hardware_mix}
          onChange={onHwChange}
        />
      </section>

      {simError && <div style={S.error}>Error: {simError}</div>}

      {/* 5. TIMELINE */}
      <section style={S.section}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Timeline</h2>
        </header>
        <div style={S.subsection}>
          <GanttTimeline scenario={scenario || { site_readiness: 'greenfield' }} exit_year={scenario?.exit_year || 10} />
        </div>
      </section>

      {/* 6. FINANCIAL PROJECTION */}
      <section style={S.section}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Financial Projection</h2>
          <span style={S.sectionSubtitle}>Key numbers & 10-year projection</span>
        </header>
        <OutputKpiStrip projection={projection} />
        <div style={S.subsection}>
          <ProjectionChart years={projection?.years || []} />
        </div>
      </section>

      {/* 7. VISUALIZATIONS */}
      <section style={S.vizCard}>
        <header style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Visualizations</h2>
          <div style={S.vizTabs} role="tablist">
            {VIZ_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={state.active_viz === t.id}
                onClick={() => dispatch({ type: ACTIONS.SET_ACTIVE_VIZ, value: t.id })}
                style={{ ...S.vizTab, ...(state.active_viz === t.id ? S.vizTabActive : {}) }}>
                {t.label}
              </button>
            ))}
          </div>
        </header>
        <div style={S.vizContainer}>
          {state.active_viz === 'radar' && (
            <ArchetypeRadar archetypes={radarArchetypes} height={400} />
          )}
          {state.active_viz === 'network' && (
            <EcosystemNetwork activeArchetypeId={state.primary_archetype_id} />
          )}
          {state.active_viz === 'matrix' && (
            <B2BMatrix
              selected={{ businessModelId: state.business_model_id, clientTypeId: state.client_type_id }}
              onCellClick={onCellClick}
            />
          )}
          {state.active_viz === 'sankey' && (
            <FinancialSankey scenario={scenario} projection={projection} height={400} />
          )}
        </div>
      </section>

      {/* 8. ACTIONS */}
      <SimulatorCTABar
        hasProjection={!!projection}
        savingState={savingState}
        onSave={handleSave}
        onExportMd={handleExportMd}
        onGenerateMemo={() => startMemoJob({
          payload: simResult,
          title: 'Strategic Memo — Simulator scenario',
          scenarioLabel: 'Simulator scenario',
          scenarioId: savedScenarioId,
          projectId,
        })}
      />
      {/* Modal/badge/toast mountés globalement dans app/(cockpit)/admin/hearst/layout.jsx */}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Memo MD generator
// ────────────────────────────────────────────────────────────
function renderMemoMd(state, scenario, projection, archetypeOutcome) {
  const fmtUsd = (v) => v != null ? `$${(v / 1e6).toFixed(1)}M` : 'N/A';
  const fmtPct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : 'N/A';
  const fmtX = (v) => v != null ? `${v.toFixed(2)}x` : 'N/A';

  return `# Investment Plan — ${new Date().toISOString().slice(0, 10)}

## Starting point
- **Mode**: ${state.mode}
- **Deal model**: ${archetypeOutcome?.label || state.primary_archetype_id} (${archetypeOutcome?.code || ''})
- **Business model**: ${state.business_model_id}
- **Customer type**: ${state.client_type_id}

## Plan (key numbers)
- Total size: ${scenario.total_mw} MW
- Energy efficiency (PUE): ${scenario.pue}
- Electricity price: $${scenario.electricity_price_mwh}/MWh
- Rental price (big tech): $${scenario.price_hyperscale_kw_month}/kW/month
- Debt: ${scenario.debt_pct.toFixed(0)}% at ${scenario.debt_interest_rate}%
- Exit: ${scenario.exit_multiple}x yearly profit in year ${scenario.exit_year}

## Equipment mix
- Standard / High-density / AI clusters: ${state.hardware_mix.classic_pct}% / ${state.hardware_mix.liquid_pct}% / ${state.hardware_mix.ai_pct}%
- AI chip model: ${state.hardware_mix.gpu_sku_id}
- How busy: ${state.hardware_mix.utilization_pct}%
- Rental price per hour: $${state.hardware_mix.gpu_hour_price}

## Results (10-year projection)
| Metric | Value |
|---|---|
| Total Build Cost | ${fmtUsd(projection.total_capex)} |
| Yearly Revenue | ${fmtUsd(projection.stabilized_revenue)} |
| Yearly Profit | ${fmtUsd(projection.stabilized_ebitda)} |
| Annual Return | ${fmtPct(projection.irr)} |
| Money Multiplier | ${fmtX(projection.moic)} |
| Years to Break Even | ${projection.payback_years ?? 'N/A'} yr |
| Debt Safety | ${fmtX(projection.dscr_stabilized)} |
| Sale Value | ${fmtUsd(projection.terminal_value)} |
| Net Value Today | ${fmtUsd(projection.npv)} |

## Overall score
${archetypeOutcome?.score ?? 'N/A'}/100

---
Generated by HEARST Investment Simulator (/admin/hearst/simulator).
`;
}

// ────────────────────────────────────────────────────────────
// Design tokens — local
// spacing 4-base {4,8,16,24,32,48,96} · radius {8,12,999} · font {11,12,13,16,28,44}
// ────────────────────────────────────────────────────────────
const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-8, 32px)',
    maxWidth: 1280,
    margin: '0 auto',
    padding: 'var(--cp-space-8, 32px) var(--cp-space-8, 32px) var(--cp-space-12, 96px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 'var(--cp-space-4, 16px)',
    flexWrap: 'wrap',
    paddingBottom: 'var(--cp-space-4, 16px)',
    borderBottom: '1px solid var(--cp-border)',
  },
  headerText: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1, 4px)' },
  title: {
    fontSize: 'var(--cp-font-2xl, 24px)',
    lineHeight: '1.2',
    fontWeight: 600,
    letterSpacing: -0.4,
    color: 'var(--cp-text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: 'var(--cp-font-base, 13px)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
    color: 'var(--cp-text-muted)',
  },
  modeSwitch: {
    display: 'inline-flex', gap: 'var(--cp-space-1, 4px)', padding: 'var(--cp-space-1, 4px)',
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)', flexShrink: 0,
  },
  modeBtn: {
    height: 32, padding: '0 var(--cp-space-4, 16px)',
    background: 'transparent', color: 'var(--cp-text-muted)',
    border: 'none', borderRadius: 'var(--cp-radius-pill, 9999px)', cursor: 'pointer',
    fontSize: 'var(--cp-font-sm)', fontWeight: 600, letterSpacing: 0.3,
    transition: 'all 0.15s ease',
  },
  modeBtnActive: {
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
    color: 'var(--cp-text-strong)',
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

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4, 16px)',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3, 12px)',
    minHeight: 32,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 'var(--cp-font-lg, 16px)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
    fontWeight: 600,
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

  vizCard: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 10px)',
    padding: 'var(--cp-space-6, 24px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4, 16px)',
  },
  vizTabs: {
    display: 'flex',
    gap: 'var(--cp-space-1, 4px)',
    marginLeft: 'auto',
    padding: 'var(--cp-space-1, 4px)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    flexWrap: 'wrap',
  },
  vizTab: {
    fontSize: 'var(--cp-font-sm)',
    height: 32,
    padding: '0 var(--cp-space-4, 16px)',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: 'none',
    borderRadius: 'var(--cp-radius-md, 8px)',
    cursor: 'pointer',
    fontWeight: 600,
    letterSpacing: 0.3,
    transition: 'all 0.15s ease',
  },
  vizTabActive: {
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
  },
  vizContainer: {
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
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
    border: '1px solid var(--cp-border)',
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
