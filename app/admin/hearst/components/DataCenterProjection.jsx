'use client';

import styles from '../hearst.module.css';

// SVG placeholders for different visual states, simulating the cinematic crossfade
function PlaceholderSVG({ type }) {
  let color1 = "#1a1a1a";
  let color2 = "#0a0a0a";
  
  if (type === 'shell') {
    color1 = "#121A20";
    color2 = "#0A0D10";
  } else if (type === 'compute') {
    color1 = "#101D2A";
    color2 = "#050B12";
  } else if (type === 'gov') {
    color1 = "#201815";
    color2 = "#100A08";
  }

  return (
    <svg width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
        <pattern id={`grid-${type}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grad-${type})`} />
      <rect width="100%" height="100%" fill={`url(#grid-${type})`} />
      
      {/* Decorative center element based on thesis */}
      {type === 'shell' && (
        <rect x="30%" y="40%" width="40%" height="20%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      )}
      {type === 'compute' && (
        <>
          <rect x="25%" y="30%" width="15%" height="40%" fill="rgba(0,150,255,0.05)" stroke="rgba(0,150,255,0.2)" strokeWidth="1" />
          <rect x="42%" y="30%" width="15%" height="40%" fill="rgba(0,150,255,0.05)" stroke="rgba(0,150,255,0.2)" strokeWidth="1" />
          <rect x="59%" y="30%" width="15%" height="40%" fill="rgba(0,150,255,0.05)" stroke="rgba(0,150,255,0.2)" strokeWidth="1" />
        </>
      )}
      {type === 'gov' && (
        <path d="M 30% 70% L 50% 30% L 70% 70% Z" fill="none" stroke="rgba(255,50,50,0.1)" strokeWidth="3" />
      )}
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
        <div className={styles.projectionLabel}>Long Lease Campus // {scale}MW</div>
      </div>
      
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'compute'}
      >
        <PlaceholderSVG type="compute" />
        <div className={styles.projectionLabel}>High-Density Compute // {scale}MW // Mix {aiMix}%</div>
      </div>
      
      <div 
        className={styles.projectionState} 
        data-active={thesis === 'gov'}
      >
        <PlaceholderSVG type="gov" />
        <div className={styles.projectionLabel}>Sovereign AI Cluster // {scale}MW // Perimeter Secured</div>
      </div>
    </div>
  );
}
