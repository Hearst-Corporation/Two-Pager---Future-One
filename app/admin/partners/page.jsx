import Link from 'next/link';
import { getAdminClient, STATUS_LABEL, PARTNER_KIND_COLOR as KIND_COLOR } from '@/lib/supabase-admin';
import NewPartnerButton from './NewPartnerButton';

export const dynamic = 'force-dynamic';

export default async function PartnersListPage() {
  const supa = getAdminClient();
  const { data: partners } = await supa
    .from('partners')
    .select('*')
    .eq('archived', false)
    .order('name');

  // Get counts of linked initiatives per partner
  const { data: links } = await supa.from('initiative_partners').select('partner_id');
  const counts = {};
  for (const l of links || []) counts[l.partner_id] = (counts[l.partner_id] || 0) + 1;

  return (
    <div style={S.wrap}>
      <div style={S.topbar}>
        <Link href="/admin" style={S.back}>← BACK TO PIPELINE</Link>
        <Link href="/admin/roadmap" style={S.back}>ROADMAP →</Link>
      </div>

      <header style={S.header}>
        <div style={{ flex: 1 }}>
          <div style={S.eyebrow}>FUTUR ONE × MISA · INSTITUTIONAL PARTNERS</div>
          <h1 style={S.title}>Partners</h1>
          <p style={S.sub}>{(partners || []).length} partners · authorities, foundations, host institutions</p>
        </div>
        <NewPartnerButton />
      </header>

      <div style={S.grid}>
        {(partners || []).map((p) => (
          <Link key={p.id} href={`/admin/partner/${p.id}`} style={{ ...S.card, borderLeft: `4px solid ${KIND_COLOR[p.kind] || '#94a3b8'}` }}>
            <div style={{ ...S.kind, color: KIND_COLOR[p.kind] || '#94a3b8' }}>{p.kind.toUpperCase()}</div>
            <div style={S.name}>{p.name}</div>
            <div style={S.country}>{p.country}</div>
            <p style={S.oneLiner}>{p.one_liner}</p>
            <div style={S.metaRow}>
              <span style={S.statusPill}>{STATUS_LABEL[p.status]}</span>
              {counts[p.id] > 0 && <span style={S.linksChip}>🔗 {counts[p.id]} initiatives</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const S = {
  wrap: {
    padding: '24px 40px 80px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'var(--color-text-primary)',
    maxWidth: 1400,
    margin: '0 auto',
  },
  topbar: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 },
  back: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', textDecoration: 'none' },
  header: { marginBottom: 28, paddingBottom: 18, borderBottom: '1px solid var(--color-border-light)', display: 'flex', alignItems: 'flex-end', gap: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 3, fontWeight: 800, color: 'var(--color-accent-strong)', marginBottom: 6 },
  title: { fontSize: 38, fontWeight: 800, letterSpacing: -1.5, margin: '0 0 4px' },
  sub: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    padding: 22,
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
    transition: 'transform .15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  kind: { fontSize: 9, fontWeight: 800, letterSpacing: 2, marginBottom: 4 },
  name: { fontSize: 18, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 },
  country: { fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 },
  oneLiner: { fontSize: 12, lineHeight: 1.55, color: 'var(--color-text-secondary)', margin: '12px 0 14px', flex: 1 },
  metaRow: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  statusPill: { fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-accent-strong)' },
  linksChip: { fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 },
};
