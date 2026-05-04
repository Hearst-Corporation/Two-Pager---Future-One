'use client';

import DatacenterP2 from '@/components/pages/DatacenterP2';
import { REF_W, REF_H } from '@/components/FoldableA3';

/**
 * /datacenter — One-pager isolé.
 * Affiche exclusivement la duplication de P2 (DatacenterP2) au format
 * 480×680, dans le même cadre que la brochure (background sombre,
 * page centrée). N'impacte ni /brochure ni P2InsideLeft d'origine.
 */
export default function DatacenterPage() {
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
