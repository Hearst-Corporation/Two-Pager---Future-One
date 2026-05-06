'use client';

import { useEffect, useRef, useState } from 'react';

export default function TextReveal({ children, delay = 0, type = 'word' }) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setRevealed(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  if (typeof children !== 'string') {
    return <span ref={ref}>{children}</span>;
  }

  const items = type === 'word' ? children.split(' ') : children.split('');

  return (
    <span ref={ref} style={{ display: 'inline-block' }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'bottom',
            marginRight: type === 'word' ? '0.25em' : '0',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: revealed ? 'translateY(0)' : 'translateY(100%)',
              transition: `transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * (type === 'word' ? 40 : 20)}ms`,
            }}
          >
            {item === ' ' ? '\u00A0' : item}
          </span>
        </span>
      ))}
    </span>
  );
}