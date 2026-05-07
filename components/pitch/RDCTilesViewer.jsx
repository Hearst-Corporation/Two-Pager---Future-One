'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { TilesRenderer, GlobeControls, WGS84_ELLIPSOID } from '3d-tiles-renderer';
import { GoogleCloudAuthPlugin, TileCompressionPlugin, UpdateOnChangePlugin, TilesFadePlugin } from '3d-tiles-renderer/plugins';

/**
 * QF Research & Development Complex — Education City, Doha
 * Coordinates from Google Maps satellite inspection
 */
const RDC_LAT = 25.31580;
const RDC_LON = 51.43745;
const RDC_HEIGHT = 0; // sea level reference

export default function RDCTilesViewer({ apiToken }) {
  const mountRef = useRef(null);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [attributions, setAttributions] = useState('');

  useEffect(() => {
    if (!apiToken) {
      setError('Missing Google Maps API token. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
      return;
    }
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    /* ---------- Scene + camera + renderer ---------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 160000000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    /* ---------- Tiles renderer (Google Photorealistic 3D Tiles) ---------- */
    const tiles = new TilesRenderer();
    tiles.registerPlugin(
      new GoogleCloudAuthPlugin({
        apiToken,
        autoRefreshToken: true,
        useRecommendedSettings: true,
      }),
    );
    tiles.registerPlugin(new TileCompressionPlugin());
    tiles.registerPlugin(new UpdateOnChangePlugin());
    tiles.registerPlugin(new TilesFadePlugin());

    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);

    // Listen for first tile load
    tiles.addEventListener('load-tile-set', () => setLoaded(true));
    tiles.addEventListener('load-error', (e) => {
      console.error('[3D Tiles] load error', e);
      setError('Failed to load Google 3D Tiles. Check your API key has "Map Tiles API" enabled.');
    });

    scene.add(tiles.group);

    /* ---------- Position camera over the RDC building ---------- */
    // Convert lat/lon to ECEF (Earth-Centered Earth-Fixed)
    const target = new THREE.Vector3();
    WGS84_ELLIPSOID.getCartographicToPosition(
      THREE.MathUtils.degToRad(RDC_LAT),
      THREE.MathUtils.degToRad(RDC_LON),
      RDC_HEIGHT,
      target,
    );

    // Camera offset: place ~400m above and 600m south, looking at the building
    const enuFrame = new THREE.Matrix4();
    WGS84_ELLIPSOID.getEastNorthUpFrame(
      THREE.MathUtils.degToRad(RDC_LAT),
      THREE.MathUtils.degToRad(RDC_LON),
      RDC_HEIGHT,
      enuFrame,
    );
    // ENU: X=east, Y=north, Z=up
    const cameraOffsetLocal = new THREE.Vector3(0, -600, 400); // 600m south, 400m up
    cameraOffsetLocal.applyMatrix4(enuFrame);
    cameraOffsetLocal.sub(
      new THREE.Vector3().setFromMatrixPosition(enuFrame),
    );

    camera.position.copy(target).add(cameraOffsetLocal);
    camera.up.copy(new THREE.Vector3(0, 0, 1).applyMatrix4(enuFrame).normalize());
    camera.lookAt(target);

    /* ---------- Globe controls (handles tilt/orbit/zoom on a globe) ---------- */
    const controls = new GlobeControls(scene, camera, renderer.domElement, tiles);
    controls.enableDamping = true;
    controls.minDistance = 80;
    controls.maxDistance = 8000;

    /* ---------- Animation loop ---------- */
    let frame;
    const animate = () => {
      // Camera matrix must be updated before tiles update
      camera.updateMatrixWorld();
      controls.update();
      tiles.update();

      // Pull current attribution credits
      try {
        const credits = tiles.getAttributions
          ? tiles.getAttributions()
          : tiles.getCreditsString
          ? [tiles.getCreditsString()]
          : [];
        if (credits && credits.length) {
          const txt = credits
            .map((c) => (typeof c === 'string' ? c : c.value))
            .filter(Boolean)
            .join(' · ');
          if (txt) setAttributions(txt);
        }
      } catch (_) {
        /* ignore */
      }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    /* ---------- Resize ---------- */
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      tiles.setResolutionFromRenderer(camera, renderer);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      tiles.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [apiToken]);

  return (
    <div style={S.wrap}>
      <div ref={mountRef} style={S.canvas} />

      {!loaded && !error && (
        <div style={S.loading}>
          <div style={S.spinner} />
          <div>Streaming Google Photorealistic 3D Tiles…</div>
          <div style={S.loadingSub}>Doha · Education City · QF Research Complex</div>
        </div>
      )}

      {error && (
        <div style={S.errorBox}>
          <div style={S.errorTitle}>⚠ {error}</div>
          <div style={S.errorBody}>
            <p>To enable: create a <a style={S.link} href="https://console.cloud.google.com/google/maps-apis/" target="_blank" rel="noreferrer">Google Cloud project</a>, enable <strong>Map Tiles API</strong>, generate an API key, then:</p>
            <pre style={S.code}>echo 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY' &gt;&gt; .env.local{'\n'}npm run dev</pre>
            <p style={{ fontSize: 11, opacity: 0.6 }}>Free tier: 25 000 tile loads/day. No credit card needed for starter quota.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div style={S.brand}>
          <span style={S.brandAccent}>FUTUR</span> ONE — SITE INSPECTION
        </div>
        <div style={S.location}>QF · R&D COMPLEX · DOHA · 25.3158°N 51.4374°E</div>
      </div>

      {/* Fact panel */}
      <div style={S.factPanel}>
        <div style={S.factHeader}>QF — RESEARCH & DEVELOPMENT COMPLEX</div>
        <div style={S.factSub}>Education City · Phase 1A (2013–2016) · Perkins+Will</div>
        <div style={S.factGrid}>
          {[
            ['45 500', 'm² built-up'],
            ['95 000', 'm² plot'],
            ['11', 'transformers'],
            ['420', 'parking'],
            ['700', 'staff'],
            ['QAR 1.5 Bn', 'cost'],
          ].map(([n, l]) => (
            <div key={l} style={S.factCell}>
              <div style={S.factNum}>{n}</div>
              <div style={S.factLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div style={S.hint}>
        Drag · scroll to zoom · right-click to pan
      </div>

      {/* Google attribution (REQUIRED by ToS) */}
      <div style={S.attribution}>
        <div style={S.googleLogo}>Google</div>
        {attributions && <div style={S.creditsTxt}>{attributions}</div>}
      </div>
    </div>
  );
}

const S = {
  wrap: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    background: '#0a0a0a',
    cursor: 'grab',
    fontFamily: '"Inter", -apple-system, sans-serif',
  },
  canvas: { position: 'absolute', inset: 0 },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  spinner: {
    width: 36,
    height: 36,
    border: '2px solid rgba(255,255,255,0.15)',
    borderTopColor: 'var(--color-accent-strong)',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 1s linear infinite',
  },
  loadingSub: {
    marginTop: 8,
    fontSize: 10,
    opacity: 0.5,
  },
  errorBox: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: 540,
    padding: 32,
    background: 'rgba(20,20,20,0.95)',
    border: '1px solid rgba(141,27,61,0.6)',
    borderRadius: 4,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-accent-strong)',
    marginBottom: 14,
  },
  errorBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.6,
    letterSpacing: 0.3,
  },
  code: {
    background: '#000',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '12px 14px',
    fontSize: 11,
    color: '#9be29b',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    margin: '12px 0',
    borderRadius: 4,
    overflow: 'auto',
  },
  link: {
    color: '#fff',
    textDecorationColor: 'var(--color-accent-strong)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '14px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
    background: 'linear-gradient(180deg, rgba(10,10,10,0.7), transparent)',
    zIndex: 30,
  },
  brand: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.9)',
  },
  brandAccent: { color: 'var(--color-accent-strong)' },
  location: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    fontVariantNumeric: 'tabular-nums',
  },
  factPanel: {
    position: 'absolute',
    top: 70,
    left: 32,
    padding: '20px 24px',
    background: 'rgba(15,15,15,0.7)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: 4,
    pointerEvents: 'none',
    maxWidth: 380,
    zIndex: 20,
  },
  factHeader: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-accent-strong)',
    marginBottom: 4,
  },
  factSub: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  factGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px 18px',
  },
  factCell: {},
  factNum: {
    fontSize: 18,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: -0.5,
    fontVariantNumeric: 'tabular-nums',
  },
  factLabel: {
    fontSize: 9,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  hint: {
    position: 'absolute',
    top: 70,
    right: 32,
    padding: '8px 14px',
    background: 'rgba(15,15,15,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    borderRadius: 4,
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    zIndex: 30,
  },
  attribution: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 10px',
    background: 'rgba(0,0,0,0.55)',
    borderRadius: 3,
    pointerEvents: 'none',
    zIndex: 30,
  },
  googleLogo: {
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 0.3,
  },
  creditsTxt: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    maxWidth: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
