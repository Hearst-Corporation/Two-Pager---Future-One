'use client';

import '@hearst/cockpit-shell/tokens.css';
import { CockpitShell } from '@hearst/cockpit-shell';
import { SimulationProvider } from '@/lib/hearst-simulation-context';

const ORACLE_PRODUCTS = [
  // eslint-disable-next-line no-restricted-syntax -- CockpitProduct.color contract requires a hex literal (shell consumes it via color-mix).
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
