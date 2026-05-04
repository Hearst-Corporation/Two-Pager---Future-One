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
  const marks  = params.get('marks') === '1';

  // 5mm bleed + crop marks space. 
  // 420mm = 960px -> 1mm = 2.285px. 15mm = ~34px.
  const pad = marks ? 34 : 0;

  const renderWithMarks = (content, w, h) => {
    if (!marks) return content;
    return (
      <div style={{ padding: pad, background: '#fff', position: 'relative', width: w + pad * 2, height: h + pad * 2 }}>
        {/* Traits de coupe (Crop marks) */}
        <div style={{ position: 'absolute', top: pad, left: 0, width: 10, height: 1, background: '#000' }} />
        <div style={{ position: 'absolute', top: 0, left: pad, width: 1, height: 10, background: '#000' }} />
        
        <div style={{ position: 'absolute', top: pad, right: 0, width: 10, height: 1, background: '#000' }} />
        <div style={{ position: 'absolute', top: 0, right: pad, width: 1, height: 10, background: '#000' }} />
        
        <div style={{ position: 'absolute', bottom: pad, left: 0, width: 10, height: 1, background: '#000' }} />
        <div style={{ position: 'absolute', bottom: 0, left: pad, width: 1, height: 10, background: '#000' }} />
        
        <div style={{ position: 'absolute', bottom: pad, right: 0, width: 10, height: 1, background: '#000' }} />
        <div style={{ position: 'absolute', bottom: 0, right: pad, width: 1, height: 10, background: '#000' }} />

        <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden' }}>
          {content}
        </div>
      </div>
    );
  };

  if (SINGLE[view]) {
    const Page = SINGLE[view];
    return renderWithMarks(
      <div style={{ width: W, height: H, overflow: 'hidden', background: '#fff' }}>
        <Page />
      </div>,
      W, H
    );
  }

  const pairs = {
    interior: [<P2InsideLeft key="p2" />, <P3InsideRight key="p3" />],
    exterior: [<P4Back key="p4" />,       <P1Cover       key="p1" />],
  };
  const pages = pairs[view] ?? pairs.interior;

  return renderWithMarks(
    <div style={{ width: W * 2, height: H, display: 'flex', overflow: 'hidden', background: '#fff' }}>
      {pages.map((p, i) => (
        <div key={i} style={{ width: W, height: H, overflow: 'hidden', flexShrink: 0 }}>
          {p}
        </div>
      ))}
    </div>,
    W * 2, H
  );
}

export default function PrintPage() {
  return (
    <Suspense>
      <PrintContent />
    </Suspense>
  );
}
