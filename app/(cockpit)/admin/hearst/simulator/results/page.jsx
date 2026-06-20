'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

import { buildSimulatePayload, INITIAL_STATE } from '@/lib/hearst-simulator-state';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { fmtMW, fmtPctFromRatio, fmtPctRaw, fmtUSD, MISSING } from '@/lib/hearst-format';
import { startMemoJob } from '@/lib/hearst-memo-job-store';
import { useSimulation } from '@/lib/hearst-simulation-context';

import {
  ARCH_BY_ID,
  BUSINESS_BY_ID,
  CLIENT_BY_ID,
  capitalStackSegments,
  buildMemoMd,
} from '@/lib/hearst-results-view';

import {
  BoardMetric,
  CapitalDonut,
  CapitalStructureGrid,
  DecisionHeader,
  ReturnsComposition,
  LayerCard,
  Tornado,
} from '@/components/hearst/simulator/results';
import { generateTornado } from '@/lib/hearst-calculations';

import VisualizationsStep from '@/components/hearst/simulator/sections/VisualizationsStep';

import GanttTimeline from '@/components/hearst/simulator/GanttTimeline';
import ProjectionChart from '@/components/hearst/simulator/ProjectionChart';
import SimulatorCTABar from '@/components/hearst/simulator/SimulatorCTABar';
import { Card, SectionHead, KpiGrid, Button } from '@/components/hearst/ui';
import { S as CP } from '@/lib/cp-styles';
import { UI } from '@/lib/ui-strings';
import './results.css';

const RESULTS_ERROR = { ...CP.accentAlert, padding: 'var(--cp-space-4)', background: 'var(--cp-accent-soft)' };

function buildStateFromScenario(row, searchParams) {
  const mode = row.input_mode || 'mw_first';
  const inputValue = row.input_value || {};
  const archetypeId = searchParams.get('arch') || row.archetype_id || INITIAL_STATE.primary_archetype_id;
  const modelDefaults = MODEL_DEFAULTS[archetypeId] || {};
  const state = {
    ...INITIAL_STATE,
    mode,
    primary_archetype_id: archetypeId,
    business_model_id: searchParams.get('biz') || row.business_model_id || modelDefaults.business_model_id || INITIAL_STATE.business_model_id,
    client_type_id: searchParams.get('client') || row.client_type_id || modelDefaults.client_type_id || INITIAL_STATE.client_type_id,
    geography: row.geography || INITIAL_STATE.geography,
    // Investment case carried via URL so /simulate re-applies the same scenario_overrides
    // the config page used — otherwise results would silently fall back to Base.
    scenario_case: searchParams.get('case') || INITIAL_STATE.scenario_case,
    hardware_mix: { ...INITIAL_STATE.hardware_mix, ...(row.hardware_mix || {}) },
  };
  if (mode === 'capital_first' && inputValue.total_capex_usd != null) state.capital_usd = inputValue.total_capex_usd;
  if (mode === 'mw_first' && inputValue.total_mw != null) state.total_mw = inputValue.total_mw;
  if (mode === 'target_irr_first') {
    if (inputValue.target_irr_pct != null) state.target_irr_pct = inputValue.target_irr_pct;
    if (inputValue.lever) state.target_irr_lever = inputValue.lever;
    if (inputValue.total_mw != null) state.total_mw = inputValue.total_mw;
  }
  if (row.total_mw != null) state.total_mw = row.total_mw;
  return state;
}

export default function SimulatorResultsPage() {
  const { setAdvisorContext } = useSimulation();
  const [row, setRow] = useState(null);
  const [state, setState] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingState, setSavingState] = useState('idle');
  const [activeViz, setActiveViz] = useState('radar');
  const [searchParams, setSearchParams] = useState(null);

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    document.body.classList.add('oracle-results-wide', 'oracle-results-page');
    return () => document.body.classList.remove('oracle-results-wide', 'oracle-results-page');
  }, []);

  const scenarioId = searchParams?.get('scenario') || null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!searchParams) return;
      if (!scenarioId) {
        setError('Missing scenario id.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const rowRes = await fetch(`/api/admin/hearst/scenarios/${scenarioId}`);
        if (!rowRes.ok) {
          const body = await rowRes.json().catch(() => ({}));
          throw new Error(body.error || `Scenario load failed (${rowRes.status})`);
        }
        const data = await rowRes.json();
        const savedRow = data.scenario;
        const nextState = buildStateFromScenario(savedRow, searchParams);
        const simRes = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildSimulatePayload(nextState)),
        });
        if (!simRes.ok) {
          const body = await simRes.json().catch(() => ({}));
          throw new Error(body.error || `Simulation failed (${simRes.status})`);
        }
        const simData = await simRes.json();
        if (cancelled) return;
        setRow(savedRow);
        setState(nextState);
        setSimResult(simData);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load scenario results.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [scenarioId, searchParams]);

  const projection = useMemo(() => simResult?.projection, [simResult]);
  const scenario = useMemo(() => simResult?.scenario || row, [simResult, row]);
  const archetype = useMemo(() => state ? ARCH_BY_ID[state.primary_archetype_id] : null, [state]);
  const hardware = useMemo(() => state?.hardware_mix || {}, [state]);

  // Investment Case sentence: "Deploy $X into a Y in Z targeting W% IRR"
  const investmentCaseSentence = useMemo(() => projection ? (
    <>
      Deploy <strong style={{ color: 'var(--cp-text-strong)', fontWeight: 'var(--cp-weight-bold)' }}>{fmtUSD(projection.total_capex)}</strong> into a{' '}
      <strong style={{ color: 'var(--cp-text-strong)', fontWeight: 'var(--cp-weight-bold)' }}>{archetype?.label || state?.primary_archetype_id}</strong> in{' '}
      <strong style={{ color: 'var(--cp-text-strong)', fontWeight: 'var(--cp-weight-bold)' }}>{state?.geography}</strong> targeting{' '}
      <strong style={{ color: 'var(--cp-text-strong)', fontWeight: 'var(--cp-weight-bold)' }}>{fmtPctFromRatio(projection.irr)} IRR</strong>.
    </>
  ) : null, [projection, archetype, state]);

  const advisorContext = useMemo(() => ({
    surface: 'results',
    row,
    state,
    scenario,
    projection,
    simResult,
    loading,
    error,
    scenarioId,
  }), [row, state, scenario, projection, simResult, loading, error, scenarioId]);

  useEffect(() => {
    setAdvisorContext?.(advisorContext);
    return () => setAdvisorContext?.(null);
  }, [advisorContext, setAdvisorContext]);

  const handleExportMd = useCallback(() => {
    if (!row || !state || !projection) return;
    const md = buildMemoMd({ name: row?.name, state, scenario, projection, archetype });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario-results-${scenarioId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [archetype, projection, row, scenario, scenarioId, state]);

  const handleGenerateMemo = useCallback(() => {
    if (!simResult || !row) return;
    startMemoJob({
      payload: simResult,
      title: `Strategic Memo — ${row.name || 'Scenario'}`,
      scenarioLabel: row.name || 'Scenario',
      scenarioId,
      projectId: row.project_id,
    });
  }, [row, scenarioId, simResult]);

  const handleSave = useCallback(() => {
    setSavingState('saved');
    setTimeout(() => setSavingState('idle'), 1800);
  }, []);

  const donutSegments = useMemo(() => capitalStackSegments(scenario, projection), [scenario, projection]);

  // One-variable-at-a-time IRR sensitivity on the active (post-override) scenario.
  // Runs the core engine client-side; relative driver ranking, not the headline IRR.
  const tornado = useMemo(() => (scenario ? generateTornado(scenario) : null), [scenario]);

  const layer1Rows = useMemo(() => [
    [UI.RESULTS_ROW_MODE, state?.mode],
    [UI.RESULTS_ROW_POWER, scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : null],
    [UI.RESULTS_ROW_PUE, scenario?.pue],
  ], [state?.mode, scenario?.total_mw, scenario?.pue]);

  const layer2Rows = useMemo(() => [
    [UI.RESULTS_ROW_MODEL, archetype?.label],
    [UI.RESULTS_ROW_BUSINESS, BUSINESS_BY_ID[state?.business_model_id]?.label],
    [UI.RESULTS_ROW_CLIENT, CLIENT_BY_ID[state?.client_type_id]?.label],
  ], [archetype?.label, state?.business_model_id, state?.client_type_id]);

  const layer3Rows = useMemo(() => [
    [UI.RESULTS_ROW_MIX, `${hardware.classic_pct ?? 0}% / ${hardware.liquid_pct ?? 0}% / ${hardware.ai_pct ?? 0}%`],
    [UI.RESULTS_ROW_GPU, hardware.gpu_sku_id],
    [UI.RESULTS_ROW_UTIL, hardware.utilization_pct != null ? fmtPctRaw(hardware.utilization_pct) : null],
  ], [hardware]);

  const layer4Rows = useMemo(() => [
    [UI.RESULTS_ROW_REGION, state?.geography],
    [UI.RESULTS_ROW_THESIS, archetype?.operator_role],
    [UI.RESULTS_ROW_AI, hardware.ai_pct != null ? `${hardware.ai_pct}%` : null],
  ], [state?.geography, archetype?.operator_role, hardware.ai_pct]);

  if (loading) {
    return (
      <div className="oracle-page">
        <div data-results-layout style={S.inner}>
          <div style={CP.loadingCard}>{UI.RESULTS_LOADING_SCENARIO}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oracle-page">
        <div data-results-layout style={S.inner}>
          <Link href="/admin/hearst/simulator" style={S.backLink}>← Back to simulator</Link>
          <div style={RESULTS_ERROR}>Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="oracle-page">
    <div data-results-layout style={S.inner}>
      <Card as="header" data-results-hero variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={S.heroTopRow}>
          <Link href={`/admin/hearst/simulator?scenario=${scenarioId}`} style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" style={{ fontWeight: 'var(--cp-weight-bold)' }}>
              {UI.RESULTS_BACK_EDIT}
            </Button>
          </Link>
          <span style={S.heroName}>{row?.name || UI.RESULTS_HERO_FALLBACK_NAME}</span>
        </div>

        <div data-narrative-box style={S.narrativeBox}>
          <span style={S.cardEyebrow}>INVESTMENT CASE</span>
          <p style={S.narrativeSentence}>{investmentCaseSentence}</p>
        </div>

        <DecisionHeader projection={projection} />
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title={UI.RESULTS_ECON_TITLE} hint={UI.RESULTS_ECON_HINT} style={{ marginBottom: 0 }} />
        <KpiGrid data-economics-grid style={{ gap: 'var(--cp-space-4)' }}>
          <BoardMetric label={UI.RESULTS_BM_CAPEX} value={fmtUSD(projection?.total_capex)} note={UI.RESULTS_BM_CAPEX_NOTE} hint="capex" />
          <BoardMetric label={UI.RESULTS_BM_REVENUE} value={fmtUSD(projection?.stabilized_revenue)} note={UI.RESULTS_BM_REVENUE_NOTE} hint="revenue" />
          <BoardMetric label={UI.RESULTS_BM_EBITDA} value={fmtUSD(projection?.stabilized_ebitda)} note={UI.RESULTS_BM_EBITDA_NOTE} hint="ebitda" />
          <BoardMetric label={UI.RESULTS_BM_TERMINAL} value={fmtUSD(projection?.terminal_value)} note={UI.RESULTS_BM_TERMINAL_NOTE} hint="terminal_value" />
          <BoardMetric label={UI.RESULTS_BM_PAYBACK} value={projection?.payback_years != null ? `${projection.payback_years} yr` : MISSING} note={UI.RESULTS_BM_PAYBACK_NOTE} hint="payback" />
          <BoardMetric label={UI.RESULTS_BM_SOURCE} value={simResult?.confidence_score != null ? `${simResult.confidence_score}/100` : MISSING} note={UI.RESULTS_BM_SOURCE_NOTE} hint="confidence_score" />
        </KpiGrid>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ minWidth: 0 }}>
        <div data-analysis-head>
          <SectionHead title={UI.RESULTS_PROJ_TITLE} hint={UI.RESULTS_PROJ_HINT} style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none', flex: '1 1 auto', minWidth: 0 }} />
          <span data-analysis-eyebrow style={S.cardEyebrow}>{UI.RESULTS_PROJ_EYEBROW}</span>
        </div>
        <div data-analysis-layout>
          <Card data-results-chart variant="card" surface={1} style={{ minWidth: 0 }}>
            <ProjectionChart years={projection?.years || []} height={400} />
          </Card>
          <Card as="aside" data-capital-panel variant="card" surface={1} padding="sm">
            <div data-capital-zone="donut">
              <span style={S.cardEyebrow}>{UI.RESULTS_KPI_CAPITAL}</span>
              <CapitalDonut segments={donutSegments} />
            </div>

            <div data-capital-zone="returns">
              <ReturnsComposition projection={projection} />
            </div>

            <div data-capital-zone="structure">
              <span style={S.cardEyebrow}>{UI.RESULTS_CAPITAL_STRUCTURE}</span>
              <CapitalStructureGrid projection={projection} scenario={scenario} />
            </div>
          </Card>
        </div>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title={UI.RESULTS_TORNADO_TITLE} hint={UI.RESULTS_TORNADO_HINT} style={{ marginBottom: 0 }} />
        <Tornado tornado={tornado} />
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title={UI.RESULTS_LAYERS_TITLE} hint={UI.RESULTS_LAYERS_HINT} style={{ marginBottom: 0 }} />
        <div data-layer-grid>
          <LayerCard index="01" title={UI.RESULTS_LAYER_START} rows={layer1Rows} />
          <LayerCard index="02" title={UI.RESULTS_LAYER_MODEL} rows={layer2Rows} />
          <LayerCard index="03" title={UI.RESULTS_LAYER_HW} rows={layer3Rows} />
          <LayerCard index="04" title={UI.RESULTS_LAYER_INDUSTRY} rows={layer4Rows} />
        </div>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title={UI.RESULTS_TIMELINE_TITLE} hint={UI.RESULTS_TIMELINE_HINT} style={{ marginBottom: 0 }} />
        <GanttTimeline scenario={scenario || { site_readiness: 'greenfield' }} exit_year={scenario?.exit_year || 10} />
      </Card>

      <VisualizationsStep
        activeViz={activeViz}
        onSelectViz={setActiveViz}
        state={state}
        scenario={scenario}
        projection={projection}
      />

      <SimulatorCTABar
        hasProjection={!!projection}
        savingState={savingState}
        onSave={handleSave}
        onExportMd={handleExportMd}
        onGenerateMemo={handleGenerateMemo}
        planCaution={!!projection?.warnings?.length}
        cautionReason={projection?.warnings?.[0] || null}
      />
      {savingState === 'saved' && <div style={CP.toastAccent}>{UI.RESULTS_SCENARIO_SAVED}</div>}
    </div>
    </div>
    </>
  );
}

const S = {
  inner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-section-gap)',
    width: '100%',
    minWidth: 0,
  },
  heroTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  heroName: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
  },
  narrativeBox: {
    padding: 'var(--cp-space-5)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-md)',
    border: '1px solid var(--cp-border-base)',
    display: 'flex',
    flexDirection: 'column',
  },
  narrativeSentence: {
    margin: 0,
    fontSize: 'var(--cp-font-lg)',
    color: 'var(--cp-text-primary)',
    lineHeight: 'var(--cp-leading-relaxed)',
  },
  backLink: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    textDecoration: 'none',
  },
  cardEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
};
