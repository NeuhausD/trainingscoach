import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Trainingscoach", template: "%s – Trainingscoach" },
  description: "Persönlicher Trainings-Coach: Dokumentation, Fortschritt, KI-Vorschläge",
};

export const viewport: Viewport = {
  // Safe-Area-Werte (Notch, Home-Indikator) nur mit viewport-fit=cover verfügbar
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1512" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="de-CH" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <AppShell signedIn={!!session?.user}>{children}</AppShell>
      </body>
    </html>
  );
}
