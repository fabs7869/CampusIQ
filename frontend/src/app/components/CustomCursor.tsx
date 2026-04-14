'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Faster spring for real-time tracking
  const springConfig = { damping: 20, stiffness: 600, mass: 0.4 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    // Check if the device has a mouse/pointer
    const touchQuery = window.matchMedia('(pointer: fine)');
    setIsMobile(!touchQuery.matches);

    const moveMouse = (e: MouseEvent) => {
      cursorX.set(e.clientX - 10);
      cursorY.set(e.clientY - 10);
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    if (touchQuery.matches) {
      window.addEventListener('mousemove', moveMouse);
      window.addEventListener('mouseover', handleHover);
    }

    return () => {
      window.removeEventListener('mousemove', moveMouse);
      window.removeEventListener('mouseover', handleHover);
    };
  }, [cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-5 h-5 bg-blue-500 rounded-full pointer-events-none z-[9999] mix-blend-difference shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        style={{
          x: cursorX,
          y: cursorY,
          scale: isHovering ? 2 : 1,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-10 h-10 border border-blue-400 rounded-full pointer-events-none z-[9998] opacity-50"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: -10,
          translateY: -10,
          scale: isHovering ? 1.4 : 1,
        }}
      />
    </>
  );
}
