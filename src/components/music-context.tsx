"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { musicSrc } from "@/data/config";

interface MusicContextType {
  playing: boolean;
  toggleMusic: () => void;
  playMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // Load music sekali
  useEffect(() => {
    const audio = new Audio(musicSrc);
    audio.loop = true;
    audio.preload = "auto";
    audio.load();
    audioRef.current = audio;

    return () => audio.pause();
  }, []);

  const playMusic = () => {
    audioRef.current
      ?.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      playMusic();
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <MusicContext.Provider value={{ playing, toggleMusic, playMusic }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
  return ctx;
};
