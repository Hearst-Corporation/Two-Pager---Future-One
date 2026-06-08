'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { BUSINESS_MODELS, CLIENT_TYPES, FINANCIAL_THRESHOLDS } from '@/lib/hearst-constants';
import { buildSimulatePayload, INITIAL_STATE } from '@/lib/hearst-simulator-state';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { fmtMW, fmtPctFromRatio, fmtPctRaw, fmtUSD, fmtX, MISSING } from '@/lib/hearst-format';
import { startMemoJob } from '@/lib/hearst-memo-job-store';
import { useSimulation } from '@/lib/hearst-simulation-context';

import ArchetypeRadar from '@/components/hearst/simulator/ArchetypeRadar';
import B2BMatrix from '@/components/hearst/simulator/B2BMatrix';
import GanttTimeline from '@/components/hearst/simulator/GanttTimeline';
import ProjectionChart from '@/components/hearst/simulator/ProjectionChart';
import SimulatorCTABar from '@/components/hearst/simulator/SimulatorCTABar';
import { Card, SectionHead, KpiGrid } from '@/components/hearst/ui';
import { S as CP, T } from '@/lib/cp-styles';
import { UI } from '@/lib/ui-strings';

const RESULTS_ERROR = { ...CP.accentAlert, padding: 'var(--cp-space-4)', background: 'var(--cp-accent-soft)' };

const EcosystemNetwork = dynamic(() => import('@/components/hearst/simulator/EcosystemNetwork'), {
  ssr: false,
  loading: () => <div style={CP.loadingPanel}>{UI.RESULTS_LOADING_ECOSYSTEM}</div>,
});
const FinancialSankey = dynamic(() => import('@/components/hearst/simulator/FinancialSankey'), {
  ssr: false,
  loading: () => <div style={CP.loadingPanel}>{UI.RESULTS_LOADING_SANKEY}</div>,
});

const ARCH_BY_ID = Object.fromEntries(DEAL_ARCHETYPES.map(a => [a.id, a]));
const BUSINESS_BY_ID = Object.fromEntries(BUSINESS_MODELS.map(b => [b.id, b]));
const CLIENT_BY_ID = Object.fromEntries(CLIENT_TYPES.map(c => [c.id, c]));

const DECISION_METRICS = [
  {
    id: 'irr',
    label: 'IRR',
    note: 'annualized equity return',
    value: p => fmtPctFromRatio(p?.irr),
  },
  {
    id: 'npv',
    label: 'NPV',
    note: 'value created today',
    value: p => fmtUSD(p?.npv),
  },
  {
    id: 'moic',
    label: 'MOIC',
    note: 'cash multiple at exit',
    value: p => fmtX(p?.moic),
  },
];

const VIZ_META = {
  radar: {
    label: 'Strengths',
    title: 'Operating-model strength map',
    detail: 'Compares brand control, bankability, speed, margin and exit liquidity.',
  },
  network: {
    label: 'Industry players',
    title: 'Industry participant network',
    detail: 'Shows the operators, hyperscalers, capital partners and local enablers around the scenario.',
  },
  matrix: {
    label: 'Industry layers',
    title: 'Commercial fit by product and buyer',
    detail: 'Highlights which product layer and customer segment this scenario is really built for.',
  },
  sankey: {
    label: 'Money flow',
    title: 'Capital and annual cash-flow path',
    detail: 'Traces equity, debt, build cost, revenue, operating costs and owner profit.',
  },
};

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

function scenarioSubtitle(state, scenario) {
  const arch = ARCH_BY_ID[state.primary_archetype_id];
  const business = BUSINESS_BY_ID[state.business_model_id];
  const client = CLIENT_BY_ID[state.client_type_id];
  return [
    arch?.label || state.primary_archetype_id,
    business?.label || state.business_model_id,
    client?.label || state.client_type_id,
    scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : null,
  ].filter(Boolean).join(' · ');
}

function buildMemoMd({ row, state, scenario, projection, archetype }) {
  return `# ${row?.name || 'Scenario Results'}

## Scenario
- Operating model: ${archetype?.label || state.primary_archetype_id}
- Business model: ${BUSINESS_BY_ID[state.business_model_id]?.label || state.business_model_id}
- Customer layer: ${CLIENT_BY_ID[state.client_type_id]?.label || state.client_type_id}
- Total power: ${scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING}

## KPIs
- Total CAPEX: ${fmtUSD(projection?.total_capex)}
- Stabilized revenue: ${fmtUSD(projection?.stabilized_revenue)}
- Stabilized EBITDA: ${fmtUSD(projection?.stabilized_ebitda)}
- IRR: ${fmtPctFromRatio(projection?.irr)}
- NPV: ${fmtUSD(projection?.npv)}
- MOIC: ${fmtX(projection?.moic)}
- DSCR: ${fmtX(projection?.dscr_stabilized)}
- Terminal value: ${fmtUSD(projection?.terminal_value)}
`;
}

function capitalStackSegments(scenario, projection) {
  const total = projection?.total_capex || 0;
  const debtPct = Math.max(0, Math.min(100, scenario?.debt_pct ?? 0));
  const equityTotal = Math.max(0, 100 - debtPct);
  const hearst = scenario?.equity_hearst_pct ?? 0;
  const brookfield = scenario?.equity_brookfield_pct ?? 0;
  const qatar = scenario?.equity_qatar_pct ?? 0;
  const equityBase = hearst + brookfield + qatar || 1;
  return [
    { label: 'Debt', pct: debtPct, value: total * debtPct / 100, color: 'var(--cp-text-muted)' },
    { label: 'HEARST equity', pct: equityTotal * hearst / equityBase, value: total * equityTotal * hearst / equityBase / 100, color: 'var(--cp-accent-maroon)' },
    { label: 'Brookfield equity', pct: equityTotal * brookfield / equityBase, value: total * equityTotal * brookfield / equityBase / 100, color: 'var(--cp-accent)' },
    { label: 'Qatar equity', pct: equityTotal * qatar / equityBase, value: total * equityTotal * qatar / equityBase / 100, color: 'var(--cp-text-primary)' },
  ].filter(s => s.pct > 0.1);
}

function decisionVerdict(projection) {
  if (!projection) return 'Scenario pending';
  const irr = projection.irr;
  const npv = projection.npv;
  const dscr = projection.dscr_stabilized;
  if (irr == null || npv == null) return UI.RESULTS_VERDICT_INSUFFICIENT;
  if (irr >= FINANCIAL_THRESHOLDS.investment_grade_pct / 100 && npv > 0 && dscr != null && dscr >= FINANCIAL_THRESHOLDS.dscr_strong_threshold) return 'Investment-grade case';
  if (irr >= FINANCIAL_THRESHOLDS.ic_hurdle_pct / 100 && npv > 0 && (dscr == null || dscr >= FINANCIAL_THRESHOLDS.dscr_breach_threshold)) return 'Viable, needs structuring';
  return 'Needs rework before IC';
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
  const radarArchetypes = useMemo(() => {
    if (!state) return [];
    const ids = new Set([state.primary_archetype_id, 'neocloud_gpu', 'sovereign_ai']);
    return Array.from(ids).map(id => ARCH_BY_ID[id]).filter(Boolean);
  }, [state]);
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
    const md = buildMemoMd({ row, state, scenario, projection, archetype });
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
        [data-viz-rail] {
          max-width: none !important;
          display: grid !important;
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
        [data-capital-panel],
        [data-viz-rail] {
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
          <Link href={`/admin/hearst/simulator?scenario=${scenarioId}`} style={S.backLink}>← Edit inputs</Link>
          <span style={S.verdict}>{decisionVerdict(projection)}</span>
          <h1 style={S.title}>{row?.name || 'Scenario Results'}</h1>
          <p style={S.subtitle}>{state && scenarioSubtitle(state, scenario)}</p>
          <div style={S.heroChips}>
            <span style={S.heroChip}>{archetype?.label || state?.primary_archetype_id}</span>
            <span style={S.heroChip}>{scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : MISSING}</span>
            <span style={S.heroChip}>{hardware.ai_pct ?? 0}% AI allocation</span>
            {projection?.warnings?.length > 0 && (
              <span title={projection.warnings.join('\n')} style={S.cautionChip}>{`Needs review${projection.warnings.length > 1 ? ` (${projection.warnings.length})` : ''}`}</span>
            )}
          </div>
        </div>
        <DecisionKpis projection={projection} />
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title="Economics behind the decision" hint="Scale, yield and evidence quality behind the return." style={{ marginBottom: 0 }} />
        <KpiGrid cols={3} data-economics-grid style={{ gap: 'var(--cp-space-4)' }}>
          <BoardMetric label="Total CAPEX" value={fmtUSD(projection?.total_capex)} note="Build requirement" />
          <BoardMetric label="Stabilized revenue" value={fmtUSD(projection?.stabilized_revenue)} note="Annual run-rate" />
          <BoardMetric label="Stabilized EBITDA" value={fmtUSD(projection?.stabilized_ebitda)} note="Operating yield" />
          <BoardMetric label="Terminal value" value={fmtUSD(projection?.terminal_value)} note="Exit valuation" />
          <BoardMetric label="Payback" value={projection?.payback_years != null ? `${projection.payback_years} yr` : MISSING} note="Capital recovery" />
          <BoardMetric label="Source score" value={simResult?.source_score != null ? `${simResult.source_score}/100` : MISSING} note="Evidence depth" />
        </KpiGrid>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ minWidth: 0 }}>
        <div style={S.analysisHead}>
          <SectionHead title="Financial Projection" hint="10-year cash generation, break-even path and exit value." style={{ marginBottom: 0, flex: '1 1 auto' }} />
          <span style={S.cardEyebrow}>Main analysis</span>
        </div>
        <div data-analysis-layout style={S.analysisLayout}>
          <Card data-results-chart variant="card" surface={1} style={{ minWidth: 0, minHeight: 430, paddingTop: 'var(--cp-space-4)', paddingBottom: 'var(--cp-space-2)', paddingLeft: 'var(--cp-space-3)', paddingRight: 'var(--cp-space-3)' }}>
            <ProjectionChart years={projection?.years || []} height={500} />
          </Card>
          <Card as="aside" data-capital-panel variant="card" surface={1} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)', padding: 'var(--cp-space-4)' }}>
            <CapitalDonut segments={capitalStackSegments(scenario, projection)} />
            <div style={S.structureRows}>
              <InlineMetric label="Build cost" value={fmtUSD(projection?.total_capex)} />
              {projection?.equity_invested != null && <InlineMetric label="Equity (incl. IDC)" value={fmtUSD(projection.equity_invested)} />}
              {projection?.idc != null && projection.idc > 0 && <InlineMetric label="Interest during construction" value={fmtUSD(projection.idc)} />}
              <InlineMetric label="Terminal value" value={fmtUSD(projection?.terminal_value)} />
              {projection?.terminal_value_to_equity != null && <InlineMetric label="Terminal value (to equity)" value={fmtUSD(projection.terminal_value_to_equity)} />}
              <InlineMetric label="IRR" value={fmtPctFromRatio(projection?.irr)} />
              <InlineMetric label="DSCR risk guardrail" value={fmtX(projection?.dscr_stabilized)} />
              <InlineMetric label="Occupancy target" value={scenario?.target_occupancy_pct != null ? fmtPctRaw(scenario.target_occupancy_pct) : MISSING} />
              <InlineMetric label="Exit year" value={scenario?.exit_year ? `Year ${scenario.exit_year}` : MISSING} />
            </div>
          </Card>
        </div>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title="Scenario Layers" hint="Starting point, operating model and hardware allocation" style={{ marginBottom: 0 }} />
        <div data-layer-grid style={S.layerGrid}>
          <LayerCard index="01" title="Starting Point" rows={[
            ['Mode', state?.mode],
            ['Total power', scenario?.total_mw != null ? fmtMW(scenario.total_mw, 0) : null],
            ['PUE', scenario?.pue],
          ]} />
          <LayerCard index="02" title="Operating Model" rows={[
            ['Model', archetype?.label],
            ['Business', BUSINESS_BY_ID[state?.business_model_id]?.label],
            ['Client', CLIENT_BY_ID[state?.client_type_id]?.label],
          ]} />
          <LayerCard index="03" title="Hardware Allocation" rows={[
            ['Standard / dense / AI', `${hardware.classic_pct ?? 0}% / ${hardware.liquid_pct ?? 0}% / ${hardware.ai_pct ?? 0}%`],
            ['GPU SKU', hardware.gpu_sku_id],
            ['Utilization', hardware.utilization_pct != null ? fmtPctRaw(hardware.utilization_pct) : null],
          ]} />
          <LayerCard index="04" title="Industry Layer" rows={[
            ['Region', state?.geography],
            ['Operating thesis', archetype?.operator_role],
            ['AI exposure', hardware.ai_pct != null ? `${hardware.ai_pct}%` : null],
          ]} />
        </div>
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title="Deployment Timeline" hint="Milestones and launch path" style={{ marginBottom: 0 }} />
        <GanttTimeline scenario={scenario || { site_readiness: 'greenfield' }} exit_year={scenario?.exit_year || 10} />
      </Card>

      <Card as="section" variant="flat" padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <SectionHead title="Visualizations" hint="Switch between strategic, industry and money-flow views" style={{ marginBottom: 0 }} />
        <div data-viz-shell style={S.vizShell}>
          <aside data-viz-rail style={S.vizRail}>
            {Object.entries(VIZ_META).map(([id, meta]) => (
              <button key={id} type="button" onClick={() => setActiveViz(id)}
                style={{ ...S.vizRailBtn, ...(activeViz === id ? S.vizRailBtnActive : {}) }}>
                <span style={S.vizRailLabel}>{meta.label}</span>
                <span style={S.vizRailDetail}>{meta.detail}</span>
              </button>
            ))}
          </aside>
          <Card data-viz-panel variant="card" surface={0} padding="lg" style={{ minWidth: 0 }}>
            <div style={S.vizPanelHead}>
              <div>
                <h3 style={S.vizTitle}>{VIZ_META[activeViz].title}</h3>
                <p style={S.vizDetail}>{VIZ_META[activeViz].detail}</p>
              </div>
              <span style={S.vizMode}>{VIZ_META[activeViz].label}</span>
            </div>
            <div style={S.vizContainer}>
              {activeViz === 'radar' && <ArchetypeRadar archetypes={radarArchetypes} highlighted={[state?.primary_archetype_id]} height={420} />}
              {activeViz === 'network' && <EcosystemNetwork activeArchetypeId={state?.primary_archetype_id} />}
              {activeViz === 'matrix' && (
                <B2BMatrix selected={{ businessModelId: state?.business_model_id, clientTypeId: state?.client_type_id }} />
              )}
              {activeViz === 'sankey' && <FinancialSankey scenario={scenario} projection={projection} height={420} />}
            </div>
          </Card>
        </div>
      </Card>

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

function InlineMetric({ label, value }) {
  return (
    <div style={S.inlineMetric}>
      <span style={S.metricLabel}>{label}</span>
      <strong style={S.inlineMetricValue}>{value ?? MISSING}</strong>
    </div>
  );
}

function BoardMetric({ label, value, note }) {
  return (
    <Card variant="card" surface={1} padding="sm" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' }}>
      <span style={S.metricLabel}>{label}</span>
      <strong style={S.boardMetricValue}>{value ?? MISSING}</strong>
      <span style={S.boardMetricNote}>{note}</span>
    </Card>
  );
}

function CapitalDonut({ segments }) {
  let cursor = 0;
  const gradient = segments.map((s) => {
    const start = cursor;
    const end = cursor + s.pct;
    cursor = end;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div data-capital-donut style={S.donutWrap}>
      <div style={{ ...S.donut, background: `conic-gradient(${gradient || 'var(--cp-border) 0% 100%'})` }}>
        <div style={S.donutHole}>
          <span style={S.donutLabel}>Capital</span>
          <strong style={S.donutValue}>Stack</strong>
        </div>
      </div>
      <div style={S.donutLegend}>
        {segments.map(s => (
          <div key={s.label} style={S.donutLegendRow}>
            <span style={{ ...S.donutDot, background: s.color }} />
            <span style={S.donutLegendLabel}>{s.label}</span>
            <strong style={S.donutLegendValue}>{fmtPctRaw(s.pct, 0)} · {fmtUSD(s.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionKpis({ projection }) {
  return (
    <div data-decision-panel style={S.decisionPanel}>
      <span style={S.decisionEyebrow}>Decision metrics</span>
      <div data-decision-metrics style={S.decisionMetrics}>
        {DECISION_METRICS.map(metric => (
          <div key={metric.id} style={S.decisionMetric}>
            <span style={S.decisionMetricLabel}>{metric.label}</span>
            <strong style={S.decisionMetricValue}>{metric.value(projection)}</strong>
            <span style={S.decisionMetricNote}>{metric.note}</span>
          </div>
        ))}
      </div>
      <div data-risk-strip style={S.riskStrip}>
        <span style={S.riskLabel}>Risk guardrail</span>
        <strong style={S.riskValue}>DSCR {fmtX(projection?.dscr_stabilized)}</strong>
        <span style={T.muted}>{UI.RESULTS_RISK_NOTE}</span>
      </div>
    </div>
  );
}

function LayerCard({ index, title, rows }) {
  return (
    <Card variant="card" surface={1} padding="sm" style={{ minWidth: 0 }}>
      <div style={S.layerHead}>
        <span style={S.layerIndex}>{index}</span>
        <h3 style={S.layerTitle}>{title}</h3>
      </div>
      <div style={S.layerRows}>
        {rows.map(([label, value]) => (
          <div key={label} style={S.layerRow}>
            <span style={S.layerLabel}>{label}</span>
            <strong style={S.layerValue}>{value ?? MISSING}</strong>
          </div>
        ))}
      </div>
    </Card>
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
  decisionPanel: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-4)',
    paddingLeft: 'var(--cp-space-6)',
    borderLeft: '1px solid var(--cp-border)',
  },
  decisionEyebrow: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  decisionMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 'var(--cp-space-5)',
  },
  decisionMetric: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  decisionMetricLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  decisionMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'clamp(28px, 2.15vw, 34px)',
    lineHeight: 1,
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  decisionMetricNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  riskStrip: {
    display: 'grid',
    gridTemplateColumns: 'auto auto minmax(0, 1fr)',
    gap: 'var(--cp-space-3)',
    alignItems: 'center',
    paddingTop: 'var(--cp-space-3)',
    borderTop: '1px solid var(--cp-border)',
  },
  riskLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  riskValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
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
  layerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 'var(--cp-space-4)' },
  layerHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-3)',
    marginBottom: 'var(--cp-space-3)',
  },
  layerIndex: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  layerTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
  },
  layerRows: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)' },
  layerRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)', gap: 'var(--cp-space-3)' },
  layerLabel: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)' },
  layerValue: { color: 'var(--cp-text-primary)', fontSize: 'var(--cp-font-sm)', textAlign: 'right', overflowWrap: 'anywhere' },
  inlineMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minWidth: 0,
  },
  metricLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    fontWeight: 'var(--cp-weight-bold)',
  },
  inlineMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-base)',
    lineHeight: 'var(--cp-leading-tight)',
    fontVariantNumeric: 'tabular-nums',
  },
  boardMetricValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-xl)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    fontVariantNumeric: 'tabular-nums',
  },
  boardMetricNote: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  donutWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--cp-space-4)',
  },
  donut: {
    width: 150,
    height: 150,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    boxShadow: 'inset 0 0 0 1px var(--cp-border)',
  },
  donutHole: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  donutValue: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-lg)',
  },
  donutLegend: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  donutLegendRow: {
    display: 'grid',
    gridTemplateColumns: 'var(--cp-space-3) minmax(0, 1fr) auto',
    gap: 'var(--cp-space-2)',
    alignItems: 'center',
  },
  donutDot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
  },
  donutLegendLabel: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
  },
  donutLegendValue: {
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-sm)',
    whiteSpace: 'nowrap',
  },
  vizShell: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 'var(--cp-space-4)',
    alignItems: 'stretch',
  },
  vizRail: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  vizRailBtn: {
    appearance: 'none',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 'var(--cp-space-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minHeight: 118,
  },
  vizRailBtnActive: {
    borderColor: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
  },
  vizRailLabel: {
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  vizRailDetail: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  vizPanelHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-4)',
    marginBottom: 'var(--cp-space-4)',
    width: '100%',
  },
  vizTitle: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    fontWeight: 'var(--cp-weight-black)',
  },
  vizDetail: {
    margin: 'var(--cp-space-1) 0 0',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
  },
  vizMode: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  vizContainer: { minHeight: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
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
