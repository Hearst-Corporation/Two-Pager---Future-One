'use client';

import styles from '../hearst.module.css';

// SVG placeholders for different visual states, simulating the cinematic crossfade
function PlaceholderSVG({ type }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`grid-${type}`} width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
        </pattern>
        <pattern id={`grid-micro-${type}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.01)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      
      {/* Deep black background */}
      <rect width="100%" height="100%" fill="#000" />
      
      {/* Blueprint grid overlay */}
      <rect width="100%" height="100%" fill={`url(#grid-micro-${type})`} />
      <rect width="100%" height="100%" fill={`url(#grid-${type})`} />
      
      {/* Subdued structural halos instead of bright colors */}
      {type === 'shell' && (
        <circle cx="50%" cy="50%" r="30%" fill="rgba(212, 175, 55, 0.03)" filter="blur(40px)" />
      )}
      {type === 'compute' && (
        <circle cx="50%" cy="50%" r="30%" fill="rgba(0, 200, 255, 0.03)" filter="blur(40px)" />
      )}
      {type === 'gov' && (
        <circle cx="50%" cy="50%" r="30%" fill="rgba(255, 50, 50, 0.03)" filter="blur(40px)" />
      )}
      
      {/* Geometric architectural abstraction (Hairlines) */}
      {type === 'shell' && (
        <rect x="20%" y="20%" width="60%" height="60%" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      )}
      {type === 'compute' && (
        <>
          <rect x="25%" y="25%" width="50%" height="50%" fill="none" stroke="rgba(0,200,255,0.15)" strokeWidth="0.5" />
          <path d="M 25% 25% L 75% 75% M 25% 75% L 75% 25%" stroke="rgba(0,200,255,0.05)" strokeWidth="0.5" />
        </>
      )}
      {type === 'gov' && (
        <path d="M 20% 50% L 50% 20% L 80% 50% L 50% 80% Z" fill="none" stroke="rgba(255,50,50,0.15)" strokeWidth="0.5" />
      )}
      
      {/* Corner crosshairs (viewBox 0–100; no calc() in path d) */}
      <path d="M 1 3 L 1 1 L 3 1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <path d="M 97 1 L 99 1 L 99 3" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <path d="M 1 97 L 1 99 L 3 99" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
      <path d="M 97 99 L 99 99 L 99 97" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function DataCenterProjection({ thesis, scale, aiMix }) {
  // Determine state from inputs (mocking up logic for visual)
  
  return (
    <div className={styles.projectionContainer}>
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'shell'}
      >
        <PlaceholderSVG type="shell" />
        <div className={styles.projectionLabel}>
          LONG LEASE CAMPUS <span style={{ opacity: 0.5 }}>{'//'}</span> {scale}MW
        </div>
      </div>
      
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'compute'}
      >
        <PlaceholderSVG type="compute" />
        <div className={styles.projectionLabel}>
          HIGH-DENSITY COMPUTE <span style={{ opacity: 0.5 }}>{'//'}</span> {scale}MW <span style={{ opacity: 0.5 }}>{'//'}</span> MIX: {aiMix}%
        </div>
      </div>
      
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'gov'}
      >
        <PlaceholderSVG type="gov" />
        <div className={styles.projectionLabel}>
          SOVEREIGN AI CLUSTER <span style={{ opacity: 0.5 }}>{'//'}</span> {scale}MW <span style={{ opacity: 0.5 }}>{'//'}</span> PERIMETER SECURED
        </div>
      </div>
    </div>
  );
}
