'use client';

import { Card, Button } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

const MODES = [
  { id: 'capital_first',     label: 'Budget',        sub: '$',       hint: 'How much money do you have?' },
  { id: 'mw_first',          label: 'Size',          sub: 'MW',      hint: 'How big do you want it?' },
  { id: 'target_irr_first',  label: 'Target return', sub: '%',       hint: 'What yearly return do you want?' },
];

export default function InputModeSwitcher({ mode, onChange, onBootstrap }) {
  return (
    <div style={S.wrap}>
      <div data-input-mode-grid style={S.modes} role="radiogroup" aria-label={UI.SIM_INPUT_MODE_ARIA}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <Card
              key={m.id}
              as="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange?.(m.id)}
              accent={active}
              surface={0}
              hover
              padding="sm"
              style={S.modeBtn}
            >
              <div style={S.modeRow}>
                <span style={S.modeLabel}>{m.label}</span>
                <span style={{ ...S.modeSub, ...(active ? S.modeSubActive : {}) }}>{m.sub}</span>
              </div>
              <div style={S.modeHint}>{m.hint}</div>
            </Card>
          );
        })}
      </div>

      <Button variant="link" size="sm" onClick={onBootstrap} style={{ alignSelf: 'flex-start' }}>
        Auto-fill with Qatar market data →
      </Button>
    </div>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
  },
  modes: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'var(--cp-space-3)',
  },
  modeBtn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    minHeight: 72,
  },
  modeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--cp-space-1)' },
  modeLabel: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-wide)',
  },
  modeSub: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  modeSubActive: { color: 'var(--cp-text-strong)', opacity: 0.85 },
  modeHint: {
    fontSize: 'var(--cp-font-micro)',
    opacity: 0.8,
    lineHeight: 'var(--cp-leading-tight)',
  },
};
