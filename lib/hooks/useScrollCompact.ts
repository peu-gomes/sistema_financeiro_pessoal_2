'use client';

import { useEffect, useRef, useState } from 'react';

export function useScrollCompact(threshold = 150): boolean {
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Histerese simples para evitar "liga/desliga" perto do threshold.
    // Ex.: compacta acima de threshold, e só volta ao normal alguns px abaixo.
    const hysteresisPx = 24;

    const apply = () => {
      rafRef.current = null;
      const y = window.scrollY;
      const next = compactRef.current
        ? y > threshold - hysteresisPx
        : y > threshold;

      if (next !== compactRef.current) {
        compactRef.current = next;
        setCompact(next);
      }
    };

    const handleScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [threshold]);

  return compact;
}
