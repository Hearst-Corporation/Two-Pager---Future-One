'use client';

import { useReducer, useState, useEffect, useDeferredValue, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  INITIAL_STATE, ACTIONS, simulatorReducer,
  buildSimulatePayload, serializeStateToUrl, parseStateFromUrl, QATAR_PRESETS,
} from '@/lib/hearst-simulator-state';
import { SCENARIO_WRITABLE_KEYS, PRIMARY_DEAL_ARCHETYPES } from '@/lib/hearst-deal-structures';
import { MODEL_DEFAULTS } from '@/lib/hearst-config-presets';
import { useSimulation } from '@/lib/hearst-simulation-context';

import { SIMULATOR_PARAM_EVENT } from '@/lib/hearst-simulator-bridge';
import { UI } from '@/lib/ui-strings';
import { S as CP } from '@/lib/cp-styles';
import './simulator.css';

import InvestmentCaseSurface from '@/components/hearst/simulator/InvestmentCaseSurface';
import SimulatorConfigPanel from '@/components/hearst/simulator/SimulatorConfigPanel';
import { Button } from '@/components/hearst/ui';
import { fmtPctFromRatio, fmtUSD, MISSING } from '@/lib/hearst-format';
import { PRESET_META, LEVEL_LABEL } from '@/components/hearst/simulator/preset-meta';

export default function SimulatorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { setAdvisorContext } = useSimulation();

  const [state, dispatch] = useReducer(simulatorReducer, INITIAL_STATE);
  const deferredState = useDeferredValue(state);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('scenario')) return;
    const fromUrl = parseStateFromUrl(sp);
    if (fromUrl) dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: fromUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    function handler(e) {
      const { field, value } = e.detail || {};
      if (!field) return;
      switch (field) {
        case 'total_mw':              return dispatch({ type: ACTIONS.SET_MW, value: Number(value) });
        case 'capital_usd':           return dispatch({ type: ACTIONS.SET_CAPITAL, value: Number(value) });
        case 'target_irr_pct':        return dispatch({ type: ACTIONS.SET_IRR_TARGET, value: Number(value) });
        case 'target_irr_lever':      return dispatch({ type: ACTIONS.SET_IRR_LEVER, value: String(value) });
        case 'primary_archetype_id': {
          const def = MODEL_DEFAULTS[String(value)];
          return dispatch({ type: ACTIONS.APPLY_PRESET, value: { primary_archetype_id: String(value), ...(def || {}) } });
        }
        case 'business_model_id':     return dispatch({ type: ACTIONS.SET_BUSINESS_MODEL, value: String(value) });
        case 'client_type_id':        return dispatch({ type: ACTIONS.SET_CLIENT_TYPE, value: String(value) });
        case 'mode':                  return dispatch({ type: ACTIONS.SET_MODE, value: String(value) });
        case 'geography':             return dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: { geography: String(value) } });
        case 'apply_preset': {
          const p = QATAR_PRESETS.find(q => q.id === value);
          if (!p) return;
          const { id: _id, label: _label, ...payload } = p;
          return dispatch({ type: ACTIONS.APPLY_PRESET, value: payload });
        }
        case 'hardware_mix.classic_pct':
        case 'hardware_mix.liquid_pct':
        case 'hardware_mix.ai_pct':
        case 'hardware_mix.gpu_sku_id':
        case 'hardware_mix.num_racks':
        case 'hardware_mix.utilization_pct':
        case 'hardware_mix.gpu_hour_price': {
          const key = field.split('.')[1];
          return dispatch({ type: ACTIONS.SET_HARDWARE_MIX, value: { [key]: typeof value === 'number' ? value : Number(value) || value } });
        }
        default: return;
      }
    }
    window.addEventListener(SIMULATOR_PARAM_EVENT, handler);
    return () => window.removeEventListener(SIMULATOR_PARAM_EVENT, handler);
  }, []);

  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingState, setSavingState] = useState('idle');
  const [projectId, setProjectId] = useState(null);
  const [savedScenarioId, setSavedScenarioId] = useState(null);
  const [projectLoadError, setProjectLoadError] = useState(null);
  const [dirtySinceSave, setDirtySinceSave] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const debounceRef = useRef(null);
  const saveTimerRef = useRef(null);
  const savingRef = useRef(false);
  const resultsNavigationRef = useRef(false);

  useEffect(() => {
    if (pathname && !pathname.includes('/results')) {
      resultsNavigationRef.current = false;
    }
  }, [pathname]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const prevSimKeyRef = useRef(null);
  useEffect(() => {
    const next = JSON.stringify(buildSimulatePayload(state));
    if (next !== prevSimKeyRef.current) {
      prevSimKeyRef.current = next;
      setDirtySinceSave(true);
      setSimResult(null);
      setSimError(null);
    }
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) setProjectLoadError('Project load timed out — please refresh.');
    }, 8000);
    (async () => {
      try {
        const r = await fetch('/api/admin/hearst/project');
        clearTimeout(t);
        if (cancelled) return;
        if (r.ok) {
          const { project } = await r.json();
          setProjectId(project?.id);
        } else {
          setProjectLoadError(`Project unavailable (${r.status}) — please refresh.`);
        }
      } catch (e) {
        clearTimeout(t);
        if (!cancelled) setProjectLoadError(`Project load failed: ${e.message}`);
      }
    })();
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('scenario');
    if (!sid) return;
    (async () => {
      try {
        const r = await fetch(`/api/admin/hearst/scenarios/${sid}`);
        if (!r.ok) return;
        const row = (await r.json())?.scenario;
        if (!row) return;
        const patch = {};
        if (row.input_mode) patch.mode = row.input_mode;
        if (row.geography) patch.geography = row.geography;
        const iv = row.input_value || {};
        if (row.input_mode === 'capital_first' && iv.total_capex_usd != null) patch.capital_usd = iv.total_capex_usd;
        else if (row.input_mode === 'target_irr_first') {
          if (iv.target_irr_pct != null) patch.target_irr_pct = iv.target_irr_pct;
          if (iv.lever) patch.target_irr_lever = iv.lever;
          if (iv.total_mw != null) patch.total_mw = iv.total_mw;
        } else if (iv.total_mw != null) patch.total_mw = iv.total_mw;
        if (row.hardware_mix) patch.hardware_mix = { ...INITIAL_STATE.hardware_mix, ...row.hardware_mix };
        if (row.primary_archetype_id) patch.primary_archetype_id = row.primary_archetype_id;
        dispatch({ type: ACTIONS.HYDRATE_FROM_URL, value: patch });
        setSavedScenarioId(sid);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[simulator] failed to reopen scenario:', e.message);
      }
    })();
  }, []);

  const simKey = useMemo(() => JSON.stringify(buildSimulatePayload(deferredState)), [deferredState]);

  useEffect(() => {
    let ignore = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSimError(null);
      try {
        const payload = JSON.parse(simKey);
        const r = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, project_id: projectId || undefined }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          if (!ignore) {
            setSimError(body.error || `Simulate failed (${r.status})`);
            setSimResult(null);
          }
        } else {
          const data = await r.json();
          if (!ignore) {
            setSimResult(data);
            setSimError(null);
          }
        }
      } catch (e) {
        if (!ignore) setSimError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(debounceRef.current);
    };
  }, [simKey, projectId]);

  useEffect(() => {
    if (resultsNavigationRef.current) return;
    const params = new URLSearchParams(serializeStateToUrl(state));
    if (savedScenarioId) params.set('scenario', savedScenarioId);
    router.replace(`/admin/hearst/simulator?${params.toString()}`, { scroll: false });
  }, [state, savedScenarioId, router]);

  const projection = simResult?.projection;
  const scenario = simResult?.scenario;
  const archetypeOutcome = simResult?.archetype_outcome;

  useEffect(() => {
    setAdvisorContext?.({
      surface: 'simulator',
      state,
      scenario,
      projection,
      simResult,
      loading,
      error: simError,
      savedScenarioId,
    });
    return () => setAdvisorContext?.(null);
  }, [loading, projection, savedScenarioId, scenario, setAdvisorContext, simError, simResult, state]);

  async function handleSave() {
    if (!projectId || !scenario) return null;
    setSavingState('saving');
    setSaveError(null);
    try {
      const writable = {};
      for (const k of SCENARIO_WRITABLE_KEYS) {
        if (scenario[k] !== undefined) writable[k] = scenario[k];
      }
      const name = `Plan — ${archetypeOutcome?.label || 'Custom'} ${state.total_mw || ''}MW (${new Date().toISOString().slice(0, 10)})`;
      const r = await fetch('/api/admin/hearst/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name,
          scenario_type: 'custom',
          ...writable,
          input_mode: state.mode,
          input_value: buildSimulatePayload(state).input_value,
          hardware_mix: state.hardware_mix,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || 'Save failed');
      }
      const data = await r.json();
      const newId = data.scenario?.id || null;
      setSavedScenarioId(newId);
      setDirtySinceSave(false);
      setSaveError(null);
      setSavingState('saved');
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSavingState('idle'), 2500);
      return newId;
    } catch (e) {
      setSavingState('idle');
      setSaveError(e.message || 'Save failed');
      return null;
    }
  }

  async function handleValidateAndReveal() {
    if (savingRef.current) return;
    if (!projection || !projectId || loading || simError) return;
    savingRef.current = true;
    try {
      let id = savedScenarioId;
      if (!id || dirtySinceSave) id = await handleSave();
      if (!id) return;
      resultsNavigationRef.current = true;
      const params = new URLSearchParams({
        scenario: id,
        arch: state.primary_archetype_id,
        biz: state.business_model_id,
        client: state.client_type_id,
      });
      router.push(`/admin/hearst/simulator/results?${params.toString()}`);
    } finally {
      savingRef.current = false;
    }
  }

  const validateBlocked = !projection || !projectId || loading || !!simError || savingState === 'saving';
  const meta = PRESET_META[state.primary_archetype_id];
  const irr = projection?.irr ?? projection?.return_metrics?.irr;
  const npv = projection?.npv ?? projection?.return_metrics?.npv;
  const capex = projection?.total_capex ?? scenario?.total_capex_usd ?? state.capital_usd;

  return (
    <div className="oracle-page oracle-simulator-page">
      <div data-sim-wrap>
        {/* Hero strip — compact, full width */}
        <InvestmentCaseSurface
          state={state}
          scenario={scenario}
          projection={projection}
          selectedArchetype={PRIMARY_DEAL_ARCHETYPES.find(a => a.id === state.primary_archetype_id)}
        />

        {/* Cockpit 2-col: config left / live panel right */}
        <div data-sim-cockpit>
          {/* LEFT — configuration */}
          <SimulatorConfigPanel
            state={state}
            dispatch={dispatch}
          />

          {/* RIGHT — live metrics + CTA */}
          <aside data-sim-right-panel className="is-assembling del-3">
            <div data-sim-live-metrics>
              <div data-sim-live-label>
                <span className="live-dot" data-loading={loading} />
                {loading ? UI.SIM_LIVE_COMPUTING : UI.SIM_LIVE_PROJECTION}
              </div>

              <div data-sim-live-kpi>
                <span data-sim-live-kpi-name>{UI.SIM_KPI_IRR}</span>
                <strong data-sim-live-kpi-value data-accent={irr != null && !loading}>
                  {loading ? MISSING : irr != null ? fmtPctFromRatio(irr) : MISSING}
                </strong>
              </div>

              <div data-sim-live-kpi>
                <span data-sim-live-kpi-name>{UI.SIM_METRIC_TOTAL_CAPEX}</span>
                <strong data-sim-live-kpi-value>
                  {loading ? MISSING : fmtUSD(capex)}
                </strong>
              </div>

              <div data-sim-live-kpi>
                <span data-sim-live-kpi-name>{UI.SIM_METRIC_NPV}</span>
                <strong data-sim-live-kpi-value>
                  {loading ? MISSING : npv != null ? fmtUSD(npv) : MISSING}
                </strong>
              </div>

              <div data-sim-live-kpi>
                <span data-sim-live-kpi-name>{UI.SIM_META_RISK}</span>
                <strong data-sim-live-kpi-value>
                  {meta ? LEVEL_LABEL[meta.risk] : MISSING}
                </strong>
              </div>
            </div>

            <div data-decision-ctrl>
              <div>
                <span data-decision-label>{UI.SIM_DECISION_REQUIRED}</span>
                <div data-decision-title>{UI.SIM_DECISION_TITLE}</div>
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={validateBlocked}
                onClick={handleValidateAndReveal}
                className="sim-cta-btn"
              >
                {savingState === 'saving' ? UI.SIM_SAVING : UI.SIM_CONFIG_GENERATE_MEMO}
              </Button>
            </div>

            {saveError && (
              <div style={CP.dangerAlert} role="alert">{UI.ERR_SAVE_DETAIL(saveError)}</div>
            )}
          </aside>
        </div>

        {projectLoadError && (
          <div style={{ ...CP.dangerAlert, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--cp-space-3)' }} role="alert">
            <span>{projectLoadError}</span>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>{UI.ACTION_RETRY}</Button>
          </div>
        )}
        {simError && <div style={CP.dangerAlert} role="alert">{UI.SIM_ERROR_PREFIX} {simError}</div>}
      </div>
    </div>
  );
}
