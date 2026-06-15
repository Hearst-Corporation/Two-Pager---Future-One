'use client';

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import InputModeSwitcher from './InputModeSwitcher';
import InputFieldHero from './InputFieldHero';

export default function ScaleControl({
  state,
  dispatch,
  projection,
  scenario,
  derived,
  solver,
  projectionStale,
  loading,
}) {
  const inputValue =
    state.mode === 'capital_first'
      ? state.capital_usd
      : state.mode === 'target_irr_first'
        ? state.target_irr_pct
        : state.total_mw;

  const onModeChange = useCallback(
    (id) => {
      if (state.mode === id) return;
      dispatch({ type: ACTIONS.SET_MODE, value: id });
    },
    [dispatch, state.mode],
  );

  const onInputChange = useCallback(
    (val) => {
      if (state.mode === 'capital_first') dispatch({ type: ACTIONS.SET_CAPITAL, value: val });
      else if (state.mode === 'target_irr_first') dispatch({ type: ACTIONS.SET_IRR_TARGET, value: val });
      else dispatch({ type: ACTIONS.SET_MW, value: val });
    },
    [dispatch, state.mode],
  );

  return (
    <div data-sim-scale-stack>
      <InputModeSwitcher mode={state.mode} onChange={onModeChange} />
      <InputFieldHero
        mode={state.mode}
        value={inputValue}
        onChange={onInputChange}
        projection={projection}
        scenario={scenario}
        derived={derived}
        solver={solver}
        projectionStale={projectionStale}
        loading={loading}
      />
    </div>
  );
}

ScaleControl.propTypes = {
  state: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  projection: PropTypes.object,
  scenario: PropTypes.object,
  derived: PropTypes.object,
  solver: PropTypes.object,
  projectionStale: PropTypes.bool,
  loading: PropTypes.bool,
};
