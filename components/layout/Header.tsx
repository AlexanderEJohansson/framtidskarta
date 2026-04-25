"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0033A0]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">Framtidskarta</span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 ml-10">
          <a href="/analys" className="text-white text-sm font-medium hover:text-blue-200 transition-colors">
            Starta analys
          </a>
          <a href="/foretag" className="text-white text-sm font-medium hover:text-blue-200 transition-colors">
            Foretag
          </a>
          <a href="/utbildare" className="text-white text-sm font-medium hover:text-blue-200 transition-colors">
            Utbildare
          </a>
          <a href="/pris" className="text-white text-sm font-medium hover:text-blue-200 transition-colors">
            Priser
          </a>
        </nav>

        {/* CTA */}
        <div className="ml-auto flex items-center gap-3">
          <a
            href="/analys"
            className="bg-white text-[#0033A0] font-semibold text-sm px-4 py-2 rounded font-bold hover:bg-blue-50 transition-colors"
          >
            Starta nu
          </a>
        </div>
      </div>
    </header>
  );
}