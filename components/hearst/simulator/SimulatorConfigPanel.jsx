'use client';
import { UI } from '@/lib/ui-strings';
import { Button } from '@/components/hearst/ui';
import ArchetypeSegment from './ArchetypeSegment';
import CapacityControl from './CapacityControl';
import TechPresetControl from './TechPresetControl';
import './simulator-config.css';

export default function SimulatorConfigPanel({ state, dispatch, validateBlocked, validateLabel, onValidate }) {
  return (
    <div data-sim-config-v2 className="is-assembling">
      <section data-sim-section className="del-1">
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_THESIS_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_THESIS_HINT}</p>
        </header>
        <ArchetypeSegment primaryId={state.primary_archetype_id} dispatch={dispatch} />
      </section>

      <section data-sim-section className="del-2">
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_SIZE_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_SIZE_HINT}</p>
        </header>
        <CapacityControl value={state.total_mw} dispatch={dispatch} />
      </section>

      <section data-sim-section className="del-3">
        <header data-sim-section-head>
          <h2 className="sim-config-label">{UI.SIM_HW_TITLE}</h2>
          <p className="sim-config-hint">{UI.SIM_HW_HINT}</p>
        </header>
        <TechPresetControl hardwareMix={state.hardware_mix} dispatch={dispatch} />
      </section>

      <section data-sim-section className="del-4">
        <div data-decision-ctrl>
          <div>
            <span data-decision-label>Decision Required</span>
            <div data-decision-title>Approve & Generate Memo</div>
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={validateBlocked}
            onClick={onValidate}
            style={{ width: '100%', justifyContent: 'space-between', padding: '0 24px', height: '56px', fontSize: '16px' }}
          >
            {validateLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
