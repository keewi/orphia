import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Link from "next/link";
import Navigation from "./Navigation";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Orphia",
  description: "Your VIP theatre companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`} style={{ backgroundColor: "#0F0E12" }}>
      <body style={{ backgroundColor: "#0F0E12" }}>
        <header className="site-header">
          <div className="header-content">
            <h1>
              <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                <span className="brand-accent">Orphia</span>
              </Link>
            </h1>
            <p className="tagline">Remember every curtain call</p>
          </div>
          <Navigation />
        </header>
        {children}
      </body>
    </html>
  );
}
