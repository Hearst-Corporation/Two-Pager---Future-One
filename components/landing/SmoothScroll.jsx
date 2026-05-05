'use client';

import { useEffect, useRef } from 'react';

export default function SmoothScroll({ children }) {
  const scrollingContainerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    // Disable smooth scroll if user prefers reduced motion
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const content = contentRef.current;
    if (!content) return;
    
    let rafId;
    let currentY = window.scrollY;
    let targetY = window.scrollY;

    const onScroll = () => {
      targetY = window.scrollY;
    };

    const update = () => {
      // Lerp
      currentY += (targetY - currentY) * 0.08; 
      
      // Optimization: only update DOM if difference is noticeable
      if (Math.abs(targetY - currentY) > 0.01) {
        content.style.transform = `translate3d(0, -${currentY}px, 0)`;
      }
      
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    // Keep body height synced with content height
    const resizeObserver = new ResizeObserver(() => {
      document.body.style.height = `${content.getBoundingClientRect().height}px`;
    });
    resizeObserver.observe(content);

    // Initial setup
    document.body.style.height = `${content.getBoundingClientRect().height}px`;
    content.style.position = 'fixed';
    content.style.top = '0';
    content.style.left = '0';
    content.style.width = '100%';
    content.style.willChange = 'transform';

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      document.body.style.height = '';
      if (content) {
        content.style.position = '';
        content.style.top = '';
        content.style.left = '';
        content.style.width = '';
        content.style.transform = '';
        content.style.willChange = '';
      }
    };
  }, []);

  return (
    <div ref={scrollingContainerRef}>
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
}