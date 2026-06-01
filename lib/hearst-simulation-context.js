'use client';
import { createContext, useContext, useMemo, useState } from 'react';

const SimulationContext = createContext({
  overrides: null,
  setOverrides: () => {},
  advisorContext: null,
  setAdvisorContext: () => {},
});

export function SimulationProvider({ children }) {
  const [overrides, setOverrides] = useState(null);
  const [advisorContext, setAdvisorContext] = useState(null);
  const value = useMemo(() => ({
    overrides,
    setOverrides,
    advisorContext,
    setAdvisorContext,
  }), [advisorContext, overrides]);

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}
