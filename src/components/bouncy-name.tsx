"use client";

import { motion, useAnimationControls } from "motion/react";

// Satu huruf: jatuh masuk, lompat kalau disentuh.
function Letter({ ch, i }: { ch: string; i: number }) {
  const hop = useAnimationControls();

  const jump = () =>
    hop.start({
      y: [0, -36, 0],
      rotate: [0, i % 2 ? 10 : -10, 0],
      scaleY: [1, 1.08, 0.9, 1],
      transition: { duration: 0.55, ease: "easeOut" },
    });

  return (
    <motion.span
      className="inline-block"
      initial={{ y: -220, opacity: 0, rotate: i % 2 ? 25 : -25 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 12, delay: 0.5 + i * 0.07 }}
    >
      <motion.span
        className="inline-block cursor-default select-none"
        animate={hop}
        onHoverStart={jump}
        onTap={jump}
        whileHover={{ color: "#8b4fd6" }}
      >
        {ch}
      </motion.span>
    </motion.span>
  );
}

export default function BouncyName({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} aria-label={text} role="text">
      {text.split("").map((ch, i) => (
        <Letter key={i} ch={ch} i={i} />
      ))}
    </span>
  );
}
