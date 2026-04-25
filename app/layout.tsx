import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Framtidskarta — se ditt kompetensgap och få jobb snabbare",
  description: "Analysera ditt kompetensgap mot Arbetsförmedlingens öppna data och få den kortaste vägen till jobb eller praktikplats.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="antialiased min-h-screen flex flex-col bg-[#F8F9FA]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}