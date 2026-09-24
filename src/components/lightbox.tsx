"use client";

import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/data/config";

type Props = {
  items: Photo[];
  open: number | null;
  // posisi elemen yang ditap, biar fotonya terbang dari situ
  from: DOMRect | null;
  onChange: (i: number | null) => void;
};

// Lebar foto di lightbox: muat di layar, rasio asli foto dipertahankan
const frameWidth = (p: Photo) => {
  const byHeight = window.innerHeight * 0.72 * (p.width / p.height);
  return Math.min(window.innerWidth - 48, 640, byHeight);
};

export default function Lightbox({ items, open, from, onChange }: Props) {
  const [dir, setDir] = useState(0);
  const n = items.length;

  const step = useCallback(
    (d: number) => {
      if (open === null) return;
      setDir(d);
      onChange((open + d + n) % n);
    },
    [open, n, onChange],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, onChange]);

  const onSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) step(1);
    else if (info.offset.x > 60 || info.velocity.x > 400) step(-1);
  };

  if (typeof document === "undefined") return null;

  const photo = open === null ? null : items[open];
  const w = photo ? frameWidth(photo) : 0;
  const origin = from
    ? {
        x: from.left + from.width / 2 - window.innerWidth / 2,
        y: from.top + from.height / 2 - window.innerHeight / 2,
        scale: from.width / (w || 1),
      }
    : { x: 0, y: 60, scale: 0.6 };

  // portal biar lightbox ga kejebak stacking context section
  return createPortal(
    <AnimatePresence onExitComplete={() => setDir(0)}>
      {photo && open !== null && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-plum/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onChange(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${photo.alt}, ${open + 1} dari ${n}`}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ ...origin, rotate: -6 }}
            animate={{ x: 0, y: 0, scale: 1, rotate: -1.5 }}
            exit={{ ...origin, rotate: -6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.figure
                key={open}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ x: d * 260, rotate: d * 10, opacity: 0 }),
                  center: { x: 0, rotate: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d * -260, rotate: d * -10, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                drag="x"
                dragSnapToOrigin
                dragElastic={0.6}
                onDragEnd={onSwipe}
                style={{ width: w }}
                className="cursor-grab touch-pan-y bg-white p-3 pb-4 shadow-2xl active:cursor-grabbing"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 700px) 100vw, 640px"
                  className="pointer-events-none h-auto w-full bg-blush"
                  draggable={false}
                  priority
                />
                <figcaption className="mt-3 min-h-6 text-center font-hand text-2xl leading-none text-plum">
                  {photo.caption}
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Foto sebelumnya"
                className="grid size-11 place-items-center rounded-full bg-white text-xl text-plum transition hover:scale-110 active:scale-95"
              >
                ‹
              </button>
              <span className="min-w-14 rounded-full bg-white/80 px-3 py-1 text-center text-sm font-semibold text-plum">
                {open + 1} / {n}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Foto berikutnya"
                className="grid size-11 place-items-center rounded-full bg-white text-xl text-plum transition hover:scale-110 active:scale-95"
              >
                ›
              </button>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-4 right-4 rounded-full bg-white px-4 py-2 font-semibold text-plum transition hover:scale-105"
          >
            Tutup
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
