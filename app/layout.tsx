import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

// Elegant serif for the whispered words of the experience.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
  display: "swap",
});

// Restrained sans, used only for minimal UI chrome.
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Dormant Heart",
  description: "A quiet cinematic story by Isah Sulaiman.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
  // Zoom stays available — the experience is tap-driven, but pinch-to-zoom is
  // someone's accessibility tool and shouldn't be taken away.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="font-serif">{children}</body>
    </html>
  );
}
