"use client";

import { AnimatePresence, motion } from "motion/react";

type Props = {
  blown: boolean;
  digits: string;
  // 0..1, seberapa kencang tiupan dari mic; apinya ikut miring
  wind?: number;
};

// Kue dua tingkat dengan lilin angka di atasnya.
export default function Cake({ blown, digits, wind = 0 }: Props) {
  const chars = digits.split("");
  const gap = 64;
  const startX = 160 - ((chars.length - 1) * gap) / 2;

  return (
    <svg viewBox="0 0 320 300" className="h-auto w-full" aria-hidden="true">
      <defs>
        <radialGradient id="flame-grad" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="55%" stopColor="#FFD889" />
          <stop offset="100%" stopColor="#ff9f6b" />
        </radialGradient>
      </defs>

      {/* piring */}
      <ellipse cx="160" cy="268" rx="150" ry="18" fill="#fffaf6" />
      <ellipse cx="160" cy="264" rx="138" ry="12" fill="#fff" />

      {/* tingkat bawah */}
      <rect x="36" y="178" width="248" height="88" rx="20" fill="#FFB3BD" />
      <path
        d="M36 198 Q36 178 56 178 H264 Q284 178 284 198 V206 q-10 14 -20 0 q-12 22 -24 0 q-10 12 -22 0 q-12 20 -26 0 q-10 12 -20 0 q-12 18 -24 0 q-10 12 -22 0 q-12 20 -24 0 q-10 12 -22 0 q-10 16 -20 0 Z"
        fill="#fffaf6"
      />
      {[
        [70, 232, "#AFCBFF", 20],
        [104, 246, "#C8A2FF", -30],
        [140, 228, "#FFD889", 45],
        [178, 244, "#AFCBFF", -15],
        [214, 230, "#C8A2FF", 30],
        [248, 246, "#FFD889", -40],
      ].map(([x, y, c, r], i) => (
        <rect
          key={i}
          x={x as number}
          y={y as number}
          width="12"
          height="5"
          rx="2.5"
          fill={c as string}
          transform={`rotate(${r} ${(x as number) + 6} ${(y as number) + 2.5})`}
        />
      ))}

      {/* tingkat atas */}
      <rect x="78" y="118" width="164" height="68" rx="18" fill="#C8A2FF" />
      <path
        d="M78 136 Q78 118 96 118 H224 Q242 118 242 136 V142 q-9 12 -18 0 q-10 18 -20 0 q-9 10 -18 0 q-10 16 -22 0 q-9 10 -18 0 q-10 16 -20 0 q-9 10 -18 0 q-9 14 -18 0 Z"
        fill="#fffaf6"
      />

      {/* lilin angka */}
      {chars.map((ch, i) => {
        const x = startX + i * gap;
        return (
          <g key={i}>
            <text
              x={x}
              y={124}
              textAnchor="middle"
              fontSize="84"
              fill={i % 2 === 0 ? "#AFCBFF" : "#FFD889"}
              stroke="#642CA9"
              strokeWidth="4"
              paintOrder="stroke"
              style={{ fontFamily: "var(--font-bagel)" }}
            >
              {ch}
            </text>
            <line x1={x} y1={60} x2={x} y2={50} stroke="#642CA9" strokeWidth="2.5" strokeLinecap="round" />

            <AnimatePresence>
              {!blown && (
                <motion.g
                  key="flame"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.25, delay: i * 0.12 } }}
                  style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
                >
                  <motion.g
                    animate={{ skewX: wind * -35, scaleY: 1 - wind * 0.45 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
                  >
                  <g className="flame" style={{ transformBox: "fill-box" }}>
                    <path
                      d={`M${x} 18 C${x + 9} 30 ${x + 11} 38 ${x} 50 C${x - 11} 38 ${x - 9} 30 ${x} 18 Z`}
                      fill="url(#flame-grad)"
                    />
                  </g>
                  </motion.g>
                </motion.g>
              )}
            </AnimatePresence>

            {blown &&
              [0, 1, 2].map((p) => (
                <motion.circle
                  key={p}
                  cx={x + (p - 1) * 4}
                  cy={46}
                  r={5}
                  fill="#642CA9"
                  initial={{ opacity: 0.35, y: 0, scale: 0.6 }}
                  animate={{ opacity: 0, y: -46, x: (p - 1) * 10, scale: 1.8 }}
                  transition={{ duration: 1.4, delay: i * 0.12 + p * 0.15, ease: "easeOut" }}
                />
              ))}
          </g>
        );
      })}
    </svg>
  );
}
