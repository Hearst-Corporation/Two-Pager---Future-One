import React from 'react';
import { TOKENS, PHASE_PALETTE } from '@/lib/spatial/tokens';

// Local alias map — every value resolves to a cockpit `var(--color-*)`.
// Roles: burgundy*=dataHall, phase1/2/3=PHASE_PALETTE, substation=power,
// cooling=cooling, fiber=network, expansion=phase.expansion, grey*/warmWhite=neutrals.
const COLORS = {
  burgundy: TOKENS.dataHall.base.var,
  burgundyLight: TOKENS.dataHall.strong.var,
  burgundyFill: TOKENS.dataHall.base.var,
  surfaceBg: TOKENS.surface.var,
  textInverse: TOKENS.textInverse.var,
  grey: TOKENS.power.base.var,
  greyLight: TOKENS.textMuted.var,
  greyBorder: TOKENS.border.var,
  phase1: PHASE_PALETTE[0].var,
  phase2: PHASE_PALETTE[1].var,
  phase3: PHASE_PALETTE[2].var,
  expansion: TOKENS.phase.expansion.var,
  substation: TOKENS.power.base.var,
  cooling: TOKENS.cooling.base.var,
  fiber: TOKENS.network.base.var,
};

function getMWPerHall(mw, phases) {
  if (phases === 1) return [mw];
  if (phases === 2) return [Math.round(mw * 0.6), Math.round(mw * 0.4)];
  return [Math.round(mw * 0.5), Math.round(mw * 0.3), Math.round(mw * 0.2)];
}

function PhaseColors(phases) {
  const colors = [COLORS.phase1, COLORS.phase2, COLORS.phase3];
  return colors.slice(0, phases);
}

export default function CampusFloorplan2D({ mw = 100, phases = 2, archetype = 'ai_factory', style = {} }) {
  const mwPerHall = getMWPerHall(mw, Math.min(phases, 3));
  const phaseColors = PhaseColors(Math.min(phases, 3));

  const hallCount = mwPerHall.length;
  const hallWidth = 150;
  const hallHeight = hallCount === 1 ? 200 : hallCount === 2 ? 180 : 150;
  const hallStartX = 120;
  const hallSpacing = 20;
  const totalHallsHeight = hallCount * hallHeight + (hallCount - 1) * hallSpacing;
  const hallsStartY = (400 - totalHallsHeight) / 2;

  const halls = mwPerHall.map((mwVal, i) => ({
    x: hallStartX,
    y: hallsStartY + i * (hallHeight + hallSpacing),
    w: hallWidth,
    h: hallHeight,
    mw: mwVal,
    phase: i + 1,
    color: phaseColors[i],
    label: `Data Hall ${i + 1}`,
  }));

  return (
    <svg
      viewBox="0 0 600 400"
      width="100%"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.surfaceBg, ...style }}
      aria-label={`Campus Floorplan — ${mw}MW, ${phases} phase${phases > 1 ? 's' : ''}, ${archetype}`}
    >
      {/* Defs */}
      <defs>
        <pattern id="dash-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
          <line x1="0" y1="0" x2="8" y2="8" stroke={COLORS.greyLight} strokeWidth="0.8" strokeDasharray="2 2" />
        </pattern>
      </defs>

      {/* Site boundary */}
      <rect
        x="12" y="12" width="576" height="376"
        rx="4"
        fill="none"
        stroke={COLORS.grey}
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />

      {/* Site label */}
      <text x="300" y="26" textAnchor="middle" fontSize="9" fill={COLORS.greyLight} fontWeight="600" letterSpacing="2">
        CAMPUS SITE BOUNDARY
      </text>

      {/* --- FIBER POP (left edge) --- */}
      <line x1="12" y1="195" x2="36" y2="195" stroke={COLORS.fiber} strokeWidth="2" />
      <circle cx="36" cy="195" r="4" fill={COLORS.fiber} />
      <text x="40" y="185" fontSize="7.5" fill={COLORS.fiber} fontWeight="700">Fiber PoP</text>
      <text x="40" y="195" fontSize="6.5" fill={COLORS.fiber}>Dark Fiber Entry</text>

      {/* --- 132kV SUBSTATION (top-left) --- */}
      <rect x="30" y="30" width="68" height="48" rx="3" fill={COLORS.substation} />
      <rect x="30" y="30" width="68" height="48" rx="3" fill="none" stroke={COLORS.greyBorder} strokeWidth="0.8" />
      {/* Substation symbols */}
      <line x1="44" y1="42" x2="44" y2="66" stroke={COLORS.textInverse} strokeWidth="1.2" />
      <line x1="58" y1="42" x2="58" y2="66" stroke={COLORS.textInverse} strokeWidth="1.2" />
      <line x1="72" y1="42" x2="72" y2="66" stroke={COLORS.textInverse} strokeWidth="1.2" />
      <line x1="38" y1="52" x2="88" y2="52" stroke={COLORS.textInverse} strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="64" y="91" textAnchor="middle" fontSize="7.5" fill={COLORS.grey} fontWeight="700">132kV Substation</text>

      {/* Power line from substation to halls */}
      <line
        x1="98" y1="54"
        x2={hallStartX - 6} y2={hallsStartY + (totalHallsHeight / 2)}
        stroke={COLORS.substation}
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* --- DATA HALLS --- */}
      {halls.map((hall) => (
        <g key={hall.phase}>
          {/* Hall fill */}
          <rect
            x={hall.x} y={hall.y} width={hall.w} height={hall.h}
            rx="3"
            fill={hall.color}
            opacity="0.12"
          />
          {/* Hall border */}
          <rect
            x={hall.x} y={hall.y} width={hall.w} height={hall.h}
            rx="3"
            fill="none"
            stroke={hall.color}
            strokeWidth="2"
          />
          {/* Hall label */}
          <text
            x={hall.x + hall.w / 2}
            y={hall.y + hall.h / 2 - 12}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill={hall.color}
          >
            {hall.label}
          </text>
          {/* MW label */}
          <text
            x={hall.x + hall.w / 2}
            y={hall.y + hall.h / 2 + 6}
            textAnchor="middle"
            fontSize="15"
            fontWeight="800"
            fill={hall.color}
          >
            {hall.mw}MW
          </text>
          {/* Archetype small label */}
          <text
            x={hall.x + hall.w / 2}
            y={hall.y + hall.h / 2 + 20}
            textAnchor="middle"
            fontSize="7"
            fill={hall.color}
            opacity="0.75"
          >
            {archetype.replace(/_/g, ' ').toUpperCase()}
          </text>
          {/* Phase badge */}
          <rect
            x={hall.x + hall.w - 28}
            y={hall.y + 6}
            width="22"
            height="16"
            rx="3"
            fill={hall.color}
          />
          <text
            x={hall.x + hall.w - 17}
            y={hall.y + 18}
            textAnchor="middle"
            fontSize="8"
            fontWeight="800"
            fill={COLORS.textInverse}
          >
            P{hall.phase}
          </text>
        </g>
      ))}

      {/* --- COOLING PLANT (bottom) --- */}
      <rect x="30" y="320" width="260" height="52" rx="3" fill={COLORS.cooling} opacity="0.1" />
      <rect x="30" y="320" width="260" height="52" rx="3" fill="none" stroke={COLORS.cooling} strokeWidth="1.5" />
      {/* Cooling tower symbols */}
      {[50, 90, 130, 170, 210, 250].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="332" rx="10" ry="5" fill="none" stroke={COLORS.cooling} strokeWidth="1" opacity="0.6" />
          <line x1={cx} y1="337" x2={cx} y2="362" stroke={COLORS.cooling} strokeWidth="1" opacity="0.4" />
        </g>
      ))}
      <text x="160" y="367" textAnchor="middle" fontSize="8" fill={COLORS.cooling} fontWeight="700">
        Cooling Plant / CDU
      </text>
      {/* Cooling pipe to halls */}
      <line
        x1={hallStartX + 30}
        y1={hallsStartY + totalHallsHeight}
        x2="160"
        y2="320"
        stroke={COLORS.cooling}
        strokeWidth="1.2"
        strokeDasharray="4 3"
        opacity="0.5"
      />

      {/* --- EXPANSION ZONE (right side) --- */}
      <rect
        x="310" y="50" width="260" height="300"
        rx="4"
        fill="none"
        stroke={COLORS.expansion}
        strokeWidth="1.5"
        strokeDasharray="10 6"
      />
      {/* Expansion diagonal hatch (light) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <line
          key={i}
          x1={310 + i * 14}
          y1="50"
          x2={310}
          y2={50 + i * 14}
          stroke={COLORS.expansion}
          strokeWidth="0.4"
          opacity="0.2"
          clipPath="url(#expansion-clip)"
        />
      ))}
      <clipPath id="expansion-clip">
        <rect x="310" y="50" width="260" height="300" />
      </clipPath>
      {Array.from({ length: 40 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1="310"
          y1={50 + i * 8}
          x2="570"
          y2={50 + i * 8}
          stroke={COLORS.expansion}
          strokeWidth="0.3"
          opacity="0.08"
        />
      ))}

      {/* Expansion label */}
      <text x="440" y="190" textAnchor="middle" fontSize="11" fill={COLORS.expansion} fontWeight="700" opacity="0.7">
        Phase 2/3
      </text>
      <text x="440" y="205" textAnchor="middle" fontSize="11" fill={COLORS.expansion} fontWeight="700" opacity="0.7">
        Expansion
      </text>
      <text x="440" y="222" textAnchor="middle" fontSize="8.5" fill={COLORS.expansion} opacity="0.55">
        Reserved Land
      </text>
      {/* Future MW indicator */}
      {phases < 3 && (
        <>
          <rect x="400" y="235" width="80" height="22" rx="3" fill="none" stroke={COLORS.expansion} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
          <text x="440" y="250" textAnchor="middle" fontSize="8" fill={COLORS.expansion} fontWeight="600" opacity="0.6">
            +{Math.round(mw * 0.4)}MW future
          </text>
        </>
      )}

      {/* --- LEGEND (bottom-right) --- */}
      <rect x="430" y="335" width="148" height="52" rx="3" fill={COLORS.surfaceBg} stroke={COLORS.greyBorder} strokeWidth="0.8" />
      <text x="438" y="348" fontSize="7" fontWeight="700" fill={COLORS.grey}>LEGEND</text>
      {phaseColors.map((c, i) => (
        <g key={i}>
          <rect x="438" y={354 + i * 11} width="8" height="8" rx="1" fill={c} />
          <text x="450" y={362 + i * 11} fontSize="7" fill={COLORS.grey}>Phase {i + 1} — {mwPerHall[i]}MW IT</text>
        </g>
      ))}

      {/* --- TOTAL MW BADGE (top-right) --- */}
      <rect x="460" y="20" width="110" height="28" rx="4" fill={COLORS.burgundy} />
      <text x="515" y="30" textAnchor="middle" fontSize="8" fill={COLORS.textInverse} opacity="0.8">TOTAL CAPACITY</text>
      <text x="515" y="43" textAnchor="middle" fontSize="11" fontWeight="800" fill={COLORS.textInverse}>{mw}MW IT LOAD</text>
    </svg>
  );
}
