'use client';

export const REF_W = 480;
export const REF_H = 680;

/**
 * A3 plié en 2 (= A4 portrait quand fermé), 4 pages portrait.
 *   - "closed"  : couverture (P1) visible
 *   - "open"    : pages 2 & 3 côte à côte
 *   - "back"    : dos (P4) visible
 *   - "flat"    : recto (P4|P1) + verso (P2|P3) à plat
 */
export default function FoldableA3({ pages, view, scale = 1 }) {
  const [p1, p2, p3, p4] = pages;

  if (view === 'flat') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
        <div style={{ fontSize: 12, opacity: 0.6 }}>RECTO (extérieur du pli)</div>
        <Spread scale={scale}>
          <Page node={p4} label="P4 — Dos" />
          <Page node={p1} label="P1 — Couverture" border="left" />
        </Spread>
        <div style={{ fontSize: 12, opacity: 0.6 }}>VERSO (intérieur du pli)</div>
        <Spread scale={scale}>
          <Page node={p2} label="P2 — Intérieur gauche" />
          <Page node={p3} label="P3 — Intérieur droite" border="left" />
        </Spread>
      </div>
    );
  }

  if (view === 'open') {
    return (
      <Spread scale={scale} fold>
        <Page node={p2} label="P2" />
        <Page node={p3} label="P3" border="left" />
      </Spread>
    );
  }

  if (view === 'back') {
    return (
      <Spread scale={scale} cols={1}>
        <Page node={p4} label="P4 — Dos" />
      </Spread>
    );
  }

  return (
    <Spread scale={scale} cols={1}>
      <Page node={p1} label="P1 — Couverture" />
    </Spread>
  );
}

function Spread({ children, scale, cols = 2, fold = false }) {
  const innerW = REF_W * cols;
  const innerH = REF_H;
  return (
    <div
      style={{
        width: innerW * scale,
        height: innerH * scale,
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,.5)',
      }}
    >
      <div
        style={{
          width: innerW,
          height: innerH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          display: 'flex',
          background: '#fff',
          position: 'relative',
        }}
      >
        {children}
        {fold && <FoldShadow />}
      </div>
    </div>
  );
}

function Page({ node, label, border }) {
  return (
    <div
      style={{
        width: REF_W,
        height: REF_H,
        background: '#fff',
        color: '#111',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: border === 'left' ? '1px dashed rgba(0,0,0,.15)' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          fontSize: 8,
          color: 'rgba(255,255,255,.6)',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          zIndex: 100,
          pointerEvents: 'none',
          mixBlendMode: 'difference',
        }}
      >
        {label}
      </div>
      <div style={{ width: '100%', height: '100%' }}>
        {node || <Placeholder label={label} />}
      </div>
    </div>
  );
}

function Placeholder({ label }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'repeating-linear-gradient(45deg, #fafafa, #fafafa 12px, #f0f0f0 12px, #f0f0f0 24px)',
        color: 'rgba(0,0,0,.35)',
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      {label} — section à définir
    </div>
  );
}

function FoldShadow() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 24,
        transform: 'translateX(-50%)',
        background:
          'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,.18) 50%, rgba(0,0,0,0) 100%)',
        pointerEvents: 'none',
      }}
    />
  );
}
