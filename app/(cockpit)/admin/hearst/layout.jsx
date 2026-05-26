'use client';

import '@hearst/cockpit-shell/tokens.css';
import './cp-tokens.css';
import { CockpitShell } from '@hearst/cockpit-shell';
import { SimulationProvider } from '@/lib/hearst-simulation-context';
import { OracleBottomBar } from '@/components/OracleBottomBar';
import { HubSessionBridge } from '@/components/HubSessionBridge';

const ORACLE_PRODUCTS = [
  // eslint-disable-next-line no-restricted-syntax -- CockpitProduct.color contract requires a hex literal (shell consumes it via color-mix).
  { id: 'oracle', name: 'Hearst Oracle', short: 'OR', color: '#4361EE' },
];

export default function HearstLayout({ children }) {
  return (
    <SimulationProvider>
      <HubSessionBridge />
      <CockpitShell products={ORACLE_PRODUCTS} appId="oracle">
        <OracleBottomBar />
        {children}
      </CockpitShell>
    </SimulationProvider>
  );
}
