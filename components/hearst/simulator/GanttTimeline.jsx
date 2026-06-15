'use client';

import { memo } from 'react';
import { SITE_READINESS } from '@/lib/hearst-constants';

/**
 * Clean, horizontal investment timeframe.
 * Start -> Development -> Stabilization -> Exit
 */
function GanttTimeline({ scenario, exit_year = 10 }) {
  const readiness = SITE_READINESS[scenario?.site_readiness] || SITE_READINESS.greenfield;
  const exit = exit_year || 10;
  
  // Approximate years
  const devYears = Math.max(1, Math.round(readiness.dev_months / 12));
  
  return (
    <div style={S.wrap}>
      <div style={S.timeline}>
        <div style={S.line} />
        <div style={S.nodes}>
          
          <div style={S.node}>
            <span style={S.sub}>Year 0</span>
            <div style={S.dot} />
            <span style={S.label}>Inception</span>
          </div>
          
          <div style={S.node}>
            <span style={S.sub}>Year {devYears}</span>
            <div style={S.dot} />
            <span style={S.label}>Operations</span>
          </div>
          
          <div style={S.node}>
            <span style={S.sub}>Year {Math.floor((exit + devYears) / 2)}</span>
            <div style={S.dot} />
            <span style={S.label}>Stabilization</span>
          </div>
          
          <div style={S.node}>
            <span style={S.sub}>Year {exit}</span>
            <div style={S.dot} />
            <span style={S.label}>Exit</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default memo(GanttTimeline);

const S = {
  wrap: { 
    width: '100%', 
    padding: 'var(--cp-space-5) 0', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'var(--cp-space-4)' 
  },
  timeline: { 
    display: 'flex', 
    alignItems: 'center', 
    width: '100%', 
    position: 'relative' 
  },
  line: {
    position: 'absolute',
    top: '50%',
    left: 'var(--cp-space-5)',
    right: 'var(--cp-space-5)',
    height: 'var(--cp-space-hair)',
    background: 'var(--cp-border)', 
    transform: 'translateY(-50%)', 
    zIndex: 1 
  },
  nodes: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    width: '100%', 
    position: 'relative', 
    zIndex: 2 
  },
  node: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: 'var(--cp-space-2)', 
    background: 'var(--cp-surface-0)', 
    padding: '0 var(--cp-space-4)' 
  },
  dot: {
    width: 'var(--cp-icon-xs)',
    height: 'var(--cp-icon-xs)',
    borderRadius: '50%', 
    background: 'var(--cp-accent-maroon)',
    border: 'var(--cp-border-w-accent) solid var(--cp-surface-0)'
  },
  label: { 
    fontSize: 'var(--cp-font-sm)', 
    fontWeight: 'var(--cp-weight-bold)', 
    color: 'var(--cp-text-primary)' 
  },
  sub: { 
    fontSize: 'var(--cp-font-micro)', 
    color: 'var(--cp-text-muted)', 
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-caps)'
  }
};
