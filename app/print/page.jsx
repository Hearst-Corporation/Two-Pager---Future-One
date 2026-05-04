'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import P1Cover        from '@/components/pages/P1Cover';
import P2InsideLeft   from '@/components/pages/P2InsideLeft';
import P3InsideRight  from '@/components/pages/P3InsideRight';
import P4Back         from '@/components/pages/P4Back';

/**
 * Page d'impression sans chrome UI.
 * ?view=interior → P2 | P3  (VERSO)
 * ?view=exterior → P4 | P1  (RECTO)
 * ?view=p1 / p2 / p3 / p4   → page seule (A4 portrait)
 */

const W = 480;
const H = 680;

const SINGLE = { p1: P1Cover, p2: P2InsideLeft, p3: P3InsideRight, p4: P4Back };

function PrintContent() {
  const params = useSearchParams();
  const view   = params.get('view') ?? 'interior';

  if (SINGLE[view]) {
    const Page = SINGLE[view];
    return (
      <div style={{ width: W, height: H, overflow: 'hidden', background: '#fff' }}>
        <Page />
      </div>
    );
  }

  const pairs = {
    interior: [<P2InsideLeft key="p2" />, <P3InsideRight key="p3" />],
    exterior: [<P4Back key="p4" />,       <P1Cover       key="p1" />],
  };
  const pages = pairs[view] ?? pairs.interior;

  return (
    <div style={{ width: W * 2, height: H, display: 'flex', overflow: 'hidden', background: '#fff' }}>
      {pages.map((p, i) => (
        <div key={i} style={{ width: W, height: H, overflow: 'hidden', flexShrink: 0 }}>
          {p}
        </div>
      ))}
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense>
      <PrintContent />
    </Suspense>
  );
}
