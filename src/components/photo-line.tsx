"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { photos } from "@/data/config";
import Lightbox from "./lightbox";

// Kemiringan tiap polaroid, fixed biar ga beda antara server & client
const tilts = [
  [-4, 2],
  [3, -3],
  [-2, 4],
  [4, -2],
  [-3, 3],
  [2, -4],
];

export default function PhotoLine() {
  const [open, setOpen] = useState<number | null>(null);
  const [from, setFrom] = useState<DOMRect | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, { once: true, amount: 0.3 });
  const n = photos.length;

  const openAt = (i: number, el: HTMLElement) => {
    setFrom(el.getBoundingClientRect());
    setOpen(i);
  };

  return (
    <>
      <div
        ref={rowRef}
        className="-mx-4 overflow-x-auto px-4 pt-2 pb-12 md:mx-0 md:overflow-visible md:px-0"
      >
        <div className="relative w-max md:w-full">
          {/* tali: lurus di HP, melengkung di desktop.
              Revealnya pakai clip-path (bukan pathLength) karena SVG-nya di-stretch,
              pathLength bikin garisnya putus-putus. */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 h-4 md:h-[120px]"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: inView ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <svg className="h-full w-full md:hidden" viewBox="0 0 100 16" preserveAspectRatio="none">
              <path
                d="M0,8 Q50,14 100,8"
                fill="none"
                stroke="#642CA9"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <svg className="hidden h-full w-full md:block" viewBox="0 0 100 80" preserveAspectRatio="none">
              <path
                d="M0,10 Q50,70 100,10"
                fill="none"
                stroke="#642CA9"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </motion.div>

          <ul
            className="relative flex gap-6 md:grid md:gap-4"
            style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
          >
            {photos.map((p, i) => {
              const t = (i + 0.5) / n;
              // posisi y di kurva Q (tinggi 120px / 80 unit); tali lewat 10px dari atas jepitan
              const drop = 1.5 * (10 + 120 * t * (1 - t)) - 10;
              const [a, b] = tilts[i % tilts.length];
              return (
                <motion.li
                  key={p.src}
                  className="flex w-44 shrink-0 justify-center md:mt-(--drop) md:w-auto"
                  style={{ "--drop": `${drop}px` } as React.CSSProperties}
                  initial={{ opacity: 0, y: -80, rotate: a * 3 }}
                  animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
                  transition={{
                    type: "spring",
                    stiffness: 180,
                    damping: 11,
                    delay: 0.5 + i * 0.12,
                  }}
                >
                  <div
                    className="sway flex w-full flex-col items-center"
                    style={
                      {
                        "--tilt-a": `${a}deg`,
                        "--tilt-b": `${b}deg`,
                        "--sway-dur": `${4 + (i % 3)}s`,
                        "--sway-delay": `${-i * 0.7}s`,
                      } as React.CSSProperties
                    }
                  >
                    {/* jepitan: menjepit tali, polaroid gantung di bawah tali biar talinya ga ketutup */}
                    <span className="relative z-10 h-9 w-3 rounded-sm bg-butter ring-2 ring-plum" />
                    <motion.button
                      type="button"
                      onClick={(e) => openAt(i, e.currentTarget)}
                      aria-label={`Buka foto ${i + 1}`}
                      whileHover={{ y: -6, rotate: b, scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 18,
                      }}
                      className="-mt-3 w-full max-w-44 cursor-zoom-in bg-white p-2 pb-8 shadow-[0_10px_24px_-12px_rgba(100,44,169,0.55)]"
                    >
                      <div className="relative aspect-[5/6] w-full overflow-hidden bg-blush">
                        <Image
                          src={p.src}
                          alt={p.alt}
                          fill
                          sizes="176px"
                          className="object-cover object-top"
                          draggable={false}
                        />
                      </div>
                      {p.caption && (
                        <p className="mt-2 text-sm leading-tight text-plum">
                          {p.caption}
                        </p>
                      )}
                    </motion.button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>

      <Lightbox items={photos} open={open} from={from} onChange={setOpen} />
    </>
  );
}
