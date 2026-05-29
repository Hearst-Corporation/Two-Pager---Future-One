'use client';

/**
 * ScenarioVisualizer.jsx
 * Wraps InfrastructureDiagram for all three spec types.
 * Props:
 *   simulation : object  — raw simulation state from oracle engine
 *   mode       : 'auto' | 'floorplan' | 'topology' | 'phases'
 *
 * In 'auto' mode renders all three sections, each collapsible.
 * Compact layout, no full-screen takeover.
 */

import React, { useState } from 'react';
import InfrastructureDiagram from './InfrastructureDiagram';
import {
  build2DDiagramSpec,
  buildTopologySpec,
  buildDeploymentPhaseSpec,
} from '../../lib/oracle-visualization/index';

// ---------------------------------------------------------------------------
// Section wrapper with collapse toggle
// ---------------------------------------------------------------------------
function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      marginBottom: 10,
      border: '1px solid var(--cp-accent)',
      borderOpacity: 0.25,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          width:           '100%',
          padding:         '6px 12px',
          background:      'transparent',
          border:          'none',
          cursor:          'pointer',
          color:           'var(--cp-accent)',
          fontSize:        11,
          fontWeight:      600,
          letterSpacing:   '0.05em',
          textTransform:   'uppercase',
          textAlign:       'left',
          opacity:         0.85,
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? 'hide' : 'show'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 8px 8px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * @param {{ simulation: object, mode?: 'auto'|'floorplan'|'topology'|'phases' }} props
 */
export default function ScenarioVisualizer({ simulation, mode = 'auto' }) {
  if (!simulation) {
    return (
      <div style={{
        padding: 16,
        fontSize: 12,
        color: 'var(--cp-accent)',
        opacity: 0.4,
        textAlign: 'center',
      }}>
        No simulation data
      </div>
    );
  }

  // Build all three specs (cheap pure functions)
  const floorplanSpec = build2DDiagramSpec(simulation);
  const topologySpec  = buildTopologySpec(simulation);
  const phasesSpec    = buildDeploymentPhaseSpec(simulation);

  const DIAGRAM_HEIGHT = 220;

  // Single-mode views
  if (mode === 'floorplan') {
    return <InfrastructureDiagram spec={floorplanSpec} height={DIAGRAM_HEIGHT} />;
  }
  if (mode === 'topology') {
    return <InfrastructureDiagram spec={topologySpec} height={DIAGRAM_HEIGHT} />;
  }
  if (mode === 'phases') {
    return <InfrastructureDiagram spec={phasesSpec} height={DIAGRAM_HEIGHT} />;
  }

  // Auto mode — all three sections
  return (
    <div style={{
      width:    '100%',
      maxWidth: 620,
      fontFamily: 'var(--cp-font-sans, sans-serif)',
    }}>
      <CollapsibleSection title="Infrastructure Floorplan" defaultOpen={true}>
        <InfrastructureDiagram spec={floorplanSpec} height={DIAGRAM_HEIGHT} />
        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          {floorplanSpec.legend.map(item => (
            <span key={item.kind} style={{
              fontSize:    10,
              color:       'var(--cp-accent)',
              opacity:     0.65,
              display:     'flex',
              alignItems:  'center',
              gap:         4,
            }}>
              <span style={{
                display:         'inline-block',
                width:           10,
                height:          10,
                background:      item.color_token,
                borderRadius:    2,
                opacity:         0.7,
              }} />
              {item.label}
            </span>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Power & Network Topology" defaultOpen={false}>
        <InfrastructureDiagram spec={topologySpec} height={DIAGRAM_HEIGHT} />
        <div style={{ marginTop: 4, fontSize: 10, color: 'var(--cp-accent)', opacity: 0.5 }}>
          {topologySpec.nodes.length} nodes — {topologySpec.edges.length} edges
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Deployment Phases" defaultOpen={false}>
        <InfrastructureDiagram spec={phasesSpec} height={Math.max(160, phasesSpec.phases.length * 38 + 40)} />
        <div style={{ marginTop: 4, fontSize: 10, color: 'var(--cp-accent)', opacity: 0.5 }}>
          {phasesSpec.total_months} months total — {phasesSpec.phases.length} phases
        </div>
      </CollapsibleSection>
    </div>
  );
}
