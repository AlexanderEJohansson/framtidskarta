import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Framtidskarta — se ditt kompetensgap och få jobb snabbare",
  description: "Analysera ditt kompetensgap mot Arbetsförmedlingens öppna data och få den kortaste vägen till jobb eller praktikplats.",
};

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-white border-b border-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0033A0]">
            Vet du vilket kompetensgap du har?
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Ladda upp ditt CV och få en analys som visar exakt vad du behöver för att komma
            närmare jobb eller praktik — baserat på Arbetsförmedlingens öppna data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/analys" className="btn-primary inline-block text-center">
              Ladda upp CV och fa din analys
            </Link>
            <Link href="/foretag" className="btn-secondary inline-block text-center">
              Foretag och HR
            </Link>
          </div>
        </div>
      </section>

      {/* Steg */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Så fungerar det
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { n: 1, t: "Ladda upp CV", d: " Dra-och-slapp eller ladda upp ditt CV direkt i webblasaren." },
              { n: 2, t: "AI analyserar", d: " Vi jämför din profil mot Arbetsförmedlingens Platsbank och Yrkesbarometer." },
              { n: 3, t: "Se ditt gap", d: " Du far en tydlig rapport over ditt kompetensgap och matchade praktikplatser." },
              { n: 4, t: "Fa konkreta steg", d: " Få exakta rekommendationer pa YH-utbildningar, kurser och praktikplatser." },
            ].map(({ n, t, d }) => (
              <div key={n} className="af-card p-6">
                <div className="w-10 h-10 rounded-full bg-[#0033A0] text-white flex items-center justify-center font-bold mb-4">
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t}</h3>
                <p className="text-sm text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pris */}
      <section className="bg-white border-t border-slate-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Priser</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="af-card p-6 text-left">
              <p className="text-sm font-bold text-[#0033A0] uppercase tracking-wide mb-2">Privatpersoner</p>
              <p className="text-4xl font-black text-slate-900 mb-1">19 kr<span className="text-lg font-normal text-slate-500">/mån</span></p>
              <p className="text-sm text-slate-500 mb-4">For dig som söker jobb eller praktik</p>
              <Link href="/analys" className="btn-primary w-full block text-center">
                Starta nu
              </Link>
            </div>
            <div className="af-card p-6 text-left border-2 border-[#0033A0]">
              <p className="text-sm font-bold text-[#0033A0] uppercase tracking-wide mb-2">Foretag & Utbildare</p>
              <p className="text-4xl font-black text-slate-900 mb-1">999 kr<span className="text-lg font-normal text-slate-500">/mån</span></p>
              <p className="text-sm text-slate-500 mb-4">For HR, skolor och utbildare</p>
              <Link href="/foretag" className="btn-secondary w-full block text-center">
                Läs mer
              </Link>
            </div>
          </div>
          <p className="text-sm text-slate-400">Ingen gratis rapport innan betalning. Betala med kort.</p>
        </div>
      </section>

      {/* B2B info */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Foretag och organisationer</h2>
          <p className="text-slate-600">
            Hjalp era medlemmar, elever eller kandidater att hitta rätt väg framåt.
            Vår B2B-lösning ger er verktyg för att analysera kompetensgap pa gruppniva.
          </p>
          <Link href="/foretag" className="btn-primary inline-block">
            Kontakta oss
          </Link>
        </div>
      </section>
    </div>
  );
}