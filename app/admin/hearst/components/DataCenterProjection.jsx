'use client';

import { memo } from 'react';
import styles from '../hearst.module.css';

// SVG placeholders for different visual states, simulating the cinematic crossfade.
// Memoized: depends only on `type` (fixed per panel), so changing scale/aiMix/thesis
// no longer re-renders any of the 3 SVGs — only the text labels update.
const PlaceholderSVG = memo(function PlaceholderSVG({ type }) {
  const toneClass = {
    shell: styles.projectionSvgShell,
    compute: styles.projectionSvgCompute,
    gov: styles.projectionSvgGov,
  }[type];

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.projectionSvg} ${toneClass}`}
    >
      <defs>
        <pattern id={`grid-${type}`} width="60" height="60" patternUnits="userSpaceOnUse">
          <path className={styles.projectionGridMajor} d="M 60 0 L 0 0 0 60" strokeWidth="0.5" />
        </pattern>
        <pattern id={`grid-micro-${type}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path className={styles.projectionGridMicro} d="M 10 0 L 0 0 0 10" strokeWidth="0.5" />
        </pattern>
      </defs>

      <rect className={styles.projectionBackdrop} width="100%" height="100%" />
      <rect width="100%" height="100%" fill={`url(#grid-micro-${type})`} />
      <rect width="100%" height="100%" fill={`url(#grid-${type})`} />

      {type === 'shell' && (
        <circle className={styles.projectionHalo} cx="50%" cy="50%" r="30%" />
      )}
      {type === 'compute' && (
        <circle className={styles.projectionHalo} cx="50%" cy="50%" r="30%" />
      )}
      {type === 'gov' && (
        <circle className={styles.projectionHalo} cx="50%" cy="50%" r="30%" />
      )}

      {type === 'shell' && (
        <rect className={styles.projectionStructurePrimary} x="20%" y="20%" width="60%" height="60%" strokeWidth="0.5" />
      )}
      {type === 'compute' && (
        <>
          <rect className={styles.projectionStructurePrimary} x="25%" y="25%" width="50%" height="50%" strokeWidth="0.5" />
          <path className={styles.projectionStructureSecondary} d="M 25 25 L 75 75 M 25 75 L 75 25" strokeWidth="0.5" />
        </>
      )}
      {type === 'gov' && (
        <path className={styles.projectionStructurePrimary} d="M 20 50 L 50 20 L 80 50 L 50 80 Z" strokeWidth="0.5" />
      )}

      <path className={styles.projectionCornerMark} d="M 1 3 L 1 1 L 3 1" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <path className={styles.projectionCornerMark} d="M 97 1 L 99 1 L 99 3" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <path className={styles.projectionCornerMark} d="M 1 97 L 1 99 L 3 99" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <path className={styles.projectionCornerMark} d="M 97 99 L 99 99 L 99 97" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
    </svg>
  );
});

export default function DataCenterProjection({ thesis, scale, aiMix }) {
  return (
    <div className={styles.projectionContainer}>
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'shell'}
      >
        <PlaceholderSVG type="shell" />
        <div className={styles.projectionLabel}>
          LONG LEASE CAMPUS <span className={styles.faintSep}>{'//'}</span> {scale}MW
        </div>
      </div>
      
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'compute'}
      >
        <PlaceholderSVG type="compute" />
        <div className={styles.projectionLabel}>
          HIGH-DENSITY COMPUTE <span className={styles.faintSep}>{'//'}</span> {scale}MW <span className={styles.faintSep}>{'//'}</span> MIX: {aiMix}%
        </div>
      </div>
      
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'gov'}
      >
        <PlaceholderSVG type="gov" />
        <div className={styles.projectionLabel}>
          SOVEREIGN AI CLUSTER <span className={styles.faintSep}>{'//'}</span> {scale}MW <span className={styles.faintSep}>{'//'}</span> PERIMETER SECURED
        </div>
      </div>
    </div>
  );
}
