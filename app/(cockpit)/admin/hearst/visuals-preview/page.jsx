'use client';
import { useState } from 'react';
import CampusFloorplan2D from '@/components/hearst/visuals/CampusFloorplan2D';
import Campus3DIsometric from '@/components/hearst/visuals/Campus3DIsometric';
import PowerFlowDiagram from '@/components/hearst/visuals/PowerFlowDiagram';
import CoolingFlowDiagram from '@/components/hearst/visuals/CoolingFlowDiagram';
import RegionalStrategyMap from '@/components/hearst/visuals/RegionalStrategyMap';
import ScenarioComparisonBoard from '@/components/hearst/visuals/ScenarioComparisonBoard';
import DeploymentPhasingChart from '@/components/hearst/visuals/DeploymentPhasingChart';

const DEMO_SCENARIOS = [
  { id: '1', name: 'Qatar 100MW Powered Shell', archetype: 'Powered Shell', irr_pct: 18.3, moic: 5.9, capex_m: 744, mw: 100, cod_months: 30, risk_score: 2.1, confidence: 0.88, region: 'Qatar', label: 'Qatar 100MW' },
  { id: '2', name: 'Qatar 50MW AI Factory', archetype: 'AI Factory', irr_pct: 21.4, moic: 6.8, capex_m: 440, mw: 50, cod_months: 24, risk_score: 3.2, confidence: 0.92, region: 'Qatar', label: 'Qatar 50MW AI' },
  { id: '3', name: 'KSA 200MW Hyperscale', archetype: 'Hyperscale', irr_pct: 16.1, moic: 4.7, capex_m: 1800, mw: 200, cod_months: 48, risk_score: 2.8, confidence: 0.79, region: 'KSA', label: 'KSA 200MW' },
  { id: '4', name: 'UAE 75MW GPU Cloud', archetype: 'GPU Cloud', irr_pct: 24.5, moic: 7.2, capex_m: 560, mw: 75, cod_months: 18, risk_score: 4.1, confidence: 0.71, region: 'UAE', label: 'UAE 75MW' },
  { id: '5', name: 'GCC 500MW Sovereign', archetype: 'Sovereign', irr_pct: 14.8, moic: 4.1, capex_m: 4500, mw: 500, cod_months: 72, risk_score: 1.8, confidence: 0.95, region: 'Qatar', label: 'GCC 500MW' },
];

const DEMO_PHASES = [
  { name: 'Phase 1', start_month: 0, duration_months: 24, mw_delivered: 50, cod_date: 'Q4 2026' },
  { name: 'Phase 2', start_month: 24, duration_months: 18, mw_delivered: 30, cod_date: 'Q2 2028' },
  { name: 'Phase 3', start_month: 42, duration_months: 12, mw_delivered: 20, cod_date: 'Q2 2029' },
];

const TABS = [
  { id: 'campus2d', label: 'Campus 2D' },
  { id: 'campus3d', label: 'Campus 3D' },
  { id: 'powerflow', label: 'Power Flow' },
  { id: 'coolingflow', label: 'Cooling Flow' },
  { id: 'regional', label: 'Regional Map' },
  { id: 'comparison', label: 'Scenario Comparison' },
  { id: 'phasing', label: 'Deployment Phasing' },
];

const S = {
  page: { padding: '32px 40px', maxWidth: 1200, margin: '0 auto', color: 'var(--cp-text, #f5f5f4)' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 },
  sub: { fontSize: 14, color: 'var(--cp-text-muted, #9ca3af)' },
  tabs: { display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' },
  tab: (active) => ({
    padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', letterSpacing: '0.2px',
    background: active ? '#7f1d1d' : 'var(--cp-surface-2, #1c1917)',
    color: active ? '#fef2f2' : 'var(--cp-text-muted, #9ca3af)',
    transition: 'all 150ms',
  }),
  card: {
    background: 'var(--cp-surface-1, #141210)', border: '1px solid var(--cp-border, #292524)',
    borderRadius: 16, padding: '24px 28px', marginBottom: 24,
  },
  label: { fontSize: 12, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 },
  mwRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  mwBtn: (active) => ({
    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: '1px solid', transition: 'all 150ms',
    borderColor: active ? '#7f1d1d' : '#374151',
    background: active ? 'rgba(127,29,29,0.2)' : 'transparent',
    color: active ? '#fca5a5' : '#9ca3af',
  }),
};

export default function VisualsPreview() {
  const [tab, setTab] = useState('campus2d');
  const [mw, setMw] = useState(100);
  const [phases, setPhases] = useState(2);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Spatial Visual System — Placeholder Mode</h1>
        <p style={S.sub}>7 institutional placeholders · awaiting approved 3D/spatial assets · not for presentation</p>
      </div>

      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'campus2d' || tab === 'campus3d') && (
        <div style={S.card}>
          <div style={S.label}>Parameters</div>
          <div style={S.mwRow}>
            {[50, 100, 200, 500].map(v => (
              <button key={v} style={S.mwBtn(mw === v)} onClick={() => setMw(v)}>{v} MW</button>
            ))}
            {[1, 2, 3].map(v => (
              <button key={v} style={S.mwBtn(phases === v)} onClick={() => setPhases(v)}>Phase {v}</button>
            ))}
          </div>
        </div>
      )}

      <div style={S.card}>
        {tab === 'campus2d' && (
          <>
            <div style={S.label}>Campus 2D Floorplan — placeholder (awaiting approved asset)</div>
            <CampusFloorplan2D mw={mw} phases={phases} archetype="powered_shell" />
          </>
        )}
        {tab === 'campus3d' && (
          <>
            <div style={S.label}>Campus 3D Isometric — placeholder (awaiting approved 3D asset)</div>
            <Campus3DIsometric mw={mw} phases={phases} archetype="ai_factory" />
          </>
        )}
        {tab === 'powerflow' && (
          <>
            <div style={S.label}>Power Flow Diagram — placeholder (awaiting approved asset)</div>
            <PowerFlowDiagram mw={100} tier="III" />
          </>
        )}
        {tab === 'coolingflow' && (
          <>
            <div style={S.label}>Cooling Flow Diagram — placeholder (awaiting approved asset)</div>
            <CoolingFlowDiagram pue={1.45} cooling_type="hybrid" />
          </>
        )}
        {tab === 'regional' && (
          <>
            <div style={S.label}>Regional Strategy Map — placeholder (awaiting approved asset)</div>
            <RegionalStrategyMap scenarios={DEMO_SCENARIOS} />
          </>
        )}
        {tab === 'comparison' && (
          <>
            <div style={S.label}>Scenario Comparison Board — placeholder (awaiting approved asset)</div>
            <ScenarioComparisonBoard scenarios={DEMO_SCENARIOS} />
          </>
        )}
        {tab === 'phasing' && (
          <>
            <div style={S.label}>Deployment Phasing Chart — placeholder (awaiting approved asset)</div>
            <DeploymentPhasingChart phases={DEMO_PHASES} />
          </>
        )}
      </div>
    </div>
  );
}
