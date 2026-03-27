import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import Link from "next/link";
import Navigation from "./Navigation";
import Providers from "./providers";
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
        <Providers>
        <NextTopLoader
          color="#F4C542"
          height={2}
          showSpinner={false}
          shadow="0 0 8px rgba(244, 197, 66, 0.4)"
        />
        <header className="site-header">
          <Link href="/" className="header-logo">
            {/* Placeholder icon: "O" merged with a playbill page-fold */}
            <svg
              className="header-logo-icon"
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="4" y="2" width="24" height="28" rx="4" stroke="currentColor" strokeWidth="2.2" />
              <path d="M22 2 L28 8 L22 8 Z" fill="currentColor" opacity="0.5" />
              <ellipse cx="16" cy="17" rx="7" ry="8" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="header-logo-text">Orphia</span>
          </Link>
          <Navigation />
        </header>
        <main className="main-content">
          {children}
        </main>
        </Providers>
      </body>
    </html>
  );
}
