'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { buildSimulatePayload, INITIAL_STATE } from '@/lib/hearst-simulator-state';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { fmtMW, fmtPctFromRatio, fmtPctRaw, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { startMemoJob } from '@/lib/hearst-memo-job-store';
import { useSimulation } from '@/lib/hearst-simulation-context';

import {
  ARCH_BY_ID,
  BUSINESS_BY_ID,
  CLIENT_BY_ID,
  scenarioSubtitle,
  capitalStackSegments,
  decisionVerdict,
  buildMemoMd,
} from '@/lib/hearst-results-view';

import {
  InlineMetric,
  BoardMetric,
  CapitalDonut,
  DecisionKpis,
  LayerCard,
} from '@/components/hearst/simulator/results';

import VisualizationsStep from '@/components/hearst/simulator/sections/VisualizationsStep';

import GanttTimeline from '@/components/hearst/simulator/GanttTimeline';
import ProjectionChart from '@/components/hearst/simulator/ProjectionChart';
import SimulatorCTABar from '@/components/hearst/simulator/SimulatorCTABar';
import { Card, SectionHead, KpiGrid } from '@/components/hearst/ui';
import { S as CP } from '@/lib/cp-styles';
import { UI } from '@/lib/ui-strings';

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
    document.body.classList.add('oracle-results-wide');
    return () => document.body.classList.remove('oracle-results-wide');
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

  const projection = simResult?.projection;
  const scenario = simResult?.scenario || row;
  const archetype = state ? ARCH_BY_ID[state.primary_archetype_id] : null;
  const hardware = state?.hardware_mix || {};

  useEffect(() => {
    setAdvisorContext?.({
      surface: 'results',
      row,
      state,
      scenario,
      projection,
      simResult,
      loading,
      error,
      scenarioId,
    });
    return () => setAdvisorContext?.(null);
  }, [error, loading, projection, row, scenario, scenarioId, setAdvisorContext, simResult, state]);

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
    <style>{`
      body.oracle-results-wide .ct-center-panel {
        flex: 1 1 auto !important;
        width: auto !important;
      }
      body.oracle-results-wide .ct-page-area {
        width: 100% !important;
      }
      @media (max-width: 1500px) {
        [data-results-hero],
        [data-analysis-layout] {
          grid-template-columns: 1fr !important;
        }
        [data-decision-panel] {
          min-width: 0 !important;
          padding-left: 0 !important;
          border-left: 0 !important;
          border-top: 1px solid var(--cp-border) !important;
          padding-top: var(--cp-space-4) !important;
        }
        [data-capital-panel] {
          display: grid !important;
          grid-template-columns: 220px minmax(0, 1fr) !important;
          align-items: center !important;
        }
        [data-layer-grid] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }
      @media (max-width: 1120px) {
        [data-economics-grid] {
          grid-template-columns: 1fr !important;
        }
        [data-layer-grid] {
          grid-template-columns: 1fr !important;
        }
        [data-capital-panel] {
          grid-template-columns: 1fr !important;
        }
        [data-decision-metrics] {
          grid-template-columns: 1fr !important;
        }
        [data-risk-strip] {
          grid-template-columns: 1fr !important;
        }
      }
      @media (max-width: 760px) {
        [data-economics-grid],
        [data-layer-grid],
        [data-capital-panel] {
          grid-template-columns: 1fr !important;
        }
        [data-decision-metrics] {
          grid-template-columns: 1fr !important;
        }
        [data-risk-strip] {
          grid-template-columns: 1fr !important;
        }
      }
    `}</style>
    <div className="oracle-page">
    <div data-results-layout style={S.inner}>
      <Card as="header" data-results-hero variant="flat" padding="lg" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'stretch', gap: 'var(--cp-space-6)' }}>
        <div style={S.heroCopy}>
          <Link href={`/admin/hearst/simulator?scenario=${scenarioId}`} style={S.backLink}>{UI.RESULTS_BACK_EDIT}</Link>
          <span style={S.verdict}>{decisionVerdict(projection)}</span>
          <h1 style={S.title}>{row?.name || UI.RESULTS_HERO_FALLBACK_NAME}</h1>
          <p style={S.subtitle}>{state && scenarioSubtitle(state, scenario)}</p>
          <div style={S.heroChips}>
            <span style={S.heroChip}>{archetype?.label || state?.primary_archetype_id}</span>
            <span style={S.heroChip}>{scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING}</span>
            <span style={S.heroChip}>{hardware.ai_pct ?? 0}% {UI.RESULTS_CHIP_AI_SUFFIX}</span>
            {projection?.warnings?.length > 0 && (
              <span title={projection.warnings.join('\n')} style={S.cautionChip}>{UI.RESULTS_CHIP_NEEDS_REVIEW(projection.warnings.length)}</span>
            )}
          </div>
        </div>
        <DecisionKpis projection={projection} />
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title={UI.RESULTS_ECON_TITLE} hint={UI.RESULTS_ECON_HINT} style={{ marginBottom: 0 }} />
        <KpiGrid cols={3} data-economics-grid style={{ gap: 'var(--cp-space-4)' }}>
          <BoardMetric label={UI.RESULTS_BM_CAPEX} value={fmtUSD(projection?.total_capex)} note={UI.RESULTS_BM_CAPEX_NOTE} />
          <BoardMetric label={UI.RESULTS_BM_REVENUE} value={fmtUSD(projection?.stabilized_revenue)} note={UI.RESULTS_BM_REVENUE_NOTE} />
          <BoardMetric label={UI.RESULTS_BM_EBITDA} value={fmtUSD(projection?.stabilized_ebitda)} note={UI.RESULTS_BM_EBITDA_NOTE} />
          <BoardMetric label={UI.RESULTS_BM_TERMINAL} value={fmtUSD(projection?.terminal_value)} note={UI.RESULTS_BM_TERMINAL_NOTE} />
          <BoardMetric label={UI.RESULTS_BM_PAYBACK} value={projection?.payback_years != null ? `${projection.payback_years} yr` : MISSING} note={UI.RESULTS_BM_PAYBACK_NOTE} />
          <BoardMetric label={UI.RESULTS_BM_SOURCE} value={simResult?.source_score != null ? `${simResult.source_score}/100` : MISSING} note={UI.RESULTS_BM_SOURCE_NOTE} />
        </KpiGrid>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ minWidth: 0 }}>
        <div style={S.analysisHead}>
          <SectionHead title={UI.RESULTS_PROJ_TITLE} hint={UI.RESULTS_PROJ_HINT} style={{ marginBottom: 0, flex: '1 1 auto' }} />
          <span style={S.cardEyebrow}>{UI.RESULTS_PROJ_EYEBROW}</span>
        </div>
        <div data-analysis-layout style={S.analysisLayout}>
          <Card data-results-chart variant="card" surface={1} style={{ minWidth: 0, minHeight: 430, paddingTop: 'var(--cp-space-4)', paddingBottom: 'var(--cp-space-2)', paddingLeft: 'var(--cp-space-3)', paddingRight: 'var(--cp-space-3)' }}>
            <ProjectionChart years={projection?.years || []} height={500} />
          </Card>
          <Card as="aside" data-capital-panel variant="card" surface={1} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)', padding: 'var(--cp-space-4)' }}>
            <CapitalDonut segments={capitalStackSegments(scenario, projection)} />
            <div style={S.structureRows}>
              <InlineMetric label={UI.RESULTS_IM_BUILD_COST} value={fmtUSD(projection?.total_capex)} />
              {projection?.equity_invested != null && <InlineMetric label={UI.RESULTS_IM_EQUITY_IDC} value={fmtUSD(projection.equity_invested)} />}
              {projection?.idc != null && projection.idc > 0 && <InlineMetric label={UI.RESULTS_IM_IDC} value={fmtUSD(projection.idc)} />}
              <InlineMetric label={UI.RESULTS_IM_TERMINAL} value={fmtUSD(projection?.terminal_value)} />
              {projection?.terminal_value_to_equity != null && <InlineMetric label={UI.RESULTS_IM_TERMINAL_EQUITY} value={fmtUSD(projection.terminal_value_to_equity)} />}
              <InlineMetric label={UI.RESULTS_IM_IRR} value={fmtPctFromRatio(projection?.irr)} />
              <InlineMetric label={UI.RESULTS_IM_DSCR} value={fmtX(projection?.dscr_stabilized)} />
              <InlineMetric label={UI.RESULTS_IM_OCCUPANCY} value={scenario?.target_occupancy_pct != null ? fmtPctRaw(scenario.target_occupancy_pct) : MISSING} />
              <InlineMetric label={UI.RESULTS_IM_EXIT_LABEL} value={scenario?.exit_year ? UI.RESULTS_IM_EXIT_YEAR(scenario.exit_year) : MISSING} />
            </div>
          </Card>
        </div>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title={UI.RESULTS_LAYERS_TITLE} hint={UI.RESULTS_LAYERS_HINT} style={{ marginBottom: 0 }} />
        <div data-layer-grid style={S.layerGrid}>
          <LayerCard index="01" title={UI.RESULTS_LAYER_START} rows={[
            [UI.RESULTS_ROW_MODE, state?.mode],
            [UI.RESULTS_ROW_POWER, scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : null],
            [UI.RESULTS_ROW_PUE, scenario?.pue],
          ]} />
          <LayerCard index="02" title={UI.RESULTS_LAYER_MODEL} rows={[
            [UI.RESULTS_ROW_MODEL, archetype?.label],
            [UI.RESULTS_ROW_BUSINESS, BUSINESS_BY_ID[state?.business_model_id]?.label],
            [UI.RESULTS_ROW_CLIENT, CLIENT_BY_ID[state?.client_type_id]?.label],
          ]} />
          <LayerCard index="03" title={UI.RESULTS_LAYER_HW} rows={[
            [UI.RESULTS_ROW_MIX, `${hardware.classic_pct ?? 0}% / ${hardware.liquid_pct ?? 0}% / ${hardware.ai_pct ?? 0}%`],
            [UI.RESULTS_ROW_GPU, hardware.gpu_sku_id],
            [UI.RESULTS_ROW_UTIL, hardware.utilization_pct != null ? fmtPctRaw(hardware.utilization_pct) : null],
          ]} />
          <LayerCard index="04" title={UI.RESULTS_LAYER_INDUSTRY} rows={[
            [UI.RESULTS_ROW_REGION, state?.geography],
            [UI.RESULTS_ROW_THESIS, archetype?.operator_role],
            [UI.RESULTS_ROW_AI, hardware.ai_pct != null ? `${hardware.ai_pct}%` : null],
          ]} />
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
    maxWidth: 1240,
    margin: '0 auto',
    width: '100%',
  },
  heroCopy: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    minWidth: 0,
  },
  verdict: {
    width: 'fit-content',
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    padding: 'var(--cp-space-1) var(--cp-space-3)',
    border: '1px solid var(--cp-accent-maroon)',
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-accent-soft)',
  },
  backLink: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    textDecoration: 'none',
  },
  title: {
    margin: 'var(--cp-space-3) 0 var(--cp-space-2)',
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-xl)',
    lineHeight: '1.15',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  subtitle: {
    margin: 0,
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-base)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  heroChips: {
    display: 'flex',
    gap: 'var(--cp-space-2)',
    flexWrap: 'wrap',
  },
  heroChip: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 'var(--cp-space-7)',
    padding: '0 var(--cp-space-3)',
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-pill)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
  },
  analysisHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    marginBottom: 'var(--cp-space-4)',
  },
  analysisLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: 'var(--cp-space-6)',
    alignItems: 'stretch',
  },
  cardEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  structureRows: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--cp-space-3)',
  },
  layerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'var(--cp-space-4)',
  },
  cautionChip: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 'var(--cp-space-7)',
    padding: '0 var(--cp-space-3)',
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-accent)',
    borderRadius: 'var(--cp-radius-pill)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
  },
};
