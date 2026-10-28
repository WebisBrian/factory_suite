import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";
import { HubNav } from "@/components/hub/HubNav";
import { hubTextScaleBootScript } from "@/components/hub/hub-text-scale";

// Atkinson Hyperlegible : police conçue pour les personnes malvoyantes (Braille Institute).
// Branchée sur les variables que globals.css (non modifiable) relie déjà à font-sans / font-mono.
const sans = Atkinson_Hyperlegible_Next({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const mono = Atkinson_Hyperlegible_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Hub - FactorySuite",
  description: "Hub des outils ScreenDraft, AnimFlow et le contrôle qualité",
};

/**
 * Contour de focus clavier jaune épais sur tout élément focusable de l'app (Hub et squads).
 * Jaune sur fond sombre : contraste maximal, distinct pour tous les types de daltonisme.
 */
const focusRing =
  "[&_:focus-visible]:outline-4 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-yellow-300 [&_:focus-visible]:outline-solid";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : le script ci-dessous ajuste la taille de police de <html> avant React.
    <html lang="fr" className={`${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: hubTextScaleBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Le fond est posé sur ce wrapper : globals.css (non modifiable) style body hors @layer et gagnerait. */}
        <div
          className={`relative flex min-h-screen flex-1 flex-col bg-[#0b0b10] font-sans text-base leading-relaxed text-zinc-100 ${focusRing}`}
        >
            <div
            aria-hidden
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.08),transparent_45%),radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.08),transparent_45%)]"
          />
          <div className="relative flex flex-1 flex-col">
            <HubNav />
            <div id="contenu" tabIndex={-1} className="flex flex-1 flex-col outline-none">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
