import type { ReactNode } from 'react';
import styles from './qatar-report.module.css';
import { QATAR_ASSUMPTIONS } from '@/lib/investment-model/qatar/assumptions';
import {
  computePlatform,
  unitEconomics,
  usdB,
  usdM,
  usdMdec,
  pct,
  mult,
} from '@/lib/investment-model/qatar/calculations';
import { SCENARIO_RESULTS } from '@/lib/investment-model/qatar/scenarios';

const INK = '#0B1220';
const GOLD = '#B0894B';
const GOLDD = '#856634';
const LINE = '#E6E1D6';
const MUT = '#6E6A62';
const FAINT = '#9A958A';
const usdB1 = (x: number) => `$${(x / 1e9).toFixed(1)}B`;

/* ---------- Section 3 · Power-to-Cash Corridor (deterministic SVG) ---------- */
function CorridorSVG({ revenuePerMw }: { revenuePerMw: number }) {
  const W = 1000, H = 320, L = 78, R = 152, T = 72, B = 58;
  const xM = (m: number) => L + (m / 18) * (W - L - R);
  const yMW = (v: number) => H - B - (v / 150) * (H - T - B);
  const e: ReactNode[] = [];
  let k = 0;
  const key = () => `c${k++}`;

  // allocated-power rail
  const railY = 20, railH = 24;
  e.push(<rect key={key()} x={L} y={railY} width={W - R - L} height={railH} rx={4} fill="#F4ECDA" stroke={GOLD} strokeWidth={1} />);
  e.push(<rect key={key()} x={L} y={railY} width={5} height={railH} fill={GOLD} />);
  e.push(<text key={key()} x={L + 16} y={railY + railH / 2 + 4.5} fontFamily="Inter" fontSize={12} fontWeight={600} fill={GOLDD} letterSpacing="0.6">Allocated Power Envelope · 150 MW</text>);
  e.push(<text key={key()} x={W - R - 10} y={railY + railH / 2 + 4.5} textAnchor="end" fontFamily="Inter" fontSize={10.5} fill={MUT}>available / pre-identified</text>);

  // phase bands (short labels)
  const bands: Array<[number, number, string, number]> = [
    [0, 3, 'Sovereign Alignment', 1], [3, 6, 'Fast-Track Prep', 1],
    [6, 9, 'First Powered MW', 0], [9, 15, 'Scale-Up', 0], [15, 18, '150 MW Stabilized', 0],
  ];
  bands.forEach(([m0, m1, label, gold], i) => {
    const x0 = xM(m0), x1 = xM(m1);
    e.push(<rect key={key()} x={x0} y={T} width={x1 - x0} height={H - B - T} fill={gold ? '#F6F1E6' : i % 2 ? '#FBFAF8' : '#F4F2EB'} />);
    e.push(<text key={key()} x={(x0 + x1) / 2} y={T - 12} textAnchor="middle" fontFamily="Inter" fontSize={11} fontWeight={600} fill={gold ? GOLDD : MUT} letterSpacing="0.2">{label}</text>);
  });

  [0, 50, 100, 150].forEach((v) => {
    const y = yMW(v);
    e.push(<line key={key()} x1={L} y1={y} x2={W - R} y2={y} stroke={LINE} />);
    e.push(<text key={key()} x={L - 12} y={y + 4} textAnchor="end" fontFamily="Inter" fontSize={12.5} fill={FAINT}>{v} MW</text>);
  });

  const steps: Array<[number, number]> = [[0, 0], [6, 0], [6, 50], [9, 50], [9, 100], [15, 100], [15, 150], [18, 150]];
  const poly = steps.map(([m, v]) => `${xM(m)},${yMW(v)}`).join(' ');
  e.push(<polygon key={key()} points={`${xM(0)},${yMW(0)} ${poly} ${xM(18)},${yMW(0)}`} fill={INK} opacity={0.08} />);
  e.push(<polyline key={key()} points={poly} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />);

  ([[6, 50], [9, 100], [15, 150]] as Array<[number, number]>).forEach(([m, v]) => {
    const x = xM(m), y = yMW(v);
    e.push(<circle key={key()} cx={x} cy={y} r={5.5} fill={GOLD} stroke="#FCFBF8" strokeWidth={2} />);
    // top milestone sits on the 150-line; drop its label below the line to clear the band header.
    const ly = v === 150 ? y + 24 : y - 9;
    e.push(<text key={key()} x={x + 10} y={ly} fontFamily="Inter" fontSize={13.5} fontWeight={700} fill={GOLDD}>{usdM(v * revenuePerMw)}</text>);
  });

  [0, 3, 6, 9, 12, 15, 18].forEach((m) =>
    e.push(<text key={key()} x={xM(m)} y={H - B + 24} textAnchor="middle" fontFamily="Inter" fontSize={12.5} fill={MUT}>M{m}</text>)
  );
  e.push(<text key={key()} x={W - R + 12} y={yMW(150) + 4} fontFamily="Inter" fontSize={13} fontWeight={600} fill={INK}>150 MW</text>);
  e.push(<text key={key()} x={W - R + 12} y={yMW(150) + 21} fontFamily="Inter" fontSize={11.5} fill={MUT}>stabilized · M18</text>);

  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true">{e}</svg>;
}

/* ---------- Section 4 · Day 0 → Year 15 Value Bridge (deterministic SVG) ---------- */
function ValueBridgeSVG({
  cumulative, cashTop, total, terminal, capital, moicLabel, irrLabel,
}: {
  cumulative: Array<{ year: number; cumulativeConsortium: number }>;
  cashTop: number; total: number; terminal: number; capital: number; moicLabel: string; irrLabel: string;
}) {
  const W = 1000, H = 400, L = 86, R = 252, T = 46, B = 58;
  const maxV = total * 1.07;
  const xT = (t: number) => L + (t / 15) * (W - L - R);
  const yV = (v: number) => H - B - (v / maxV) * (H - T - B);
  const e: ReactNode[] = [];
  let k = 0;
  const key = () => `v${k++}`;

  for (let b = 0; b <= 10; b += 2) {
    const y = yV(b * 1e9);
    e.push(<line key={key()} x1={L} y1={y} x2={W - R} y2={y} stroke={LINE} />);
    e.push(<text key={key()} x={L - 14} y={y + 5} textAnchor="end" fontFamily="Inter" fontSize={13} fill={FAINT}>${b}B</text>);
  }
  [0, 5, 10, 15].forEach((t) =>
    e.push(<text key={key()} x={xT(t)} y={H - B + 26} textAnchor="middle" fontFamily="Inter" fontSize={13} fill={MUT}>Year {t}</text>)
  );

  // capital reference (Year 0)
  const cw = 24;
  e.push(<rect key={key()} x={xT(0) - cw / 2} y={yV(capital)} width={cw} height={H - B - yV(capital)} fill={INK} opacity={0.3} />);
  e.push(<text key={key()} x={xT(0)} y={yV(capital) - 12} textAnchor="middle" fontFamily="Inter" fontSize={13} fontWeight={700} fill={INK}>{usdB1(capital)}</text>);
  e.push(<text key={key()} x={xT(0)} y={yV(capital) - 28} textAnchor="middle" fontFamily="Inter" fontSize={10.5} fill={MUT}>capital · Y0</text>);

  // cumulative cash area + line
  const line = cumulative.map((p) => `${xT(p.year)},${yV(p.cumulativeConsortium)}`).join(' ');
  e.push(<polygon key={key()} points={`${xT(1)},${yV(0)} ${line} ${xT(15)},${yV(0)}`} fill={INK} opacity={0.09} />);
  e.push(<polyline key={key()} points={line} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />);

  // Year-15 climax column
  const colW = 60, cx = xT(15);
  e.push(<rect key={key()} x={cx - colW / 2} y={yV(cashTop)} width={colW} height={H - B - yV(cashTop)} fill={INK} />);
  e.push(<rect key={key()} x={cx - colW / 2} y={yV(total)} width={colW} height={yV(cashTop) - yV(total)} fill={GOLD} />);
  e.push(<rect key={key()} x={cx - colW / 2} y={yV(total)} width={colW} height={3} fill={GOLDD} />);
  e.push(<text key={key()} x={cx - colW / 2 - 12} y={(yV(total) + yV(cashTop)) / 2 - 2} textAnchor="end" fontFamily="Inter" fontSize={13.5} fontWeight={700} fill={GOLDD}>+{usdB(terminal)}</text>);
  e.push(<text key={key()} x={cx - colW / 2 - 12} y={(yV(total) + yV(cashTop)) / 2 + 15} textAnchor="end" fontFamily="Inter" fontSize={10.5} fill={MUT}>Terminal Asset Value · 22×</text>);

  // right labels — hierarchy: total (strongest) · cash
  e.push(<line key={key()} x1={cx + colW / 2} y1={yV(total)} x2={W - R + 12} y2={yV(total)} stroke={GOLDD} strokeDasharray="3 3" />);
  e.push(<text key={key()} x={W - R + 18} y={yV(total) + 2} fontFamily="Inter" fontSize={25} fontWeight={700} fill={GOLDD}>{usdB(total)}</text>);
  e.push(<text key={key()} x={W - R + 18} y={yV(total) + 21} fontFamily="Inter" fontSize={12} fontWeight={600} fill={INK} letterSpacing="0.3">Total Consortium Value</text>);
  e.push(<text key={key()} x={W - R + 18} y={yV(total) + 38} fontFamily="Inter" fontSize={12} fill={MUT}>{moicLabel} MOIC · {irrLabel} IRR</text>);
  e.push(<line key={key()} x1={cx + colW / 2} y1={yV(cashTop)} x2={W - R + 12} y2={yV(cashTop)} stroke={INK} strokeDasharray="3 3" />);
  e.push(<text key={key()} x={W - R + 18} y={yV(cashTop) + 5} fontFamily="Inter" fontSize={16} fontWeight={700} fill={INK}>{usdB(cashTop)}</text>);
  e.push(<text key={key()} x={W - R + 18} y={yV(cashTop) + 22} fontFamily="Inter" fontSize={11.5} fill={MUT}>Cumulative Cash · Y1–Y15</text>);

  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true">{e}</svg>;
}

/* ============================ REPORT ============================ */
export function QatarReport({ print = false, fontClass = '' }: { print?: boolean; fontClass?: string }) {
  const a = QATAR_ASSUMPTIONS;
  const p = computePlatform(a);
  const u = unitEconomics(a);
  const scn = SCENARIO_RESULTS;
  const by = (k: string) => scn.find((s) => s.key === k)!;
  const revenuePerMw = p.annualRevenue / a.mw;

  const gross = p.annualRevenue;
  const consPct = (p.consortiumAnnualCash / gross) * 100;
  const opPct = (p.operatingPartnerAnnualCash / gross) * 100;
  const opexPct = 100 - consPct - opPct;
  const opexUsd = gross - p.annualEbitda;

  const cashPct = (p.cumulativeCashConsortium / p.totalValueConsortium) * 100;
  const termPct = 100 - cashPct;
  const maxMultH = 198;
  const capexBarH = (u.capexPerMw / u.terminalValuePerMw) * maxMultH;

  const rootClass = [styles.report, print ? styles.printRoot : '', fontClass].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <main className={styles.deck}>

        {/* ===== 1 · SOVEREIGN THESIS ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}>
            <div className={styles.brand}>Project Earth · Hearst</div>
            <div className={styles.confidential}>Private &amp; Confidential — Investment Memorandum</div>
          </div>
          <div className={styles.coverHero}>
            <div className={`${styles.coverImg} ${styles.coverImgPhoto}`} />
            <div className={styles.coverVeil} />
            <div className={styles.coverTag}>Sovereign Investment Memorandum — 01 / 06</div>
            <div className={styles.coverCap}>
              <div className={styles.coverCe}>Sovereign AI &amp; Cloud Infrastructure · Qatar</div>
              <div className={styles.coverTitle}>Sovereign Data Infrastructure.<br /><span className={styles.it}>Global scale. Long-term institutional yield.</span></div>
            </div>
          </div>
          <p className={styles.lede}>A strategic initiative to develop a hyper-scale, AI-ready data center platform. Backed by sovereign capital, it is structured to establish direct ownership and governance control of critical national infrastructure, with the objective of generating durable, escalating cash flows. Headline figures reflect the <b>Core Contracted Case</b> — see methodology, Section 6.</p>

          <div className={styles.statrow} style={{ marginTop: 42 }}>
            <div className={styles.stat}><div className={styles.statFig}>150<span className={styles.statU}>MW</span></div><div className={styles.statLab}>Initial Capacity</div><div className={styles.statSub}>Targeted under anchor-led pre-lease; designed to scale to 300+ MW.</div></div>
            <div className={styles.stat}><div className={styles.statFig}>$1.5<span className={styles.statU}>B</span></div><div className={styles.statLab}>Deployed Capital</div><div className={styles.statSub}>Direct sovereign &amp; consortium ownership of the real assets.</div></div>
            <div className={styles.stat}><div className={styles.statFig}>$211<span className={styles.statU}>M</span></div><div className={styles.statLab}>Net Annual Cash</div><div className={styles.statSub}>Stabilized Year-1 cash attributable to the Consortium.</div></div>
            <div className={styles.stat}><div className={styles.statFig}>14.0<span className={styles.statU}>%</span></div><div className={styles.statLab}>Net Cash Yield</div><div className={styles.statSub}>Stabilized un-levered cash yield on deployed capital.</div></div>
          </div>

          <div className={`${styles.pillars} ${styles.flexcap}`}>
            <div><div className={styles.pe}>Why Qatar</div><div className={styles.pk}>Power-backed industrial policy</div><div className={styles.pv}>Among the lowest-cost sovereign power in the world (~$0.03/kWh) — the structural input behind durable AI-infrastructure economics.</div></div>
            <div><div className={styles.pe}>Why Now</div><div className={styles.pk}>Sovereign AI demand wave</div><div className={styles.pv}>Regional sovereign-scale programs prove multi-gigawatt absorption; compute capacity is now strategic national infrastructure.</div></div>
            <div><div className={styles.pe}>Strategic Position</div><div className={styles.pk}>A regional control point</div><div className={styles.pv}>Designed as a sovereign control point for AI and cloud capacity — a platform of strategic relevance, not local colocation alone.</div></div>
          </div>
        </section>

        {/* ===== 2 · THE 1 MW INCOME UNIT ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Revenue Architecture · Unit Economics</div><div className={styles.confidential}>Investment Memorandum — 02 / 06</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>The Income Unit</div><div className={styles.h2}>One megawatt is a contracted cash machine</div></div><div className={styles.pnum}>02</div></div>
          <p className={styles.lede} style={{ marginBottom: 8 }}>Each megawatt is structured as a standardized, contracted income unit. Capital converts into long-dated, escalating cash and a substantial terminal asset — then replicates 150× across the platform.</p>

          <div className={styles.chain}>
            <div className={styles.cnode}><div className={styles.cf}>{usdMdec(u.capexPerMw, 1)}</div><div className={styles.cl}>Capital<br />deployed</div></div>
            <div className={styles.carrow}>→</div>
            <div className={`${styles.cnode} ${styles.cnodeHero}`}><div className={styles.cf}>1 MW</div><div className={styles.cl}>15-yr NNN<br />contracted</div></div>
            <div className={styles.carrow}>→</div>
            <div className={styles.cnode}><div className={styles.cf}>{usdMdec(u.annualRevenuePerMw, 2)}</div><div className={styles.cl}>Annual<br />revenue</div></div>
            <div className={styles.carrow}>→</div>
            <div className={styles.cnode}><div className={styles.cf}>{usdMdec(u.annualEbitdaPerMw, 2)}</div><div className={styles.cl}>Annual<br />EBITDA</div></div>
            <div className={styles.carrow}>→</div>
            <div className={styles.cnode}><div className={styles.cf}>{usdMdec(u.terminalValuePerMw, 1)}</div><div className={styles.cl}>Terminal<br />value (22×)</div></div>
          </div>

          <div className={styles.unitSplit}>
            <div className={styles.mult}>
              <div className={styles.mbar}><div className={styles.bv}>{usdMdec(u.capexPerMw, 1)}</div><div className={styles.bar} style={{ height: capexBarH, background: 'var(--line2)' }} /><div className={styles.bl}>Capital<br />deployed</div></div>
              <div className={styles.mbar}><div className={styles.bv}>{usdMdec(u.terminalValuePerMw, 1)}</div><div className={styles.bar} style={{ height: maxMultH, background: 'var(--ink)' }} /><div className={styles.bl}>Terminal<br />value</div></div>
            </div>
            <div>
              <div className={styles.mx}>{mult(u.valueMultiple)}</div>
              <p className={styles.multCapP}>On the Core Contracted Case, each megawatt is modelled to return ~{mult(u.valueMultiple)} its build cost in terminal value — in addition to 15 years of escalating contracted cash. Stabilized EBITDA yield: ~{pct(p.stabilizedYieldProject)} (project) · ~{pct(p.stabilizedYieldConsortium)} (Consortium share).</p>
            </div>
          </div>

          <div className={styles.annual}>
            <div className={styles.h3}>Annual cash, in proportion</div>
            <div className={styles.annualSub}>Stabilized 150 MW · Year 1 · Core Contracted Case — how {usdM(gross)} of gross contract becomes Consortium cash.</div>
            <div className={styles.propbar}>
              <div className={`${styles.propseg} ${styles.segCons}`} style={{ width: `${consPct}%` }}><div className={styles.propPv}>{usdM(p.consortiumAnnualCash)}</div><div className={styles.propPl}>Consortium · 80%</div></div>
              <div className={`${styles.propseg} ${styles.segOp}`} style={{ width: `${opPct}%` }}><div className={styles.propPv}>{usdM(p.operatingPartnerAnnualCash)}</div><div className={styles.propPl}>Operating partner · 20%</div></div>
              <div className={`${styles.propseg} ${styles.segOpex}`} style={{ width: `${opexPct}%` }}><div className={styles.propPv}>{usdM(opexUsd)}</div><div className={styles.propPl}>Opex · reserves · 35%</div></div>
            </div>
          </div>

          <div className={styles.footnote}>Revenue = $225/kW/month × 150,000 kW × 12 = {usdM(gross)} gross (Core Contracted Case). A triple-net structure is intended to pass power, maintenance and property cost to tenants; the 35% deduction reflects assumed platform overhead, insurance and reserves. Figures are illustrative and un-levered; see methodology, Section 6.</div>
        </section>

        {/* ===== 3 · POWER-TO-CASH CORRIDOR ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Execution · Go-to-Market</div><div className={styles.confidential}>Investment Memorandum — 03 / 06</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>The Power-to-Cash Corridor</div><div className={styles.h2}>Qatar can compress the path from power to contracted cash</div></div><div className={styles.pnum}>03</div></div>
          <p className={styles.lede} style={{ marginBottom: 6 }}>Value comes from control of power, not construction alone. With sovereign coordination, power allocation, land, permitting and anchor demand can be aligned earlier than a merchant greenfield — compressing the critical path. Capacity is targeted to be contracted ahead of energization; each tranche activates cash on delivery, toward a {usdM(gross)} stabilized run-rate within ~18 months of first power.</p>

          <div className={styles.viz}><CorridorSVG revenuePerMw={revenuePerMw} /></div>
          <div className={styles.note} style={{ margin: '2px 0 4px' }}>Accelerated path · subject to sovereign coordination &amp; anchor-led leasing · available / allocated MW · not a merchant greenfield timeline.</div>

          <div className={`${styles.stepstrip} ${styles.flexcap}`}>
            <div><div className={styles.sq}>M0–M3</div><div className={styles.sh}>Sovereign Alignment</div><div className={styles.sd}>Power allocation, site control and anchor term-sheet move in parallel.</div></div>
            <div><div className={styles.sq}>M3–M6</div><div className={styles.sh}>Fast-Track Prep</div><div className={styles.sd}>Available or allocable MW are prepared for first powered delivery.</div></div>
            <div><div className={styles.sq}>M6–M9</div><div className={styles.sh}>First Powered MW</div><div className={styles.sd}>Initial 50 MW activates contracted revenue; run-rate begins.</div></div>
            <div><div className={styles.sq}>M9–M15</div><div className={styles.sh}>Scale-Up</div><div className={styles.sd}>Expansion to 100 MW+ as delivery and tenant demand converge.</div></div>
            <div><div className={styles.sq}>M15–M18</div><div className={styles.sh}>Stabilized Platform</div><div className={styles.sd}>150 MW platform reaches the {usdM(gross)} revenue run-rate.</div></div>
          </div>
        </section>

        {/* ===== 4 · DAY 0 → YEAR 15 VALUE CREATION ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Capital Formation · 15-Year Horizon</div><div className={styles.confidential}>Investment Memorandum — 04 / 06</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Value Creation · Consortium 80% Economics</div><div className={styles.h2}>Day 0 to Year 15 — capital that compounds into ownership</div></div><div className={styles.pnum}>04</div></div>
          <p className={styles.lede} style={{ marginBottom: 14 }}><b>{usdB1(a.fundedCapexUsd)} of funded capital compounds into {usdB(p.totalValueConsortium)} of modelled consortium value</b> — through cash distributions and terminal asset ownership over fifteen years (Core Contracted Case · 3% escalation · 22× EBITDA exit).</p>

          <div className={styles.viz}>
            <ValueBridgeSVG
              cumulative={p.cumulativeByYear}
              cashTop={p.cumulativeCashConsortium}
              total={p.totalValueConsortium}
              terminal={p.terminalValueConsortium}
              capital={a.fundedCapexUsd}
              moicLabel={mult(p.moicConsortium)}
              irrLabel={pct(p.irrConsortium)}
            />
          </div>

          <div className={styles.flexcap}>
            <div className={styles.eyebrow} style={{ marginTop: 30 }}>Scale Optionality — Illustrative</div>
            <div className={styles.ladder}>
              <div className={styles.rung}><span className={styles.rdot} /><div className={styles.rmw}>60 MW</div><div className={styles.ryl}>~10.9% yield</div><div className={styles.rd}>Entry scale. Soft costs weigh more heavily on early capacity.</div></div>
              <div className={styles.rung}><span className={styles.rdot} /><div className={styles.rmw}>150 MW</div><div className={styles.ryl}>~12.3% yield · reference</div><div className={styles.rd}>Reference platform. Soft costs diluted; full operating leverage.</div></div>
              <div className={styles.rung}><span className={styles.rdot} /><div className={styles.rmw}>300 MW</div><div className={styles.ryl}>~13.0% yield · optionality</div><div className={styles.rd}>Second-anchor dependent. Modelled as optionality, not base revenue.</div></div>
            </div>
            <div className={styles.note} style={{ marginTop: 12 }}>Scale-yield figures are illustrative of capital efficiency at scale and are not a forecast. The 300 MW leg is contingent on a second anchor and dedicated power; see conditions precedent, Section 6.</div>
          </div>
        </section>

        {/* ===== 5 · CAPITAL STRUCTURE & RETURNS ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Capital Structure · Returns Distribution</div><div className={styles.confidential}>Investment Memorandum — 05 / 06</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Ownership Economics</div><div className={styles.h2}>Funds the capital. Owns the assets. Holds 80% of economics.</div></div><div className={styles.pnum}>05</div></div>

          <div className={styles.own}>
            <div className={styles.o}><div className={styles.of}>100%</div><div className={styles.ol}><b>of project capital</b> funded by the Sovereign Consortium</div></div>
            <div className={styles.o}><div className={styles.of}>100%</div><div className={styles.ol}><b>of real assets &amp; power rights</b> owned and governed by the Consortium</div></div>
            <div className={styles.o}><div className={styles.of}>80%</div><div className={styles.ol}><b>of cash economics</b> to the Consortium; 20% to the Operating Partner</div></div>
          </div>

          <div className={styles.build}>
            <div className={styles.blabels}><span>Capital invested {usdB1(a.fundedCapexUsd)}</span><span>15-year value build · Consortium · Core Contracted Case</span></div>
            <div className={styles.buildbar}>
              <div className={`${styles.bs} ${styles.bsCash}`} style={{ width: `${cashPct}%` }}><div className={styles.bsF}>{usdB(p.cumulativeCashConsortium)}</div><div className={styles.bsN}>Cumulative cash · Y1–Y15</div></div>
              <div className={`${styles.bs} ${styles.bsTerm}`} style={{ width: `${termPct}%` }}><div className={styles.bsF}>{usdB(p.terminalValueConsortium)}</div><div className={styles.bsN}>Terminal asset value · Y15</div></div>
            </div>
            <div className={styles.bend}>
              <div><div className={styles.beV}>{usdB(p.totalValueConsortium)}</div><div className={styles.beL}>Total value created</div></div>
              <div><div className={styles.beV}>{mult(p.moicConsortium)}</div><div className={styles.beL}>MOIC (15-yr)</div></div>
              <div><div className={styles.beV}>{pct(p.irrConsortium)}</div><div className={styles.beL}>Target IRR</div></div>
            </div>
          </div>

          <table className={styles.ftable}>
            <thead><tr><th>Metric</th><th>Total Project</th><th className={styles.thHl}>Consortium</th><th>Operating Partner</th></tr></thead>
            <tbody>
              <tr><td>Funded capex (initial 150 MW)</td><td>{usdB(a.fundedCapexUsd)}</td><td className={styles.tdHl}>{usdB(a.fundedCapexUsd)}</td><td>$0</td></tr>
              <tr><td>Economic distribution</td><td>100%</td><td className={styles.tdHl}>80%</td><td>20%</td></tr>
              <tr><td>Stabilized EBITDA (Year 1)</td><td>{usdM(p.annualEbitda)}</td><td className={styles.tdHl}>{usdM(p.consortiumAnnualCash)}</td><td>{usdM(p.operatingPartnerAnnualCash)}</td></tr>
              <tr><td>Cumulative cash (Y1–Y15)</td><td>{usdB(p.cumulativeCashTotal)}</td><td className={styles.tdHl}>{usdB(p.cumulativeCashConsortium)}</td><td>{usdB(p.cumulativeCashOperating)}</td></tr>
              <tr><td>Terminal value (Year 15 · 22×)</td><td>{usdB(p.terminalValueTotal)}</td><td className={styles.tdHl}>{usdB(p.terminalValueConsortium)}</td><td>{usdB(p.terminalValueOperating)}</td></tr>
              <tr className={styles.trStrong}><td>Total value created</td><td>{usdB(p.totalValueTotal)}</td><td className={styles.tdHl}>{usdB(p.totalValueConsortium)}</td><td>{usdB(p.totalValueOperating)}</td></tr>
              <tr><td>MOIC · Target IRR</td><td>{mult(p.moicTotal)} · {pct(p.irrTotal)}</td><td className={styles.tdHl}>{mult(p.moicConsortium)} · {pct(p.irrConsortium)}</td><td>—</td></tr>
            </tbody>
          </table>

          <div className={styles.footnote}>Illustrative distribution; all figures un-levered and independently re-computed from first principles. Figures represent the Core Contracted Case; the lease-up J-curve (Section 3) is intended to be mitigated through anchor-led pre-leasing. A downside range and conditions precedent are set out in Section 6.</div>
        </section>

        {/* ===== 6 · MARKET EVIDENCE & UNDERWRITING DISCIPLINE ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Market Evidence · Underwriting Discipline</div><div className={styles.confidential}>Investment Memorandum — 06 / 06</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Market Evidence &amp; Underwriting Discipline</div><div className={styles.h2}>Anchored to today's market — underwritten with discipline</div></div><div className={styles.pnum}>06</div></div>
          <p className={styles.lede} style={{ marginBottom: 30 }}>AI has structurally re-priced data center infrastructure: power is the scarce asset, and tenants are securing capacity years in advance at record rents. The Core Contracted Case is anchored to live 2025 comparables and stress-tested. It remains a case, subject to the conditions precedent below; it is not a forecast or guarantee.</p>

          <div className={styles.evrow}>
            <div className={styles.ev}><div className={styles.evF}>+30%</div><div className={styles.evL}>Wholesale rent · YoY</div><div className={styles.evD}>Ashburn breached $215/kW/mo in 2025; AI-ready space at a further premium.</div></div>
            <div className={styles.ev}><div className={styles.evF}>1.4%</div><div className={styles.evL}>Record-low vacancy</div><div className={styles.evD}>Primary markets effectively sold out (CBRE H2-2025).</div></div>
            <div className={styles.ev}><div className={styles.evF}>$24B</div><div className={styles.evL}>Sovereign AI capital</div><div className={styles.evD}>Blackstone–AirTrunk at ~20–23× EBITDA; KSA &amp; UAE prove sovereign-scale absorption.</div></div>
            <div className={styles.ev}><div className={styles.evF}>$0.03</div><div className={styles.evL}>GCC power · /kWh</div><div className={styles.evD}>A fraction of US/EU cost — the structural margin edge.</div></div>
          </div>

          <table className={styles.matrix}>
            <thead><tr><th style={{ width: '26%' }}>Key assumption</th><th style={{ width: '14%' }}>Input</th><th style={{ width: '38%' }}>Market reference (2025)</th><th style={{ width: '22%' }}>Position</th></tr></thead>
            <tbody>
              <tr><td>Lease rate</td><td className={styles.mIn}>$225/kW/mo</td><td>Ashburn &gt;$215; MEEZA Qatar clears $190–285</td><td><span className={`${styles.status} ${styles.stSupport}`}>Benchmark support</span></td></tr>
              <tr><td>Build capex (facility-only)</td><td className={styles.mIn}>$10.0M/MW</td><td>GCC land/labor arbitrage; tenant owns the GPUs</td><td><span className={`${styles.status} ${styles.stPosition}`}>Underwriting position</span></td></tr>
              <tr><td>EBITDA margin (NNN)</td><td className={styles.mIn}>65%</td><td>Triple-net assets run 78–90% — leaves cushion</td><td><span className={`${styles.status} ${styles.stPosition}`}>Conservative</span></td></tr>
              <tr><td>Exit multiple</td><td className={styles.mIn}>22×</td><td>AirTrunk ~20–23× (Blackstone, 2024)</td><td><span className={`${styles.status} ${styles.stSupport}`}>Benchmark support</span></td></tr>
              <tr><td>Pre-leased occupancy</td><td className={styles.mIn}>Day-1</td><td>Anchor counterparty &amp; lease execution required</td><td><span className={`${styles.status} ${styles.stCp}`}>Condition precedent</span></td></tr>
              <tr><td>Dedicated power / PPA</td><td className={styles.mIn}>150 MW</td><td>QatarEnergy / Kahramaa allocation required</td><td><span className={`${styles.status} ${styles.stCp}`}>Condition precedent</span></td></tr>
            </tbody>
          </table>

          <div className={styles.sectlabel}>Scenario Range — Underwriting Discipline</div>
          <div className={styles.sublabel}>Consortium economics across a downside, a conservative base, and the reference case. Stress columns evidence the floor, not the expected outcome. The Core Contracted Case assumes signed anchor offtake, secured power and phased delivery (see conditions precedent below).</div>
          <table className={styles.scn}>
            <thead><tr><th>Driver</th><th>Downside Case</th><th>Base Case</th><th className={styles.scnInvH}>Core Contracted Case</th></tr></thead>
            <tbody>
              <tr><td>Lease rate ($/kW/mo)</td><td>${by('downside').assumptions.leaseRatePerKwMonth}</td><td>${by('base').assumptions.leaseRatePerKwMonth}</td><td className={styles.scnInv}>${by('core').assumptions.leaseRatePerKwMonth}</td></tr>
              <tr><td>Build capex / MW</td><td>{usdMdec(by('downside').assumptions.fundedCapexUsd / a.mw, 1)}</td><td>{usdMdec(by('base').assumptions.fundedCapexUsd / a.mw, 1)}</td><td className={styles.scnInv}>{usdMdec(by('core').assumptions.fundedCapexUsd / a.mw, 1)}</td></tr>
              <tr><td>Exit multiple</td><td>{by('downside').assumptions.exitMultiple}×</td><td>{by('base').assumptions.exitMultiple}×</td><td className={styles.scnInv}>{by('core').assumptions.exitMultiple}×</td></tr>
              <tr className={styles.scnRet}><td>Consortium IRR</td><td>{pct(by('downside').canonical.irr)}</td><td>{pct(by('base').canonical.irr)}</td><td className={styles.scnInv}>{pct(by('core').canonical.irr)}</td></tr>
              <tr className={styles.scnRet}><td>Consortium MOIC (15-yr)</td><td>{mult(by('downside').canonical.moic)}</td><td>{mult(by('base').canonical.moic)}</td><td className={styles.scnInv}>{mult(by('core').canonical.moic)}</td></tr>
            </tbody>
          </table>

          <div className={styles.sectlabel}>Conditions Precedent &amp; Methodology</div>
          <ul className={styles.cpList}>
            <li>Headline economics represent the <b>Core Contracted Case</b> and are illustrative — not a forecast, valuation, or guarantee of returns.</li>
            <li>Subject to execution of <b>anchor lease(s)</b> with creditworthy counterparties on the modelled terms and duration.</li>
            <li>Subject to a <b>dedicated power allocation / PPA</b> (QatarEnergy / Kahramaa) sufficient for the 150 MW load.</li>
            <li>Subject to <b>site control, permitting, engineering, financing and full counterparty due diligence</b>.</li>
            <li>Benchmarks reflect third-party 2025 data; GCC comparables are limited and indicative.</li>
            <li>The 300 MW expansion is contingent on a second anchor and additional power, and is modelled as optionality.</li>
          </ul>

          <div className={styles.footnote}>Sources: CBRE North America Data Center Trends H2-2025; Cushman &amp; Wakefield 2025 Power &amp; Lease Pricing; Blackstone–AirTrunk acquisition (2024, ~20–23× EV/EBITDA); MEEZA Qatar hyperscaler lease (Oct-2025). Returns independently computed (15-yr hold, 80% Consortium economics); stress columns apply a phased lease-up ramp.</div>
        </section>

      </main>

      <footer className={styles.legal}>
        <div className={styles.legalBox}>
          <h4>Important Notice — Strictly Private &amp; Confidential</h4>
          <p>This document has been prepared by Hearst Corporation and its affiliates (the "Promoter") solely for the information of the intended recipient and for discussion purposes only. It is strictly private and confidential and may not be reproduced, distributed or disclosed without the Promoter's prior written consent.</p>
          <p>This document does not constitute, and shall not be construed as, an offer to sell or a solicitation of an offer to buy any security, interest or financial instrument, nor investment, legal, tax or financial advice, nor a prospectus or offering document. Any potential transaction would be made only pursuant to definitive legal documentation and subject to the conditions precedent set out herein.</p>
          <p>The figures and projections herein are illustrative, reflect the Core Contracted Case, and rest on assumptions believed reasonable but inherently uncertain. They are forward-looking and subject to significant business, market, regulatory, power-availability, counterparty and execution risks; actual results may differ materially. No representation or warranty, express or implied, is given as to the accuracy or completeness of the information. Recipients should conduct their own independent due diligence. Past or comparable transactions are not indicative of future results.</p>
        </div>
      </footer>
    </div>
  );
}
