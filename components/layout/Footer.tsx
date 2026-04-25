export function Footer() {
  return (
    <footer className="bg-[#0033A0] text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-lg mb-2">Framtidskarta</p>
            <p className="text-blue-200 text-sm">
              Kortaste vägen till jobb eller praktikplats med hjälp av Arbetsförmedlingens öppna data.
            </p>
          </div>
          <div>
            <p className="font-bold text-sm mb-2">Kontakt</p>
            <p className="text-blue-200 text-sm">info@framtidskarta.se</p>
          </div>
          <div>
            <p className="font-bold text-sm mb-2">Lankar</p>
            <div className="flex flex-col gap-1 text-sm text-blue-200">
              <a href="/analys">Starta analys</a>
              <a href="/foretag">Foretag</a>
              <a href="/utbildare">Utbildare</a>
              <a href="/pris">Priser</a>
            </div>
          </div>
        </div>
        <div className="border-t border-blue-800 mt-6 pt-6 text-sm text-blue-300 flex flex-col md:flex-row justify-between gap-2">
          <p>2026 Framtidskarta. En tjänst fran Lärinsikt AB.</p>
          <p>Ingen garanti for jobb. Personuppgifter behandlas enligt GDPR.</p>
        </div>
      </div>
    </footer>
  );
}