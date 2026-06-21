'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DeploymentSimP2 from '@/components/presentation/pages/DeploymentSimP2';
import { REF_W, REF_H } from '@/components/presentation/FoldableA3';
import { DEPLOYMENT_FIXTURE } from '@/lib/presentation/deployment-fixture';

/**
 * /presentation/deployment — One-pager "Deployment Simulation".
 *
 * Par DÉFAUT : rend le snapshot figé (lib/presentation/deployment-fixture.js) —
 *   chiffres réels (run vérifié du moteur) mais stables et éditables pour le design.
 *
 * ?live=1  → re-tire un run live via POST /api/admin/hearst/simulate.
 * ?print=1 → rend à la racine du body (sans cadre centré) pour export PDF.
 */

function DeploymentContent() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';
  const isLive = params.get('live') === '1';

  // Par défaut = fixture (instantané, complet). Live seulement si demandé.
  const [state, setState] = useState(() =>
    isLive
      ? { status: 'loading', data: null, errorMsg: null }
      : { status: 'ready', data: DEPLOYMENT_FIXTURE, errorMsg: null }
  );

  useEffect(() => {
    if (!isLive) return;
    let ignore = false;
    (async () => {
      try {
        const r = await fetch('/api/admin/hearst/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEPLOYMENT_FIXTURE._meta.rerun),
        });
        if (r.status === 401) {
          if (!ignore)
            setState({
              status: 'error',
              data: null,
              errorMsg: 'Session requise pour le mode live — connectez-vous (dev autologin attendu).',
            });
          return;
        }
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          if (!ignore)
            setState({
              status: 'error',
              data: null,
              errorMsg: body?.error || `Simulation échouée (HTTP ${r.status})`,
            });
          return;
        }
        const data = await r.json();
        if (!ignore) setState({ status: 'ready', data, errorMsg: null });
      } catch (e) {
        if (!ignore)
          setState({ status: 'error', data: null, errorMsg: e?.message || 'Erreur réseau' });
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isLive]);

  let inner;
  if (state.status === 'loading') {
    inner = (
      <div style={St.stateBox}>
        <div style={St.stateEyebrow}>LIVE FINANCIAL SIMULATION</div>
        <div style={St.stateMsg}>Chargement de la simulation…</div>
      </div>
    );
  } else if (state.status === 'error') {
    inner = (
      <div style={St.stateBox}>
        <div style={St.stateEyebrow}>SIMULATION INDISPONIBLE</div>
        <div style={St.stateMsg}>{state.errorMsg}</div>
      </div>
    );
  } else {
    inner = <DeploymentSimP2 data={state.data} />;
  }

  if (isPrint) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'var(--color-surface)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background:
          'radial-gradient(circle at 50% 30%, var(--color-gray-750) 0%, var(--color-gray-850) 60%, var(--color-dark-contrast) 100%)',
      }}
    >
      <div
        style={{
          width: REF_W,
          height: REF_H,
          background: 'var(--color-surface)',
          boxShadow: '0 30px 80px rgba(0,0,0,.45)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {inner}
      </div>
    </main>
  );
}

export default function DeploymentPage() {
  return (
    <Suspense fallback={null}>
      <DeploymentContent />
    </Suspense>
  );
}

const St = {
  stateBox: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
    background: 'var(--color-surface)',
    textAlign: 'center',
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  stateEyebrow: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-accent-strong)',
    textTransform: 'uppercase',
  },
  stateMsg: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-gray-700)',
    lineHeight: 1.5,
    maxWidth: 320,
  },
};
