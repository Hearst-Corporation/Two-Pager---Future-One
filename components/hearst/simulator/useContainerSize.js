'use client';
import { useState, useEffect, useRef } from 'react';

// Measures an element via ResizeObserver. Returns [ref, { width, height }].
// Avoids recharts ResponsiveContainer, whose first render logs a width(-1)/height(-1)
// warning before its own observer fires. Here the chart mounts only once size > 0.
export function useContainerSize() {
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}
