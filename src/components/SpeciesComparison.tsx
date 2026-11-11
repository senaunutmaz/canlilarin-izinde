import React, { useState } from 'react';
import { SpeciesAnalysis } from '../types/biodiversity';
import { Scale, ArrowRight, Award, MapPin, Calendar, Check, ExternalLink } from 'lucide-react';

interface SpeciesComparisonProps {
  primaryAnalysis: SpeciesAnalysis;
  secondaryAnalysis: SpeciesAnalysis | null;
  onSelectSecondarySpecies: (scientificName: string) => void;
  isLoadingSecondary: boolean;
}

export const SpeciesComparison: React.FC<SpeciesComparisonProps> = ({
  primaryAnalysis,
  secondaryAnalysis,
  onSelectSecondarySpecies,
  isLoadingSecondary
}) => {
  const [customSecondaryQuery, setCustomSecondaryQuery] = useState('');

  const quickPairs = [
    { label: 'Bozayı vs Bozkurt', secScientific: 'Canis lupus', secName: 'Bozkurt' },
    { label: 'Vaşak vs Bozkurt', secScientific: 'Canis lupus', secName: 'Bozkurt' },
    { label: 'Caretta caretta vs Yeşil Kaplumbağa', secScientific: 'Chelonia mydas', secName: 'Yeşil Kaplumbağa' },
    { label: 'Bozayı vs Bayağı Vaşak', secScientific: 'Lynx lynx', secName: 'Bayağı Vaşak' }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSecondaryQuery.trim()) {
      onSelectSecondarySpecies(customSecondaryQuery.trim());
    }
  };

  const p = primaryAnalysis;
  const s = secondaryAnalysis;

  return (
    <section id="karsilastir" className="my-12 bg-[#0e1913] border border-emerald-900/60 rounded-3xl p-6 lg:p-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-emerald-900/40">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Karşılaştırmalı Biyoçeşitlilik Analizi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            İki Canlı Türünü Karşılaştırın
          </h2>
          <p className="text-xs text-emerald-200/70 mt-1 max-w-xl">
            Aynı coğrafya ve zaman dilimi çerçevesinde iki türün gözlem yoğunluğunu, yıllık eğilimlerini ve bölgesel yayılışını kıyaslayın.
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2">
          {quickPairs.map((pair) => (
            <button
              key={pair.secScientific}
              type="button"
              onClick={() => onSelectSecondarySpecies(pair.secScientific)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#13241b] hover:bg-emerald-950/80 text-emerald-200 border border-emerald-800/40 transition-colors cursor-pointer"
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Selection Form for Second Species */}
      <div className="mb-8 p-4 rounded-2xl bg-[#0b1510] border border-emerald-800/40">
        <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">
            Karşılaştırılacak İkinci Türü Seçin:
          </span>
          <input
            type="text"
            value={customSecondaryQuery}
            onChange={(e) => setCustomSecondaryQuery(e.target.value)}
            placeholder="İkinci canlı adı (örn: Canis lupus, Lynx lynx, Chelonia mydas...)"
            className="flex-1 w-full px-4 py-2 bg-[#13241b] text-white placeholder-emerald-100/40 rounded-xl border border-emerald-700/40 text-sm focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            disabled={isLoadingSecondary || !customSecondaryQuery.trim()}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-[#0b1510] font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            {isLoadingSecondary ? 'Karşılaştırılıyor...' : 'Kıyasla'}
          </button>
        </form>
      </div>

      {/* Head-to-Head Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Specimen A (Primary) */}
        <div className="p-5 rounded-2xl bg-[#111e17] border-2 border-emerald-500/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              1. TÜR (TEMEL İNCELEME)
            </span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </div>

          <div className="flex items-start gap-4">
            {p.species.photoUrl ? (
              <img
                src={p.species.photoUrl}
                alt={p.species.turkishName}
                className="w-20 h-20 rounded-xl object-cover border border-emerald-800/40 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-[#0b1510] border border-emerald-800/40 flex items-center justify-center text-xs text-emerald-400/50 shrink-0">
                Görsel Yok
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-white">
                {p.species.turkishName || p.species.canonicalName}
              </h3>
              <p className="text-xs italic font-serif text-emerald-300">
                {p.species.scientificName}
              </p>
              <div className="mt-2 text-xs font-mono text-emerald-200/70">
                IUCN: <strong className="text-emerald-300">{p.species.iucnStatus || 'NE'}</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-emerald-900/40 text-xs font-mono">
            <div>
              <span className="text-[10px] text-emerald-400/70 uppercase block">Toplam Kayıt</span>
              <span className="text-lg font-bold text-white tabular-nums">{p.totalRecords} adet</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400/70 uppercase block">Haritalanan GPS</span>
              <span className="text-lg font-bold text-emerald-300 tabular-nums">{p.mappedRecordsCount} nokta</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400/70 uppercase block">Zirve Yıl</span>
              <span className="text-sm font-bold text-white">{p.peakYear?.year || '—'} ({p.peakYear?.count || 0})</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400/70 uppercase block">Lider İl</span>
              <span className="text-sm font-bold text-white truncate block">{p.regionalStats[0]?.region || '—'}</span>
            </div>
          </div>
        </div>

        {/* Specimen B (Secondary) */}
        <div className="p-5 rounded-2xl bg-[#111e17] border-2 border-amber-500/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              2. TÜR (KARŞILAŞTIRMA)
            </span>
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          </div>

          {s ? (
            <>
              <div className="flex items-start gap-4">
                {s.species.photoUrl ? (
                  <img
                    src={s.species.photoUrl}
                    alt={s.species.turkishName}
                    className="w-20 h-20 rounded-xl object-cover border border-amber-800/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-[#0b1510] border border-amber-800/40 flex items-center justify-center text-xs text-amber-400/50 shrink-0">
                    Görsel Yok
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {s.species.turkishName || s.species.canonicalName}
                  </h3>
                  <p className="text-xs italic font-serif text-amber-300">
                    {s.species.scientificName}
                  </p>
                  <div className="mt-2 text-xs font-mono text-amber-200/70">
                    IUCN: <strong className="text-amber-300">{s.species.iucnStatus || 'NE'}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-amber-900/40 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-amber-400/70 uppercase block">Toplam Kayıt</span>
                  <span className="text-lg font-bold text-white tabular-nums">{s.totalRecords} adet</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400/70 uppercase block">Haritalanan GPS</span>
                  <span className="text-lg font-bold text-amber-300 tabular-nums">{s.mappedRecordsCount} nokta</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400/70 uppercase block">Zirve Yıl</span>
                  <span className="text-sm font-bold text-white">{s.peakYear?.year || '—'} ({s.peakYear?.count || 0})</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400/70 uppercase block">Lider İl</span>
                  <span className="text-sm font-bold text-white truncate block">{s.regionalStats[0]?.region || '—'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-amber-300/60">
              <Scale className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Yukarıdaki önerilerden veya kutudan ikinci bir canlı seçin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Yearly Comparison if both species loaded */}
      {s && (
        <div className="p-6 bg-[#0b1510] rounded-2xl border border-emerald-900/50">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span>Yıllara Göre Gözlem Hacmi Karşılaştırması</span>
            <div className="flex items-center gap-4 text-xs font-normal">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                {p.species.turkishName || p.species.canonicalName}
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                {s.species.turkishName || s.species.canonicalName}
              </span>
            </div>
          </h4>

          {/* Combined 9-Metric Scientific Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-emerald-900/60 text-emerald-400/70 text-left">
                  <th className="py-2.5 pr-4 uppercase text-[11px] font-bold">13. Yönerge Metrikleri</th>
                  <th className="py-2.5 px-4 text-emerald-300 font-bold text-sm">{p.species.turkishName || p.species.canonicalName}</th>
                  <th className="py-2.5 px-4 text-amber-300 font-bold text-sm">{s.species.turkishName || s.species.canonicalName}</th>
                  <th className="py-2.5 pl-4 text-right uppercase text-[11px]">Kıyaslama / Analiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/40">
                {/* 1. Türkçe İsim */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">1. Türkçe İsim</td>
                  <td className="py-2.5 px-4 font-bold text-white">{p.species.turkishName}</td>
                  <td className="py-2.5 px-4 font-bold text-white">{s.species.turkishName}</td>
                  <td className="py-2.5 pl-4 text-right text-emerald-400/70">Yerel adlandırma</td>
                </tr>

                {/* 2. Bilimsel İsim */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">2. Bilimsel İsim (Taksonomi)</td>
                  <td className="py-2.5 px-4 italic font-serif text-emerald-300">{p.species.scientificName}</td>
                  <td className="py-2.5 px-4 italic font-serif text-amber-300">{s.species.scientificName}</td>
                  <td className="py-2.5 pl-4 text-right text-emerald-400/70">Binominal nomenklatür</td>
                </tr>

                {/* 3. Familya ve Sınıf */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">3. Familya ve Sınıf</td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="block font-semibold">{p.species.family || 'Bilinmiyor'}</span>
                    <span className="text-[10px] text-emerald-400/70 block">{p.species.class || p.species.classHierarchy || '—'} / {p.species.order || '—'}</span>
                  </td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="block font-semibold">{s.species.family || 'Bilinmiyor'}</span>
                    <span className="text-[10px] text-amber-400/70 block">{s.species.class || s.species.classHierarchy || '—'} / {s.species.order || '—'}</span>
                  </td>
                  <td className="py-2.5 pl-4 text-right text-emerald-400/70">
                    {p.species.family === s.species.family ? 'Aynı Familya' : 'Farklı Familya'}
                  </td>
                </tr>

                {/* 4. Toplam GBIF Gözlem Sayısı */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">4. Toplam GBIF Kaydı (Arşiv)</td>
                  <td className="py-2.5 px-4 font-bold text-white tabular-nums">{p.totalRecords.toLocaleString('tr-TR')} adet</td>
                  <td className="py-2.5 px-4 font-bold text-white tabular-nums">{s.totalRecords.toLocaleString('tr-TR')} adet</td>
                  <td className="py-2.5 pl-4 text-right text-emerald-300 font-bold">
                    {p.totalRecords > 0 && s.totalRecords > 0 
                      ? `${(Math.max(p.totalRecords, s.totalRecords) / Math.min(p.totalRecords, s.totalRecords)).toFixed(1)} kat fark`
                      : '—'}
                  </td>
                </tr>

                {/* 5. GPS Koordinatlı Gözlem Sayısı */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">5. GPS Koordinatlı Kayıt (Harita)</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-300 tabular-nums">
                    {p.mappedRecordsCount.toLocaleString('tr-TR')} nokta
                    <span className="block text-[10px] font-normal text-emerald-400/70">
                      (%{p.downloadedRecordsCount > 0 ? Math.round((p.mappedRecordsCount / p.downloadedRecordsCount) * 100) : 0} başarı)
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-bold text-amber-300 tabular-nums">
                    {s.mappedRecordsCount.toLocaleString('tr-TR')} nokta
                    <span className="block text-[10px] font-normal text-amber-400/70">
                      (%{s.downloadedRecordsCount > 0 ? Math.round((s.mappedRecordsCount / s.downloadedRecordsCount) * 100) : 0} başarı)
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-right text-emerald-300">
                    Haritada coğrafi koordinatlı
                  </td>
                </tr>

                {/* 6. En Fazla Gözlem Yapılan Bölgeler */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">6. En Çok Gözlenen Bölgeler / İller</td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="font-bold text-emerald-300">{p.regionalStats[0]?.region || '—'}</span>
                    <span className="text-[10px] text-emerald-400/70 block">
                      {p.regionalStats.slice(0, 3).map(r => `${r.region} (${r.count})`).join(', ') || 'Veri yok'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="font-bold text-amber-300">{s.regionalStats[0]?.region || '—'}</span>
                    <span className="text-[10px] text-amber-400/70 block">
                      {s.regionalStats.slice(0, 3).map(r => `${r.region} (${r.count})`).join(', ') || 'Veri yok'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-right text-emerald-300">
                    {p.regionalStats.length} İl vs {s.regionalStats.length} İl yayılış
                  </td>
                </tr>

                {/* 7. Yıllara Göre Değişim / Zirve Yıl */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">7. Yıllara Göre Değişim / Zirve Yıl</td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="font-bold text-emerald-300">Zirve: {p.peakYear?.year || '—'}</span>
                    <span className="text-[10px] text-emerald-400/70 block">
                      ({p.peakYear?.count || 0} kayıt) — İlk: {p.lowestYear?.year || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="font-bold text-amber-300">Zirve: {s.peakYear?.year || '—'}</span>
                    <span className="text-[10px] text-amber-400/70 block">
                      ({s.peakYear?.count || 0} kayıt) — İlk: {s.lowestYear?.year || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-right text-emerald-300">
                    Kronolojik gözlem yoğunluğu
                  </td>
                </tr>

                {/* 8. Koruma Kategorisi (IUCN) */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">8. Koruma Durumu (IUCN Red List)</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      {p.species.iucnStatus || 'NE'}
                    </span>
                    <span className="block text-[10px] text-emerald-300/80 mt-0.5">
                      {p.species.iucnCategoryName || 'Değerlendirilmemiş'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/50">
                      {s.species.iucnStatus || 'NE'}
                    </span>
                    <span className="block text-[10px] text-amber-300/80 mt-0.5">
                      {s.species.iucnCategoryName || 'Değerlendirilmemiş'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-right text-emerald-400/70 text-[10px]">
                    Resmi IUCN Kırmızı Liste verisi
                  </td>
                </tr>

                {/* 9. Veri Kaynakları ve Güvenilirlik */}
                <tr>
                  <td className="py-2.5 pr-4 text-emerald-100 font-sans font-medium">9. Veri Kaynakları & Güvenilirlik</td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="block text-emerald-300 font-bold">GBIF + iNaturalist</span>
                    <span className="text-[10px] text-emerald-400/70 block">
                      Eşleşme: {p.species.matchType || 'EXACT'} (%{p.species.confidence || 95} güven)
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white">
                    <span className="block text-amber-300 font-bold">GBIF + iNaturalist</span>
                    <span className="text-[10px] text-amber-400/70 block">
                      Eşleşme: {s.species.matchType || 'EXACT'} (%{s.species.confidence || 95} güven)
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-right text-emerald-400/70 text-[10px]">
                    Hakemli & açık bilimsel veriler
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
