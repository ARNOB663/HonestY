import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import ChromeGate from "../components/ChromeGate";
import MobileBottomNav from "../components/MobileBottomNav";
import { getStoreSettings } from "../lib/settings";

// Performance: explicit display:"swap" so text paints with the system fallback
// immediately and re-renders to web font when it arrives — no FOIT, lower LCP.
// adjustFontFallback (default true) computes a size-adjusted system font so the
// swap doesn't cause CLS. Trim weights to what we actually use: Inter body +
// Cormorant 400/600.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  // Italic is loaded so the wordmark logo can use Cormorant's flowing italic 'H'.
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "Honesty in every step",
  description: "Beautifully made things, honestly priced. A curated shop of fashion, home, beauty, wellness, and more from independent makers.",
};

export default async function RootLayout({ children }) {
  const settings = await getStoreSettings();
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fafaf7] text-[#1a2b4a] pb-16 md:pb-0">
        <Providers>
          <ChromeGate><Header announcement={settings.announcement} navLinks={settings.navLinks} /></ChromeGate>
          <main className="flex-1">{children}</main>
          <ChromeGate><Footer /></ChromeGate>
          <ChromeGate><ScrollToTop /></ChromeGate>
          <ChromeGate><MobileBottomNav /></ChromeGate>
        </Providers>
      </body>
    </html>
  );
}
