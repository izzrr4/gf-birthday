"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { person, scrapbook, type Photo } from "@/data/config";
import Lightbox from "./lightbox";

/*
  Posisi di desktop dalam % dari buku (rasio 16:10, halaman kiri 0–50%, kanan 50–100%).
  mw = lebar di HP. Urutan sama dengan `scrapbook` di config.
*/
const layout = [
  { x: 6, y: 6, w: 19, mw: 64, rot: -4, tape: "center" },
  { x: 24, y: 63, w: 23, mw: 84, rot: 5, tape: "corners" },
  { x: 55, y: 8, w: 24, mw: 84, rot: -3, tape: "corners" },
  { x: 76, y: 22, w: 18, mw: 64, rot: 4, tape: "center" },
] as const;

const tapeColors = ["#FFB3BD", "#AFCBFF", "#FFD889", "#C8A2FF"];

// Selotip washi: ujungnya bergerigi, agak transparan
function Tape({ color, className, delay }: { color: string; className: string; delay: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute z-10 h-6 w-20 opacity-80 ${className}`}
      style={{
        backgroundColor: color,
        clipPath:
          "polygon(0 8%, 6% 0, 12% 10%, 18% 0, 24% 8%, 100% 0, 94% 50%, 100% 100%, 88% 92%, 82% 100%, 76% 90%, 0 100%, 5% 50%)",
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    />
  );
}

type ItemProps = {
  photo: Photo;
  index: number;
  inView: boolean;
  canDrag: boolean;
  bookRef: React.RefObject<HTMLDivElement | null>;
  z: number;
  onFront: () => void;
  onOpen: (el: HTMLElement) => void;
};

function ScrapItem({ photo, index, inView, canDrag, bookRef, z, onFront, onOpen }: ItemProps) {
  const l = layout[index % layout.length];
  const delay = 0.3 + index * 0.35;
  const tape = tapeColors[index % tapeColors.length];
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      className={`relative w-(--mw) md:absolute md:top-(--y) md:left-(--x) md:w-(--w) ${
        index % 2 ? "mr-3 self-end md:mr-0" : "ml-3 self-start md:ml-0"
      }`}
      style={
        {
          "--x": `${l.x}%`,
          "--y": `${l.y}%`,
          "--w": `${l.w}%`,
          "--mw": `${l.mw}%`,
          zIndex: z,
        } as React.CSSProperties
      }
      // "ditempel": jatuh dari atas, sedikit kebesaran, lalu nempel
      initial={{ opacity: 0, scale: 1.25, y: -40, rotate: l.rot * 3 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0, rotate: l.rot } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
      drag={canDrag}
      dragConstraints={bookRef}
      dragElastic={0.08}
      dragMomentum={false}
      whileDrag={{ scale: 1.05, rotate: 0, cursor: "grabbing" }}
      whileHover={canDrag ? { scale: 1.02 } : undefined}
      onPointerDown={onFront}
      onTap={() => ref.current && onOpen(ref.current)}
      tabIndex={0}
      role="button"
      aria-label={`Buka foto: ${photo.alt}`}
    >
      {l.tape === "center" ? (
        <Tape color={tape} delay={delay + 0.35} className="-top-3 left-1/2 -ml-10 -rotate-3" />
      ) : (
        <>
          <Tape color={tape} delay={delay + 0.35} className="-top-2 -left-6 -rotate-[35deg]" />
          <Tape color={tape} delay={delay + 0.45} className="-right-6 -bottom-1 -rotate-[35deg]" />
        </>
      )}

      <div className="bg-white p-1.5 shadow-[0_12px_24px_-14px_rgba(100,44,169,0.7)] pointer-fine:cursor-grab">
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="(max-width: 768px) 86vw, 300px"
          className="pointer-events-none h-auto w-full select-none"
          draggable={false}
        />
      </div>
      {photo.caption && (
        <p className="mt-1 text-center font-hand text-[1.7rem] leading-none text-plum">{photo.caption}</p>
      )}
    </motion.div>
  );
}

// Stiker kecil: cuma di desktop, bisa digeser juga
function Sticker({
  children,
  x,
  y,
  delay,
  inView,
  canDrag,
  bookRef,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  delay: number;
  inView: boolean;
  canDrag: boolean;
  bookRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute z-30 hidden md:block pointer-fine:cursor-grab"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, rotate: -40 }}
      animate={inView ? { scale: 1, rotate: 0 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 12, delay }}
      drag={canDrag}
      dragConstraints={bookRef}
      dragMomentum={false}
      whileDrag={{ scale: 1.2, cursor: "grabbing" }}
      whileHover={{ rotate: 12, scale: 1.1 }}
    >
      {children}
    </motion.div>
  );
}

const Heart = ({ color }: { color: string }) => (
  <svg width="44" height="40" viewBox="0 0 44 40">
    <path
      d="M22 38 C 8 28, 2 20, 2 12 C 2 5, 8 2, 13 2 C 17 2, 20 4, 22 8 C 24 4, 27 2, 31 2 C 36 2, 42 5, 42 12 C 42 20, 36 28, 22 38 Z"
      fill={color}
      stroke="#642CA9"
      strokeWidth="2.5"
    />
  </svg>
);

const Star = ({ color, size = 44 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 44 44">
    <path
      d="M22 3 L27 16 L41 17 L30 26 L34 40 L22 32 L10 40 L14 26 L3 17 L17 16 Z"
      fill={color}
      stroke="#642CA9"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Scrapbook() {
  const bookRef = useRef<HTMLDivElement>(null);
  const inView = useInView(bookRef, { once: true, amount: 0.25 });
  const [open, setOpen] = useState<number | null>(null);
  const [from, setFrom] = useState<DOMRect | null>(null);
  // foto yang terakhir disentuh naik ke paling atas
  const [order, setOrder] = useState(() => scrapbook.map((_, i) => i));
  // geser-geser cuma buat mouse di layout buku terbuka (md+). Di layout satu kolom,
  // drag bikin posisi foto ikut di-rescale tiap tinggi halaman berubah.
  const [canDrag] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine) and (min-width: 768px)").matches,
  );

  const toFront = (i: number) => setOrder((o) => [...o.filter((v) => v !== i), i]);
  const stickerProps = { inView, canDrag, bookRef };
  const lastDelay = 0.3 + scrapbook.length * 0.35;

  return (
    <>
      <div
        ref={bookRef}
        className="relative mx-auto flex max-w-5xl flex-col gap-10 rounded-md bg-paper px-5 py-10 shadow-[0_30px_60px_-30px_rgba(100,44,169,0.6)] md:block md:aspect-[16/10] md:p-0"
        style={{
          // kertas bergaris kotak
          backgroundImage:
            "linear-gradient(rgba(200,162,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(200,162,255,0.22) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      >
        {/* punggung buku */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-16 -translate-x-1/2 md:block"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(100,44,169,0.10) 42%, rgba(100,44,169,0.22) 50%, rgba(100,44,169,0.10) 58%, transparent)",
          }}
        />

        {/* catatan tangan */}
        <motion.p
          className="relative z-20 self-center text-center font-hand text-5xl leading-[0.9] text-plum md:absolute md:top-[14%] md:left-[31%] md:w-[16%] md:self-auto"
          initial={{ opacity: 0, rotate: -6 }}
          animate={inView ? { opacity: 1, rotate: -6 } : undefined}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Happy {person.ageOrdinal}, {person.nickname}!
          <svg className="mx-auto mt-1 block" width="120" height="14" viewBox="0 0 120 14" aria-hidden="true">
            <motion.path
              d="M2 9 C 20 2, 40 13, 60 7 S 100 2, 118 8"
              fill="none"
              stroke="#FFB3BD"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : undefined}
              transition={{ delay: 0.6, duration: 0.8 }}
            />
          </svg>
        </motion.p>

        {scrapbook.map((p, i) => (
          <ScrapItem
            key={p.src}
            photo={p}
            index={i}
            inView={inView}
            canDrag={canDrag}
            bookRef={bookRef}
            z={10 + order.indexOf(i)}
            onFront={() => toFront(i)}
            onOpen={(el) => {
              setFrom(el.getBoundingClientRect());
              setOpen(i);
            }}
          />
        ))}

        <motion.p
          className="relative z-20 self-center text-center font-hand text-4xl leading-[0.95] text-plum md:absolute md:top-[62%] md:left-[54%] md:w-[20%] md:self-auto"
          initial={{ opacity: 0, rotate: 3 }}
          animate={inView ? { opacity: 1, rotate: 3 } : undefined}
          transition={{ delay: lastDelay, duration: 0.6 }}
        >
          kapan-kapan photobox lagi ya
        </motion.p>

        <Sticker x={40} y={44} delay={lastDelay + 0.1} {...stickerProps}>
          <Heart color="#FFB3BD" />
        </Sticker>
        <Sticker x={9} y={68} delay={lastDelay + 0.2} {...stickerProps}>
          <Star color="#FFD889" />
        </Sticker>
        <Sticker x={60} y={80} delay={lastDelay + 0.3} {...stickerProps}>
          <div className="grid size-16 -rotate-12 place-items-center rounded-full bg-lilac font-display text-2xl text-paper ring-[3px] ring-plum">
            {person.age}
          </div>
        </Sticker>
        <Sticker x={90} y={78} delay={lastDelay + 0.4} {...stickerProps}>
          <Star color="#AFCBFF" size={36} />
        </Sticker>
        <Sticker x={47} y={6} delay={lastDelay + 0.5} {...stickerProps}>
          <Heart color="#C8A2FF" />
        </Sticker>
      </div>

      <p className="mt-4 text-center text-sm">
        <span className="hidden pointer-fine:inline">Fotonya bisa digeser-geser. </span>
        Tap fotonya buat lihat lebih jelas.
      </p>

      <Lightbox items={scrapbook} open={open} from={from} onChange={setOpen} />
    </>
  );
}
