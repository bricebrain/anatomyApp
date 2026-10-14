import { useMemo, type CSSProperties } from 'react';

const SYMBOLS = ['💖', '✨', '💗', '🌸', '💕', '⭐'];

/**
 * Petite pluie de cœurs (purement décorative). Remonter le composant avec
 * une nouvelle `key` pour relancer l'animation.
 */
export default function Celebrate({ count = 22, originY = 45 }: { count?: number; originY?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const distance = 140 + Math.random() * 220;
        return {
          symbol: SYMBOLS[i % SYMBOLS.length],
          style: {
            '--x': '50%',
            '--y': `${originY}%`,
            '--dx': `${Math.cos(angle) * distance}px`,
            '--dy': `${Math.sin(angle) * distance - 80}px`,
            '--r': `${Math.random() * 120 - 60}deg`,
            '--s': `${18 + Math.random() * 18}px`,
            '--d': `${Math.random() * 120}ms`,
          } as CSSProperties,
        };
      }),
    [count, originY],
  );
  return (
    <div className="celebrate" aria-hidden>
      {pieces.map((piece, i) => (
        <span key={i} style={piece.style}>
          {piece.symbol}
        </span>
      ))}
    </div>
  );
}
