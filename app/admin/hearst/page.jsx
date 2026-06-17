import Link from 'next/link';
import styles from './hearst.module.css';
import HearstPageShell from './components/HearstPageShell';

export const metadata = {
  title: 'FUTUR ONE | Investment Memo',
};

const KPIS = [
  { label: 'Target CAPEX', value: '$4.2B' },
  { label: 'Total Scale', value: '500MW' },
  { label: 'Projected IRR', value: '12.5%' },
];

// Entry map — every section reachable from the overview.
const MODULES = [
  {
    href: '/admin/hearst/simulator',
    index: '01',
    name: 'Projection',
    desc: 'Model the asset footprint and financial outcomes live across thesis, scale and AI mix.',
  },
  {
    href: '/admin/hearst/sources',
    index: '02',
    name: 'Source Register',
    desc: 'The evidence library — every datapoint, its provenance and confidence.',
  },
  {
    href: '/admin/hearst/financial',
    index: '03',
    name: 'Financial Model',
    desc: 'The base-case investment readout — returns, capital and multi-year projection.',
  },
  {
    href: '/admin/hearst/deals',
    index: '04',
    name: 'Deal Structures',
    desc: 'Catalogue of deal archetypes with bankability and control scoring.',
  },
  {
    href: '/admin/hearst/workspace',
    index: '05',
    name: 'Scenario Workspace',
    desc: 'Saved scenarios and their recomputed projections, side by side.',
  },
  {
    href: '/admin/hearst/dossier',
    index: '06',
    name: 'Decision Dossier',
    desc: 'The board pack — strategic memos and exportable deliverables.',
  },
];

export default function HearstLanding() {
  return (
    <HearstPageShell
      variant="home"
      eyebrow="Hearst Qatar AI Infrastructure"
      title="FUTUR ONE"
      context="The control surface for the sovereign AI infrastructure investment — where state-of-the-art compute meets strategic long-term yield."
      bodyClassName={styles.homeBody}
      headerClassName={styles.homeHero}
    >
      <section className={styles.homeMetrics}>
        <div className={styles.homeKpis}>
          {KPIS.map(({ label, value }) => (
            <div key={label} className={styles.metricItem}>
              <div className={styles.metricLabel}>{label}</div>
              <div className={styles.metricValue}>{value}</div>
            </div>
          ))}
        </div>
        <p className={styles.illustrativeNote}>
          Illustrative model — headline figures for narrative preview only.
        </p>
      </section>

      <nav className={styles.routeGrid} aria-label="Hearst sections">
        {MODULES.map(({ href, index, name, desc }) => (
          <Link key={href} href={href} className={styles.routeCard}>
            <div className={styles.routeCardTop}>
              <h2 className={styles.routeCardName}>{name}</h2>
              <span className={styles.routeCardIndex}>{index}</span>
            </div>
            <p className={styles.routeCardDesc}>{desc}</p>
            <span className={styles.routeCardArrow}>Open ⟶</span>
          </Link>
        ))}
      </nav>
    </HearstPageShell>
  );
}
