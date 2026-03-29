import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./name-that-song.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--nts-font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--nts-font-ui",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Name That Song — Musical Theater Song Guessing Game",
  description: "Guess the song title, Wheel of Fortune-style",
};

export default function NTSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`nts-root ${playfair.variable} ${dmSans.variable}`}
      style={{ position: "fixed", inset: 0, overflow: "auto", zIndex: 999 }}
    >
      <div className="nts-container">{children}</div>
    </div>
  );
}
