export default function HearstAboutPage() {
  return (
    <div style={S.root}>

      {/* ─── PAGE HEADER ─────────────────────────────────────────── */}
      <div style={S.pageHeader}>
        <div style={S.pageTitle}>How it works</div>
        <div style={S.pageSubtitle}>
          A 3-minute primer for investors and newcomers to the data center industry.
          No jargon left unexplained.
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          SECTION 1 — BUSINESS MODELS
      ════════════════════════════════════════════════════════════ */}
      <section style={S.section}>
        <div style={S.sectionHeader}>
          <div style={S.sectionIndex}>01</div>
          <div>
            <div style={S.sectionTitle}>Business models</div>
            <div style={S.sectionLead}>
              Data centers are not one product — they are a spectrum of risk/return
              tradeoffs driven by lease length, tenant concentration, and who builds
              the infrastructure.
            </div>
          </div>
        </div>

        <div style={S.grid}>

          <div style={S.card}>
            <div style={S.cardLabel}>Retail colocation</div>
            <div style={S.cardTag}>$/kW/month · multi-tenant</div>
            <p style={S.cardBody}>
              The landlord builds, powers, and cools the facility. Customers rent
              individual racks or cages — typically 1 kW to a few hundred kW per
              deal. Contracts are short (1–3 years), pricing is high per kW, and
              churn can be meaningful. Revenue is granular and diversified.
            </p>
            <div style={S.cardStat}>Typical deal size: &lt; 1 MW per tenant</div>
          </div>

          <div style={S.card}>
            <div style={S.cardLabel}>Wholesale colocation</div>
            <div style={S.cardTag}>MW-scale · 5–15 year leases</div>
            <p style={S.cardBody}>
              A single tenant leases an entire hall or suite — often 1–20 MW.
              The operator still handles power, cooling, and physical security.
              Rents are lower per kW than retail but contracts are long and
              credit-quality tenants provide bond-like cash flows.
            </p>
            <div style={S.cardStat}>Typical lease: 5–15 years · renewal likely</div>
          </div>

          <div style={S.card}>
            <div style={S.cardLabel}>Hyperscale lease</div>
            <div style={S.cardTag}>10–20 yr triple-net · single tenant</div>
            <p style={S.cardBody}>
              The developer builds an entire campus to a hyperscaler's specification
              (AWS, Microsoft, Google). The tenant signs a 10–20 year triple-net
              lease — they pay taxes, insurance, and maintenance on top of base rent.
              Capex is enormous; risk is near zero once the lease is signed.
            </p>
            <div style={S.cardStat}>IRR driven by cap-rate arbitrage at exit</div>
          </div>

          <div style={S.card}>
            <div style={S.cardLabel}>Powered shell</div>
            <div style={S.cardTag}>Developer delivers structure + power</div>
            <p style={S.cardBody}>
              The developer constructs the building, installs high-voltage electrical
              infrastructure, and hands over an empty shell. The tenant does its own
              cooling, fit-out, and IT install. Capex for the developer is lower;
              the tenant carries fit-out risk and gets a facility tailored exactly
              to their needs.
            </p>
            <div style={S.cardStat}>Lower upfront capex · faster delivery</div>
          </div>

          <div style={{ ...S.card, gridColumn: 'span 2' }}>
            <div style={S.cardLabel}>Sovereign AI cloud</div>
            <div style={S.cardTag}>Government / QIA · GPU-heavy · data-residency</div>
            <p style={S.cardBody}>
              Governments and sovereign wealth funds (e.g., QIA in Qatar) are
              building dedicated AI infrastructure to keep sensitive data inside
              national borders and to retain strategic autonomy over compute. These
              facilities are GPU-dense, require diplomatic-grade physical security,
              and are often structured as long-term concession or joint-venture
              agreements rather than standard leases. Revenue visibility is exceptional;
              competitive moat is high.
            </p>
            <div style={S.cardStat}>Qatar context: QIA + QCRI national AI strategy · key Hearst angle</div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 2 — WHO'S WHO IN THE VALUE CHAIN
      ════════════════════════════════════════════════════════════ */}
      <section style={S.section}>
        <div style={S.sectionHeader}>
          <div style={S.sectionIndex}>02</div>
          <div>
            <div style={S.sectionTitle}>Who's who in the value chain</div>
            <div style={S.sectionLead}>
              Three distinct lanes — each with different margins, contract lengths,
              and strategic leverage.
            </div>
          </div>
        </div>

        <div style={S.lanes}>

          <div style={S.lane}>
            <div style={S.laneHeader}>
              <div style={{ ...S.laneDot, background: 'var(--cp-accent-strong)' }} />
              <div style={S.laneName}>Hyperscalers</div>
              <div style={S.laneRole}>Tenants / buyers</div>
            </div>
            <div style={S.laneNames}>AWS · Microsoft Azure · Google Cloud · Oracle · Meta</div>
            <div style={S.laneBody}>
              <div style={S.laneRow}>
                <span style={S.laneKey}>What they want</span>
                <span style={S.laneVal}>Long-term certainty (10–20 yr), power at scale (≥ 50 MW),
                low PUE, N+1 or 2N redundancy, GPU-ready power density (≥ 50 kW/rack)</span>
              </div>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Leverage</span>
                <span style={S.laneVal}>Investment-grade credit · enormous committed capex budgets ·
                sticky once deployed (migration cost is prohibitive)</span>
              </div>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Risk to developer</span>
                <span style={S.laneVal}>Spec risk before lease signed · can walk if market shifts</span>
              </div>
            </div>
          </div>

          <div style={S.lane}>
            <div style={S.laneHeader}>
              <div style={{ ...S.laneDot, background: 'var(--cp-accent)' }} />
              <div style={S.laneName}>Operators (colo brands)</div>
              <div style={S.laneRole}>Developers & managers</div>
            </div>
            <div style={S.laneNames}>Equinix · Digital Realty · NTT · Vantage · EdgeConnex</div>
            <div style={S.laneBody}>
              <div style={S.laneRow}>
                <span style={S.laneKey}>What they sell</span>
                <span style={S.laneVal}>Managed colocation, interconnection fabric, carrier-neutral
                exchange, SLA-backed uptime (99.9999%)</span>
              </div>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Business model</span>
                <span style={S.laneVal}>Real-estate-like (REIT structure common) · recurring revenue ·
                high margins on power markup and cross-connect fees</span>
              </div>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Moat</span>
                <span style={S.laneVal}>Location, power entitlements, network density — all take years to replicate</span>
              </div>
            </div>
          </div>

          <div style={S.lane}>
            <div style={S.laneHeader}>
              <div style={{ ...S.laneDot, background: 'var(--cp-accent-strong)' }} />
              <div style={S.laneName}>Neoclouds / GPU specialists</div>
              <div style={S.laneRole}>AI-era compute renters</div>
            </div>
            <div style={S.laneNames}>CoreWeave · Lambda Labs · Crusoe · RunPod · Voltage Park</div>
            <div style={S.laneBody}>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Contract length</span>
                <span style={S.laneVal}>1–3 years (short vs hyperscalers) · often month-to-month
                for spot GPU capacity</span>
              </div>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Pricing</span>
                <span style={S.laneVal}>High $/GPU-hr or $/kW — premium for GPU-ready power density
                and flexibility; willing to pay 2–3× standard colo rates</span>
              </div>
              <div style={S.laneRow}>
                <span style={S.laneKey}>Use case</span>
                <span style={S.laneVal}>AI model training (bursts) and inference (steady) ·
                LLM startups, research labs, enterprises avoiding hyperscaler lock-in</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SECTION 3 — FINANCIAL PRIMER
      ════════════════════════════════════════════════════════════ */}
      <section style={S.section}>
        <div style={S.sectionHeader}>
          <div style={S.sectionIndex}>03</div>
          <div>
            <div style={S.sectionTitle}>Financial primer</div>
            <div style={S.sectionLead}>
              Eight terms that appear in every data center investment memo.
              Plain English first, then the math.
            </div>
          </div>
        </div>

        <div style={S.glossary}>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>CAPEX / MW</div>
              <div style={S.glossTag}>Capital Expenditure per megawatt</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                The upfront cost to build one megawatt of IT load capacity — including
                land, structure, power infrastructure, cooling, generators, and fit-out.
                The single biggest driver of equity required and IRR.
              </div>
              <div style={S.glossFormula}>Typical range: $8M – $14M / MW (hyperscale grade, 2024)</div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>PUE</div>
              <div style={S.glossTag}>Power Usage Effectiveness</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                How efficiently a facility converts utility power into IT power.
                A PUE of 1.0 is perfect — every watt goes to compute, nothing wasted.
                Cooling is the main source of overhead. Qatar's climate increases cooling load.
              </div>
              <div style={S.glossFormula}>
                PUE = Total facility power / IT equipment power<br />
                1.0 (perfect) · 1.2–1.3 (best practice) · 1.4–1.6 (Qatar climate estimate)
              </div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>OPEX</div>
              <div style={S.glossTag}>Operating Expenditure</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                All recurring cash costs to run the facility once built.
                Energy is typically 40–60% of total OPEX for a colo operator.
                The rest is staff, maintenance contracts, insurance, and G&A.
              </div>
              <div style={S.glossFormula}>
                OPEX = Energy cost + Staff + Maintenance + Insurance + G&A<br />
                Energy: PUE × IT load (MW) × 8,760 hr/yr × $/kWh
              </div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>IRR</div>
              <div style={S.glossTag}>Internal Rate of Return</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                The annualized return rate at which the net present value of all
                cash flows (in and out) equals zero. If the IRR exceeds your cost
                of capital, the project creates value. Investors typically target
                12–20% unlevered IRR for core-plus data center development.
              </div>
              <div style={S.glossFormula}>
                Solve for r : Σ CF_t / (1+r)^t = 0<br />
                Target (development): 15–20% levered IRR
              </div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>NPV</div>
              <div style={S.glossTag}>Net Present Value</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                The value today of all future cash flows, discounted at a rate that
                reflects the riskiness of those cash flows. Positive NPV = value created.
                The discount rate used is typically the weighted average cost of capital (WACC)
                or the required equity return.
              </div>
              <div style={S.glossFormula}>NPV = Σ CF_t / (1+r)^t — Initial Investment</div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>MOIC</div>
              <div style={S.glossTag}>Multiple on Invested Capital</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                A simpler metric than IRR — it ignores time but gives investors an
                intuitive sense of how many times they get their money back.
                A 2.5× MOIC means every $1 invested returned $2.50 in total proceeds.
                Used alongside IRR because timing matters for the latter.
              </div>
              <div style={S.glossFormula}>
                MOIC = Total proceeds / Equity invested<br />
                Typical target (development): 2.0×–3.5× over 7–10 years
              </div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>DSCR</div>
              <div style={S.glossTag}>Debt Service Coverage Ratio</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                The ratio a lender uses to decide if cash flows are sufficient to
                service debt. Below 1.0 means the asset cannot cover its own debt
                payments — covenant breach territory. Most infrastructure lenders
                require at least 1.3× as a floor.
              </div>
              <div style={S.glossFormula}>
                DSCR = (EBITDA − Maintenance Capex) / Annual Debt Service<br />
                Lender minimum: ≥ 1.30× (typically 1.35–1.50× covenant)
              </div>
            </div>
          </div>

          <div style={S.glossItem}>
            <div style={S.glossLeft}>
              <div style={S.glossTerm}>Terminal Value</div>
              <div style={S.glossTag}>Exit / residual value</div>
            </div>
            <div style={S.glossRight}>
              <div style={S.glossPlain}>
                The assumed value of the asset at the end of the holding period —
                usually computed as a multiple of the final year's EBITDA, or
                by capitalizing NOI at a target cap rate. In a 10-year DCF,
                terminal value often represents 50–70% of total NPV.
              </div>
              <div style={S.glossFormula}>
                Terminal Value = Exit EBITDA × Exit multiple<br />
                Or: Stabilized NOI / Exit cap rate · Typical DC exit multiple: 18×–25× EBITDA
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

/* ─── STYLES ────────────────────────────────────────────────────── */
const S = {
  root: {
    maxWidth: 960,
    margin: '0 auto',
  },

  /* Page header */
  pageHeader: {
    marginBottom: 40,
    paddingBottom: 24,
    borderBottom: '1px solid var(--cp-border)',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: 'var(--cp-text-muted)',
    lineHeight: 1.6,
  },

  /* Section wrapper */
  section: {
    marginBottom: 56,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    marginBottom: 28,
  },
  sectionIndex: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 3,
    color: 'var(--cp-accent-strong)',
    marginTop: 4,
    minWidth: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  sectionLead: {
    fontSize: 13,
    color: 'var(--cp-text-muted)',
    lineHeight: 1.65,
    maxWidth: 640,
  },

  /* ── Section 1 — Grid cards ── */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  card: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: '20px 22px',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    marginBottom: 4,
  },
  cardTag: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--cp-accent-strong)',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 13,
    color: 'var(--cp-text-muted)',
    lineHeight: 1.7,
    margin: 0,
    marginBottom: 14,
  },
  cardStat: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 4,
    padding: '5px 10px',
    display: 'inline-block',
  },

  /* ── Section 2 — Lanes ── */
  lanes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  lane: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: '20px 24px',
  },
  laneHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  laneDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  laneName: {
    fontSize: 15,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
  },
  laneRole: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--cp-text-muted)',
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  laneNames: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--cp-accent-strong)',
    letterSpacing: 0.3,
    marginBottom: 14,
    marginLeft: 18,
  },
  laneBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginLeft: 18,
  },
  laneRow: {
    display: 'flex',
    gap: 16,
    fontSize: 13,
    lineHeight: 1.6,
  },
  laneKey: {
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    minWidth: 120,
    flexShrink: 0,
  },
  laneVal: {
    color: 'var(--cp-text-muted)',
    flex: 1,
  },

  /* ── Section 3 — Glossary ── */
  glossary: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  glossItem: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--cp-border)',
  },
  glossLeft: {
    width: 180,
    flexShrink: 0,
    padding: '16px 20px',
    background: 'var(--cp-surface-2)',
    borderRight: '1px solid var(--cp-border)',
  },
  glossRight: {
    flex: 1,
    padding: '16px 24px',
    background: 'var(--cp-bg-deep)',
  },
  glossTerm: {
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  glossTag: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--cp-accent-strong)',
    letterSpacing: 0.5,
    lineHeight: 1.4,
  },
  glossPlain: {
    fontSize: 13,
    color: 'var(--cp-text-muted)',
    lineHeight: 1.7,
    marginBottom: 10,
  },
  glossFormula: {
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 4,
    padding: '8px 12px',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
};
