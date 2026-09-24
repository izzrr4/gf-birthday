"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { person } from "@/data/config";
import BouncyName from "./bouncy-name";
import FoilBalloon from "./foil-balloon";
import MusicToggle from "./music-toggle";
import PhotoLine from "./photo-line";
import Scrapbook from "./scrapbook";
import ScrollHint from "./scroll-hint";
import SkyBalloons from "./sky-balloons";
import WishModal from "./wish-modal";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 120, damping: 18, delay },
});

export default function Party() {
  const [wishOpen, setWishOpen] = useState(false);
  const nameDone = 0.5 + person.firstName.length * 0.07 + 0.3;

  return (
    <main className="relative min-h-svh overflow-x-clip">
      <SkyBalloons />
      <MusicToggle />

      {/* HERO */}
      <section className="pointer-events-none relative z-10 mx-auto grid min-h-svh max-w-6xl content-center items-center gap-4 px-4 pt-20 pb-28 md:grid-cols-[1.1fr_1fr] md:gap-8 md:px-8 md:pt-10">
        <div className="pointer-events-auto order-2 md:order-1">
          <motion.p {...fadeUp(0.2)} className="text-xl font-semibold sm:text-2xl">
            Happy {person.ageOrdinal} birthday,
          </motion.p>
          <h1 className="mt-1 font-display leading-[0.95]">
            <BouncyName text={person.firstName} className="block text-[clamp(4rem,15vw,9.5rem)]" />
            <motion.span {...fadeUp(nameDone)} className="mt-[0.35em] block text-[clamp(1.75rem,5vw,3rem)] leading-none">
              {person.restName}!
            </motion.span>
          </h1>
          <motion.p {...fadeUp(nameDone + 0.15)} className="mt-4 text-lg">
            a.k.a <span className="font-semibold">{person.nickname}</span>
          </motion.p>

          <motion.div {...fadeUp(nameDone + 0.3)} className="mt-8">
            <motion.button
              type="button"
              onClick={() => setWishOpen(true)}
              whileHover={{ y: -3, rotate: -1.5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="rounded-full bg-plum px-7 py-4 text-lg font-semibold text-white shadow-[5px_5px_0_#C8A2FF] hover:bg-plum-dark"
            >
              Make a Wish ✨
            </motion.button>
          </motion.div>
        </div>

        <div className="pointer-events-auto order-1 flex justify-center md:order-2">
          <div className="w-[min(62vw,460px)]">
            <FoilBalloon value={String(person.age)} />
          </div>
        </div>

        <ScrollHint targetId="galeri" delay={nameDone + 0.9} />
      </section>

      {/* GALERI */}
      <section id="galeri" className="relative z-10 mx-auto max-w-6xl scroll-mt-10 px-4 pb-16 md:px-8">
        <h2 className="mb-6 text-center font-display text-4xl sm:text-5xl">Si Cantik Ulang Tahun</h2>
        <PhotoLine />
      </section>

      {/* SCRAPBOOK */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-28 md:px-8">
        <h2 className="mb-8 text-center font-display text-4xl sm:text-5xl">Arsip Photobox</h2>
        <Scrapbook />
      </section>

      <WishModal open={wishOpen} onClose={() => setWishOpen(false)} />
    </main>
  );
}
