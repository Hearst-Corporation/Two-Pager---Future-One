'use client';

import dynamic from 'next/dynamic';

const RDCTilesViewer = dynamic(
  () => import('@/components/pitch/RDCTilesViewer'),
  {
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
        Initializing 3D engine…
      </div>
    ),
  },
);

export default function RDC3DPage() {
  const apiToken = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
      <RDCTilesViewer apiToken={apiToken} />
    </div>
  );
}
