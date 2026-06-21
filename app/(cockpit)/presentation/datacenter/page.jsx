'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import DatacenterP2 from '@/components/presentation/pages/DatacenterP2';
import { REF_W, REF_H } from '@/components/presentation/FoldableA3';

function DatacenterContent() {
  const params = useSearchParams();
  const isPrint = params.get('print') === '1';

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
        <DatacenterP2 />
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
        <DatacenterP2 />
      </div>
    </main>
  );
}

export default function DatacenterPage() {
  return (
    <Suspense fallback={null}>
      <DatacenterContent />
    </Suspense>
  );
}
