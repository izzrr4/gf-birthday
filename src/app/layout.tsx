import type { Metadata } from "next";
import { Bagel_Fat_One, Bricolage_Grotesque, Nanum_Pen_Script } from "next/font/google";
import { person } from "@/data/config";
import "./globals.css";

const display = Bagel_Fat_One({
  variable: "--font-bagel",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const body = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

// tulisan tangan buat caption scrapbook
const hand = Nanum_Pen_Script({
  variable: "--font-nanum",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `Happy Birthday, ${person.nickname}!`,
  description: `Happy ${person.ageOrdinal} birthday, ${person.fullName}.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${hand.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
