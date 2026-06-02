'use client';

// /admin/hearst/deals — Deal Models · Strategic Reference.
//
// How the majors (Equinix, Digital Realty, hyperscalers, sovereigns) structure
// data-center JV / equity / build-to-suit / off-take deals — who owns what, who
// operates, who pays. Static presentation (no engine, no API). Hybrid register:
// sober hero + KPI strip, then denser sections with the equity-split bars and a
// deal table. Tokens only (--cp-*), cockpit-canon. Mirrors docs/deal-models-cockpit.html.

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ─── Content data ────────────────────────────────────────────────────────────

const KPIS = [
  { label: 'Largest single JV', value: '> $15B', sub: 'Equinix · GIC · CPP (US xScale)', highlight: true },
  { label: 'Typical operator stake', value: '20–25%', sub: 'rest to long-term capital' },
  { label: 'Sovereign control floor', value: '60%', sub: 'Gulf — local majority (G42)' },
  { label: 'Neocloud commitments', value: '$60B+', sub: 'Microsoft → Nscale, Nebius, CoreWeave…' },
  { label: 'Qatar wholesale deal', value: '750M QAR', sub: 'MEEZA · 6→44 MW lease' },
];

const SECTIONS = [
  { id: 'models', label: '1 · The 6 models' },
  { id: 'deals', label: '2 · Real deals' },
  { id: 'splits', label: '3 · Splits' },
  { id: 'roles', label: '4 · Who does what' },
  { id: 'gulf', label: '5 · Gulf / Qatar' },
  { id: 'playbook', label: '6 · Playbook' },
];

const MODELS = [
  {
    tag: 'A · capital-light for the operator', title: 'Equity Joint-Venture (JV)',
    sub: 'The classic Equinix / Digital Realty play',
    body: 'The operator pairs with long-term capital (sovereign fund, pension, PE) in a shared vehicle that owns the assets. The operator keeps a minority (20–25%) but retains development + operations for recurring fees.',
    pros: ['Moves debt off balance sheet, keeps the ops', 'Recurring asset/dev management fees', 'Scales capacity without diluting own equity'],
    cons: ['Shares the upside (capital takes majority)', 'Shared governance on big calls'],
  },
  {
    tag: 'B · the user dictates the spec', title: 'Build-to-Suit (BTS)',
    sub: 'Developer builds for a single tenant',
    body: 'A developer finances and builds to a hyperscaler’s exact spec under a long lease (often 15y+). An investment-grade tenant’s lease ≈ near-bond paper — highly bankable.',
    pros: ['Revenue secured from delivery (pre-leased)', 'Long lease = easy financing, predictable IRR'],
    cons: ['Single-tenant = concentration risk', 'Tenant captures the flexibility, not the landlord'],
  },
  {
    tag: 'C · the lease is the product', title: 'Wholesale lease / Powered shell',
    sub: 'Leased in MW, 5–15 year terms',
    body: 'The operator delivers the powered shell + cooling + connectivity; the tenant racks its own servers. Priced per MW. The tenant’s credit is the real underlying — a Microsoft/AWS lease is close to investment-grade.',
    pros: ['Triple-net: tenant carries tax, insurance, maintenance', 'Ticket 1–20 MW per suite/hall'],
    cons: ['Margin per unit lower than retail colo', 'Value capped by lease terms'],
  },
  {
    tag: 'D · a fund replaces the partner', title: 'Fund / development vehicle',
    sub: 'Digital Realty Hyperscale Fund ($3.25B)',
    body: 'The operator raises a dedicated fund from institutional investors, keeps ~20% and operates everything. The industrialized variant of the JV: one vehicle, many LPs, a pipeline of assets.',
    pros: ['Scalable: reload the vehicle each vintage', 'Operator stays the sole GP / operator'],
    cons: ['Needs a credible pipeline to attract LPs', 'GP economics, not full ownership'],
  },
  {
    tag: 'E · AI changes the game', title: 'Neocloud / GPU off-take',
    sub: 'CoreWeave, Nscale, Nebius, Fluidstack…',
    body: 'Born of AI: a compute buyer (hyperscaler or AI lab) signs a massive multi-year off-take contract that collateralizes the build + GPU purchase. The contract IS the financing.',
    pros: ['Microsoft: $60B+ to Nscale, Nebius, CoreWeave, Iren, Lambda', 'Anthropic ↔ Fluidstack: ~$50B of Claude-dedicated DC', 'Levered IRR 25–35%+ with GPU residual'],
    cons: ['GPU obsolescence / residual-value exposure', 'Counterparty concentration on one buyer'],
  },
  {
    tag: 'F · the state as co-owner', title: 'Sovereign / national-champion JV',
    sub: 'The Gulf model — G42, HUMAIN, Qai',
    body: 'The state (via a national entity) takes the controlling majority to keep sovereignty; tech players bring tech, GPUs and skills in minority. The mirror image of model A.',
    pros: ['Stargate UAE: G42 60% / OpenAI·Oracle·NVIDIA·SoftBank 40%', 'Data + governance stay in-country'],
    cons: ['Global partner gives up control', 'Politically gated, slower to close'],
  },
];

const DEALS = [
  { who: 'Equinix × GIC × CPP — xScale US', op: 'equinix', amt: '> $15B', struct: 'Equity JV · 2024',
    desc: 'GIC 37.5% · CPP Investments 37.5% · Equinix 25%. Equity + debt for >$15B. Target: 100MW+ campuses, >1.5GW of US hyperscale capacity. Equinix develops and operates for fees.' },
  { who: 'Equinix × GIC — Europe / Japan / Korea', op: 'equinix', amt: '$0.5 → 3.9B', struct: 'Equity JV · 2019–2022',
    desc: 'First xScale vehicles: GIC 80% · Equinix 20%. Replicated region by region (Europe, Japan, Korea, APAC), then topped up +$3.9B. Equinix keeps 20% and the operations.' },
  { who: 'Digital Realty × Blackstone', op: 'hyperscaler', amt: '$7B', struct: 'Development JV · 2024',
    desc: 'Blackstone 80% (~$700M initial) · Digital Realty 20%. 4 campuses (Frankfurt, Paris, Northern Virginia), ~500 MW. Digital Realty runs dev + operations, earns fees.' },
  { who: 'Digital Realty × TPG', op: 'hyperscaler', amt: 'NoVA portfolio', struct: 'Stabilized JV · 2023',
    desc: 'TPG Real Estate takes the majority of 3 stabilized DCs (Northern Virginia); Digital Realty keeps a minority + operates. The "already-leased assets" variant: monetize stabilized, not development.' },
  { who: 'Stargate UAE — G42 + OpenAI/Oracle/NVIDIA/SoftBank', op: 'sovereign', amt: 'up to $10B', struct: 'Sovereign JV · May 2025',
    desc: 'G42 60% (national control) · tech consortium 40%. Target: 1 GW of AI compute in Abu Dhabi. Sovereignty mandates local control — the inverse of the Equinix model.' },
  { who: 'Microsoft × G42 — UAE', op: 'hyperscaler', amt: '$15.2B', struct: 'Equity + capacity · 2024–29',
    desc: 'Microsoft takes a stake in G42 and co-expands capacity (+200 MW). $15.2B total country commitment (incl. $7.9B new for 2026–2029). Mixes equity participation and capacity deployment.' },
  { who: 'MEEZA × hyperscaler — Qatar', op: 'sovereign', amt: '750M QAR', struct: 'Wholesale lease · 2025',
    desc: '~$205M, 6 MW phase 1 → 44 MW over time. Wholesale-lease model, no shared equity. The bankable, revenue-first path Qatar has actually signed.' },
  { who: 'Ooredoo × Oracle — Qatar', op: 'sovereign', amt: 'platform licence', struct: 'Sovereign cloud · 2025',
    desc: 'Deploys Oracle Alloy: sovereign cloud + AI delivered from Qatar. Platform-licence model — data and governance stay local. Sovereignty via software, not equity.' },
];

// SERIES — the single source for every chart/graphic colour on this page.
// Bound to design-system tokens only (cp-tokens.css). The operator (the deal's
// protagonist) carries the brand accent; passive pension capital uses the DS
// neutral the Dossier capital-stack already uses. No raw colour anywhere.
const SERIES = {
  capital:   'var(--cp-op-hyperscaler)', // long-term capital / partner (LP, fund, PE)
  operator:  'var(--cp-accent)',         // operator / developer — brand protagonist
  sovereign: 'var(--cp-op-sovereign)',   // sovereign / national champion
  coinvest:  'var(--cp-text-muted)',     // passive co-investor (pension) — neutral, recedes
};

// Equity-split bars: each segment = {pct, who, role→SERIES colour}. Sum to 100.
const SPLITS = [
  { deal: 'Equinix / GIC / CPP (US)', model: 'Equity JV', size: '> $15B', op: 'Equinix',
    segs: [{ k: 'GIC', pct: 37.5, c: SERIES.capital }, { k: 'CPP', pct: 37.5, c: SERIES.coinvest }, { k: 'Equinix', pct: 25, c: SERIES.operator }] },
  { deal: 'Equinix / GIC (EU·JP·KR)', model: 'Equity JV', size: '$0.5–3.9B', op: 'Equinix',
    segs: [{ k: 'GIC', pct: 80, c: SERIES.capital }, { k: 'Equinix', pct: 20, c: SERIES.operator }] },
  { deal: 'Digital Realty / Blackstone', model: 'Dev JV', size: '$7B', op: 'Digital Realty',
    segs: [{ k: 'Blackstone', pct: 80, c: SERIES.capital }, { k: 'DLR', pct: 20, c: SERIES.operator }] },
  { deal: 'Digital Realty / TPG', model: 'Stabilized JV', size: 'portfolio', op: 'Digital Realty',
    segs: [{ k: 'TPG (majority)', pct: 70, c: SERIES.capital }, { k: 'DLR (minority)', pct: 30, c: SERIES.operator }] },
  { deal: 'DLR US Hyperscale Fund', model: 'Fund', size: '$3.25B', op: 'Digital Realty',
    segs: [{ k: 'LPs', pct: 80, c: SERIES.capital }, { k: 'DLR (GP)', pct: 20, c: SERIES.operator }] },
  { deal: 'Stargate UAE (G42 + tech)', model: 'Sovereign JV', size: '≤ $10B', op: 'G42 / consortium',
    segs: [{ k: 'G42', pct: 60, c: SERIES.sovereign }, { k: 'Consortium', pct: 40, c: SERIES.capital }] },
];

const ROLES = [
  { title: 'The long-term capital', who: 'GIC, CPP, Blackstone, TPG, sovereign funds', desc: 'Brings the majority equity. Wants stable returns backed by investment-grade leases. Does not want to operate.' },
  { title: 'The operator / developer', who: 'Equinix, Digital Realty, Vantage, NTT', desc: 'Brings dev + operations know-how, client relationships, pipeline. Keeps 20–25% + fees. The "engine" of the deal.' },
  { title: 'The capacity taker', who: 'Microsoft, AWS, Google, Meta, Oracle, AI labs', desc: 'The tenant / compute buyer. Its credit drives bankability. In AI, its off-take contract IS the financing.' },
  { title: 'The tech supplier', who: 'NVIDIA (GPU), Oracle/OpenAI (cloud/models)', desc: 'Brings silicon, platform, models. Often minority in equity but central to the AI value chain.' },
  { title: 'Land & power', who: 'Land, grid connection, power (gas, solar, grid)', desc: 'The rare, decisive underlying: no available MW, no deal. A holder of land + power has real negotiating leverage.', accentRole: false },
  { title: 'The state / sovereign', who: 'Gulf model — national entity', desc: 'In the Gulf, the state enters the cap table in the majority to keep data + governance. Inverts the usual balance of power.', accent: true },
];

const PLAYBOOK = [
  { lead: 'If you bring land + power + a sovereign position →', body: 'aim for a Sovereign JV where the local entity is majority and the global player (DC operator or hyperscaler) enters in minority as operator/tech. This is the Gulf model and the most defensible politically.' },
  { lead: 'If you want revenue secured before building →', body: 'lock a build-to-suit / wholesale lease with an investment-grade tenant (Microsoft, Oracle, AWS): their lease makes the project bankable, exactly as MEEZA did.' },
  { lead: 'If the target is AI / compute →', body: 'structure around a GPU off-take (neocloud): a multi-year contract from a lab or hyperscaler finances the build. The most capitalized 2025–2026 model (Microsoft $60B+).' },
  { lead: 'For capital →', body: 'mirror the Equinix/GIC or DLR/Blackstone mechanic: bring a long fund (sovereign, PE, pension) in as equity majority, keep operations + fees. Except here the "local" plays GIC, not Equinix.' },
];

const SIZE_CHART = [
  { name: 'Equinix/GIC/CPP', val: 15, c: SERIES.operator },
  { name: 'Microsoft/G42', val: 15.2, c: SERIES.capital },
  { name: 'Stargate UAE', val: 10, c: SERIES.sovereign },
  { name: 'Digital Realty/Blackstone', val: 7, c: SERIES.capital },
  { name: 'Equinix/GIC EU (peak)', val: 3.9, c: SERIES.operator },
  { name: 'DLR Hyperscale Fund', val: 3.25, c: SERIES.capital },
  { name: 'MEEZA Qatar (~$0.2B)', val: 0.21, c: SERIES.sovereign },
];

const SOURCES = [
  { label: 'DCD — Equinix $15bn xScale JV (GIC 37.5 / CPP 37.5 / EQIX 25)', url: 'https://www.datacenterdynamics.com/en/news/equinix-sets-up-15bn-jv-to-build-xscale-data-centers-in-the-us/' },
  { label: 'Equinix IR — JV xScale Europe (GIC 80 / EQIX 20)', url: 'https://investor.equinix.com/news-events/press-releases/detail/158/equinix-and-gic-agree-to-form-joint-venture-to-develop-and' },
  { label: 'PRNewswire — Digital Realty × Blackstone $7bn JV (80/20)', url: 'https://www.prnewswire.com/news-releases/digital-realty-and-blackstone-announce-7-billion-hyperscale-data-center-development-joint-venture-302009426.html' },
  { label: 'TPG — Digital Realty × TPG JV (Northern Virginia)', url: 'https://www.tpg.com/news-and-insights/digital-realty-and-tpg-announce-joint-venture-hyperscale-data' },
  { label: 'DCD — Digital Realty US Hyperscale Fund $3.25bn', url: 'https://www.datacenterdynamics.com/en/news/digital-realty-closes-first-hyperscale-data-center-fund-raises-325bn/' },
  { label: 'G42 — Stargate UAE (G42 60% / consortium 40%)', url: 'https://www.g42.ai/resources/news/global-tech-alliance-launches-stargate-uae' },
  { label: 'DCD — Microsoft × G42, +200 MW ($15.2B commitment)', url: 'https://www.datacenterdynamics.com/en/news/microsoft-and-g42-expand-data-center-capacity-plans-in-uae-by-200mw/' },
  { label: 'Introl — Microsoft $60B+ neoclouds (Nscale, Nebius, CoreWeave…)', url: 'https://introl.com/blog/microsoft-60-billion-neocloud-spending-capacity-crunch-december-2025' },
  { label: 'MEEZA — 750M QAR / 6→44 MW (Qatar)', url: 'https://www.meeza.net/meeza-signs-new-landmark-data-centre-agreement-worth-over-qar-750-million-to-secure-6-megawatts-of-data-center-services-for-a-global-hyperscaler/' },
  { label: 'TechAfrica — Ooredoo × Oracle Alloy (sovereign cloud Qatar)', url: 'https://techafricanews.com/2025/12/02/ooredoo-signs-landmark-deal-to-deploy-oracle-alloy-and-strengthen-qatars-digital-sovereignty/' },
  { label: 'Build.inc — Wholesale vs colocation / build-to-suit (models)', url: 'https://build.inc/insights/wholesale-vs-colocation-data-center-development' },
];

// Deal-card keyline colour by lead actor — same SERIES palette.
const OP_BAR = {
  equinix: SERIES.operator,
  hyperscaler: SERIES.capital,
  sovereign: SERIES.sovereign,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SplitBar({ row }) {
  return (
    <div style={S.splitRow}>
      <div style={S.splitMeta}>
        <span style={S.splitDeal}>{row.deal}</span>
        <span style={S.splitTags}>{row.model} · {row.size}</span>
      </div>
      <div style={S.splitTrack}>
        {row.segs.map((seg, i) => (
          <div key={i} style={{ ...S.splitSeg, width: `${seg.pct}%`, background: seg.c }} title={`${seg.k} ${seg.pct}%`}>
            {seg.pct >= 18 ? <span style={S.splitSegLabel}>{seg.k} {seg.pct}%</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [active, setActive] = useState('models');

  const go = (id) => {
    setActive(id);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(`sec-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <style>{`
        /* Container queries — measured against the rail-constrained content
           box, not the viewport, so columns reflow against the REAL width. */
        /* !important required: base columns are set via inline style, which
           outranks a stylesheet rule. These overrides must win. */
        [data-deals-root] { container-type: inline-size; }
        @container (max-width: 1040px) {
          [data-deals-kpi-grid] { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
          [data-deals-grid-3]   { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
        }
        @container (max-width: 720px) {
          [data-deals-kpi-grid] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          [data-deals-grid-2]   { grid-template-columns: 1fr !important; }
        }
        @container (max-width: 480px) {
          [data-deals-kpi-grid] { grid-template-columns: 1fr !important; }
          [data-deals-grid-3]   { grid-template-columns: 1fr !important; }
          [data-deals-pc]       { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div data-deals-root style={S.wrap}>

        {/* HERO */}
        <header style={S.hero}>
          <div style={S.eyebrow}>HEARST · STRATEGIC REFERENCE · HYPERSCALE / AI INFRA</div>
          <h1 style={S.h1}>How the majors structure their deals<br />— JV, equity, build-to-suit, off-take</h1>
          <p style={S.lede}>
            How data-center operators and hyperscalers finance and run capacity — who takes which share,
            who operates, who pays. A reference frame for designing a deal around a hub like Futur One.
          </p>
        </header>

        {/* KPI STRIP */}
        <div data-deals-kpi-grid style={S.kpiGrid}>
          {KPIS.map((k) => (
            <div key={k.label} className={`cp-card${k.highlight ? ' cp-card-accent' : ''}`} style={S.kpiCard}>
              <div style={S.kpiLabel}>{k.label}</div>
              <div style={{ ...S.kpiValue, color: k.highlight ? 'var(--cp-text-strong)' : 'var(--cp-text-strong)' }}>{k.value}</div>
              <div style={S.kpiSub}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ANCHOR NAV */}
        <nav data-deals-nav style={S.nav} aria-label="Deal models sections">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} style={{ ...S.navBtn, ...(active === s.id ? S.navBtnActive : {}) }}>
              {s.label}
            </button>
          ))}
        </nav>

        {/* §1 MODELS */}
        <section id="sec-models" style={S.section}>
          <SectionHead num="01" title="The 6 deal models used across the industry"
            hint="From the least capital-intensive for the operator (lease) to the most committing (equity JV). All coexist." />
          <div data-deals-grid-2 style={S.grid2}>
            {MODELS.map((m) => (
              <div key={m.title} className="cp-card" style={S.modelCard}>
                <div style={S.modelTag}>{m.tag}</div>
                <div style={S.modelTitle}>{m.title}</div>
                <div style={S.modelSub}>{m.sub}</div>
                <p style={S.modelBody}>{m.body}</p>
                <div data-deals-pc style={S.pc}>
                  <div style={S.pcCol}>
                    <div style={{ ...S.pcHead, color: 'var(--cp-status-positive)' }}>Upside</div>
                    {m.pros.map((p, i) => <div key={i} style={S.pcItem}><span style={{ color: 'var(--cp-status-positive)' }}>+</span> {p}</div>)}
                  </div>
                  <div style={S.pcCol}>
                    <div style={{ ...S.pcHead, color: 'var(--cp-status-negative)' }}>Trade-off</div>
                    {m.cons.map((c, i) => <div key={i} style={S.pcItem}><span style={{ color: 'var(--cp-status-negative)' }}>–</span> {c}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* §2 REAL DEALS */}
        <section id="sec-deals" style={S.section}>
          <SectionHead num="02" title="Real deals — what the majors have signed"
            hint="The recurring structure: majority long-term capital + minority operator that keeps operational control." />
          <div data-deals-grid-2 style={S.grid2}>
            {DEALS.map((d) => (
              <div key={d.who} className="cp-card" style={{ ...S.dealCard, borderLeft: `3px solid ${OP_BAR[d.op]}` }}>
                <div style={S.dealTop}>
                  <span style={S.dealWho}><span style={{ ...S.dot, background: OP_BAR[d.op] }} />{d.who}</span>
                  <span style={S.dealAmt}>{d.amt}</span>
                </div>
                <div style={S.dealStruct}>{d.struct}</div>
                <p style={S.dealDesc}>{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* §3 SPLITS */}
        <section id="sec-splits" style={S.section}>
          <SectionHead num="03" title="The equity splits — who owns what"
            hint="Outside the Gulf, the dominant rule: long-term capital owns, the operator keeps 20–25% + operations." />
          <div className="cp-card" style={S.splitPanel}>
            {SPLITS.map((row) => <SplitBar key={row.deal} row={row} />)}
            <div style={S.legendRow}>
              <span style={S.legendItem}><span style={{ ...S.dot, background: SERIES.capital }} /> Long-term capital / partner</span>
              <span style={S.legendItem}><span style={{ ...S.dot, background: SERIES.operator }} /> Operator (Equinix / DLR)</span>
              <span style={S.legendItem}><span style={{ ...S.dot, background: SERIES.sovereign }} /> Sovereign / national champion</span>
              <span style={S.legendItem}><span style={{ ...S.dot, background: SERIES.coinvest }} /> Pension / co-investor</span>
            </div>
          </div>

          {/* table */}
          <div style={{ overflowX: 'auto', marginTop: 'var(--cp-space-5)' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Deal', 'Model', 'Equity split', 'Size', 'Operates'].map((h) => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {SPLITS.map((r) => (
                  <tr key={r.deal}>
                    <td style={S.tdLabel}>{r.deal}</td>
                    <td style={S.td}>{r.model}</td>
                    <td style={{ ...S.td, color: 'var(--cp-text-primary)' }}>{r.segs.map((s) => `${s.k} ${s.pct}`).join(' · ')}</td>
                    <td style={S.td}>{r.size}</td>
                    <td style={S.td}>{r.op}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* deal size chart */}
          <div className="cp-card" style={{ ...S.chartCard, marginTop: 'var(--cp-space-5)' }}>
            <div style={S.chartTitle}>HEADLINE DEAL / COMMITMENT SIZE ($B)</div>
            <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 440 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={SIZE_CHART} margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cp-grid-line)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} tickFormatter={(v) => '$' + v + 'B'} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fill: 'var(--cp-text-body)', fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => ['$' + v + 'B', 'Size']}
                  cursor={{ fill: 'var(--cp-surface-2)' }}
                  contentStyle={{ background: 'var(--cp-tooltip-bg)', border: '1px solid var(--cp-border-strong)', borderRadius: 6, color: 'var(--cp-text-strong)' }}
                  labelStyle={{ color: 'var(--cp-text-muted)', fontSize: 11 }}
                />
                <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                  {SIZE_CHART.map((e, i) => <Cell key={i} fill={e.c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            </div>
          </div>
        </section>

        {/* §4 ROLES */}
        <section id="sec-roles" style={S.section}>
          <SectionHead num="04" title="Who does what in a hyperscale deal"
            hint="A deal can involve up to 5 distinct roles. One actor can hold several — but thinking in roles tells you what you bring and what you capture." />
          <div data-deals-grid-3 style={S.grid3}>
            {ROLES.map((r) => (
              <div key={r.title} className="cp-card" style={{ ...S.roleCard, ...(r.accent ? S.roleCardAccent : {}) }}>
                <div style={{ ...S.roleTitle, ...(r.accent ? { color: 'var(--cp-accent-strong)' } : {}) }}>{r.title}</div>
                <div style={S.roleWho}>{r.who}</div>
                <p style={S.roleDesc}>{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* §5 GULF */}
        <section id="sec-gulf" style={S.section}>
          <SectionHead num="05" title="Gulf / Qatar specifics"
            hint="The regional pattern differs from the West: sovereignty first, the state/national champion owns, tech enters in minority." />
          <div data-deals-grid-2 style={S.grid2}>
            <div className="cp-card" style={{ ...S.callout, borderColor: SERIES.sovereign }}>
              <div style={S.calloutTitle}><span style={{ ...S.dot, background: SERIES.sovereign }} />The sovereign rule</div>
              <p style={S.calloutBody}>
                UAE (G42), Saudi (HUMAIN), Qatar (Qai) are national champions coordinating capital, energy and compute.
                On Stargate UAE, G42 keeps 60% so sovereign AI infra stays under national control. Data does not leave
                the country — hence the sovereign-cloud wave (Oracle Alloy at Ooredoo).
              </p>
            </div>
            <div className="cp-card" style={S.callout}>
              <div style={S.calloutTitle}><span style={{ ...S.dot, background: SERIES.capital }} />What Qatar has already signed</div>
              <p style={{ ...S.calloutBody, marginBottom: 'var(--cp-space-3)' }}><b style={S.b}>MEEZA × hyperscaler</b> — 750M QAR (~$205M), 6 MW phase 1 → 44 MW at term. Wholesale-lease model, no shared equity.</p>
              <p style={S.calloutBody}><b style={S.b}>Ooredoo × Oracle</b> — deploys Oracle Alloy: sovereign cloud + AI delivered from Qatar. Platform-licence model, data stays local.</p>
            </div>
          </div>
          <div className="cp-card cp-card-accent" style={{ ...S.callout, marginTop: 'var(--cp-space-4)' }}>
            <div style={S.calloutTitle}>Implication for a local deal (a hub like Futur One)</div>
            <p style={S.calloutBody}>
              In Qatar, a Western partner (Equinix, Digital Realty, a hyperscaler) will not arrive as majority. The realistic
              setup: local entity / sovereign majority, the global player in minority + operator/tech role. The exact mirror
              of the Equinix/GIC JVs where, here, it is the local side holding 60–80%.
            </p>
          </div>
        </section>

        {/* §6 PLAYBOOK */}
        <section id="sec-playbook" style={S.section}>
          <SectionHead num="06" title="Playbook for a hub — which model to aim for"
            hint="Actionable synthesis depending on what you bring to the table." />
          <div className="cp-card cp-card-accent" style={S.playbook}>
            <ol style={S.ol}>
              {PLAYBOOK.map((p, i) => (
                <li key={i} style={S.li}><b style={S.b}>{p.lead}</b> {p.body}</li>
              ))}
            </ol>
          </div>
          <p style={S.closing}>
            <b style={S.b}>The central reflex:</b> value is not captured at the equity line alone. The operator keeps 20% but
            pockets recurring development + operations fees, and whoever holds land + power controls the bottleneck. Knowing
            which role you play determines what you negotiate.
          </p>
        </section>

        {/* FOOTER */}
        <footer style={S.footer}>
          <div style={S.footHead}>SOURCES (PUBLIC DEALS)</div>
          <div style={S.srcList}>
            {SOURCES.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={S.srcLink}>{s.label}</a>
            ))}
          </div>
          <p style={S.disclaimer}>
            Internal Hearst note — data from press releases and trade press (2021–2026). Percentages and amounts reflect
            public announcements; some structures evolve (successive closings, top-ups). Verify before any use in negotiation.
            Not for external distribution.
          </p>
        </footer>

      </div>
    </>
  );
}

function SectionHead({ num, title, hint }) {
  return (
    <div style={S.secHead}>
      <span style={S.secNum}>{num}</span>
      <div>
        <h2 style={S.secTitle}>{title}</h2>
        {hint && <p style={S.secHint}>{hint}</p>}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-7)', paddingBottom: 180, maxWidth: 1160 },

  // hero
  hero: { borderLeft: '3px solid var(--cp-accent)', paddingLeft: 'var(--cp-space-5)', paddingTop: 'var(--cp-space-2)', paddingBottom: 'var(--cp-space-2)' },
  eyebrow: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--cp-accent-strong)' },
  h1: { fontSize: 'clamp(22px, 3.4vw, 30px)', lineHeight: 1.18, fontWeight: 800, letterSpacing: 'var(--cp-tracking-tight)', color: 'var(--cp-text-strong)', margin: '10px 0 10px' },
  lede: { fontSize: 'clamp(13px, 1.4vw, 15px)', color: 'var(--cp-text-body)', maxWidth: 780, lineHeight: 1.55 },

  // kpi strip
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--cp-space-3)' },
  kpiCard: { padding: 'var(--cp-space-4) var(--cp-space-5)', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 92 },
  kpiLabel: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--cp-text-muted)' },
  kpiValue: { fontSize: 'clamp(19px, 2.6vw, 24px)', fontWeight: 800, letterSpacing: 'var(--cp-tracking-tight)', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', marginTop: 2 },
  kpiSub: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', lineHeight: 1.35 },

  // anchor nav
  nav: { display: 'flex', gap: 6, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 5, padding: 'var(--cp-space-2) 0', background: 'linear-gradient(180deg, var(--cp-bg-deep) 60%, transparent)' },
  navBtn: { fontSize: 'var(--cp-font-xs)', fontWeight: 600, padding: '6px 13px', border: '1px solid var(--cp-border)', background: 'var(--cp-surface-1)', color: 'var(--cp-text-muted)', borderRadius: 'var(--cp-radius-pill)', cursor: 'pointer', transition: 'all var(--cp-dur-base) var(--cp-ease)', whiteSpace: 'nowrap' },
  navBtnActive: { background: 'var(--cp-accent-maroon, var(--cp-accent))', color: 'var(--cp-text-strong)', borderColor: 'var(--cp-border-accent)' },

  // section
  section: { scrollMarginTop: 56, display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' },
  secHead: { display: 'flex', gap: 'var(--cp-space-4)', alignItems: 'flex-start' },
  secNum: { fontSize: 'var(--cp-font-sm)', fontWeight: 800, color: 'var(--cp-accent-strong)', border: '1px solid var(--cp-border-accent)', borderRadius: 'var(--cp-radius-sm)', padding: '4px 9px', flex: 'none', letterSpacing: '0.05em' },
  secTitle: { fontSize: 'clamp(17px, 2.2vw, 20px)', fontWeight: 800, letterSpacing: 'var(--cp-tracking-tight)', color: 'var(--cp-text-strong)', lineHeight: 1.25 },
  secHint: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', marginTop: 4, maxWidth: 820, lineHeight: 1.5 },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--cp-space-4)' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--cp-space-4)' },

  // model card
  modelCard: { padding: 'var(--cp-space-5)', display: 'flex', flexDirection: 'column' },
  modelTag: { display: 'inline-block', alignSelf: 'flex-start', fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cp-accent-strong)', background: 'var(--cp-accent-soft)', border: '1px solid var(--cp-border-accent)', borderRadius: 'var(--cp-radius-sm)', padding: '3px 8px', marginBottom: 'var(--cp-space-3)' },
  modelTitle: { fontSize: 'var(--cp-font-lg)', fontWeight: 700, color: 'var(--cp-text-strong)', letterSpacing: 'var(--cp-tracking-tight)' },
  modelSub: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-3)', marginTop: 2 },
  modelBody: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.55 },
  pc: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--cp-space-3)', marginTop: 'var(--cp-space-4)' },
  pcCol: { border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)', padding: 'var(--cp-space-3)', background: 'var(--cp-surface-0)' },
  pcHead: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--cp-space-2)' },
  pcItem: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-body)', lineHeight: 1.5, marginBottom: 5 },

  // deal card
  dealCard: { padding: 'var(--cp-space-5)', display: 'flex', flexDirection: 'column' },
  dealTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--cp-space-3)', marginBottom: 4 },
  dealWho: { fontSize: 'var(--cp-font-md)', fontWeight: 700, color: 'var(--cp-text-strong)', display: 'flex', alignItems: 'center', minWidth: 0, lineHeight: 1.3 },
  dealAmt: { fontSize: 'var(--cp-font-base)', fontWeight: 800, color: 'var(--cp-text-strong)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  dealStruct: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-accent-strong)', fontWeight: 600, marginBottom: 'var(--cp-space-3)' },
  dealDesc: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.55 },

  // split panel
  splitPanel: { padding: 'var(--cp-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' },
  splitRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  splitMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--cp-space-3)' },
  splitDeal: { fontSize: 'var(--cp-font-sm)', fontWeight: 700, color: 'var(--cp-text-primary)' },
  splitTags: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  splitTrack: { display: 'flex', height: 26, borderRadius: 'var(--cp-radius-sm)', overflow: 'hidden', border: '1px solid var(--cp-border)' },
  splitSeg: { display: 'flex', alignItems: 'center', paddingLeft: 8, minWidth: 0, transition: 'width var(--cp-dur-base) var(--cp-ease)' },
  splitSegLabel: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, color: 'var(--cp-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  legendRow: { display: 'flex', flexWrap: 'wrap', gap: 'var(--cp-space-4)', marginTop: 4, paddingTop: 'var(--cp-space-3)', borderTop: '1px solid var(--cp-border-soft)' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)' },

  // table
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)', background: 'var(--cp-surface-2)', borderRadius: 'var(--cp-radius-md)', overflow: 'hidden' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cp-text-muted)', background: 'var(--cp-surface-0)', borderBottom: '1px solid var(--cp-border)', whiteSpace: 'nowrap' },
  td: { padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid var(--cp-border-soft)', fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-body)', verticalAlign: 'top' },
  tdLabel: { padding: '10px 14px', fontWeight: 700, fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-strong)', borderBottom: '1px solid var(--cp-border-soft)', whiteSpace: 'nowrap' },

  // chart
  chartCard: { padding: 'var(--cp-space-5)' },
  chartTitle: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-4)' },

  // roles
  roleCard: { padding: 'var(--cp-space-5)' },
  roleCardAccent: { borderColor: 'var(--cp-border-accent)' },
  roleTitle: { fontSize: 'var(--cp-font-md)', fontWeight: 700, color: 'var(--cp-text-strong)', marginBottom: 4 },
  roleWho: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-3)' },
  roleDesc: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.55 },

  // callouts
  callout: { padding: 'var(--cp-space-5)' },
  calloutTitle: { fontSize: 'var(--cp-font-lg)', fontWeight: 700, color: 'var(--cp-text-strong)', marginBottom: 'var(--cp-space-3)', display: 'flex', alignItems: 'center' },
  calloutBody: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.6 },

  // playbook
  playbook: { padding: 'var(--cp-space-6)' },
  ol: { margin: 0, paddingLeft: 'var(--cp-space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)' },
  li: { fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 1.6 },
  closing: { fontSize: 'var(--cp-font-md)', color: 'var(--cp-text-body)', lineHeight: 1.6, maxWidth: 880, marginTop: 'var(--cp-space-2)' },
  b: { color: 'var(--cp-text-strong)', fontWeight: 700 },

  // footer
  footer: { borderTop: '1px solid var(--cp-border)', paddingTop: 'var(--cp-space-5)', marginTop: 'var(--cp-space-4)' },
  footHead: { fontSize: 'var(--cp-font-micro)', fontWeight: 700, letterSpacing: 'var(--cp-tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-3)' },
  srcList: { display: 'flex', flexDirection: 'column', gap: 6 },
  srcLink: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', transition: 'color var(--cp-dur-base) var(--cp-ease)', textDecoration: 'none' },
  disclaimer: { marginTop: 'var(--cp-space-5)', fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-faint)', maxWidth: 860, lineHeight: 1.5 },

  dot: { width: 9, height: 9, borderRadius: '50%', marginRight: 8, flex: 'none', display: 'inline-block' },
};
