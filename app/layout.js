import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import ChromeGate from "../components/ChromeGate";
import { getStoreSettings } from "../lib/settings";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Honesty — Honesty in every step",
  description: "Beautifully made things, honestly priced. A curated shop of fashion, home, beauty, wellness, and more from independent makers.",
};

export default async function RootLayout({ children }) {
  const settings = await getStoreSettings();
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fafaf7] text-[#1a2b4a]">
        <Providers>
          <ChromeGate><Header announcement={settings.announcement} /></ChromeGate>
          <main className="flex-1">{children}</main>
          <ChromeGate><Footer /></ChromeGate>
          <ChromeGate><ScrollToTop /></ChromeGate>
        </Providers>
      </body>
    </html>
  );
}
