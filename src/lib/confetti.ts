import confetti from "canvas-confetti";

const colors = ["#FFB3BD", "#FFD889", "#AFCBFF", "#C8A2FF", "#642CA9"];

export function burst(x = 0.5, y = 0.5) {
  confetti({
    particleCount: 90,
    spread: 80,
    startVelocity: 38,
    origin: { x, y },
    colors,
    scalar: 1.1,
    disableForReducedMotion: true,
  });
}

// Tembakan dari dua sisi layar, dipakai waktu lilin ditiup
export function celebrate() {
  const end = Date.now() + 1200;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.75 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.75 },
      colors,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Burst dari posisi elemen di layar
export function burstFrom(el: Element) {
  const r = el.getBoundingClientRect();
  burst((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
}
