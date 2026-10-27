import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HubHeader } from "@/components/hub/HubHeader";
import { HubSidebar } from "@/components/hub/HubSidebar";
import "./globals.css";

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
  description:
    "Chaîne de production d'interfaces : Screendraft, Générateur HTML/CSS, Animations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="flex min-h-dvh">
          <HubSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <HubHeader />
            <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 md:px-8 md:py-12">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
