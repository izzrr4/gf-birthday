"use client";

import { MotionConfig } from "motion/react";
import Gate from "@/components/gate";
import { MusicProvider } from "@/components/music-context";
import Party from "@/components/party";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <MusicProvider>
        <Gate>
          <Party />
        </Gate>
      </MusicProvider>
    </MotionConfig>
  );
}
