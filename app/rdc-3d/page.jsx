'use client';

import dynamic from 'next/dynamic';

const RDCViewer = dynamic(() => import('@/components/pitch/RDCViewer'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        color: 'rgba(255,255,255,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Inter", -apple-system, sans-serif',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      Loading 3D model…
    </div>
  ),
});

export default function RDC3DPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <RDCViewer />

      {/* Page header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '14px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 30,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(10,10,10,0.6), transparent)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 3,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          <span style={{ color: 'var(--color-accent-strong)' }}>FUTUR</span> ONE — SITE INSPECTION
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          QF · R&D COMPLEX · DOHA
        </div>
      </div>
    </div>
  );
}
