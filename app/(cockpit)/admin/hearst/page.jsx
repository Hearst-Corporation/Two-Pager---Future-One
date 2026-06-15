'use client';

// /admin/hearst — Brief home. Entry point for Model → Evidence → Decision.
// Static surface only — no engine, no API.

import Link from 'next/link';
import { SectionHead, Card } from '@/components/hearst/ui';
import { UI } from '@/lib/ui-strings';

const JOURNEY = [
  {
    step: '01',
    nav: UI.NAV_SIMULATOR,
    href: '/admin/hearst/simulator',
    title: UI.BRIEF_CTA_MODEL_TITLE,
    hint: UI.BRIEF_CTA_MODEL_HINT,
  },
  {
    step: '02',
    nav: UI.NAV_SOURCES,
    href: '/admin/hearst/sources',
    title: UI.BRIEF_CTA_EVIDENCE_TITLE,
    hint: UI.BRIEF_CTA_EVIDENCE_HINT,
  },
  {
    step: '03',
    nav: UI.NAV_DOSSIER,
    href: '/admin/hearst/dossier',
    title: UI.BRIEF_CTA_DECISION_TITLE,
    hint: UI.BRIEF_CTA_DECISION_HINT,
  },
];

export default function HearstBriefPage() {
  return (
    <div className="oracle-page">
      <header className="oracle-page-header">
        <SectionHead
          hero
          eyebrow={UI.BRIEF_EYEBROW}
          title={UI.BRIEF_TITLE}
          hint={UI.BRIEF_HINT}
        />
      </header>

      <div data-brief-journey>
        {JOURNEY.map((item) => (
          <Link key={item.href} href={item.href} data-brief-cta>
            <Card variant="card" surface={1} padding="lg" hover>
              <span data-brief-cta-step>{item.step} · {item.nav}</span>
              <h2 data-brief-cta-title>{item.title}</h2>
              <p data-brief-cta-hint>{item.hint}</p>
              <span data-brief-cta-action>{UI.BRIEF_CTA_OPEN} →</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
