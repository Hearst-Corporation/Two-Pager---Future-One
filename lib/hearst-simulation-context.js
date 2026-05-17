'use client';
import { createContext, useContext, useState } from 'react';

const SimulationContext = createContext({ overrides: null, setOverrides: () => {} });

export function SimulationProvider({ children }) {
  const [overrides, setOverrides] = useState(null);
  return (
    <SimulationContext.Provider value={{ overrides, setOverrides }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}
