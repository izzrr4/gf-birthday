"use client";

import { toPng } from "html-to-image";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { person } from "@/data/config";

type Props = { open: boolean; onClose: () => void };

export default function WishModal({ open, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [wishText, setWishText] = useState("");
  const [saving, setSaving] = useState(false);

  // kartu miring 3D ngikutin pointer
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 18 });

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "wish-card.png";
      link.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-plum/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wish-title"
            className="relative w-full max-w-[440px] rounded-[28px] bg-paper p-5 shadow-2xl"
            initial={{ y: 80, scale: 0.9, rotate: 3 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            exit={{ y: 60, scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="absolute top-3 right-4 z-10 text-2xl text-plum/60 transition hover:rotate-90 hover:text-plum"
            >
              ×
            </button>

            <div style={{ perspective: 800 }} onPointerMove={onMove} onPointerLeave={onLeave}>
              <motion.div style={{ rotateX, rotateY }}>
                {/* Kartu yang di-download */}
                <div
                  ref={cardRef}
                  className="relative flex min-h-56 overflow-hidden rounded-2xl bg-blush"
                >
                  <div className="relative flex w-20 shrink-0 flex-col items-center justify-center border-r-[3px] border-dashed border-plum/40 bg-lilac font-display text-paper">
                    <span className="text-5xl leading-[0.9] [text-orientation:upright] [writing-mode:vertical-rl]">
                      {person.age}
                    </span>
                    {/* akhiran kecil: "st" dari "21st" */}
                    <span className="mt-1 text-lg leading-none">
                      {person.ageOrdinal.slice(String(person.age).length)}
                    </span>
                  </div>
                  <div className="relative flex flex-1 flex-col p-5">
                    <h2 id="wish-title" className="font-display text-2xl text-plum">
                      My Birthday Wish 🎀
                    </h2>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-plum/85">
                      {wishText ||
                        "Write your wish below... Anything, for yourself, your family, or whoever. Bebas."}
                    </p>
                    <p className="mt-4 text-xs text-plum/60">— from myself, {person.nickname}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <label htmlFor="wish" className="sr-only">
              Tulis wish
            </label>
            <textarea
              id="wish"
              className="mt-4 h-28 w-full resize-none rounded-2xl border-[3px] border-plum/30 bg-white p-3 text-plum transition outline-none focus:border-plum"
              placeholder="Write your wish..."
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
            />
            <p className="mt-1 text-xs text-[#c2185b]">*Relax, your wishes wont be shared to me (izra).</p>

            <div className="mt-4 flex gap-3">
              <motion.button
                type="button"
                onClick={downloadCard}
                disabled={saving}
                whileTap={{ scale: 0.96 }}
                className="flex-1 rounded-full bg-plum py-3 font-semibold text-white transition hover:bg-plum-dark disabled:opacity-60"
              >
                {saving ? "Downloading..." : "Download Wish Card"}
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.96 }}
                className="flex-1 rounded-full bg-plum/10 py-3 font-semibold text-plum transition hover:bg-plum/20"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
