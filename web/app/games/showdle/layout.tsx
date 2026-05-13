import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./showdle.css";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-sd-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-sd-ui",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Showdle — Daily Musical Theater Puzzle",
  description: "Guess the missing lyric word, Wordle-style",
};

export default function ShowdleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`sd-root ${playfairDisplay.variable} ${dmSans.variable}`}
      style={{ position: "fixed", inset: 0, overflow: "auto", zIndex: 999 }}
    >
      <div className="sd-container">{children}</div>
    </div>
  );
}
