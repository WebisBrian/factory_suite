import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HubNav } from "@/components/hub/HubNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FactorySuite",
  description: "Hub des outils Screendraft, Générateur et Animations",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Le fond est posé sur ce wrapper : globals.css (non modifiable) style body hors @layer et gagnerait. */}
        <div className="relative flex min-h-screen flex-1 flex-col bg-[#0b0b10] font-sans text-zinc-100">
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.12),transparent_45%),radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.12),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(249,115,22,0.08),transparent_50%)]"
          />
          <div className="relative flex flex-1 flex-col">
            <HubNav />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
