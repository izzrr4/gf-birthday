"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { person } from "@/data/config";
import { celebrate } from "@/lib/confetti";
import Cake from "./cake";
import { useMusic } from "./music-context";

type Stage = "date" | "cake" | "party";

// Kalau tanggal udah pernah dijawab bener, ga usah jawab lagi selama 3 jam
const UNLOCK_KEY = "fie-hbd-unlocked-until";
const UNLOCK_MS = 3 * 60 * 60 * 1000;

const isUnlocked = () => {
  try {
    return Number(localStorage.getItem(UNLOCK_KEY)) > Date.now();
  } catch {
    return false;
  }
};

const rememberUnlock = () => {
  try {
    localStorage.setItem(UNLOCK_KEY, String(Date.now() + UNLOCK_MS));
  } catch {
    // private mode dll: ya jawab lagi nanti
  }
};

const noopSubscribe = () => () => {};

export default function Gate({ children }: { children: React.ReactNode }) {
  const [rawStage, setStage] = useState<Stage>("date");
  // dibaca sekali di client; di server selalu false biar hydration aman
  const unlocked = useSyncExternalStore(noopSubscribe, isUnlocked, () => false);
  const stage: Stage = rawStage === "date" && unlocked ? "cake" : rawStage;
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [blown, setBlown] = useState(false);
  const shake = useAnimationControls();
  const { playMusic } = useMusic();
  const [mic, setMic] = useState<"off" | "listening" | "error">("off");
  const [level, setLevel] = useState(0);
  const stopMicRef = useRef<() => void>(() => {});

  useEffect(() => () => stopMicRef.current(), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (input === person.birthday) {
      rememberUnlock();
      setError("");
      setStage("cake");
    } else {
      setError("sp luh kok salah tanggal...");
      shake.start({ x: [0, -14, 12, -8, 6, 0], transition: { duration: 0.45 } });
    }
  };

  const blowCandles = () => {
    if (blown) return;
    stopMicRef.current();
    setBlown(true);
    playMusic();
    celebrate();
    setTimeout(() => setStage("party"), 1900);
  };

  // Tiup beneran: dengerin mic, kalau suara tiupan cukup kencang sebentar → lilin mati
  const listen = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let raf = 0;
      let loudFrames = 0;

      stopMicRef.current = () => {
        cancelAnimationFrame(raf);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        stopMicRef.current = () => {};
      };

      setMic("listening");
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 4));
        loudFrames = rms > 0.18 ? loudFrames + 1 : 0;
        if (loudFrames > 8) {
          blowCandles();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMic("error");
    }
  };

  if (stage === "party") return <>{children}</>;

  return (
    <main className="grid min-h-svh place-items-center overflow-hidden px-4 py-10">
      <AnimatePresence mode="wait">
        {stage === "date" ? (
          <motion.section
            key="date"
            className="flex w-full max-w-sm flex-col items-center text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, transition: { duration: 0.35 } }}
          >
            <h1 className="font-display text-5xl leading-none sm:text-6xl">Beneran lu ga ni?</h1>
            <p className="mt-4 text-lg">Coba tanggal ultah lu masukin sini</p>

            <motion.form
              animate={shake}
              onSubmit={handleSubmit}
              className="mt-8 flex w-full flex-col items-center gap-3"
            >
              <label htmlFor="birthday" className="sr-only">
                Tanggal ulang tahun
              </label>
              <input
                id="birthday"
                type="date"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                // klik di mana aja dalam field langsung buka kalender, bukan cuma ikonnya
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {
                    // browser lama: tetap bisa ketik manual
                  }
                }}
                className="w-full max-w-64 cursor-pointer rounded-2xl border-[3px] border-plum bg-paper px-4 py-3 text-center text-lg text-plum shadow-[4px_4px_0_#642CA9]"
              />
              <button
                type="submit"
                className="rounded-full bg-plum px-8 py-3 text-lg font-semibold text-white transition hover:bg-plum-dark active:scale-95"
              >
                Submit
              </button>
            </motion.form>

            <p role="alert" className="mt-4 h-6 text-sm font-medium text-[#c2185b]">
              {error}
            </p>
          </motion.section>
        ) : (
          <motion.section
            key="cake"
            className="flex w-full max-w-md flex-col items-center text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15, transition: { duration: 0.5 } }}
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={blown ? "yay" : "ask"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="font-display text-4xl leading-tight sm:text-5xl"
              >
                {blown ? "Yeaaay!" : `Tiup lilinnya dulu, ${person.nickname}`}
              </motion.h1>
            </AnimatePresence>
            <p className="mt-3 text-lg">
              {blown ? "Selamat ulang tahun!" : "Make a wish dulu, abis itu tap kuenya"}
            </p>

            <motion.button
              type="button"
              onClick={blowCandles}
              disabled={blown}
              aria-label="Tiup lilin"
              whileHover={blown ? undefined : { scale: 1.03, rotate: -1 }}
              whileTap={blown ? undefined : { scale: 0.96 }}
              className="mt-6 w-full max-w-sm cursor-pointer rounded-3xl disabled:cursor-default"
            >
              <Cake blown={blown} digits={String(person.age)} wind={mic === "listening" ? level : 0} />
            </motion.button>

            {!blown && (
              <div className="mt-6 flex h-12 items-center justify-center">
                {mic === "off" && (
                  <button
                    type="button"
                    onClick={listen}
                    className="rounded-full border-[3px] border-plum bg-paper px-5 py-2 font-semibold transition hover:-translate-y-0.5 active:scale-95"
                  >
                    🎤 Tiup beneran pakai mic
                  </button>
                )}
                {mic === "listening" && (
                  <div className="flex items-center gap-3" aria-live="polite">
                    <span className="text-sm font-medium">Tiup ke mic-nya…</span>
                    <span className="h-3 w-32 overflow-hidden rounded-full bg-paper ring-2 ring-plum">
                      <motion.span
                        className="block h-full rounded-full bg-plum"
                        animate={{ width: `${Math.max(6, level * 100)}%` }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    </span>
                  </div>
                )}
                {mic === "error" && (
                  <p className="text-sm font-medium">Mic-nya ga bisa dipake, tap kuenya aja</p>
                )}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
