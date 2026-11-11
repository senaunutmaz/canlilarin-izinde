import React, { useState } from 'react';
import { Search, Globe2, Sparkles, MapPin, Database, ArrowRight } from 'lucide-react';
import heroBg from './assets/images/canli_atlasi_hero_1794352926481.jpg';

interface HeroSectionProps {
  onSearch: (query: string, country: string) => void;
  isLoading: boolean;
  activeCountry: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, isLoading, activeCountry }) => {
  const [searchInput, setSearchInput] = useState('');
  const [country, setCountry] = useState(activeCountry);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim(), country);
    }
  };

  const handleQuickChip = (term: string) => {
    setSearchInput(term);
    onSearch(term, country);
  };

  const quickSpecies = [
    { label: 'Bozayı (Ursus arctos)', query: 'Ursus arctos' },
    { label: 'Vaşak (Lynx lynx)', query: 'Lynx lynx' },
    { label: 'Bozkurt (Canis lupus)', query: 'Canis lupus' },
    { label: 'Caretta caretta', query: 'Caretta caretta' },
    { label: 'Kelaynak (Geronticus eremita)', query: 'Geronticus eremita' },
    { label: 'Akdeniz Foku (Monachus)', query: 'Monachus monachus' }
  ];

  return (
    <section id="arama" className="relative overflow-hidden border-b border-emerald-950/60 bg-[#0b1510]">
      {/* Background Hero Image with Measured Gradient Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Anadolu dağları ve sisli ormanlar"
          className="w-full h-full object-cover object-center opacity-35"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1510] via-[#0b1510]/85 to-[#0b1510]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        {/* Subtle unboxed metadata kicker */}
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-4 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
          <span>GBIF Açık Bilim Verisi</span>
          <span aria-hidden="true">·</span>
          <span>OpenStreetMap & Leaflet</span>
          <span aria-hidden="true">·</span>
          <span>Biyoçeşitlilik Analizi</span>
        </div>

        {/* Main Display Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-5 text-balance">
          Kaybolan Canlıların İzinde
        </h1>
        <p className="text-lg sm:text-xl text-emerald-100/80 max-w-2xl mx-auto font-normal leading-relaxed mb-10 text-balance">
          <strong className="text-emerald-300 font-semibold">Canlı Atlası</strong>, açık küresel veri tabanlarından beslenen, geçmiş yıllardaki bilimsel gözlemleri, coğrafi yayılışı ve türlerin korunma durumunu inceleyen etkileşimli bir dijital hafıza platformudur.
        </p>

        {/* Main Search Console */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row items-stretch gap-2.5 bg-[#13241b]/95 p-2.5 rounded-2xl border border-emerald-700/40 shadow-2xl backdrop-blur-xl">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-emerald-400/80 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Canlı adı veya bilimsel ad yazın (örn: Ursus arctos, Bozayı, Kurt, Vaşak...)"
                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-emerald-100/40 text-base focus:outline-none focus:ring-0 font-medium"
              />
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 rounded-xl border border-emerald-800/40 shrink-0">
              <Globe2 className="w-4 h-4 text-emerald-400" />
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  if (searchInput.trim()) {
                    onSearch(searchInput.trim(), e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-emerald-200 focus:outline-none cursor-pointer pr-2"
              >
                <option value="TR" className="bg-[#13241b] text-white">Türkiye Kayıtları (TR)</option>
                <option value="" className="bg-[#13241b] text-white">Tüm Dünya (Global)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900/60 disabled:text-emerald-400/50 text-[#0b1510] font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0b1510] border-t-transparent rounded-full animate-spin" />
                  <span>GBIF Taranıyor...</span>
                </>
              ) : (
                <>
                  <span>Gözlemleri Getir</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Filter Search Prompts */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-emerald-200/70">
            <span className="font-medium text-emerald-300">Örnek türler:</span>
            {quickSpecies.map((s) => (
              <button
                key={s.query}
                type="button"
                onClick={() => handleQuickChip(s.query)}
                className="px-2.5 py-1 rounded-md bg-emerald-950/50 hover:bg-emerald-800/40 text-emerald-200 hover:text-white border border-emerald-800/40 transition-colors cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
