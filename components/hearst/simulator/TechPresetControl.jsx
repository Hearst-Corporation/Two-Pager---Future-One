'use client';
import PropTypes from 'prop-types';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { HARDWARE_PRESETS } from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';

const PRESET_LABEL = {
  colo: UI.HW_PRESET_COLO_NAME,
  mixed: UI.HW_PRESET_MIXED_NAME,
  ai_factory: UI.HW_PRESET_AI_NAME,
};

const PRESET_INFO = {
  colo: UI.HW_PRESET_COLO_INFO,
  mixed: UI.HW_PRESET_MIXED_INFO,
  ai_factory: UI.HW_PRESET_AI_INFO,
};

function isPresetSelected(hardwareMix, preset) {
  if (!hardwareMix) return false;
  return (
    hardwareMix.classic_pct === preset.patch.classic_pct &&
    hardwareMix.liquid_pct === preset.patch.liquid_pct &&
    hardwareMix.ai_pct === preset.patch.ai_pct
  );
}

export default function TechPresetControl({ hardwareMix, dispatch }) {
  return (
    <div data-focus-stage>
      {HARDWARE_PRESETS.map((p) => {
        const selected = isPresetSelected(hardwareMix, p);
        return (
          <button
            key={p.id}
            onClick={() => dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: p.patch })}
            aria-pressed={selected}
            data-focus-item
            data-focused={selected}
            data-dimmed={!selected}
          >
            <div data-focus-title>{PRESET_LABEL[p.id]}</div>
            
            <div data-focus-detail>
              <p style={{ fontSize: '13px', color: 'var(--cp-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                {PRESET_INFO[p.id]}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--cp-text-muted)' }}>Standard</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cp-text-strong)' }}>{p.patch.classic_pct}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--cp-text-muted)' }}>High-Density</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cp-text-strong)' }}>{p.patch.ai_pct}%</div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

TechPresetControl.propTypes = {
  hardwareMix: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};
