'use client';

// SimpleWizard — version néophyte du simulateur Hearst.
// 4 étapes guidées, zéro jargon financier. Réutilise le state reducer
// du simulateur Pro pour que la simulation tourne en arrière-plan.
//
// Props :
//   state, dispatch : reducer du simulator (ACTIONS / state shape inchangés)
//   simResult       : dernière réponse de /api/admin/hearst/simulate
//   onSwitchToPro   : callback pour passer en mode Pro (avec state hérité)

import { useState } from 'react';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';

const STEPS = [
  { id: 'capital',  label: 'Votre budget' },
  { id: 'deal',     label: 'Type de deal' },
  { id: 'hardware', label: 'Équipement' },
  { id: 'result',   label: 'Vos résultats' },
];

// Sous-ensemble friendly des 8 archetypes — vocabulaire néophyte.
const SIMPLE_DEALS = [
  {
    id: 'powered_shell',
    title: 'Construire pour louer',
    pitch: 'Tu bâtis le data center, un grand opérateur (Equinix, NTT) loue tout pendant 15-20 ans.',
    pros: 'Risque faible, revenus stables, ton nom reste sur le bâtiment.',
    icon: '🏛',
  },
  {
    id: 'branded_jv',
    title: 'Partenariat 51/49',
    pitch: 'Tu mets 51%, un opérateur met 49%. Vous décidez ensemble, son équipe opère.',
    pros: 'Plus de contrôle, vous partagez les profits et les risques.',
    icon: '🤝',
  },
  {
    id: 'sale_leaseback',
    title: 'Construire pour revendre',
    pitch: 'Tu bâtis, tu loues 5 ans à un opérateur, puis tu vends le bâtiment avec son loyer attaché.',
    pros: 'Sortie rapide (4-5 ans), grosse plus-value à la revente.',
    icon: '🔄',
  },
  {
    id: 'neocloud_gpu',
    title: 'Cloud IA (GPU)',
    pitch: 'Tu achètes des GPU NVIDIA et tu loues du compute IA à des startups et entreprises.',
    pros: 'Très forte demande IA, marges hautes, mais hardware se déprécie vite.',
    icon: '⚡',
  },
];

const HARDWARE_PRESETS = [
  {
    id: 'standard',
    title: 'Standard',
    pitch: 'Serveurs classiques pour entreprises, banques, télécoms.',
    mix: { classic_pct: 100, liquid_pct: 0, ai_pct: 0, gpu_sku_id: 'h100_sxm5', utilization_pct: 75, gpu_hour_price: 4 },
  },
  {
    id: 'high_density',
    title: 'Haute densité',
    pitch: 'Refroidi à eau, plus de puissance par rack — pour hyperscalers.',
    mix: { classic_pct: 40, liquid_pct: 50, ai_pct: 10, gpu_sku_id: 'h100_sxm5', utilization_pct: 78, gpu_hour_price: 4 },
  },
  {
    id: 'ai_focus',
    title: 'Focus IA',
    pitch: 'Clusters GPU NVIDIA pour entraînement et inférence IA.',
    mix: { classic_pct: 15, liquid_pct: 25, ai_pct: 60, gpu_sku_id: 'gb200_nvl72', utilization_pct: 85, gpu_hour_price: 5 },
  },
];

function fmtMoney(usd) {
  if (usd == null) return '—';
  if (Math.abs(usd) >= 1e9) return `${(usd / 1e9).toFixed(1)} milliards $`;
  if (Math.abs(usd) >= 1e6) return `${(usd / 1e6).toFixed(0)} M$`;
  if (Math.abs(usd) >= 1e3) return `${(usd / 1e3).toFixed(0)} k$`;
  return `${usd.toFixed(0)} $`;
}
function fmtPct(r) {
  if (r == null) return '—';
  return `${(r * 100).toFixed(0)}%`;
}

function megawattAnalogy(mw) {
  if (!mw) return '';
  if (mw < 20) return `équivalent à ~${Math.round(mw / 5)} petits immeubles de bureaux`;
  if (mw < 100) return `équivalent à ~${Math.round(mw / 25)} grands campus`;
  return `équivalent à une petite ville de ${Math.round(mw * 1000)} foyers`;
}

export default function SimpleWizard({ state, dispatch, simResult, onSwitchToPro }) {
  const [step, setStep] = useState(0);

  const projection = simResult?.projection;
  const scenario = simResult?.scenario;
  const archOutcome = simResult?.archetype_outcome;

  return (
    <div style={S.wrap}>
      <Stepper step={step} />

      {step === 0 && (
        <StepCapital
          capital={state.capital_usd}
          mw={scenario?.total_mw || state.total_mw}
          onChange={(v) => dispatch({ type: ACTIONS.SET_CAPITAL, value: v })}
          onModeFirst={() => dispatch({ type: ACTIONS.SET_MODE, value: 'capital_first' })}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <StepDeal
          selected={state.primary_archetype_id}
          onSelect={(id) => dispatch({ type: ACTIONS.SET_PRIMARY_ARCHETYPE, value: id })}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepHardware
          current={state.hardware_mix}
          onSelect={(mix) => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: { ...state.hardware_mix, ...mix } })}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepResult
          state={state}
          projection={projection}
          scenario={scenario}
          archOutcome={archOutcome}
          onBack={() => setStep(2)}
          onSwitchToPro={onSwitchToPro}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
function Stepper({ step }) {
  return (
    <ol style={S.stepper}>
      {STEPS.map((s, i) => (
        <li key={s.id} style={S.stepperItem}>
          <span style={{
            ...S.stepDot,
            ...(i === step ? S.stepDotActive : {}),
            ...(i < step ? S.stepDotDone : {}),
          }}>{i + 1}</span>
          <span style={{ ...S.stepLabel, ...(i === step ? S.stepLabelActive : {}) }}>{s.label}</span>
          {i < STEPS.length - 1 && <span style={S.stepLine} />}
        </li>
      ))}
    </ol>
  );
}

// ────────────────────────────────────────────────────────────
function StepCapital({ capital, mw, onChange, onModeFirst, onNext }) {
  const value = capital || 500_000_000;

  return (
    <section style={S.step}>
      <h2 style={S.q}>Combien voulez-vous investir ?</h2>
      <p style={S.qSub}>Glissez le curseur pour choisir votre budget.</p>

      <div style={S.heroValue}>{fmtMoney(value)}</div>

      <input
        type="range"
        min={50_000_000}
        max={2_000_000_000}
        step={10_000_000}
        value={value}
        onChange={(e) => {
          onModeFirst();
          onChange(Number(e.target.value));
        }}
        style={S.slider}
      />

      <div style={S.scaleRow}>
        <span>50 M$</span>
        <span>2 milliards $</span>
      </div>

      {mw > 0 && (
        <div style={S.tip}>
          💡 Avec {fmtMoney(value)}, vous pouvez construire environ <strong>{Math.round(mw)} MW</strong>{' '}
          de data center — {megawattAnalogy(mw)}.
        </div>
      )}

      <NavRow nextLabel="Suivant — choix du deal" onNext={onNext} />
    </section>
  );
}

// ────────────────────────────────────────────────────────────
function StepDeal({ selected, onSelect, onBack, onNext }) {
  return (
    <section style={S.step}>
      <h2 style={S.q}>Quel type de deal vous plaît ?</h2>
      <p style={S.qSub}>4 façons différentes de gagner de l'argent avec un data center.</p>

      <div style={S.cardGrid}>
        {SIMPLE_DEALS.map((d) => {
          const active = selected === d.id;
          const arch = DEAL_ARCHETYPES.find(a => a.id === d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect(d.id)}
              style={{ ...S.dealCard, ...(active ? S.dealCardActive : {}) }}
            >
              <div style={S.dealIcon}>{d.icon}</div>
              <div style={S.dealTitle}>{d.title}</div>
              <div style={S.dealPitch}>{d.pitch}</div>
              <div style={S.dealPros}>👍 {d.pros}</div>
              {arch?.recommended && <span style={S.dealRecommended}>RECOMMANDÉ</span>}
            </button>
          );
        })}
      </div>

      <NavRow backLabel="← Retour" onBack={onBack} nextLabel="Suivant — équipement" onNext={onNext} />
    </section>
  );
}

// ────────────────────────────────────────────────────────────
function StepHardware({ current, onSelect, onBack, onNext }) {
  const currentPresetId = HARDWARE_PRESETS.find(p =>
    p.mix.classic_pct === current?.classic_pct
    && p.mix.ai_pct === current?.ai_pct
  )?.id;

  return (
    <section style={S.step}>
      <h2 style={S.q}>Quel équipement à l'intérieur ?</h2>
      <p style={S.qSub}>Le type de serveurs change le prix de location et le profil de clients.</p>

      <div style={S.cardGrid}>
        {HARDWARE_PRESETS.map(p => {
          const active = currentPresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.mix)}
              style={{ ...S.dealCard, ...(active ? S.dealCardActive : {}) }}
            >
              <div style={S.dealTitle}>{p.title}</div>
              <div style={S.dealPitch}>{p.pitch}</div>
              <div style={S.mixBar}>
                <span style={{ ...S.mixSeg, flexBasis: `${p.mix.classic_pct}%`, background: 'var(--cp-text-muted)' }} title={`Standard ${p.mix.classic_pct}%`} />
                <span style={{ ...S.mixSeg, flexBasis: `${p.mix.liquid_pct}%`, background: 'var(--cp-text-body)' }} title={`Liquide ${p.mix.liquid_pct}%`} />
                <span style={{ ...S.mixSeg, flexBasis: `${p.mix.ai_pct}%`, background: 'var(--cp-accent)' }} title={`IA ${p.mix.ai_pct}%`} />
              </div>
              <div style={S.mixLegend}>
                Standard {p.mix.classic_pct}% · Liquide {p.mix.liquid_pct}% · IA {p.mix.ai_pct}%
              </div>
            </button>
          );
        })}
      </div>

      <NavRow backLabel="← Retour" onBack={onBack} nextLabel="Voir mes résultats" onNext={onNext} />
    </section>
  );
}

// ────────────────────────────────────────────────────────────
function StepResult({ state, projection, scenario, archOutcome, onBack, onSwitchToPro }) {
  if (!projection || !scenario) {
    return (
      <section style={S.step}>
        <h2 style={S.q}>Calcul en cours…</h2>
        <p style={S.qSub}>Patiente un instant pendant que le simulateur calcule ton scénario.</p>
        <NavRow backLabel="← Retour" onBack={onBack} />
      </section>
    );
  }

  const capital = state.capital_usd || projection.total_capex;
  const mw = scenario.total_mw;
  const payback = projection.payback_years;
  const irr = projection.irr;
  const terminalValue = projection.terminal_value;
  const yearlyProfit = projection.stabilized_ebitda;

  return (
    <section style={S.step}>
      <h2 style={S.q}>Voici votre plan</h2>
      <p style={S.qSub}>Résumé en langage simple — le détail technique est dans le mode Pro.</p>

      <div style={S.story}>
        <p style={S.storyLine}>
          🏗 Avec <strong>{fmtMoney(capital)}</strong>, vous construisez{' '}
          <strong>{Math.round(mw)} MW</strong> de data center{' '}
          ({archOutcome?.label || 'deal sélectionné'}).
        </p>
        <p style={S.storyLine}>
          📈 Chaque année, votre activité génère environ{' '}
          <strong>{fmtMoney(yearlyProfit)}</strong> de profit.
        </p>
        <p style={S.storyLine}>
          ⏳ Vous récupérez votre argent investi en environ{' '}
          <strong>{payback ? `${payback.toFixed(1)} ans` : '— ans'}</strong>.
        </p>
        <p style={S.storyLine}>
          💰 Ensuite, vous gagnez{' '}
          <strong>{fmtPct(irr)}</strong> par an pendant 10 ans.
        </p>
        <p style={S.storyLine}>
          🎯 À la sortie (année 10), le data center vaut environ{' '}
          <strong>{fmtMoney(terminalValue)}</strong>.
        </p>
      </div>

      <div style={S.kpiGrid}>
        <Kpi label="Coût de construction" value={fmtMoney(projection.total_capex)} />
        <Kpi label="Profit annuel" value={fmtMoney(yearlyProfit)} />
        <Kpi label="Rendement annuel" value={fmtPct(irr)} />
        <Kpi label="Valeur à la revente" value={fmtMoney(terminalValue)} />
      </div>

      <NavRow
        backLabel="← Modifier"
        onBack={onBack}
        nextLabel="Ouvrir le mode Pro →"
        onNext={onSwitchToPro}
      />
    </section>
  );
}

function Kpi({ label, value }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiLabel}>{label}</div>
      <div style={S.kpiValue}>{value}</div>
    </div>
  );
}

function NavRow({ backLabel, onBack, nextLabel, onNext }) {
  return (
    <div style={S.navRow}>
      {onBack ? <button type="button" onClick={onBack} style={S.btnGhost}>{backLabel}</button> : <span />}
      {onNext ? <button type="button" onClick={onNext} style={S.btnPrimary}>{nextLabel}</button> : <span />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 32 },

  stepper: { display: 'flex', alignItems: 'center', gap: 0, listStyle: 'none', padding: 0, margin: 0, overflowX: 'auto' },
  stepperItem: { display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' },
  stepDot: {
    width: 28, height: 28, borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 'var(--cp-font-sm)', fontWeight: 700,
    background: 'var(--cp-surface-2)', color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)', flexShrink: 0,
  },
  stepDotActive: { background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none' },
  stepDotDone: { background: 'var(--cp-text-primary)', color: 'var(--cp-bg-deep, #000)' },
  stepLabel: { fontSize: 'var(--cp-font-sm)', fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' },
  stepLabelActive: { color: 'var(--cp-text-primary)' },
  stepLine: { flex: '0 0 16px', height: 1, background: 'var(--cp-border)' },

  step: {
    display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-5)',
    padding: 'clamp(20px, 5vw, 48px) clamp(16px, 4vw, 32px)',
    background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
  },
  q: { fontSize: 'clamp(18px, 4vw, 28px)', fontWeight: 800, color: 'var(--cp-text-primary)', margin: 0, lineHeight: 1.2 },
  qSub: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-muted)', margin: 0 },

  heroValue: { fontSize: 'clamp(32px, 10vw, 52px)', fontWeight: 800, color: 'var(--cp-text-primary)', textAlign: 'center', padding: 'var(--cp-space-4) 0', fontVariantNumeric: 'tabular-nums' },
  slider: { width: '100%', accentColor: 'var(--cp-accent)' },
  scaleRow: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', marginTop: -8 },
  tip: { padding: 'var(--cp-space-4)', background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)', fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.6 },

  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--cp-space-3)' },
  dealCard: {
    position: 'relative',
    padding: 'var(--cp-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)',
    background: 'var(--cp-surface-0)', border: '2px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s ease', color: 'inherit', font: 'inherit',
  },
  dealCardActive: {
    background: 'var(--cp-surface-2)', borderColor: 'var(--cp-accent)',
    boxShadow: '0 0 0 4px color-mix(in srgb, var(--cp-accent) 12%, transparent)',
  },
  dealIcon: { fontSize: 'var(--cp-font-2xl)', lineHeight: 1 },
  dealTitle: { fontSize: 'var(--cp-font-lg)', fontWeight: 800, color: 'var(--cp-text-primary)' },
  dealPitch: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.5 },
  dealPros: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', lineHeight: 1.5, marginTop: 'auto' },
  dealRecommended: {
    position: 'absolute', top: 8, right: 8,
    fontSize: 'var(--cp-font-xs)', fontWeight: 800, padding: 'var(--cp-space-1) var(--cp-space-2)',
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)',
    borderRadius: 'var(--cp-radius-pill)', letterSpacing: 0.5,
  },

  mixBar: { display: 'flex', height: 10, background: 'var(--cp-border)', borderRadius: 'var(--cp-radius-pill)', overflow: 'hidden', marginTop: 'var(--cp-space-2)' },
  mixSeg: { display: 'inline-block' },
  mixLegend: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },

  story: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)' },
  storyLine: { fontSize: 'var(--cp-font-lg)', lineHeight: 1.6, color: 'var(--cp-text-body)', margin: 0 },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--cp-space-2)', marginTop: 'var(--cp-space-4)' },
  kpi: { padding: 'var(--cp-space-4)', background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)' },
  kpiLabel: { fontSize: 'var(--cp-font-xs)', fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: 'var(--cp-font-xl)', fontWeight: 800, color: 'var(--cp-text-primary)', marginTop: 'var(--cp-space-1)', fontVariantNumeric: 'tabular-nums' },

  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--cp-space-3)', marginTop: 'var(--cp-space-4)' },
  btnGhost: {
    height: 44, padding: '0 var(--cp-space-5)',
    background: 'transparent', color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-base)', fontWeight: 700, cursor: 'pointer',
  },
  btnPrimary: {
    height: 44, padding: '0 var(--cp-space-7)',
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)',
    border: 'none', borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-md)', fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3,
  },
};
