import React, { useState } from 'react';
import { DISCOVERY_SPECIMENS } from '../services/gbif';
import { DiscoverySpecimen } from '../types/biodiversity';
import { Compass, Sparkles, AlertTriangle, Fish, Bird, Bug, Shield, ArrowUpRight } from 'lucide-react';

interface SpeciesDiscoveryProps {
  onSelectSpecies: (scientificName: string) => void;
  activeScientificName?: string;
}

export const SpeciesDiscovery: React.FC<SpeciesDiscoveryProps> = ({
  onSelectSpecies,
  activeScientificName
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('mammals');

  const categories = [
    { id: 'mammals', label: 'Memeliler', icon: '🐻', count: 5 },
    { id: 'birds', label: 'Kuşlar', icon: '🦅', count: 4 },
    { id: 'reptiles', label: 'Sürüngenler', icon: '🐢', count: 4 },
    { id: 'marine', label: 'Deniz Canlıları', icon: '🐬', count: 3 },
    { id: 'amphibians', label: 'Amfibiler', icon: '🐸', count: 2 },
    { id: 'endangered', label: 'Tehlike Altındaki Türler', icon: '⚠️', count: 3 }
  ];

  const filteredSpecimens = DISCOVERY_SPECIMENS.filter(
    s => s.category === selectedCategory
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CR': return 'bg-rose-950/80 border-rose-600/50 text-rose-300';
      case 'EN': return 'bg-orange-950/80 border-orange-600/50 text-orange-300';
      case 'VU': return 'bg-amber-950/80 border-amber-600/50 text-amber-300';
      case 'NT': return 'bg-yellow-950/80 border-yellow-600/50 text-yellow-300';
      case 'LC': return 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300';
      default: return 'bg-slate-900 border-slate-700 text-slate-300';
    }
  };

  return (
    <section id="kesif" className="my-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
            <span>Türkiye & Dünya Biyoçeşitliliği</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Canlı Türleri Keşif Alanı
          </h2>
          <p className="text-sm text-emerald-100/70 mt-1 max-w-xl">
            Anadolu'nun endemik, simgesel ve nesli tehlike altındaki canlılarını kategoriler bazında keşfedin; bir türe tıklayarak gerçek gözlem arşivini başlatın.
          </p>
        </div>
      </div>

      {/* Category Tabs (Interactive Filter Controls with clean segmented styling) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-[#0b1510] shadow-lg shadow-emerald-500/20 font-bold'
                  : 'bg-[#111e17] text-emerald-200/80 hover:text-white hover:bg-[#13241b] border border-emerald-900/60'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-[#0b1510]/20 text-[#0b1510]' : 'bg-[#0b1510] text-emerald-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Specimens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSpecimens.map((item) => {
          const isSelected = activeScientificName?.toLowerCase() === item.scientificName.toLowerCase();

          return (
            <div
              key={item.id}
              onClick={() => onSelectSpecies(item.scientificName)}
              className={`group bg-[#111e17] hover:bg-[#13241b] rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between cursor-pointer relative ${
                isSelected
                  ? 'border-emerald-400 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950'
                  : 'border-emerald-900/60 hover:border-emerald-600/60 shadow-lg'
              }`}
            >
              <div>
                {/* Header: Names & IUCN Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {item.turkishName}
                    </h3>
                    <p className="text-xs italic font-serif text-emerald-300/80">
                      {item.scientificName}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-md border text-[10px] font-mono font-bold whitespace-nowrap ${getStatusColor(item.iucnStatus)}`}>
                    {item.iucnStatus}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-emerald-100/75 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              {/* Habitat & Action */}
              <div className="pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs">
                <span className="text-[11px] text-emerald-300/60 truncate max-w-[180px]">
                  Habitat: {item.habitat}
                </span>

                <span className="text-emerald-400 group-hover:text-white font-medium flex items-center gap-1 shrink-0">
                  <span>Analiz Et</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
