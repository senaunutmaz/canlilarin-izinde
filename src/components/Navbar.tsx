import React from 'react';
import { Compass, Scale } from 'lucide-react';

interface NavbarProps {
  onQuickSearch: (query: string) => void;
  isCompareMode: boolean;
  onToggleCompare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onQuickSearch, isCompareMode, onToggleCompare }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0b1510]/90 backdrop-blur-md border-b border-emerald-950/60 px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <a 
          href="/" 
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Compass className="w-4 h-4" />
          </div>
          <span>Canlı Atlası</span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-emerald-100/70">
          <a href="#arama" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Tür Araştır
          </a>
          <a href="#kesif" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Keşif Alanı
          </a>
          <a href="#analiz" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Yıllık & Bölgesel Analiz
          </a>
          <a href="#harita" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            Gözlem Haritası
          </a>
          <a href="#metodoloji" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
            IUCN & Metodoloji
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleCompare}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isCompareMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompareMode ? 'Tekli İncelemeye Dön' : 'İki Türü Karşılaştır'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
