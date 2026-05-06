'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Wraps children in a div that fades + slides into view when it enters the
 * viewport. Used for scroll-reveal across the landing page.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  as: Tag = 'div',
  style,
  className,
  threshold = 0.15,
  once = true,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) obs.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 0.8s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform 0.9s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  );
}
