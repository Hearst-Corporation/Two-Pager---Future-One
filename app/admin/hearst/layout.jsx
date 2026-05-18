'use client';

import '@hearst/cockpit-shell/tokens.css';
import { CockpitShell } from '@hearst/cockpit-shell';
import { SimulationProvider } from '@/lib/hearst-simulation-context';

const ORACLE_PRODUCTS = [
  { id: 'oracle', name: 'Hearst Oracle', short: 'OR', color: '#4361EE' },
];

export default function HearstLayout({ children }) {
  return (
    <SimulationProvider>
      <CockpitShell products={ORACLE_PRODUCTS} appId="oracle">
        {children}
      </CockpitShell>
    </SimulationProvider>
  );
}
