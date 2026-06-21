import type { ReactNode } from 'react';
import styles from './qatar-report.module.css';
import { QATAR_ASSUMPTIONS } from '@/lib/investment-model/qatar/assumptions';
import {
  computePlatform,
  usdB,
  usdM,
  pct,
  mult,
} from '@/lib/investment-model/qatar/calculations';

const INK = '#0B1220';
const GOLD = '#B0894B';
const GOLDD = '#856634';
const LINE = '#E6E1D6';
const MUT = '#6E6A62';
const FAINT = '#9A958A';
const usdB1 = (x: number) => `$${(x / 1e9).toFixed(1)}B`;
const usdMc = (x: number) => `$${Math.round(x / 1e6).toLocaleString('en-US')}M`;

const HOP_LOW = 1.2e9;
const HOP_HIGH = 3.0e9;

/* ─── Qatar flag SVG ─── */
function QatarFlag({ size = 36 }: { size?: number }) {
  const h = size;
  const w = Math.round(size * 1.8);
  // maroon (9 points) + white band
  const points = [
    `0,0`,
    `${Math.round(w * 0.28)},0`,
    ...Array.from({ length: 9 }, (_, i) => {
      const base = Math.round(w * 0.28);
      const tip = Math.round(w * 0.38);
      const step = h / 9;
      const midY = step * i + step / 2;
      const endY = step * (i + 1);
      return `${tip},${Math.round(midY)} ${base},${Math.round(endY)}`;
    }).join(' '),
    `${Math.round(w * 0.28)},${h}`,
    `0,${h}`,
  ].join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="State of Qatar">
      <rect width={w} height={h} fill="#8D1B3D" />
      <polygon points={points} fill="#FFFFFF" />
    </svg>
  );
}

/* ─── Value Stack Chart ─── */
function ValueStackSVG({
  cumulative,
  capital,
  cashFinal,
  assetFinal,
  totalFinal,
  hopLow,
  hopHigh,
  moicLabel,
  irrLabel,
}: {
  cumulative: Array<{ year: number; cumulativeConsortium: number }>;
  capital: number;
  cashFinal: number;
  assetFinal: number;
  totalFinal: number;
  hopLow: number;
  hopHigh: number;
  moicLabel: string;
  irrLabel: string;
}) {
  const W = 1000, H = 420, L = 80, R = 230, T = 48, B = 58;
  const years = 15;
  const hopMid = (hopLow + hopHigh) / 2;
  const maxV = Math.ceil(((totalFinal + hopHigh) * 1.04) / 1e9) * 1e9;
  const xT = (t: number) => L + (t / years) * (W - L - R);
  const yV = (v: number) => H - B - (v / maxV) * (H - T - B);
  const baseY = yV(0);
  const e: ReactNode[] = [];
  let k = 0;
  const key = () => `s${k++}`;

  for (let b = 0; b <= maxV / 1e9; b += 2) {
    const y = yV(b * 1e9);
    e.push(<line key={key()} x1={L} y1={y} x2={W - R} y2={y} stroke={LINE} strokeWidth={b === 0 ? 2 : 1} />);
    e.push(<text key={key()} x={L - 12} y={y + 5} textAnchor="end" fontFamily="Inter" fontSize={12} fill={FAINT}>${b}B</text>);
  }
  [0, 5, 10, 15].forEach((t) =>
    e.push(<text key={key()} x={xT(t)} y={H - B + 26} textAnchor="middle" fontFamily="Inter" fontSize={12} fill={MUT} fontWeight={t === 0 || t === 15 ? 600 : 400}>Year {t}</text>)
  );

  const cashAt = (y: number) => cumulative[y - 1].cumulativeConsortium;
  const assetAt = (y: number) => assetFinal * (y / years);
  const hopAt = (y: number) => (y < 3 ? 0 : hopMid * ((y - 2) / (years - 2)));

  const cashPts: number[][] = [];
  const totPts: number[][] = [];
  const hopPts: number[][] = [];
  for (let y = 0; y <= years; y++) {
    const c = y === 0 ? 0 : cashAt(y);
    const a = y === 0 ? 0 : assetAt(y);
    const h = y === 0 ? 0 : hopAt(y);
    cashPts.push([xT(y), yV(c)]);
    totPts.push([xT(y), yV(c + a)]);
    hopPts.push([xT(y), yV(c + a + h)]);
  }
  const poly = (pts: number[][]) => pts.map((p) => `${p[0]},${p[1]}`).join(' ');
  const rev = (pts: number[][]) => [...pts].reverse();
  const capY = yV(capital);

  e.push(<polygon key={key()} points={`${poly(totPts)} ${poly(rev(hopPts))}`} fill={GOLD} opacity={0.17} />);
  e.push(<polyline key={key()} points={poly(hopPts)} fill="none" stroke={GOLDD} strokeWidth={1.5} strokeDasharray="5 4" />);
  e.push(<polygon key={key()} points={`${poly(cashPts)} ${poly(rev(totPts))}`} fill={GOLD} opacity={0.92} />);
  e.push(<polygon key={key()} points={`${xT(0)},${baseY} ${poly(cashPts)} ${xT(years)},${baseY}`} fill={INK} />);
  e.push(<polyline key={key()} points={poly(totPts)} fill="none" stroke={GOLDD} strokeWidth={2} strokeLinejoin="round" />);
  e.push(<line key={key()} x1={L} y1={capY} x2={xT(years)} y2={capY} stroke="#FBFAF6" strokeWidth={1.25} strokeDasharray="2 4" opacity={0.6} />);

  const xL = W - R + 18;
  e.push(<line key={key()} x1={xT(years)} y1={capY} x2={W - R + 10} y2={capY} stroke={MUT} strokeDasharray="2 3" />);
  e.push(<text key={key()} x={xL} y={capY + 4} fontFamily="Inter" fontSize={12} fontWeight={600} fill={INK}>{usdB1(capital)} in</text>);
  e.push(<text key={key()} x={xL} y={capY + 18} fontFamily="Inter" fontSize={11} fill={MUT}>capital · Year 0</text>);

  const tY = yV(totalFinal);
  e.push(<line key={key()} x1={xT(years)} y1={tY} x2={W - R + 10} y2={tY} stroke={GOLDD} strokeDasharray="3 3" />);
  e.push(<text key={key()} x={xL} y={tY + 2} fontFamily="Inter" fontSize={27} fontWeight={700} fill={GOLDD}>{usdB(totalFinal)}</text>);
  e.push(<text key={key()} x={xL} y={tY + 20} fontFamily="Inter" fontSize={11.5} fontWeight={600} fill={INK} letterSpacing="0.2">Total value · Consortium</text>);
  e.push(<text key={key()} x={xL} y={tY + 35} fontFamily="Inter" fontSize={11} fill={MUT}>{moicLabel} MOIC · {irrLabel} IRR</text>);
  e.push(<text key={key()} x={xL} y={tY + 50} fontFamily="Inter" fontSize={10.5} fill={MUT}>{usdB(cashFinal)} cash + {usdB(assetFinal)} asset</text>);

  const hY = yV(totalFinal + hopHigh);
  e.push(<text key={key()} x={xL} y={hY - 2} fontFamily="Inter" fontSize={14} fontWeight={700} fill={GOLDD}>+{usdB1(hopLow)}–{usdB1(hopHigh)}</text>);
  e.push(<text key={key()} x={xL} y={hY + 14} fontFamily="Inter" fontSize={10.5} fill={MUT}>Hearst LLM upside</text>);
  e.push(<text key={key()} x={xL} y={hY + 27} fontFamily="Inter" fontSize={10} fill={FAINT}>optional · not in headline</text>);

  return <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="presentation" aria-hidden="true">{e}</svg>;
}


/* ══════════════════════════ REPORT ══════════════════════════ */
export function QatarReport({ print = false, fontClass = '' }: { print?: boolean; fontClass?: string }) {
  const a = QATAR_ASSUMPTIONS;
  const p = computePlatform(a);

  const cashFinal = p.cumulativeCashConsortium;
  const assetFinal = p.terminalValueConsortium;
  const totalFinal = p.totalValueConsortium;

  // milestone years only
  const MILESTONES = [1, 3, 5, 10, 15];

  const rootClass = [styles.report, print ? styles.printRoot : '', fontClass].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <main className={styles.deck}>

        {/* ══════════════ PAGE 1 · THE CONSORTIUM ══════════════ */}
        <section className={styles.page}>

          {/* ── top bar ── */}
          <div className={styles.topbar}>
            <div className={styles.brandRow}>
              <img src="/futur-one-h-accent.svg" alt="Futur One" className={styles.logoFuturOne} />
              <div className={styles.topDivider} />
              <span className={styles.brandSub}>Project Earth · Partner Briefing</span>
            </div>
            <div className={styles.confidential}>Private &amp; Confidential — 01 / 03</div>
          </div>

          {/* ── cover hero ── */}
          <div className={styles.coverHero}>
            <div className={`${styles.coverImg} ${styles.coverImgPhoto}`} />
            <div className={styles.coverVeil} />
            <div className={styles.coverTag}>Sovereign AI Infrastructure · Qatar</div>
            <div className={styles.coverCap}>
              <div className={styles.coverCe}>Project Earth · Futur One</div>
              <div className={styles.coverTitle}>
                Own the power.<br />Own the asset.<br />
                <span className={styles.it}>Own the model.</span>
              </div>
            </div>
          </div>

          {/* ── thesis ── */}
          <p className={styles.lede}>
            Qatar provides <b>sovereign capital, land and dedicated power</b>. Hearst deploys its AI infrastructure and proprietary LLM technology. Equinix operates the platform and anchors hyperscale demand. Together, the consortium owns a <b>150 MW AI-ready data center</b> generating contracted cash from Day 1 — with a sovereign intelligence layer on top.
          </p>

          {/* ── four partners ── */}
          <div className={styles.sectlabel}>The consortium</div>
          <div className={styles.partners4}>

            <div className={styles.partner4}>
              <div className={styles.partnerFlag}><QatarFlag size={28} /></div>
              <div className={styles.partnerRole}>Sovereign Capital</div>
              <div className={styles.partnerName4}>State of Qatar</div>
              <div className={styles.partnerContrib}>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: '#8D1B3D' }} />Capital &amp; land provision</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: '#8D1B3D' }} />QatarEnergy power allocation</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: '#8D1B3D' }} />Sovereign regulatory fast-track</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: '#8D1B3D' }} />National data sovereignty</div>
              </div>
            </div>

            <div className={styles.partner4}>
              <div className={styles.partnerLogo}><img src="/hearst-h.svg" alt="Hearst" className={styles.logoH} /></div>
              <div className={styles.partnerRole}>Developer &amp; AI</div>
              <div className={styles.partnerName4}>Hearst</div>
              <div className={styles.partnerContrib}>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: INK }} />Platform development</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: INK }} />Proprietary LLM technology</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: INK }} />GPU infrastructure (4× RTX 4090 clusters)</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: INK }} />AI intelligence layer</div>
              </div>
            </div>

            <div className={styles.partner4}>
              <div className={styles.partnerLogoText}>EQX</div>
              <div className={styles.partnerRole}>Operations &amp; Demand</div>
              <div className={styles.partnerName4}>Equinix</div>
              <div className={styles.partnerContrib}>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: GOLDD }} />Data center operations</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: GOLDD }} />Hyperscale tenant network</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: GOLDD }} />~40% global interconnection market</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: GOLDD }} />Pre-leased demand pipeline</div>
              </div>
            </div>

            <div className={styles.partner4}>
              <div className={styles.partnerLogoText} style={{ color: FAINT }}>AI</div>
              <div className={styles.partnerRole}>Anchor Demand</div>
              <div className={styles.partnerName4}>AI Tenants</div>
              <div className={styles.partnerContrib}>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: FAINT }} />Pre-signed lease contracts</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: FAINT }} />150 MW fully committed</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: FAINT }} />Creditworthy counterparties</div>
                <div className={styles.contrib}><span className={styles.contribDot} style={{ background: FAINT }} />$225/kW/mo contracted lease</div>
              </div>
            </div>

          </div>

          {/* ── headline anchors ── */}
          <div className={`${styles.statrow} ${styles.statrowTop}`}>
            <div className={styles.stat}><div className={styles.statFig}>150<span className={styles.statU}>MW</span></div><div className={styles.statLab}>Platform capacity</div></div>
            <div className={styles.stat}><div className={styles.statFig}>$1.5<span className={styles.statU}>B</span></div><div className={styles.statLab}>Total capital in</div></div>
            <div className={styles.stat}><div className={styles.statFig}>{usdM(p.consortiumAnnualCash)}<span className={styles.statU}>/yr</span></div><div className={styles.statLab}>Year-1 consortium cash</div></div>
            <div className={styles.stat}><div className={styles.statFig}>{pct(p.irrConsortium).replace('%', '')}<span className={styles.statU}>%</span></div><div className={styles.statLab}>Target IRR</div></div>
          </div>

        </section>

        {/* ══════════════ PAGE 2 · THE ECONOMICS ══════════════ */}
        <section className={styles.page}>
          <div className={styles.topbar}>
            <div className={styles.brandRow}>
              <img src="/futur-one-h-accent.svg" alt="Futur One" className={styles.logoFuturOne} />
              <div className={styles.topDivider} />
              <span className={styles.brandSub}>The Economics</span>
            </div>
            <div className={styles.confidential}>Private &amp; Confidential — 02 / 03</div>
          </div>

          <div className={styles.phead}>
            <div>
              <div className={styles.eyebrow}>Year 0 → Year 15 · Consortium 80%</div>
              <div className={styles.h2}>{usdB(a.fundedCapexUsd)} in. {usdB(totalFinal)} out.<br /><span className={styles.it}>And a sovereign-AI option on top.</span></div>
            </div>
            <div className={styles.pnum}>02</div>
          </div>

          <div className={styles.viz}>
            <ValueStackSVG
              cumulative={p.cumulativeByYear}
              capital={a.fundedCapexUsd}
              cashFinal={cashFinal}
              assetFinal={assetFinal}
              totalFinal={totalFinal}
              hopLow={HOP_LOW}
              hopHigh={HOP_HIGH}
              moicLabel={mult(p.moicConsortium)}
              irrLabel={pct(p.irrConsortium)}
            />
          </div>

          {/* Outcome strip — the hero conclusion */}
          <div className={styles.outcome}>
            <div className={styles.outItem}>
              <div className={styles.outV}>{usdB1(a.fundedCapexUsd)}</div>
              <div className={styles.outL}>Capital in · Year 0</div>
            </div>
            <div className={styles.outArrow}>→</div>
            <div className={styles.outItem}>
              <div className={styles.outV}>{usdB(cashFinal)}</div>
              <div className={styles.outL}>Cumulative cash · Years 1–15</div>
            </div>
            <div className={styles.outArrow}>+</div>
            <div className={styles.outItem}>
              <div className={styles.outV}>{usdB(assetFinal)}</div>
              <div className={styles.outL}>Terminal asset value · 22× exit EBITDA</div>
            </div>
            <div className={styles.outArrow}>=</div>
            <div className={`${styles.outItem} ${styles.outHero}`}>
              <div className={styles.outV}>{usdB(totalFinal)}</div>
              <div className={styles.outL}>{mult(p.moicConsortium)} MOIC · {pct(p.irrConsortium)} IRR</div>
            </div>
          </div>

          {/* 5-milestone table */}
          <div className={styles.sectlabel} style={{ marginTop: 32 }}>Key milestones</div>
          <table className={styles.ftable} style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th className={styles.thHl}>Milestone</th>
                <th>Lease revenue</th>
                <th>EBITDA · 65%</th>
                <th className={styles.thHl}>Consortium · 80%</th>
                <th className={styles.thHl}>Cumulative cash</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Year 0 · capital deployed</td>
                <td>—</td>
                <td>—</td>
                <td className={styles.tdHl}>({usdB(a.fundedCapexUsd)})</td>
                <td className={styles.tdHl}>({usdB(a.fundedCapexUsd)})</td>
              </tr>
              {MILESTONES.map((y) => {
                const pt = p.cumulativeByYear[y - 1];
                const ebitdaY = pt.ebitdaTotal;
                const revY = ebitdaY / a.ebitdaMargin;
                const consY = ebitdaY * a.consortiumShare;
                const cumY = pt.cumulativeConsortium;
                const exit = y === a.holdYears;
                return (
                  <tr key={y} className={exit ? styles.rowExit : undefined}>
                    <td>Year {y}{exit ? ' · exit' : ''}</td>
                    <td>{usdMc(revY)}</td>
                    <td>{usdMc(ebitdaY)}</td>
                    <td className={styles.tdHl}>{usdMc(consY)}</td>
                    <td className={styles.tdHl}>{cumY >= 1e9 ? usdB(cumY) : usdMc(cumY)}</td>
                  </tr>
                );
              })}
              <tr className={styles.trStrong}>
                <td>15-year cash total</td>
                <td colSpan={2}>—</td>
                <td className={styles.tdHl}>{usdB(cashFinal)}</td>
                <td className={styles.tdHl}>{usdB(cashFinal)}</td>
              </tr>
              <tr className={styles.rowExit}>
                <td>+ Terminal asset · Y15</td>
                <td colSpan={3}>22× exit EBITDA · {usdB(assetFinal)}</td>
                <td className={styles.tdHl}>{usdB(totalFinal)}</td>
              </tr>
            </tbody>
          </table>

          <div className={styles.note} style={{ marginTop: 18 }}>Core Contracted Case · 150 MW energized from Year 1 · $225/kW/mo lease · 65% EBITDA margin · 3% annual escalation · 22× EBITDA exit multiple. Consortium 80% economics. The Hearst LLM upside (+{usdB1(HOP_LOW)}–{usdB1(HOP_HIGH)}) is outside this plan and not reflected in headline figures.</div>
        </section>

        {/* ══════════════ PAGE 3 · THE HEARST EDGE ══════════════ */}
        <section className={styles.page}>
          <div className={styles.topbar}>
            <div className={styles.brandRow}>
              <img src="/futur-one-h-accent.svg" alt="Futur One" className={styles.logoFuturOne} />
              <div className={styles.topDivider} />
              <span className={styles.brandSub}>Why Hearst</span>
            </div>
            <div className={styles.confidential}>Private &amp; Confidential — 03 / 03</div>
          </div>

          <div className={styles.phead}>
            <div>
              <div className={styles.eyebrow}>The Hearst advantage</div>
              <div className={styles.h2}>Infrastructure that runs.<br /><span className={styles.it}>Intelligence that compounds.</span></div>
            </div>
            <div className={styles.pnum}>03</div>
          </div>

          <p className={styles.lede} style={{ marginBottom: 32 }}>
            Hearst does not just develop the platform — it <b>operates live AI infrastructure today</b>. That stack is what turns a contracted data center into a sovereign intelligence asset. The LLM layer is the multiplier that no pure-play real-estate operator can replicate.
          </p>

          {/* GPU infrastructure */}
          <div className={styles.sectlabel}>Live infrastructure today</div>
          <div className={styles.infra3}>
            <div className={styles.infraCard}>
              <div className={styles.infraNum}>8×</div>
              <div className={styles.infraLabel}>RTX 4090 GPUs</div>
              <div className={styles.infraDesc}>Two production clusters (GPU1 · GPU2) running 24/7. Training, fine-tuning and inference — operational now.</div>
            </div>
            <div className={styles.infraCard}>
              <div className={styles.infraNum}>4</div>
              <div className={styles.infraLabel}>Active AI services</div>
              <div className={styles.infraDesc}>vLLM · ComfyUI · InvokeAI · Langfuse — serving internal and client workloads in continuous production.</div>
            </div>
            <div className={styles.infraCard}>
              <div className={styles.infraNum}>24/7</div>
              <div className={styles.infraLabel}>Pipeline orchestration</div>
              <div className={styles.infraDesc}>Systemd-managed multi-agent pipelines. Cloudflare tunnels. Prometheus + Grafana observability. Zero-downtime deployments.</div>
            </div>
          </div>

          {/* LLM sovereign upside */}
          <div className={styles.sectlabel} style={{ marginTop: 36 }}>The LLM layer — where valuation compounds</div>
          <p className={styles.lede} style={{ fontSize: 15, marginBottom: 20 }}>A reserved GPU pocket inside the 150 MW platform trains, fine-tunes and serves a <b>sovereign Hearst LLM</b>. This converts infrastructure rent into software-grade equity — a layer no tenant can touch and no competitor can replicate without years of R&amp;D.</p>

          <div className={styles.llmRamp}>
            {[
              { mw: '1 MW', phase: 'Proof Cluster', desc: 'Sovereign validation · secure enclave testing', tag: 'Year 1' },
              { mw: '3 MW', phase: 'Model Factory', desc: 'Dedicated fine-tuning on national-priority data', tag: 'Year 2' },
              { mw: '5 MW', phase: 'Platform Seed', desc: 'Sovereign model serving · intelligence layer live', tag: 'Year 3' },
              { mw: '10 MW', phase: 'LLM Platform', desc: 'Full-scale sovereign intelligence · the inflection', tag: 'Year 4–5', highlight: true },
            ].map((r, i) => (
              <div key={i} className={`${styles.llmStep} ${r.highlight ? styles.llmStepHl : ''}`}>
                <div className={styles.llmMw}>{r.mw}</div>
                <div className={styles.llmBody}>
                  <div className={styles.llmPhase}>{r.phase}</div>
                  <div className={styles.llmDesc}>{r.desc}</div>
                </div>
                <div className={styles.llmTag}>{r.tag}</div>
              </div>
            ))}
          </div>

          {/* Return stack — what each layer adds */}
          <div className={styles.sectlabel} style={{ marginTop: 36 }}>Return stack</div>
          <table className={styles.rstack} style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Layer</th>
                <th style={{ width: '38%' }}>What it is</th>
                <th style={{ width: '22%' }}>Value at exit</th>
                <th style={{ width: '18%' }}>In headline?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.rsLayer}>Cash · the rent</td>
                <td className={styles.rsDesc}>150 MW leased to AI tenants at $225/kW/mo. Rent collected and distributed to consortium every year.</td>
                <td className={styles.rsEv}>{usdB(cashFinal)}</td>
                <td><span className={styles.rsBadge} style={{ background: '#E8F5E9', color: '#2E7D32' }}>Yes</span></td>
              </tr>
              <tr>
                <td className={styles.rsLayer}>Asset · the building</td>
                <td className={styles.rsDesc}>The contracted platform is itself worth a multiple of earnings at exit. 22× EBITDA — what the consortium owns and sells.</td>
                <td className={styles.rsEv}>{usdB(assetFinal)}</td>
                <td><span className={styles.rsBadge} style={{ background: '#E8F5E9', color: '#2E7D32' }}>Yes</span></td>
              </tr>
              <tr className={styles.rsCore}>
                <td className={styles.rsLayer}>Total core</td>
                <td className={styles.rsDesc}>Cash + terminal asset value. The contracted, bankable return on the $1.5B investment.</td>
                <td className={styles.rsEv}>{usdB(totalFinal)}</td>
                <td><span className={styles.rsBadge} style={{ background: GOLD, color: '#FFF' }}>{mult(p.moicConsortium)} · {pct(p.irrConsortium)}</span></td>
              </tr>
              <tr className={styles.rsOption}>
                <td className={styles.rsLayer}>The hop · Hearst LLM</td>
                <td className={styles.rsDesc}>Reserve 10 MW of compute. Train a sovereign model. At 10 MW scale, the platform commands software-grade valuation multiples.</td>
                <td className={styles.rsEv}>+{usdB1(HOP_LOW)}–{usdB1(HOP_HIGH)}</td>
                <td><span className={styles.rsBadge} style={{ background: '#FFF8E1', color: '#F57F17' }}>Upside</span></td>
              </tr>
            </tbody>
          </table>

          <div className={styles.footnote} style={{ marginTop: 28 }}>Returns independently computed (15-yr hold, 80% Consortium economics). Lease and exit inputs anchored to 2025 comparables: CBRE H2-2025; Cushman &amp; Wakefield 2025; Blackstone–AirTrunk (2024, ~20–23× EV/EBITDA); MEEZA Qatar (Oct-2025). Illustrative — not a forecast or guarantee of returns. The Hearst LLM upside range reflects the 10 MW proprietary compute reserve; not contracted, not included in headline IRR/MOIC.</div>
        </section>

      </main>

      <footer className={styles.legal}>
        <div className={styles.legalBox}>
          <h4>Important Notice — Strictly Private &amp; Confidential</h4>
          <p>This document has been prepared by Hearst Corporation and its affiliates (the &quot;Promoter&quot;) solely for the information of the intended recipient and for discussion purposes only. It does not constitute an offer to sell or a solicitation to buy any security or interest, nor investment, legal, tax or financial advice. Any potential transaction would be made only pursuant to definitive legal documentation and subject to the conditions precedent set out herein.</p>
          <p>The figures and projections herein are illustrative, reflect the Core Contracted Case, and rest on assumptions believed reasonable but inherently uncertain. Actual results may differ materially. No representation or warranty is given as to their accuracy or completeness. Recipients should conduct their own independent due diligence.</p>
        </div>
      </footer>
    </div>
  );
}
