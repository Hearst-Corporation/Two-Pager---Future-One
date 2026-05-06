'use client';

import { useRef, useState } from 'react';

export default function MagneticButton({ children, href, style, ...props }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setHover(false);
  };

  const handleMouseEnter = () => {
    setHover(true);
  };

  const commonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    transition: hover ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    ...style,
  };

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={commonStyle}
        data-magnetic="true"
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={commonStyle}
      data-magnetic="true"
      {...props}
    >
      {children}
    </button>
  );
}