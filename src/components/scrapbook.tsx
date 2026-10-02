"use client";

import Image from "next/image";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { useRef, useState, useSyncExternalStore } from "react";
import { letter, person, scrapbook } from "@/data/config";
import Lightbox from "./lightbox";

/*
  Halaman 1 punya dua tata letak:
  - desktop (md+): buku terbuka. page 0 = halaman kiri, page 1 = halaman kanan (lembar yang dibalik).
    x, y, w dalam % halaman itu.
  - HP: satu lembar kolase, m = { x, y, w } dalam % lembar.
  Urutan sama dengan `scrapbook` di config.
*/
const layout = [
  { page: 0, x: 12, y: 6, w: 38, rot: -4, tape: "center", m: { x: 5, y: 19, w: 40 } },
  { page: 0, x: 48, y: 63, w: 46, rot: 5, tape: "corners", m: { x: 47, y: 21, w: 50 } },
  { page: 1, x: 10, y: 8, w: 48, rot: -3, tape: "corners", m: { x: 4, y: 66, w: 52 } },
  { page: 1, x: 52, y: 22, w: 36, rot: 4, tape: "center", m: { x: 59, y: 50, w: 36 } },
] as const;

const tapeColors = ["#FFB3BD", "#AFCBFF", "#FFD889", "#C8A2FF"];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// md+ = buku terbuka, di bawahnya = satu lembar
const mdQuery = "(min-width: 768px)";
const subscribeMd = (cb: () => void) => {
  const mq = window.matchMedia(mdQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/* ---------- Balik halaman ---------- */

// progress 0 = halaman 1, 1 = halaman 2. Semua rotasi & bayangan diturunkan dari sini,
// jadi animasi tombol, swipe, dan tarik sudut halaman pakai jalur yang sama.
function usePageTurn() {
  const progress = useMotionValue(0);
  const [page, setPage] = useState<0 | 1>(0);
  // halaman 2 boleh lebih panjang dari halaman 1, tapi baru memanjang setelah lembarnya kebalik
  const [grown, setGrown] = useState(false);
  const reduce = useReducedMotion();
  const anim = useRef<AnimationPlaybackControls | null>(null);
  // tap yang sebenarnya akhir dari swipe jangan dianggap klik
  const justPanned = useRef(false);

  const to = (target: 0 | 1, velocity = 0) => {
    anim.current?.stop();
    setPage(target);
    const done = () => setGrown(target === 1);
    if (reduce) {
      progress.set(target);
      done();
      return;
    }
    anim.current = animate(progress, target, {
      type: "spring",
      stiffness: 60,
      damping: 14,
      velocity,
      restDelta: 0.001,
      onComplete: done,
    });
  };

  // vx = kecepatan jari dalam "lebar halaman per detik", negatif = ke kiri
  const release = (vx: number) => {
    const target = vx < -0.6 ? 1 : vx > 0.6 ? 0 : progress.get() > 0.5 ? 1 : 0;
    to(target, clamp(-vx / 2, -4, 4));
  };

  const grab = () => {
    anim.current?.stop();
    justPanned.current = true;
  };
  // tiap jari/mouse baru turun, anggap belum swipe
  const arm = () => {
    justPanned.current = false;
  };

  return { progress, page, grown, to, release, grab, arm, justPanned };
}

type Turn = ReturnType<typeof usePageTurn>;

// Rotasi lembar + gelap-terangnya. Sisi depan & belakang juga di-hide manual
// (selain backface-visibility) biar Safari ga bocor.
function useLeaf(progress: MotionValue<number>) {
  return {
    rotateY: useTransform(progress, [0, 1], [0, -180]),
    frontVis: useTransform(progress, (p) => (p > 0.5 ? "hidden" : "visible")),
    backVis: useTransform(progress, (p) => (p > 0.5 ? "visible" : "hidden")),
    frontShade: useTransform(progress, [0, 0.5], [0, 0.35]),
    backShade: useTransform(progress, [0.5, 1], [0.35, 0]),
  };
}

/* ---------- Potongan kecil ---------- */

// Selotip washi: ujungnya bergerigi, agak transparan
function Tape({ color, className, delay }: { color: string; className: string; delay: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute z-10 opacity-80 ${className}`}
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

// bayangan punggung buku di salah satu tepi halaman
function Spine({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{
        background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, rgb(100 44 169 / 0.2), rgb(100 44 169 / 0.06) 5%, transparent 12%)`,
      }}
    />
  );
}

// lapisan gelap yang ikut progress (cahaya ke lembar yang miring / bayangan lembar di halaman bawah)
function Shade({ opacity, from }: { opacity: MotionValue<number>; from?: "left" | "right" }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50"
      style={{
        opacity,
        background: from
          ? `linear-gradient(${from === "left" ? "90deg" : "270deg"}, rgb(79 35 133 / 0.45), transparent 55%)`
          : "rgb(79 35 133 / 0.5)",
      }}
    />
  );
}

// Sudut halaman yang dilipat: diklik = balik, ditarik (desktop) = halaman ngikutin mouse
function DogEar({
  side,
  label,
  onTurn,
  pan,
}: {
  side: "left" | "right";
  label: string;
  onTurn: () => void;
  pan?: {
    onPanStart: () => void;
    onPan: (e: PointerEvent) => void;
    onPanEnd: (e: PointerEvent, info: PanInfo) => void;
  };
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onTurn}
      {...pan}
      className={`dog-ear absolute bottom-0 z-40 size-(--fold) touch-none pointer-fine:cursor-grab ${
        side === "right" ? "right-0" : "left-0"
      }`}
    >
      <span
        className={`absolute inset-0 ${
          side === "right"
            ? "drop-shadow-[-3px_-3px_3px_rgb(100_44_169/0.22)]"
            : "drop-shadow-[3px_-3px_3px_rgb(100_44_169/0.22)]"
        }`}
      >
        <span className={`absolute inset-0 ${side === "right" ? "flap-right" : "flap-left"}`} />
      </span>
    </motion.button>
  );
}

// sudut terlipat sedikit membesar waktu di-hover / difokus, kayak mau diangkat
const foldVars =
  "[--fold:2.75rem] transition-[--fold] duration-300 has-[.dog-ear:hover]:[--fold:4rem] has-[.dog-ear:focus-visible]:[--fold:4rem]";

type PhotoProps = {
  inView: boolean;
  canDrag: boolean;
  order: number[];
  toFront: (i: number) => void;
  onOpen: (i: number, el: HTMLElement) => void;
};

function ScrapItem({
  index,
  compact,
  bounds,
  inView,
  canDrag,
  order,
  toFront,
  onOpen,
}: PhotoProps & { index: number; compact: boolean; bounds: React.RefObject<HTMLDivElement | null> }) {
  const photo = scrapbook[index];
  const l = layout[index % layout.length];
  const pos = compact ? l.m : l;
  const delay = 0.3 + index * 0.35;
  const tape = tapeColors[index % tapeColors.length];
  const ref = useRef<HTMLDivElement>(null);
  const draggable = canDrag && !compact;

  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`, zIndex: 10 + order.indexOf(index) }}
      // "ditempel": jatuh dari atas, sedikit kebesaran, lalu nempel
      initial={{ opacity: 0, scale: 1.25, y: -40, rotate: l.rot * 3 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0, rotate: l.rot } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
      drag={draggable}
      dragConstraints={bounds}
      dragElastic={0.08}
      dragMomentum={false}
      whileDrag={{ scale: 1.05, rotate: 0, cursor: "grabbing" }}
      whileHover={draggable ? { scale: 1.02 } : undefined}
      onPointerDown={() => toFront(index)}
      onTap={() => ref.current && onOpen(index, ref.current)}
      tabIndex={0}
      role="button"
      aria-label={`Buka foto: ${photo.alt}`}
    >
      {l.tape === "center" ? (
        <Tape
          color={tape}
          delay={delay + 0.35}
          className={`left-1/2 -translate-x-1/2 -rotate-3 ${compact ? "-top-2 h-4 w-12" : "-top-3 h-6 w-20"}`}
        />
      ) : (
        <>
          <Tape
            color={tape}
            delay={delay + 0.35}
            className={`-rotate-[35deg] ${compact ? "-top-1.5 -left-4 h-4 w-12" : "-top-2 -left-6 h-6 w-20"}`}
          />
          <Tape
            color={tape}
            delay={delay + 0.45}
            className={`-rotate-[35deg] ${compact ? "-right-4 -bottom-0.5 h-4 w-12" : "-right-6 -bottom-1 h-6 w-20"}`}
          />
        </>
      )}

      <div
        className={`bg-white shadow-[0_12px_24px_-14px_rgba(100,44,169,0.7)] ${
          compact ? "p-1" : "p-1.5"
        } ${draggable ? "cursor-grab" : ""}`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="(max-width: 768px) 50vw, 300px"
          className="pointer-events-none h-auto w-full select-none"
          draggable={false}
        />
      </div>
      {photo.caption && (
        <p
          className={`mt-1 text-center font-hand leading-none text-plum ${
            compact ? "text-[min(5.6vw,1.4rem)]" : "text-[1.7rem]"
          }`}
        >
          {photo.caption}
        </p>
      )}
    </motion.div>
  );
}

// Stiker kecil, bisa digeser juga (mouse)
function Sticker({
  children,
  x,
  y,
  delay,
  inView,
  canDrag,
  bounds,
}: {
  children: React.ReactNode;
  x: number;
  y: number;
  delay: number;
  inView: boolean;
  canDrag: boolean;
  bounds: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute z-30 ${canDrag ? "cursor-grab" : ""}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, rotate: -40 }}
      animate={inView ? { scale: 1, rotate: 0 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 12, delay }}
      drag={canDrag}
      dragConstraints={bounds}
      dragMomentum={false}
      whileDrag={{ scale: 1.2, cursor: "grabbing" }}
      whileHover={canDrag ? { rotate: 12, scale: 1.1 } : undefined}
    >
      {children}
    </motion.div>
  );
}

const Heart = ({ color, size = 44 }: { color: string; size?: number }) => (
  <svg width={size} height={(size * 40) / 44} viewBox="0 0 44 40">
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

const AgeBadge = ({ small }: { small?: boolean }) => (
  <div
    className={`grid -rotate-12 place-items-center rounded-full bg-lilac font-display text-paper ring-[3px] ring-plum ${
      small ? "size-12 text-xl" : "size-16 text-2xl"
    }`}
  >
    {person.age}
  </div>
);

// catatan tangan judul halaman 1
function TitleNote({ inView, className }: { inView: boolean; className: string }) {
  return (
    <motion.p
      className={`absolute z-20 text-center font-hand leading-[0.9] text-plum ${className}`}
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
  );
}

// Isi halaman 2. Jarak antar paragraf = satu garis (margin bawah, biar kolom kanan di desktop
// ga mulai dengan baris kosong), jadi tulisannya tetap di atas garis kertas.
function Letter({ className = "" }: { className?: string }) {
  return (
    <div className={`font-hand leading-(--line) text-plum ${className}`}>
      <p className="mb-(--line)">{letter.greeting}</p>
      {letter.paragraphs.map((p, i) => (
        <p key={i} className="mb-(--line)">
          {p}
        </p>
      ))}
      <p className="text-right">{letter.closing}</p>
      <p className="text-right">{letter.signature}</p>
    </div>
  );
}

/* ---------- Desktop: buku terbuka, lembar kanan dibalik di punggung buku ---------- */

function DesktopBook({ turn, photo }: { turn: Turn; photo: PhotoProps }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const leaf = useLeaf(turn.progress);
  // bayangan lembar yang lagi diangkat, jatuh di halaman bawahnya
  const rightShadow = useTransform(turn.progress, [0, 0.2, 0.5], [0, 1, 0]);
  const leftShadow = useTransform(turn.progress, [0.5, 0.8, 1], [0, 1, 0]);
  const pan = useRef({ spine: 0, half: 1 });
  const lastDelay = 0.3 + scrapbook.length * 0.35;
  const stickers = { inView: photo.inView, canDrag: photo.canDrag };

  // Tarik sudut: titik sudut halaman selalu pas di bawah kursor (proyeksinya = spine + half·cosθ)
  const cornerPan = {
    onPanStart: () => {
      const r = bookRef.current!.getBoundingClientRect();
      pan.current = { spine: r.left + r.width / 2, half: r.width / 2 };
      turn.grab();
    },
    onPan: (e: PointerEvent) => {
      const { spine, half } = pan.current;
      turn.progress.set(Math.acos(clamp((e.clientX - spine) / half, -1, 1)) / Math.PI);
    },
    onPanEnd: (_: PointerEvent, info: PanInfo) => turn.release(info.velocity.x / pan.current.half),
  };
  const turnTo = (target: 0 | 1) => () => {
    if (!turn.justPanned.current) turn.to(target);
  };

  return (
    <div
      ref={bookRef}
      onPointerDownCapture={turn.arm}
      className="relative mx-auto grid aspect-[16/10] max-w-5xl grid-cols-2 rounded-md shadow-[0_30px_60px_-30px_rgba(100,44,169,0.6)] perspective-[2600px]"
      style={{ "--line": "2.4rem", "--top": "4.8rem", "--margin": "2.25rem" } as React.CSSProperties}
    >
      {/* halaman 1 kiri */}
      <section
        ref={leftRef}
        aria-label="Halaman 1"
        inert={turn.page === 1}
        className="paper-grid relative isolate col-start-1 row-start-1 rounded-l-md"
      >
        <Spine side="right" />
        <TitleNote inView={photo.inView} className="top-[14%] left-[62%] w-[32%] text-5xl" />
        {layout.map((l, i) =>
          l.page === 0 ? <ScrapItem key={i} index={i} compact={false} bounds={leftRef} {...photo} /> : null,
        )}
        <Sticker x={80} y={44} delay={lastDelay + 0.1} bounds={leftRef} {...stickers}>
          <Heart color="#FFB3BD" />
        </Sticker>
        <Sticker x={18} y={68} delay={lastDelay + 0.2} bounds={leftRef} {...stickers}>
          <Star color="#FFD889" />
        </Sticker>
        <Sticker x={86} y={4} delay={lastDelay + 0.5} bounds={leftRef} {...stickers}>
          <Heart color="#C8A2FF" />
        </Sticker>
        <Shade opacity={leftShadow} from="right" />
      </section>

      {/* halaman 2 kanan: kelihatan setelah lembarnya dibalik */}
      <div className="paper-lined relative isolate col-start-2 row-start-1 rounded-r-md" aria-hidden="true">
        <Spine side="left" />
        <div className={`${turn.grown ? "relative" : "absolute inset-0"} overflow-hidden`}>
          {/* surat yang sama dengan sisi belakang lembar, digeser setengah: ini kolom keduanya */}
          <Letter className="-ml-[100%] w-[200%] columns-2 gap-x-24 px-12 pt-(--top) pb-12 text-[1.85rem]" />
        </div>
        <Shade opacity={rightShadow} from="left" />
      </div>

      {/* lembar yang dibalik: depan = halaman 1 kanan, belakang = halaman 2 kiri */}
      <motion.div
        className="absolute inset-y-0 left-1/2 z-10 w-1/2 origin-left transform-3d"
        style={{ rotateY: leaf.rotateY }}
      >
        <motion.section
          ref={frontRef}
          aria-label="Halaman 1, kanan"
          inert={turn.page === 1}
          className={`face isolate absolute inset-0 ${foldVars}`}
          style={{ visibility: leaf.frontVis }}
        >
          <div aria-hidden="true" className="paper-grid fold-right absolute inset-0 rounded-r-md" />
          <Spine side="left" />
          {layout.map((l, i) =>
            l.page === 1 ? <ScrapItem key={i} index={i} compact={false} bounds={frontRef} {...photo} /> : null,
          )}
          <motion.p
            className="absolute top-[62%] left-[8%] z-20 w-[40%] text-center font-hand text-4xl leading-[0.95] text-plum"
            initial={{ opacity: 0, rotate: 3 }}
            animate={photo.inView ? { opacity: 1, rotate: 3 } : undefined}
            transition={{ delay: lastDelay, duration: 0.6 }}
          >
            kapan-kapan photobox lagi ya
          </motion.p>
          <Sticker x={20} y={80} delay={lastDelay + 0.3} bounds={frontRef} {...stickers}>
            <AgeBadge />
          </Sticker>
          <Sticker x={80} y={78} delay={lastDelay + 0.4} bounds={frontRef} {...stickers}>
            <Star color="#AFCBFF" size={36} />
          </Sticker>
          <DogEar side="right" label="Balik ke halaman 2" onTurn={turnTo(1)} pan={cornerPan} />
          <Shade opacity={leaf.frontShade} />
        </motion.section>

        <motion.section
          aria-label="Halaman 2"
          inert={turn.page === 0}
          className={`face isolate absolute inset-0 rotate-y-180 ${foldVars}`}
          style={{ visibility: leaf.backVis }}
        >
          <div aria-hidden="true" className="paper-lined fold-left absolute inset-0 rounded-l-md" />
          <Spine side="right" />
          <div className="absolute inset-0 overflow-hidden">
            <Letter className="w-[200%] columns-2 gap-x-24 px-12 pt-(--top) pb-12 text-[1.85rem]" />
          </div>
          <DogEar side="left" label="Balik ke halaman 1" onTurn={turnTo(0)} pan={cornerPan} />
          <Shade opacity={leaf.backShade} />
        </motion.section>
      </motion.div>
    </div>
  );
}

/* ---------- HP: satu lembar, dibalik ke kiri (swipe atau tombol) ---------- */

function PhoneBook({ turn, photo }: { turn: Turn; photo: PhotoProps }) {
  const stackRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const leaf = useLeaf(turn.progress);
  const sheetOpacity = useTransform(turn.progress, [0.85, 1], [1, 0]);
  const underShadow = useTransform(turn.progress, [0, 0.3, 1], [0, 1, 0]);
  const pan = useRef({ active: false, from: 0, reach: 1, width: 1 });

  // Swipe horizontal = balik halaman; swipe vertikal dibiarin jadi scroll biasa (touch-action: pan-y).
  // Halaman ngikutin jari: titik yang dipegang tetap di bawah jari (proyeksinya = reach·cosθ).
  const onPanStart = (e: PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) {
      pan.current.active = false;
      return;
    }
    const r = stackRef.current!.getBoundingClientRect();
    const from = turn.progress.get();
    const startX = e.clientX - info.offset.x - r.left;
    turn.grab();
    pan.current = {
      active: true,
      from,
      width: r.width,
      reach: from < 0.5 ? Math.max(startX, r.width * 0.5) : r.width * 0.5,
    };
  };
  const onPan = (_: PointerEvent, info: PanInfo) => {
    const p = pan.current;
    if (!p.active) return;
    const cos = clamp(Math.cos(p.from * Math.PI) + info.offset.x / p.reach, -1, 1);
    turn.progress.set(Math.acos(cos) / Math.PI);
  };
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (pan.current.active) turn.release(info.velocity.x / pan.current.width);
    pan.current.active = false;
  };

  return (
    <motion.div
      ref={stackRef}
      onPointerDownCapture={turn.arm}
      onPanStart={onPanStart}
      onPan={onPan}
      onPanEnd={onPanEnd}
      className="relative mx-auto grid aspect-[5/8] max-w-md perspective-[1400px]"
      style={{ touchAction: "pan-y", "--line": "2.1rem", "--top": "4.2rem", "--margin": "1.75rem" } as React.CSSProperties}
    >
      {/* halaman 2 di bawah */}
      <section
        aria-label="Halaman 2"
        inert={turn.page === 0}
        className="paper-lined relative isolate col-start-1 row-start-1 rounded-md shadow-[0_30px_60px_-30px_rgba(100,44,169,0.6)]"
      >
        <Spine side="left" />
        <div className={`${turn.grown ? "relative" : "absolute inset-0"} overflow-hidden`}>
          <Letter className="pt-(--top) pr-5 pb-10 pl-10 text-[1.6rem]" />
        </div>
        <Shade opacity={underShadow} from="left" />
      </section>

      {/* halaman 1: lembar yang dibalik */}
      <motion.div
        className={`absolute inset-x-0 top-0 z-10 aspect-[5/8] origin-left transform-3d ${
          turn.page === 1 ? "pointer-events-none" : ""
        }`}
        style={{ rotateY: leaf.rotateY, opacity: sheetOpacity }}
      >
        <motion.section
          ref={sheetRef}
          aria-label="Halaman 1"
          inert={turn.page === 1}
          className={`face isolate absolute inset-0 ${foldVars}`}
          style={{ visibility: leaf.frontVis }}
        >
          <div aria-hidden="true" className="paper-grid fold-right absolute inset-0 rounded-md" />
          <Spine side="left" />
          <TitleNote inView={photo.inView} className="inset-x-[6%] top-[3%] text-[min(10.5vw,2.75rem)]" />
          {layout.map((_, i) => (
            <ScrapItem key={i} index={i} compact bounds={sheetRef} {...photo} />
          ))}
          <Sticker x={45} y={61} delay={0.3 + scrapbook.length * 0.35} bounds={sheetRef} inView={photo.inView} canDrag={false}>
            <AgeBadge small />
          </Sticker>
          <DogEar side="right" label="Balik ke halaman 2" onTurn={() => !turn.justPanned.current && turn.to(1)} />
          <Shade opacity={leaf.frontShade} />
        </motion.section>

        {/* punggung kertas */}
        <motion.div
          aria-hidden="true"
          className="face paper-back absolute inset-0 rotate-y-180 rounded-md"
          style={{ visibility: leaf.backVis }}
        >
          <Shade opacity={leaf.backShade} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Scrapbook ---------- */

export default function Scrapbook() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { once: true, amount: 0.25 });
  const isDesktop = useSyncExternalStore(subscribeMd, () => window.matchMedia(mdQuery).matches, () => false);
  const turn = usePageTurn();
  const [open, setOpen] = useState<number | null>(null);
  const [from, setFrom] = useState<DOMRect | null>(null);
  // foto yang terakhir disentuh naik ke paling atas
  const [order, setOrder] = useState(() => scrapbook.map((_, i) => i));
  // geser-geser foto cuma buat mouse di layout buku terbuka (md+)
  const [canDrag] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine) and (min-width: 768px)").matches,
  );

  const photo: PhotoProps = {
    inView,
    canDrag,
    order,
    toFront: (i) => setOrder((o) => [...o.filter((v) => v !== i), i]),
    onOpen: (i, el) => {
      if (turn.justPanned.current) return;
      setFrom(el.getBoundingClientRect());
      setOpen(i);
    },
  };

  const flip = () => {
    const target = turn.page === 0 ? 1 : 0;
    // balik ke foto dari bawah surat yang panjang: bawa bukunya ke layar dulu
    const top = rootRef.current?.getBoundingClientRect().top ?? 0;
    if (target === 0 && top < 0) rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    turn.to(target);
  };

  return (
    <>
      <div ref={rootRef} className="scroll-mt-6">
        {isDesktop ? <DesktopBook turn={turn} photo={photo} /> : <PhoneBook turn={turn} photo={photo} />}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        <motion.button
          type="button"
          onClick={flip}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="rounded-full bg-plum px-6 py-3 font-semibold text-white shadow-[4px_4px_0_#C8A2FF] hover:bg-plum-dark"
        >
          {turn.page === 0 ? "Balik halaman" : "Balik ke foto"}
        </motion.button>
        <p className="min-h-5 text-sm">
          {turn.page === 0 && (
            <>
              <span className="hidden md:pointer-fine:inline">Fotonya bisa digeser. </span>
              Tap fotonya buat lihat lebih jelas.
            </>
          )}
        </p>
      </div>

      <Lightbox items={scrapbook} open={open} from={from} onChange={setOpen} />
    </>
  );
}
