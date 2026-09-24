"use client";

import { motion } from "motion/react";
import { useMusic } from "./music-context";

export default function MusicToggle() {
  const { playing, toggleMusic } = useMusic();

  return (
    <motion.button
      type="button"
      onClick={toggleMusic}
      aria-pressed={playing}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.92 }}
      className="fixed top-4 right-4 z-40 flex items-center gap-2 rounded-full bg-plum py-2 pr-4 pl-3 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(100,44,169,0.8)] hover:bg-plum-dark"
    >
      {/* equalizer kecil, gerak kalau musik nyala */}
      <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((b) => (
          <motion.span
            key={b}
            className="w-[3px] rounded-full bg-butter"
            animate={playing ? { height: ["30%", "100%", "45%", "85%", "30%"] } : { height: "30%" }}
            transition={
              playing ? { duration: 0.9 + b * 0.15, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }
            }
          />
        ))}
      </span>
      {playing ? "Berisik ah, matiin" : "Pengen berisik"}
    </motion.button>
  );
}
