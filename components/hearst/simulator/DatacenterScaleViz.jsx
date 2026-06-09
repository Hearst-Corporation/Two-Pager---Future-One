'use client';

import PropTypes from 'prop-types';
import { Gauge } from 'lucide-react';
import { Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';
import { L } from '@/lib/cp-styles';

const DRIVER = {
  mw_first:         { unit: UI.SIM_MODE_SIZE_UNIT,   parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
  capital_first:    { unit: UI.SIM_MODE_BUDGET_UNIT,  parse: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0, format: (v) => (v ? v.toLocaleString('en-US') : '') },
  target_irr_first: { unit: UI.SIM_MODE_RETURN_UNIT,  parse: (s) => parseFloat(s) || 0, format: (v) => (v ? String(v) : '') },
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hallTone(index, mix) {
  const classicEnd = Math.round((mix.classic_pct || 0) / 100 * 12);
  const liquidEnd = classicEnd + Math.round((mix.liquid_pct || 0) / 100 * 12);
  if (index < classicEnd) return 'standard';
  if (index < liquidEnd) return 'dense';
  return 'ai';
}

export default function DatacenterScaleViz({ totalMw = 50, mix, mode = 'mw_first', inputValue, onInputChange }) {
  const safeMw = Number.isFinite(totalMw) ? totalMw : 50;
  const v = mix || {};
  const cfg = DRIVER[mode] || DRIVER.mw_first;
  const hallCount = clamp(Math.ceil(safeMw / 10), 2, 12);
  const aiMw = safeMw * ((v.ai_pct || 0) / 100);
  const scale = clamp(safeMw / 100, 0.2, 1.2);
  const campusW = 500 + scale * 80;
  const campusH = 200 + scale * 60;

  return (
    <Card as="section" variant="card" surface={1} padding="lg" style={S.card}>
      <style>{`
        @keyframes oracle-dc-pulse {
          0%, 100% { opacity: .34; transform: scale(1); }
          50% { opacity: .82; transform: scale(1.04); }
        }
        @keyframes oracle-dc-flow {
          from { stroke-dashoffset: 26; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-dc-animated] {
            animation: none !important;
          }
        }
      `}</style>
      <div style={L.rowBetween}>
        <span style={S.titleGroup}>
          <span style={S.icon} aria-hidden="true"><Gauge size={18} strokeWidth={1.8} /></span>
          <span>
            <span style={S.kicker}>{UI.SIM_DC_KICKER}</span>
            <h3 style={S.title}>{UI.SIM_DC_TITLE}</h3>
          </span>
        </span>
        <span style={S.unitBadge}>{cfg.unit}</span>
      </div>

      <div style={S.driver}>
        <input
          type="text"
          value={cfg.format(inputValue)}
          onChange={(e) => onInputChange?.(cfg.parse(e.target.value))}
          placeholder={UI.SIM_FIELD_SIZE_PLACEHOLDER}
          aria-label={UI.SIM_SIZE_TITLE}
          style={S.input}
        />
        <span style={S.unit}>{cfg.unit}</span>
      </div>

      <svg viewBox="0 0 640 360" role="img" aria-label={UI.SIM_DC_ARIA} style={S.svg}>
        <defs>
          <linearGradient id="dcHallStandard" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cp-surface-3)" />
            <stop offset="100%" stopColor="var(--cp-surface-1)" />
          </linearGradient>
          <linearGradient id="dcHallDense" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cp-accent)" stopOpacity="0.56" />
            <stop offset="100%" stopColor="var(--cp-surface-2)" />
          </linearGradient>
          <linearGradient id="dcHallAi" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cp-accent-maroon)" stopOpacity="0.92" />
            <stop offset="100%" stopColor="var(--cp-accent)" stopOpacity="0.36" />
          </linearGradient>
          <radialGradient id="dcGlow" cx="50%" cy="46%" r="60%">
            <stop offset="0%" stopColor="var(--cp-accent-maroon)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--cp-accent-maroon)" stopOpacity="0" />
          </radialGradient>
          <filter id="dcSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="var(--cp-bg-deep)" floodOpacity="0.46" />
          </filter>
        </defs>

        <rect x="18" y="20" width="604" height="318" rx="30" fill="var(--cp-surface-0)" stroke="var(--cp-border)" />
        <circle cx="430" cy="136" r="185" fill="url(#dcGlow)" />

        <g transform={`translate(${(640 - campusW) / 2} ${40 + (240 - campusH) / 2})`} filter="url(#dcSoftShadow)">
          <rect x="0" y="0" width={campusW} height={campusH} rx="28" fill="var(--cp-surface-1)" stroke="var(--cp-border)" />
          <path
            d={`M42 ${campusH - 54} C150 ${campusH - 110}, 240 ${campusH - 12}, ${campusW - 44} ${campusH - 72}`}
            fill="none"
            stroke="var(--cp-border-accent)"
            strokeWidth="3"
            strokeDasharray="10 16"
            data-dc-animated
            style={S.flowLine}
          />

          {Array.from({ length: hallCount }).map((_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const x = 34 + col * ((campusW - 112) / 4);
            const y = 42 + row * 62;
            const tone = hallTone(i, v);
            const fill = tone === 'ai' ? 'url(#dcHallAi)' : tone === 'dense' ? 'url(#dcHallDense)' : 'url(#dcHallStandard)';
            return (
              <g key={i}>
                <rect x={x} y={y} width="100" height="46" rx="11" fill={fill} stroke="var(--cp-border)" />
                <rect x={x + 12} y={y + 11} width="62" height="5" rx="3" fill="var(--cp-text-strong)" opacity="0.4" />
                <rect x={x + 12} y={y + 25} width="74" height="5" rx="3" fill="var(--cp-text-strong)" opacity="0.24" />
                {tone === 'ai' && <circle data-dc-animated cx={x + 88} cy={y + 13} r="6" fill="var(--cp-accent-strong)" style={S.pulse} />}
              </g>
            );
          })}

          <g transform={`translate(${campusW - 124} ${campusH - 88})`}>
            <rect x="0" y="0" width="90" height="50" rx="14" fill="var(--cp-surface-2)" stroke="var(--cp-border-accent)" />
            <path d="M22 34h46M30 18h30M38 10h14" stroke="var(--cp-accent-strong)" strokeWidth="3" strokeLinecap="round" />
            <text x="45" y="73" textAnchor="middle" fill="var(--cp-text-muted)" fontSize="10" fontWeight="800" letterSpacing="1.6">{UI.SIM_DC_GRID}</text>
          </g>
        </g>

        <g transform="translate(58 296)">
          <text fill="var(--cp-text-muted)" fontSize="10" fontWeight="800" letterSpacing="1.8">{UI.SIM_DC_SCALE}</text>
          <text y="30" fill="var(--cp-text-strong)" fontSize="32" fontWeight="900">{Math.round(safeMw)} MW</text>
        </g>
        <g transform="translate(238 296)">
          <text fill="var(--cp-text-muted)" fontSize="10" fontWeight="800" letterSpacing="1.8">{UI.SIM_DC_HALLS}</text>
          <text y="30" fill="var(--cp-text-strong)" fontSize="32" fontWeight="900">{hallCount}</text>
        </g>
        <g transform="translate(386 296)">
          <text fill="var(--cp-text-muted)" fontSize="10" fontWeight="800" letterSpacing="1.8">{UI.SIM_DC_AI_FABRIC}</text>
          <text y="30" fill="var(--cp-accent-strong)" fontSize="32" fontWeight="900">{aiMw.toFixed(1)} MW</text>
        </g>
      </svg>
    </Card>
  );
}

DatacenterScaleViz.propTypes = {
  totalMw: PropTypes.number,
  mix: PropTypes.object,
  mode: PropTypes.string,
  inputValue: PropTypes.number,
  onInputChange: PropTypes.func,
};

const S = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    overflow: 'hidden',
    flex: '1 1 auto',
    background: 'linear-gradient(145deg, var(--cp-surface-2), var(--cp-surface-0))',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-3)',
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    flex: '0 0 36px',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--cp-accent-maroon)',
    background: 'var(--cp-accent-soft)',
    border: '1px solid var(--cp-border-accent)',
    borderRadius: 'var(--cp-radius-md)',
  },
  kicker: {
    color: 'var(--cp-accent-maroon)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: 'var(--cp-text-primary)',
    fontSize: 'var(--cp-font-lg)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
  },
  unitBadge: {
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  driver: {
    ...L.rowBetween,
    padding: 'var(--cp-space-4) 0 var(--cp-space-2)',
    borderBottom: '1px solid var(--cp-border-accent)',
  },
  input: {
    width: '100%',
    minWidth: 0,
    flex: '1 1 auto',
    fontSize: 'clamp(32px, 4vw, 48px)',
    lineHeight: 'var(--cp-leading-tight)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    fontVariantNumeric: 'tabular-nums',
  },
  unit: {
    fontSize: 'var(--cp-font-xl)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
  },
  svg: {
    width: '100%',
    minHeight: 330,
    display: 'block',
  },
  flowLine: {
    animation: 'oracle-dc-flow 2.4s linear infinite',
  },
  pulse: {
    transformOrigin: 'center',
    animation: 'oracle-dc-pulse 1.8s ease-in-out infinite',
  },
};
