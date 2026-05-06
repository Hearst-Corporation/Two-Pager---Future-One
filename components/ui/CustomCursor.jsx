'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const moveCursor = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      
      const target = e.target;
      const isInteractive = target.closest('a, button, [data-magnetic], input, textarea, select');
      setHovering(!!isInteractive);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          cursor: none !important;
        }
      `}} />
      
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 16, // Légèrement plus gros (avant c'était 12)
          height: 16,
          pointerEvents: 'none',
          zIndex: 9999,
          // Le parent gère la position instantanément (décalage de la moitié de la taille : 8px)
          transform: `translate3d(${pos.x - 8}px, ${pos.y - 8}px, 0)`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            // Toujours rouge pour être bien visible partout
            backgroundColor: 'var(--color-accent-strong)',
            borderRadius: '50%',
            // L'enfant gère l'échelle avec transition
            transform: `scale(${clicked ? 0.8 : hovering ? 2.5 : 1})`,
            transition: 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
            // On ajoute une légère transparence au survol pour voir ce qu'il y a en dessous
            opacity: hovering ? 0.8 : 1,
          }}
        />
      </div>
    </>
  );
}