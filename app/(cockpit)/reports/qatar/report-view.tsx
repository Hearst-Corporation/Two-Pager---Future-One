import type { ReactNode } from 'react';
import styles from './qatar-report.module.css';
import { QATAR_ASSUMPTIONS, PROPRIETARY_COMPUTE_RESERVE } from '@/lib/investment-model/qatar/assumptions';
import {
  computePlatform,
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
  const W = 1000, H = 340, L = 78, R = 152, T = 80, B = 60;
  const xM = (m: number) => L + (m / 18) * (W - L - R);
  const yMW = (v: number) => H - B - (v / 150) * (H - T - B);
  const e: ReactNode[] = [];
  let k = 0;
  const key = () => `c${k++}`;

  const railY = 24, railH = 28;
  e.push(<rect key={key()} x={L} y={railY} width={W - R - L} height={railH} fill="#FDFCF9" stroke={LINE} strokeWidth={1} />);
  e.push(<rect key={key()} x={L} y={railY} width={6} height={railH} fill={GOLD} />);
  e.push(<text key={key()} x={L + 20} y={railY + railH / 2 + 5} fontFamily="Inter" fontSize={13} fontWeight={600} fill={GOLDD} letterSpacing="0.8">ALLOCATED POWER ENVELOPE · 150 MW</text>);
  e.push(<text key={key()} x={W - R - 14} y={railY + railH / 2 + 4.5} textAnchor="end" fontFamily="Inter" fontSize={11.5} fill={MUT}>available / pre-identified</text>);

  const bands: Array<[number, number, string, number]> = [
    [0, 3, 'Sovereign Alignment', 1], [3, 6, 'Fast-Track Prep', 1],
    [6, 9, 'First Powered MW', 0], [9, 15, 'Scale-Up', 0], [15, 18, '150 MW Stabilized', 0],
  ];
  bands.forEach(([m0, m1, label, gold], i) => {
    const x0 = xM(m0), x1 = xM(m1);
    e.push(<rect key={key()} x={x0} y={T} width={x1 - x0} height={H - B - T} fill={gold ? '#FBF9F4' : i % 2 ? '#FDFCF9' : 'transparent'} />);
    e.push(<text key={key()} x={(x0 + x1) / 2} y={T - 14} textAnchor="middle" fontFamily="Inter" fontSize={11.5} fontWeight={600} fill={gold ? GOLDD : MUT} letterSpacing="0.3">{label}</text>);
  });

  [0, 50, 100, 150].forEach((v) => {
    const y = yMW(v);
    e.push(<line key={key()} x1={L} y1={y} x2={W - R} y2={y} stroke={LINE} strokeWidth={v === 0 ? 2 : 1} />);
    e.push(<text key={key()} x={L - 14} y={y + 4} textAnchor="end" fontFamily="Inter" fontSize={13} fill={FAINT}>{v} MW</text>);
  });

  const steps: Array<[number, number]> = [[0, 0], [6, 0], [6, 50], [9, 50], [9, 100], [15, 100], [15, 150], [18, 150]];
  const poly = steps.map(([m, v]) => `${xM(m)},${yMW(v)}`).join(' ');
  e.push(<polygon key={key()} points={`${xM(0)},${yMW(0)} ${poly} ${xM(18)},${yMW(0)}`} fill={INK} opacity={0.06} />);
  e.push(<polyline key={key()} points={poly} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />);

  ([[6, 50], [9, 100], [15, 150]] as Array<[number, number]>).forEach(([m, v]) => {
    const x = xM(m), y = yMW(v);
    e.push(<circle key={key()} cx={x} cy={y} r={6} fill={GOLD} stroke="#FCFBF8" strokeWidth={2} />);
    const ly = v === 150 ? y + 26 : y - 12;
    e.push(<text key={key()} x={x + 12} y={ly} fontFamily="Inter" fontSize={14.5} fontWeight={700} fill={GOLDD}>{usdM(v * revenuePerMw)}</text>);
  });

  [0, 3, 6, 9, 12, 15, 18].forEach((m) =>
    e.push(<text key={key()} x={xM(m)} y={H - B + 26} textAnchor="middle" fontFamily="Inter" fontSize={13} fill={MUT}>M{m}</text>)
  );
  e.push(<text key={key()} x={W - R + 14} y={yMW(150) + 5} fontFamily="Inter" fontSize={14} fontWeight={700} fill={INK}>150 MW</text>);
  e.push(<text key={key()} x={W - R + 14} y={yMW(150) + 24} fontFamily="Inter" fontSize={12} fill={MUT}>stabilized · M18</text>);

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

  const cw = 32;
  e.push(<rect key={key()} x={xT(0) - cw / 2} y={yV(capital)} width={cw} height={H - B - yV(capital)} fill={INK} opacity={0.1} />);
  e.push(<text key={key()} x={xT(0)} y={yV(capital) - 14} textAnchor="middle" fontFamily="Inter" fontSize={14} fontWeight={700} fill={INK}>{usdB1(capital)}</text>);
  e.push(<text key={key()} x={xT(0)} y={yV(capital) - 30} textAnchor="middle" fontFamily="Inter" fontSize={11} fill={MUT}>capital · Y0</text>);

  const line = cumulative.map((p) => `${xT(p.year)},${yV(p.cumulativeConsortium)}`).join(' ');
  e.push(<polygon key={key()} points={`${xT(1)},${yV(0)} ${line} ${xT(15)},${yV(0)}`} fill={INK} opacity={0.06} />);
  e.push(<polyline key={key()} points={line} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />);

  const colW = 72, cx = xT(15);
  e.push(<rect key={key()} x={cx - colW / 2} y={yV(cashTop)} width={colW} height={H - B - yV(cashTop)} fill={INK} />);
  e.push(<rect key={key()} x={cx - colW / 2} y={yV(total)} width={colW} height={yV(cashTop) - yV(total)} fill={GOLD} />);
  e.push(<rect key={key()} x={cx - colW / 2} y={yV(total)} width={colW} height={4} fill={GOLDD} />);
  e.push(<text key={key()} x={cx - colW / 2 - 16} y={(yV(total) + yV(cashTop)) / 2 - 2} textAnchor="end" fontFamily="Inter" fontSize={14.5} fontWeight={700} fill={GOLDD}>+{usdB(terminal)}</text>);
  e.push(<text key={key()} x={cx - colW / 2 - 16} y={(yV(total) + yV(cashTop)) / 2 + 16} textAnchor="end" fontFamily="Inter" fontSize={11} fill={MUT}>Terminal Asset Value · 22×</text>);

  e.push(<line key={key()} x1={cx + colW / 2} y1={yV(total)} x2={W - R + 12} y2={yV(total)} stroke={GOLDD} strokeDasharray="3 3" />);
  e.push(<text key={key()} x={W - R + 20} y={yV(total) + 4} fontFamily="Inter" fontSize={28} fontWeight={700} fill={GOLDD}>{usdB(total)}</text>);
  e.push(<text key={key()} x={W - R + 20} y={yV(total) + 24} fontFamily="Inter" fontSize={13} fontWeight={600} fill={INK} letterSpacing="0.3">Total Consortium Value</text>);
  e.push(<text key={key()} x={W - R + 20} y={yV(total) + 42} fontFamily="Inter" fontSize={12.5} fill={MUT}>{moicLabel} MOIC · {irrLabel} IRR</text>);
  e.push(<line key={key()} x1={cx + colW / 2} y1={yV(cashTop)} x2={W - R + 12} y2={yV(cashTop)} stroke={INK} strokeDasharray="3 3" />);
  e.push(<text key={key()} x={W - R + 20} y={yV(cashTop) + 5} fontFamily="Inter" fontSize={18} fontWeight={700} fill={INK}>{usdB(cashTop)}</text>);
  e.push(<text key={key()} x={W - R + 20} y={yV(cashTop) + 24} fontFamily="Inter" fontSize={12} fill={MUT}>Cumulative Cash · Y1–Y15</text>);

  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true">{e}</svg>;
}

/* ---------- Section 8 · Valuation Uplift value-stack (deterministic SVG) ---------- */
function UpliftSVG({ coreLabel }: { coreLabel: string }) {
  const W = 1000, H = 460, L = 40, R = 40, T = 60, B = 90;
  const e: ReactNode[] = [];
  let k = 0;
  const key = () => `u${k++}`;

  const steps = [
    { tag: 'Core', head: 'Deep Data Center', ev: coreLabel, val: 10.9, gold: false },
    { tag: '+3 MW', head: 'Proof · Model Factory', ev: '+$0.3–0.8B', val: 0.8, gold: true },
    { tag: '+5 MW', head: 'Platform Seed', ev: '+$0.6–1.6B', val: 1.6, gold: true },
    { tag: '+10 MW', head: 'LLM Platform', ev: '+$1.2–3.0B', val: 3.0, gold: true },
    { tag: '+20 MW', head: 'Institutional Option', ev: '+$2.0–5.0B', val: 5.0, gold: true },
  ];

  const plotW = W - L - R;
  const plotH = H - T - B;
  const baseY = H - B;
  
  // We want a bridge chart.
  // Core is a massive block. The others stack up.
  const totalVal = 10.9 + 0.8 + 1.6 + 3.0 + 5.0;
  const scaleY = plotH / totalVal;
  
  const colW = 140;
  const gap = (plotW - (steps.length * colW)) / (steps.length - 1);

  let currentY = baseY;

  // baseline rule
  e.push(<line key={key()} x1={L} y1={baseY} x2={W - R} y2={baseY} stroke={LINE} strokeWidth={2} />);

  steps.forEach((s, i) => {
    const x = L + i * (colW + gap);
    const barH = Math.max(s.val * scaleY, 4); // minimum height
    
    let y: number;
    if (i === 0) {
      // Core sits on the baseline
      y = baseY - barH;
      currentY = y;
      
      e.push(<rect key={key()} x={x} y={y} width={colW} height={barH} fill={INK} />);
      // Subtle top highlight
      e.push(<rect key={key()} x={x} y={y} width={colW} height={3} fill="rgba(255,255,255,0.15)" />);
      
      e.push(<text key={key()} x={x + colW / 2} y={y - 24} textAnchor="middle" fontFamily="Inter" fontSize={24} fontWeight={700} fill={INK}>{s.ev}</text>);
      e.push(<text key={key()} x={x + colW / 2} y={y + 34} textAnchor="middle" fontFamily="Inter" fontSize={12} fontWeight={600} fill="#FBFAF6" letterSpacing="1">150 MW FLOOR</text>);
    } else {
      // Upside steps float above the previous level
      y = currentY - barH;
      
      // Connector line from previous step
      const prevX = L + (i - 1) * (colW + gap) + colW;
      e.push(<line key={key()} x1={prevX} y1={currentY} x2={x} y2={currentY} stroke={LINE} strokeDasharray="4 4" strokeWidth={1.5} />);
      
      // The block
      const isOption = i === 4;
      e.push(<rect key={key()} x={x} y={y} width={colW} height={barH} fill={isOption ? 'transparent' : '#FDFCF9'} stroke={isOption ? MUT : GOLD} strokeWidth={isOption ? 1 : 1.5} strokeDasharray={isOption ? '4 4' : 'none'} />);
      if (!isOption) {
        e.push(<rect key={key()} x={x} y={y} width={colW} height={4} fill={GOLDD} />);
      } else {
        e.push(<rect key={key()} x={x} y={y} width={colW} height={2} fill={MUT} />);
      }
      
      // Drop line to baseline
      e.push(<line key={key()} x1={x + colW/2} y1={y + barH} x2={x + colW/2} y2={baseY} stroke={LINE} strokeDasharray="2 4" strokeWidth={1} />);
      
      e.push(<text key={key()} x={x + colW / 2} y={y - 20} textAnchor="middle" fontFamily="Inter" fontSize={17} fontWeight={700} fill={isOption ? MUT : GOLDD}>{s.ev}</text>);
      
      currentY = y;
    }

    // Labels below baseline
    e.push(<text key={key()} x={x + colW / 2} y={baseY + 30} textAnchor="middle" fontFamily="Inter" fontSize={14.5} fontWeight={600} fill={INK}>{s.head}</text>);
    e.push(<text key={key()} x={x + colW / 2} y={baseY + 50} textAnchor="middle" fontFamily="Inter" fontSize={12.5} fontWeight={500} fill={MUT} letterSpacing="0.5">{s.tag}</text>);
  });

  // Inflection marker for 10 MW
  const infX = L + 3 * (colW + gap) + colW / 2;
  const infY = baseY - (steps[0].val + steps[1].val + steps[2].val + steps[3].val) * scaleY;
  e.push(<text key={key()} x={infX} y={T - 20} textAnchor="middle" fontFamily="Inter" fontSize={11} fontWeight={700} fill={GOLDD} letterSpacing="1.5">STRATEGIC INFLECTION</text>);
  e.push(<line key={key()} x1={infX} y1={T - 10} x2={infX} y2={infY - 40} stroke={GOLDD} strokeWidth={1} />);
  e.push(<polygon key={key()} points={`${infX - 4},${infY - 44} ${infX + 4},${infY - 44} ${infX},${infY - 36}`} fill={GOLDD} />);

  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true">{e}</svg>;
}

/* ============================ REPORT ============================ */
export function QatarReport({ print = false, fontClass = '' }: { print?: boolean; fontClass?: string }) {
  const a = QATAR_ASSUMPTIONS;
  const p = computePlatform(a);
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

  const rootClass = [styles.report, print ? styles.printRoot : '', fontClass].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <main className={styles.deck}>

        {/* ===== 1 · SOVEREIGN AI INFRASTRUCTURE THESIS ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}>
            <div className={styles.brand}>Project Earth · Hearst</div>
            <div className={styles.confidential}>Private &amp; Confidential — Strategic Sovereign Memorandum</div>
          </div>
          <div className={styles.coverHero}>
            <div className={`${styles.coverImg} ${styles.coverImgPhoto}`} />
            <div className={styles.coverVeil} />
            <div className={styles.coverTag}>Sovereign Investment Memorandum — 01 / 09</div>
            <div className={styles.coverCap}>
              <div className={styles.coverCe}>Sovereign AI Infrastructure Stack · Qatar</div>
              <div className={styles.coverTitle}>Sovereign Intelligence.<br /><span className={styles.it}>From hardened power to proprietary compute.</span></div>
            </div>
          </div>
          <p className={styles.lede}>Qatar should not only host AI infrastructure; it should own the sovereign compute and model layer that powers it. This initiative develops a hyper-scale, AI-ready data center platform backed by sovereign capital. It establishes direct ownership of critical national infrastructure, generating durable cash flows while securing the nation's algorithmic independence.</p>

          <div className={`${styles.pillars} ${styles.flexcap}`}>
            <div><div className={styles.pe}>Layer 1</div><div className={styles.pk}>Deep Data Center</div><div className={styles.pv}>The 150 MW Core Contracted Case. Power-backed industrial policy delivering long-term institutional yield.</div></div>
            <div><div className={styles.pe}>Layer 2</div><div className={styles.pk}>Sovereign Resilience</div><div className={styles.pv}>Digital Continuity for national-priority workloads. Hardened infrastructure and EMP-shielded optionality.</div></div>
            <div><div className={styles.pe}>Layer 3</div><div className={styles.pk}>Proprietary Compute</div><div className={styles.pv}>A dedicated GPU reserve to train, fine-tune, and serve sovereign models—creating asymmetric equity upside.</div></div>
          </div>

          <div className={styles.stack}>
            {['Energy', 'Deep Data Center', 'Sovereign Resilience', 'Proprietary Compute', 'Intelligence Layer'].map((s, i, arr) => (
              <span key={s} className={styles.stackItem}>
                <span className={i === arr.length - 1 ? styles.stackTop : undefined}>{s}</span>
                {i < arr.length - 1 && <span className={styles.stackSep}>/</span>}
              </span>
            ))}
          </div>
        </section>

        {/* ===== 2 · CORE CONTRACTED CASE ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Infrastructure Yield · Bankable Foundation</div><div className={styles.confidential}>Investment Memorandum — 02 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Core Contracted Case</div><div className={styles.h2}>The infrastructure yield underwrites the asset</div></div><div className={styles.pnum}>02</div></div>
          <p className={styles.lede} style={{ marginBottom: 42 }}>The Core Contracted Case is the bankable foundation. It isolates the highly predictable, contracted cash flows of the 150 MW Deep Data Center from the equity upside of the intelligence layer. Every leased megawatt creates yield.</p>

          <div className={styles.statrow}>
            <div className={styles.stat}><div className={styles.statFig}>150<span className={styles.statU}>MW</span></div><div className={styles.statLab}>Initial Capacity</div><div className={styles.statSub}>Targeted under anchor-led pre-lease.</div></div>
            <div className={styles.stat}><div className={styles.statFig}>$1.5<span className={styles.statU}>B</span></div><div className={styles.statLab}>Deployed Capital</div><div className={styles.statSub}>Direct sovereign ownership.</div></div>
            <div className={styles.stat}><div className={styles.statFig}>$211<span className={styles.statU}>M</span></div><div className={styles.statLab}>Net Annual Cash</div><div className={styles.statSub}>Stabilized Year-1 cash (Consortium).</div></div>
            <div className={styles.stat}><div className={styles.statFig}>14.0<span className={styles.statU}>%</span></div><div className={styles.statLab}>Net Cash Yield</div><div className={styles.statSub}>Stabilized un-levered cash yield.</div></div>
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
        </section>

        {/* ===== 3 · QATAR POWER-TO-CASH CORRIDOR ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Execution · Go-to-Market</div><div className={styles.confidential}>Investment Memorandum — 03 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>The Power-to-Cash Corridor</div><div className={styles.h2}>Qatar can compress the path from power to contracted cash</div></div><div className={styles.pnum}>03</div></div>
          <p className={styles.lede} style={{ marginBottom: 6 }}>Value comes from control of power, not construction alone. With sovereign coordination, power allocation, land, permitting and anchor demand can be aligned earlier than a merchant greenfield — compressing the critical path. Capacity is targeted to be contracted ahead of energization.</p>

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
          <div className={styles.topbar}><div className={styles.brand}>Capital Formation · 15-Year Horizon</div><div className={styles.confidential}>Investment Memorandum — 04 / 09</div></div>
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

          <div className={styles.build} style={{ marginTop: 40 }}>
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
        </section>

        {/* ===== 5 · PROPRIETARY COMPUTE RESERVE ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Strategic Upside · Equity Creation</div><div className={styles.confidential}>Investment Memorandum — 05 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Proprietary LLM Reserve</div><div className={styles.h2}>Lease a megawatt, you own a cash flow. Retain a megawatt, you own a proprietary LLM.</div></div><div className={styles.pnum}>05</div></div>
          <p className={styles.lede} style={{ marginBottom: 36 }}>A dedicated fraction of the platform's capacity is reserved for proprietary compute. This capacity is not leased to third parties; it is retained by the platform to train, fine-tune, and serve a proprietary Hearst LLM on open-weight foundations. This creates asymmetric equity upside beyond the infrastructure yield.</p>

          <div className={styles.ladderList}>
            {PROPRIETARY_COMPUTE_RESERVE.map((tier, i) => {
              const isOption = i === 3; // 20 MW is the 4th item
              const isInflection = i === 2; // 10 MW
              return (
                <div key={i} className={`${styles.ladderRow} ${isOption ? styles.ladderOption : ''}`}>
                  <div className={styles.lrMw}>
                    <div className={styles.lrMwVal}>{tier.mw} MW</div>
                    {isOption && <div className={styles.lrMwTag}>OPTION</div>}
                    {isInflection && <div className={styles.lrMwTag}>INFLECTION</div>}
                  </div>
                  <div className={styles.lrContent}>
                    <div className={styles.lrLabel}>{tier.label}</div>
                    <div className={styles.lrDesc}>{tier.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.rationale}>
            <div className={styles.ratItem}><span className={styles.ratK}>3 MW first.</span> The smallest pocket that is a real capability — a fine-tuning factory for the proprietary Hearst LLM.</div>
            <div className={styles.ratItem}><span className={styles.ratK}>5 MW unlocks scale.</span> Sovereign serving at meaningful scale; cloud and managed-services revenue begin to blend with infrastructure yield.</div>
            <div className={styles.ratItem}><span className={styles.ratK}>10 MW is the inflection.</span> Large fine-tunes and continued pretraining support a genuine proprietary LLM platform narrative.</div>
            <div className={styles.ratItem}><span className={styles.ratK}>20 MW is an option.</span> A sovereign expansion option that triggers on an anchor contract — never an initial commitment.</div>
            <div className={styles.ratItem}><span className={styles.ratK}>Capital is ring-fenced.</span> GPU capex sits in a separate compute sub-vehicle, so its depreciation never touches the contracted infrastructure yield.</div>
          </div>

          <div className={styles.flexcap}>
            <div className={styles.note}>The Core Contracted Case underwrites the asset. The Proprietary Compute Reserve creates the equity upside. It sits outside the Core Contracted Case and is not reflected in headline yield, MOIC or IRR until separately capitalized and contracted.</div>
          </div>
        </section>

        {/* ===== 6 · HEARST AI INTELLIGENCE LAYER ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Operating Platform · Sovereign Intelligence</div><div className={styles.confidential}>Investment Memorandum — 06 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Hearst AI Intelligence Layer</div><div className={styles.h2}>Converting reserved megawatts into proprietary model equity</div></div><div className={styles.pnum}>06</div></div>
          <p className={styles.lede} style={{ marginBottom: 42 }}>Hearst AI acts as the operating intelligence layer. It is not a vendor; it is the platform's proprietary engine for sovereign model serving, data-resident inference, and continued pretraining on national-priority data.</p>

          <div className={styles.capList}>
            <div className={styles.capRow}>
              <div className={styles.capNum}>01.</div>
              <div className={styles.capTitle}>Platform-Controlled Compute</div>
              <div className={styles.capDesc}>Direct management of the GPU compute infrastructure. From single-GPU validation to multi-megawatt proprietary clusters, optimized for sovereign workloads.</div>
            </div>
            <div className={styles.capRow}>
              <div className={styles.capNum}>02.</div>
              <div className={styles.capTitle}>Sovereign Model Serving</div>
              <div className={styles.capDesc}>Fine-tuning and continued pretraining of open-weight foundations (Llama, DeepSeek, Qwen) on proprietary national data, ensuring absolute data residency.</div>
            </div>
            <div className={styles.capRow}>
              <div className={styles.capNum}>03.</div>
              <div className={styles.capTitle}>AI Cloud &amp; Products</div>
              <div className={styles.capDesc}>A full suite of developer tools, chat interfaces, and managed AI services deployed securely within the sovereign boundary.</div>
            </div>
            <div className={styles.capRow}>
              <div className={styles.capNum}>04.</div>
              <div className={styles.capTitle}>Forward-Deployed Engineering</div>
              <div className={styles.capDesc}>Senior engineering talent embedded locally to accelerate national AI adoption, perform custom development, and conduct applied research.</div>
            </div>
          </div>
        </section>

        {/* ===== 7 · SOVEREIGN RESILIENCE LAYER ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Digital Continuity · Hardened Infrastructure</div><div className={styles.confidential}>Investment Memorandum — 07 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Sovereign Resilience Layer</div><div className={styles.h2}>The platform is not just performant; it is sovereign-grade</div></div><div className={styles.pnum}>07</div></div>
          <p className={styles.lede} style={{ marginBottom: 42 }}>To host national-priority workloads and sovereign intelligence, the physical infrastructure must guarantee Digital Continuity. The Bastion layer provides hardened design optionality for strategic facilities.</p>

          <div className={styles.crossSec}>
            <div className={styles.crossWord}>CONTINUITY</div>
            <div className={styles.crossRows}>
              <div className={styles.crossRow}>
                <div className={styles.crossK}>National-Priority Workloads</div>
                <div className={styles.crossV}>Designed to ensure uninterrupted operation for government and critical enterprise data, sustaining service through severe disruption.</div>
              </div>
              <div className={styles.crossRow}>
                <div className={styles.crossK}>Hardened Infrastructure</div>
                <div className={styles.crossV}>Advanced physical and electromagnetic isolation (EMP-shielded optionality) exceeding standard commercial Tier IV requirements.</div>
              </div>
              <div className={styles.crossRow}>
                <div className={styles.crossK}>Active Monitoring</div>
                <div className={styles.crossV}>Integrated advisory and situational-intelligence subscriptions, giving sovereign stakeholders complete operational awareness.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 8 · VALUATION UPLIFT ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Financial Architecture · Asymmetric Upside</div><div className={styles.confidential}>Investment Memorandum — 08 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Valuation Uplift</div><div className={styles.h2}>Downside protection with asymmetric equity upside</div></div><div className={styles.pnum}>08</div></div>
          <p className={styles.lede} style={{ marginBottom: 42 }}>The financial architecture separates the predictable infrastructure yield from the high-multiple technology upside. The Core Contracted Case underwrites the asset, while the Proprietary Compute Reserve captures software valuation multiples.</p>

          <div className={styles.viz}><UpliftSVG coreLabel={usdB(p.totalValueConsortium)} /></div>
          <div className={styles.note} style={{ margin: '4px 0 30px' }}>Illustrative value stack. The Core Contracted Case underwrites the asset; the Proprietary Compute Reserve creates the equity upside. Additional-EV ranges are the figures below; bar heights are proportional intent.</div>

          <div className={styles.thesisBlock}>
            <div className={styles.thesisLine}><b>Existing sovereign infrastructure</b> underwrites the asset.</div>
            <div className={styles.thesisLine}><b>Reserved compute</b> is retained for the proprietary Hearst LLM.</div>
            <div className={styles.thesisLine}>That reserve adds <b>strategic software-layer upside</b> above the core infrastructure value.</div>
          </div>

          <table className={styles.rstack}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Layer</th>
                <th style={{ width: '32%' }}>What it is</th>
                <th style={{ width: '15%' }}>Capital needed</th>
                <th style={{ width: '16%' }}>What it can generate</th>
                <th style={{ width: '15%' }}>Potential value added</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.rsCore}>
                <td className={styles.rsLayer}>Core Infrastructure</td>
                <td className={styles.rsDesc}>150 MW sovereign data center platform already underwriting the asset</td>
                <td>{usdB1(a.fundedCapexUsd)}</td>
                <td>{usdM(p.consortiumAnnualCash)} annual consortium cash</td>
                <td className={styles.rsEv}>{usdB(p.totalValueConsortium)} core value</td>
              </tr>
              <tr>
                <td className={styles.rsLayer}>3 MW Reserve</td>
                <td className={styles.rsDesc}>First proprietary LLM capability</td>
                <td>+$155–210M</td>
                <td>~$6–15M potential annual contribution</td>
                <td className={styles.rsEv}>+$0.3–0.8B</td>
              </tr>
              <tr>
                <td className={styles.rsLayer}>5 MW Reserve</td>
                <td className={styles.rsDesc}>Platform seed</td>
                <td>+$250–340M</td>
                <td>~$15–35M</td>
                <td className={styles.rsEv}>+$0.6–1.6B</td>
              </tr>
              <tr>
                <td className={styles.rsLayer}>10 MW Reserve</td>
                <td className={styles.rsDesc}>Proprietary LLM platform</td>
                <td>+$480–650M</td>
                <td>~$40–90M</td>
                <td className={styles.rsEv}>+$1.2–3.0B</td>
              </tr>
              <tr className={styles.rsOption}>
                <td className={styles.rsLayer}>20 MW Option</td>
                <td className={styles.rsDesc}>Sovereign expansion option</td>
                <td>+$0.95–1.3B</td>
                <td>~$90–180M</td>
                <td className={styles.rsEv}>+$2.0–5.0B</td>
              </tr>
            </tbody>
          </table>

          <div className={styles.note} style={{ marginTop: 22 }}>This Strategic Upside sits outside the Core Contracted Case and is not reflected in headline yield, MOIC or IRR until separately capitalized and contracted. GPU capital is ring-fenced in a dedicated compute sub-vehicle; reserve operating contribution excludes GPU depreciation. Reserve figures are illustrative potential at maturity, not contracted.</div>
        </section>

        {/* ===== 9 · CONDITIONS & DISCIPLINE ===== */}
        <section className={styles.page}>
          <div className={styles.topbar}><div className={styles.brand}>Market Evidence · Underwriting Discipline</div><div className={styles.confidential}>Investment Memorandum — 09 / 09</div></div>
          <div className={styles.phead}><div><div className={styles.eyebrow}>Conditions Precedent &amp; Discipline</div><div className={styles.h2}>Anchored to today's market — underwritten with discipline</div></div><div className={styles.pnum}>09</div></div>
          <p className={styles.lede} style={{ marginBottom: 30 }}>AI has structurally re-priced data center infrastructure. The Core Contracted Case is anchored to live 2025 comparables and stress-tested. It remains a case, subject to the conditions precedent below; it is not a forecast or guarantee.</p>

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
          <div className={styles.sublabel}>Consortium economics across a downside, a conservative base, and the reference case. Stress columns evidence the floor, not the expected outcome. The Core Contracted Case assumes signed anchor offtake, secured power and phased delivery.</div>
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

          <div className={styles.sectlabel}>Conditions Precedent &amp; Strategic Discipline</div>
          <ul className={styles.cpList}>
            <li>Headline economics represent the <b>Core Contracted Case</b> and are illustrative — not a forecast, valuation, or guarantee of returns.</li>
            <li>Subject to execution of <b>anchor lease(s)</b> with creditworthy counterparties on the modelled terms and duration.</li>
            <li>Subject to a <b>dedicated power allocation / PPA</b> (QatarEnergy / Kahramaa) sufficient for the 150 MW load.</li>
            <li><b>AI upside is outside the Core Contracted Case</b> until capitalized and contracted; GPU capex is staged.</li>
            <li>The intelligence layer relies on <b>fine-tuning and continued pretraining</b> of open-weights, not frontier models from scratch.</li>
            <li>Model strategy requires strict <b>governance and data residency</b>.</li>
          </ul>

          <div className={styles.footnote}>Sources: CBRE North America Data Center Trends H2-2025; Cushman &amp; Wakefield 2025 Power &amp; Lease Pricing; Blackstone–AirTrunk acquisition (2024, ~20–23× EV/EBITDA); MEEZA Qatar hyperscaler lease (Oct-2025). Returns independently computed (15-yr hold, 80% Consortium economics).</div>
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
