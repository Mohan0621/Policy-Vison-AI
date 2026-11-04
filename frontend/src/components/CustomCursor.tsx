import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  const [isHovered, setIsHovered] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
      }

      // Check if target has data-cursor or is interactive
      const target = e.target as HTMLElement | null;
      const clickable = target?.closest('button, a, input, select, textarea, [data-cursor]');
      if (clickable) {
        setIsHovered(true);
        const label = clickable.getAttribute('data-cursor');
        setHoverLabel(label);
      } else {
        setIsHovered(false);
        setHoverLabel(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth sluggish float trailing at 60/120fps (lerp factor 0.24 for weighted viscous glide)
  useEffect(() => {
    let animId: number;
    const updateRing = () => {
      const targetX = mousePos.current.x;
      const targetY = mousePos.current.y;

      // Weighted sluggish lerp factor (0.24) - smooth fluid drag without the broken CSS lag
      ringPos.current.x += (targetX - ringPos.current.x) * 0.24;
      ringPos.current.y += (targetY - ringPos.current.y) * 0.24;

      if (ringRef.current) {
        const offset = isHovered ? 20 : 14;
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - offset}px, ${ringPos.current.y - offset}px, 0)`;
      }

      animId = requestAnimationFrame(updateRing);
    };

    animId = requestAnimationFrame(updateRing);
    return () => cancelAnimationFrame(animId);
  }, [isHovered]);

  // Don't render on mobile touch
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden">
      {/* Center point */}
      <div
        ref={dotRef}
        className="fixed w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50 pointer-events-none will-change-transform"
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      />

      {/* Trailing follower ring with smooth viscous drag */}
      <div
        ref={ringRef}
        className={`fixed flex items-center justify-center rounded-full border pointer-events-none will-change-transform transition-[width,height,background-color,border-color] duration-200 ease-out ${
          isHovered
            ? 'w-10 h-10 bg-orange-500/10 backdrop-blur-sm border-orange-500/60'
            : 'w-7 h-7 bg-orange-500/5 border-orange-400/50'
        }`}
        style={{ transform: 'translate3d(-100px, -100px, 0)' }}
      >
        {hoverLabel && (
          <span className="font-mono text-[9px] font-bold text-orange-600 uppercase tracking-tighter whitespace-nowrap">
            {hoverLabel}
          </span>
        )}
      </div>
    </div>
  );
};
