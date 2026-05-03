'use client';

import { useState } from 'react';
import FoldableA3 from '@/components/FoldableA3';
import P1Cover from '@/components/pages/P1Cover';
import P2InsideLeft from '@/components/pages/P2InsideLeft';
import P3InsideRight from '@/components/pages/P3InsideRight';
import P4Back from '@/components/pages/P4Back';

const VIEWS = [
  { id: 'closed', label: 'Fermé (couverture)' },
  { id: 'open', label: 'Ouvert (P2 + P3)' },
  { id: 'back', label: 'Dos (P4)' },
  { id: 'flat', label: 'À plat (recto/verso)' },
];

export default function BrochurePage() {
  const [view, setView] = useState('open');
  const [scale, setScale] = useState(1);

  const pages = [<P1Cover key="p1" />, <P2InsideLeft key="p2" />, <P3InsideRight key="p3" />, <P4Back key="p4" />];

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '20px 32px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Prese Hub</h1>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
            A3 plié en 2 · 4 pages portrait · couverture / intérieur / dos
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,.12)',
                background: view === v.id ? 'var(--color-accent-strong)' : 'transparent',
                color: 'var(--color-text-inverse)',
                fontWeight: 500,
                transition: 'all .15s ease',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, opacity: 0.6 }}>Zoom</span>
          <input
            type="range"
            min={0.6}
            max={1.6}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
          <span style={{ fontSize: 11, opacity: 0.6, width: 32 }}>{Math.round(scale * 100)}%</span>
        </div>
      </header>

      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          background:
            'radial-gradient(circle at 50% 30%, var(--color-gray-750) 0%, var(--color-gray-850) 60%, var(--color-dark-contrast) 100%)',
          overflow: 'auto',
        }}
      >
        <FoldableA3 pages={pages} view={view} scale={scale} />
      </section>
    </main>
  );
}
