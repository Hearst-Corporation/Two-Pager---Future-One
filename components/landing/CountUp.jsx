'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 → `to` once it scrolls into view.
 * Supports `prefix`/`suffix` (e.g. "100", "K") and a `format` callback
 * for custom rendering ("100 K", "24/7").
 */
export default function CountUp({
  to,
  duration = 1600,
  prefix = '',
  suffix = '',
  format,
  decimals = 0,
  style,
  className,
}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            if (reduceMotion) {
              setValue(to);
              obs.disconnect();
              return;
            }
            const start = performance.now();
            const tick = (now) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - (1 - t) ** 3; // easeOutCubic
              setValue(to * eased);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  const display = format
    ? format(value)
    : `${prefix}${value.toFixed(decimals)}${suffix}`;

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}
