"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { burst } from "@/lib/confetti";

// Balon kecil yang naik di background. Bisa dipecahin.
const balloons = [
  { left: 4, size: 44, color: "#FFB3BD", dur: 17, delay: 0 },
  { left: 16, size: 32, color: "#AFCBFF", dur: 21, delay: 6 },
  { left: 31, size: 38, color: "#FFD889", dur: 19, delay: 11 },
  { left: 47, size: 30, color: "#C8A2FF", dur: 23, delay: 3 },
  { left: 60, size: 42, color: "#FFB3BD", dur: 18, delay: 9 },
  { left: 74, size: 34, color: "#AFCBFF", dur: 20, delay: 14 },
  { left: 88, size: 40, color: "#C8A2FF", dur: 16, delay: 5 },
  { left: 95, size: 28, color: "#FFD889", dur: 22, delay: 12 },
];

export default function SkyBalloons() {
  const reduce = useReducedMotion();
  // naik tiap kali dipecahin, biar balonnya respawn
  const [lives, setLives] = useState(() => balloons.map(() => 0));

  if (reduce) return null;

  const pop = (i: number, e: React.MouseEvent) => {
    burst(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    setLives((l) => l.map((v, j) => (j === i ? v + 1 : v)));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {balloons.map((b, i) => (
        <AnimatePresence key={i}>
          <motion.button
            key={lives[i]}
            type="button"
            tabIndex={-1}
            onClick={(e) => pop(i, e)}
            className="pointer-events-auto absolute bottom-0 cursor-pointer"
            style={{ left: `${b.left}%` }}
            initial={{ y: "20vh" }}
            animate={{ y: "-120vh", x: [0, 18, -12, 10, 0] }}
            exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.15 } }}
            transition={{
              y: { duration: b.dur, delay: lives[i] ? 2 : b.delay, repeat: Infinity, ease: "linear" },
              x: { duration: b.dur / 3, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <svg width={b.size} height={b.size * 2} viewBox="0 0 40 80">
              <ellipse cx="20" cy="22" rx="17" ry="21" fill={b.color} />
              <ellipse cx="13" cy="14" rx="4" ry="7" fill="#fff" opacity="0.55" />
              <path d="M17 43 L20 40 L23 43 Z" fill={b.color} />
              <path d="M20 43 C 15 55, 25 62, 19 80" stroke="#642CA9" strokeOpacity="0.4" fill="none" />
            </svg>
          </motion.button>
        </AnimatePresence>
      ))}
    </div>
  );
}
