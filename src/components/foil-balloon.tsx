"use client";

import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { burstFrom } from "@/lib/confetti";

// Balon foil angka: miring ngikutin kursor, bisa di-drag, ditap = confetti.
export default function FoilBalloon({ value }: { value: string }) {
  const reduce = useReducedMotion();
  const squish = useAnimationControls();
  const btnRef = useRef<HTMLButtonElement>(null);
  // drag cuma buat mouse, biar di HP tetap bisa scroll lewat balon
  // (komponen ini cuma dirender di client setelah gerbang dibuka)
  const [canDrag] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
  );

  // posisi pointer relatif ke tengah layar, -1..1
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 120, damping: 14 };
  const rotateY = useSpring(useTransform(px, [-1, 1], [-18, 18]), spring);
  const rotateX = useSpring(useTransform(py, [-1, 1], [12, -12]), spring);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduce]);

  const pop = () => {
    if (btnRef.current) burstFrom(btnRef.current);
    squish.start({
      scaleX: [1, 1.12, 0.94, 1],
      scaleY: [1, 0.88, 1.06, 1],
      transition: { duration: 0.5 },
    });
  };

  const textProps = {
    x: 200,
    y: 250,
    textAnchor: "middle" as const,
    fontSize: 290,
    style: { fontFamily: "var(--font-bagel)", letterSpacing: "-0.04em" },
  };

  return (
    <motion.div
      className="relative w-full max-w-[520px]"
      style={{ perspective: 900 }}
      initial={{ y: 260, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.3 }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -16, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
      <motion.button
        ref={btnRef}
        type="button"
        onTap={pop}
        animate={squish}
        drag={canDrag}
        dragSnapToOrigin
        dragElastic={0.35}
        dragTransition={{ bounceStiffness: 260, bounceDamping: 9 }}
        whileDrag={{ scale: 1.06, cursor: "grabbing" }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        aria-label={`Balon angka ${value}, tap buat confetti`}
        className="block w-full cursor-pointer rounded-[40px] pointer-fine:cursor-grab"
      >
        <svg viewBox="0 0 400 420" className="h-auto w-full overflow-visible">
          <defs>
            <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFB3BD" />
              <stop offset="28%" stopColor="#fff1f4" />
              <stop offset="45%" stopColor="#C8A2FF" />
              <stop offset="62%" stopColor="#AFCBFF" />
              <stop offset="78%" stopColor="#fff6e0" />
              <stop offset="100%" stopColor="#FFB3BD" />
            </linearGradient>
            <linearGradient id="foil-edge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe4ea" />
              <stop offset="100%" stopColor="#c8a2ff" />
            </linearGradient>
            <linearGradient
              id="sheen"
              gradientUnits="userSpaceOnUse"
              x1="-200"
              y1="0"
              x2="0"
              y2="120"
            >
              <stop offset="0%" stopColor="#fff" stopOpacity="0" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              {!reduce && (
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  values="-100 0; 700 0; 700 0"
                  keyTimes="0; 0.45; 1"
                  dur="4.5s"
                  repeatCount="indefinite"
                />
              )}
            </linearGradient>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* tali pita */}
          <path
            d="M140 250 C 128 300, 162 330, 146 365 S 140 400, 152 420"
            fill="none"
            stroke="#642CA9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M300 250 C 314 300, 282 335, 298 370 S 306 405, 292 420"
            fill="none"
            stroke="#642CA9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* bayangan */}
          <text {...textProps} fill="#642CA9" opacity="0.18" filter="url(#soft-shadow)" dx="8" dy="14">
            {value}
          </text>
          {/* badan balon: stroke tebal bikin kesan menggembung */}
          <text
            {...textProps}
            fill="url(#foil)"
            stroke="url(#foil-edge)"
            strokeWidth="18"
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {value}
          </text>
          {/* kilau yang lewat */}
          <text {...textProps} fill="url(#sheen)">
            {value}
          </text>
          {/* garis sambungan foil */}
          <text
            {...textProps}
            fill="none"
            stroke="#fff"
            strokeOpacity="0.7"
            strokeWidth="2.5"
            strokeLinejoin="round"
          >
            {value}
          </text>
        </svg>
      </motion.button>
      </motion.div>
    </motion.div>
  );
}
