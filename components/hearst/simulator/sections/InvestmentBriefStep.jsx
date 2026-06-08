'use client';

import PropTypes from 'prop-types';
import InputModeSwitcher from '@/components/hearst/simulator/InputModeSwitcher';
import InputFieldHero from '@/components/hearst/simulator/InputFieldHero';
import { SectionHead, Card, Button, Eyebrow } from '@/components/hearst/ui';
import { QATAR_PRESETS } from '@/lib/hearst-simulator-state';
import { UI } from '@/lib/ui-strings';

/** Human one-liner under each scenario card — always shows the native metric,
 * with $ budget appended when the preset is capital-driven (so the mix reads
 * intentional, never an incoherent outlier). Never exposes raw archetype ids. */
function scenarioPresetSub(p) {
  if (p.mode === 'target_irr_first') return `${p.target_irr_pct}% target return`;
  if (p.mode === 'capital_first') {
    const budget = `$${(p.capital_usd / 1e9).toFixed(1)}B`;
    return p.total_mw ? `${p.total_mw} MW · ${budget}` : `${budget} budget`;
  }
  return `${p.total_mw} MW`;
}

const LEVER_PILLS = [
  { id: 'pricing',      label: UI.SIM_LEVER_PRICING },
  { id: 'capex_per_mw', label: UI.SIM_LEVER_CAPEX },
  { id: 'leverage',     label: UI.SIM_LEVER_LEVERAGE },
  { id: 'mw',           label: UI.SIM_LEVER_MW },
];

/**
 * InvestmentBriefStep — section 01, "The Brief Bar". One vertical card:
 * quick-start presets → a single control bar (segmented mode switch welded above
 * the driven field, with the two engine-computed quantities riveted to its right).
 * No side-by-side columns, no competing sub-titles.
 */
export default function InvestmentBriefStep({
  mode,
  inputValue,
  activeScenarioPreset,
  projection,
  scenario,
  derived,
  solver,
  targetIrrLever,
  onModeChange,
  onBootstrap,
  onPreset,
  onInputChange,
  onSetIrrLever,
}) {
  return (
    <Card as="section" data-sim-command-deck variant="flat" style={S.deck} padding="lg">
      <div style={S.head}>
        <SectionHead
          num="01"
          eyebrow={UI.SIM_BUILD_BRIEF_EYEBROW}
          title={UI.SIM_BUILD_BRIEF_TITLE}
          hint={UI.SIM_BUILD_BRIEF_HINT}
          style={{ marginBottom: 0, flex: '1 1 320px', minWidth: 0 }}
        />
        <Button variant="link" size="sm" onClick={onBootstrap} style={S.autofill}>
          {UI.SIM_AUTOFILL}
        </Button>
      </div>

      {/* Quick-start presets — shortcuts that drive the bar below */}
      <div style={S.presetBlock}>
        <Eyebrow>{UI.SIM_QUICK_START} · {UI.SIM_QUICK_START_COUNT(QATAR_PRESETS.length)}</Eyebrow>
        <div data-sim-preset-grid style={S.presetGrid} role="group" aria-label={UI.SIM_READY_SCENARIOS}>
          {QATAR_PRESETS.map((p) => {
            const active = activeScenarioPreset === p.id;
            return (
              <Card
                key={p.id}
                as="button"
                onClick={() => onPreset(p)}
                accent={active}
                surface={0}
                hover
                padding="sm"
                style={S.presetCard}
              >
                <span style={S.presetName}>{p.label}</span>
                <span style={{ ...S.presetSub, ...(active ? S.presetSubActive : {}) }}>
                  {scenarioPresetSub(p)}
                </span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* The bar — segmented mode switch welded above the driven field */}
      <div style={S.bar}>
        <InputModeSwitcher mode={mode} onChange={onModeChange} />
        <InputFieldHero
          mode={mode}
          value={inputValue}
          onChange={onInputChange}
          projection={projection}
          scenario={scenario}
          derived={derived}
          solver={solver}
        />
        {mode === 'target_irr_first' && (
          <div style={S.leverRow}>
            <Eyebrow>{UI.SIM_WHAT_TO_CHANGE}</Eyebrow>
            <div style={S.leverPills}>
              {LEVER_PILLS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={targetIrrLever === l.id}
                  onClick={() => onSetIrrLever(l.id)}
                  style={{ ...S.leverBtn, ...(targetIrrLever === l.id ? S.leverBtnActive : {}) }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

InvestmentBriefStep.propTypes = {
  mode: PropTypes.string.isRequired,
  inputValue: PropTypes.number,
  activeScenarioPreset: PropTypes.string,
  projection: PropTypes.object,
  scenario: PropTypes.object,
  derived: PropTypes.object,
  solver: PropTypes.object,
  targetIrrLever: PropTypes.string,
  onModeChange: PropTypes.func.isRequired,
  onBootstrap: PropTypes.func.isRequired,
  onPreset: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSetIrrLever: PropTypes.func.isRequired,
};

const S = {
  deck: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-5)',
    minWidth: 0,
  },
  head: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
    paddingBottom: 'var(--cp-space-4)',
    borderBottom: '1px solid var(--cp-border)',
  },
  autofill: {
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  presetBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 'var(--cp-space-2)',
  },
  presetCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minHeight: 60,
    cursor: 'pointer',
    textAlign: 'left',
  },
  presetName: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    lineHeight: 'var(--cp-leading-tight)',
  },
  presetSub: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  presetSubActive: {
    color: 'var(--cp-text-strong)',
    opacity: 0.85,
  },
  bar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  leverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-4)',
    flexWrap: 'wrap',
  },
  leverPills: {
    display: 'flex',
    gap: 'var(--cp-space-2)',
    flexWrap: 'wrap',
  },
  leverBtn: {
    fontSize: 'var(--cp-font-sm)',
    height: 'var(--cp-icon-btn-size)',
    padding: '0 var(--cp-space-4)',
    cursor: 'pointer',
    fontWeight: 'var(--cp-weight-semibold)',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-pill)',
    transition: 'background var(--cp-dur-base) var(--cp-ease), color var(--cp-dur-base) var(--cp-ease), border-color var(--cp-dur-base) var(--cp-ease)',
  },
  leverBtnActive: {
    background: 'var(--cp-accent-maroon)',
    color: 'var(--cp-text-strong)',
    borderColor: 'var(--cp-border-accent)',
  },
};
