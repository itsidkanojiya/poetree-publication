import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#fbbf24", "#f59e0b", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#ef4444", "#06b6d4"];
const COUNT = 70;

export function Confetti({ fire }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!fire) return;
    setPieces(
      Array.from({ length: COUNT }, (_, i) => {
        const size = 8 + Math.random() * 10;
        const isSquare = Math.random() > 0.4;
        return {
          id: i,
          x: (Math.random() - 0.5) * 120,
          y: -10 - Math.random() * 40,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: Math.random() * 360,
          width: size,
          height: isSquare ? size : size * 0.65,
          delay: Math.random() * 0.35,
          duration: 2.2 + Math.random() * 1.5,
        };
      })
    );
  }, [fire]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/3"
          style={{
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            borderRadius: p.width === p.height ? 2 : 1,
            boxShadow: "0 0 2px rgba(0,0,0,0.15)",
          }}
          initial={{
            x: p.x * 6,
            y: p.y * 3,
            rotate: p.rotation,
            opacity: 1,
          }}
          animate={{
            x: p.x * 12 + (Math.random() - 0.5) * 180,
            y: 350 + Math.random() * 250,
            rotate: p.rotation + 540,
            opacity: 0,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}
