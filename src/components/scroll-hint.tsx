"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

// Ajakan scroll ke galeri. Muncul setelah animasi hero, hilang begitu mulai scroll.
export default function ScrollHint({ targetId, delay }: { targetId: string; delay: number }) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setHidden(y > 80));

  const go = () => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          type="button"
          onClick={go}
          className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 px-4 py-2 text-plum"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay, duration: 0.5 } }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="font-semibold whitespace-nowrap">Scroll ke bawah, ada yang cantik</span>
          <motion.svg
            width="22"
            height="28"
            viewBox="0 0 22 28"
            fill="none"
            aria-hidden="true"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M11 2 V24 M3 16 L11 24 L19 16"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
