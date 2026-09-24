// Semua data personal ada di sini, biar gampang diganti.

export const person = {
  fullName: "Fillary Xena Pristahati",
  firstName: "Fillary",
  restName: "Xena Pristahati",
  nickname: "Fie",
  age: 21,
  ageOrdinal: "21st",
  // <input type="date" /> selalu output yyyy-mm-dd
  birthday: "2005-10-03",
};

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

// Foto solo, dipasang di polaroid yang digantung (public/photos/Solo)
export const photos: Photo[] = [
  { src: "/photos/Solo/p1.jpeg", width: 720, height: 1280, alt: "Foto Fie 1" },
  { src: "/photos/Solo/p2.jpeg", width: 720, height: 1280, alt: "Foto Fie 2" },
  { src: "/photos/Solo/p3.jpeg", width: 720, height: 1280, alt: "Foto Fie 3" },
  { src: "/photos/Solo/p4.jpeg", width: 960, height: 720, alt: "Foto Fie 4" },
  { src: "/photos/Solo/p5.jpeg", width: 720, height: 1280, alt: "Foto Fie 5" },
  { src: "/photos/Solo/p6.jpeg", width: 720, height: 1243, alt: "Foto Fie 6" },
];

// Foto photobox buat scrapbook (public/photos/Box). Caption = tulisan tangan di bawah foto.
export const scrapbook: Photo[] = [
  {
    src: "/photos/Box/20260721_044836_330.jpg",
    width: 1200,
    height: 1800,
    alt: "Strip photobox tema koran",
    caption: "masuk koran",
  },
  {
    src: "/photos/Box/IMG_0110_20260721_044101_3600.jpeg",
    width: 3600,
    height: 2400,
    alt: "Foto berdua pakai topi koboi",
    caption: "koboi dadakan",
  },
  {
    src: "/photos/Box/photo-1207fc73-2f6b-44e6-ade8-f2a628191454-filtered.jpg",
    width: 3456,
    height: 2304,
    alt: "Foto berdua di photobox lift dengan bola disko",
    caption: "lift tapi disko",
  },
  {
    src: "/photos/Box/photo-487138f2-0504-4ce7-949e-7403b2258bfa-collage-filtered.jpg",
    width: 2400,
    height: 3600,
    alt: "Strip photobox delapan pose",
    caption: "8 pose, ga ada yang serius",
  },
];

export const musicSrc = "/music/hbd.mp3";
