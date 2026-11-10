import React from 'react';
import { SpeciesAnalysis } from '../types/biodiversity';
import { Info, ExternalLink, Calendar, MapPin, Database, ShieldAlert, Award, FileText } from 'lucide-react';

interface SpeciesOverviewProps {
  analysis: SpeciesAnalysis;
}

export const SpeciesOverview: React.FC<SpeciesOverviewProps> = ({ analysis }) => {
  const { species, totalRecords, mappedRecordsCount, unmappedRecordsCount, dateRange, countryName } = analysis;

  const coordinatePercentage = totalRecords > 0 
    ? Math.round((mappedRecordsCount / totalRecords) * 100) 
    : 0;

  // IUCN Renk Belirleme
  const getIucnBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'CR':
        return { bg: 'bg-rose-950/80 border-rose-600/50 text-rose-300', dot: 'bg-rose-500', name: 'Kritik Düzeyde Tehlikede (CR)' };
      case 'EN':
        return { bg: 'bg-orange-950/80 border-orange-600/50 text-orange-300', dot: 'bg-orange-500', name: 'Tehlikede (EN)' };
      case 'VU':
        return { bg: 'bg-amber-950/80 border-amber-600/50 text-amber-300', dot: 'bg-amber-500', name: 'Hassas (VU)' };
      case 'NT':
        return { bg: 'bg-yellow-950/80 border-yellow-600/50 text-yellow-300', dot: 'bg-yellow-500', name: 'Tehdite Yakın (NT)' };
      case 'LC':
        return { bg: 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300', dot: 'bg-emerald-500', name: 'Asgari Endişe (LC)' };
      default:
        return { bg: 'bg-slate-900 border-slate-700 text-slate-300', dot: 'bg-slate-500', name: 'Veri Yetersiz / Değerlendirilmemiş (DD)' };
    }
  };

  const iucnInfo = getIucnBadge(species.iucnStatus);

  return (
    <div className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 lg:p-8 shadow-xl">
      {/* Top Taxonomy Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-emerald-300/70 font-mono mb-4">
        <span>{species.kingdom || 'Animalia'}</span>
        <span>›</span>
        <span>{species.phylum || 'Chordata'}</span>
        {species.class && (
          <>
            <span>›</span>
            <span>{species.class}</span>
          </>
        )}
        {species.order && (
          <>
            <span>›</span>
            <span>{species.order}</span>
          </>
        )}
        {species.family && (
          <>
            <span>›</span>
            <span>{species.family}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Species Photo & IUCN Badge */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-[#0b1510] border border-emerald-800/40 shadow-inner group">
            {species.photoUrl ? (
              <img
                src={species.photoUrl}
                alt={species.turkishName || species.scientificName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-emerald-400/60">
                <Database className="w-12 h-12 mb-2 stroke-1" />
                <p className="text-xs">Fotoğraf iNaturalist arşivinde aranıyor</p>
              </div>
            )}
            
            {/* IUCN Tag overlay */}
            <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-lg border backdrop-blur-md text-xs font-semibold flex items-center gap-2 ${iucnInfo.bg}`}>
              <span className={`w-2 h-2 rounded-full ${iucnInfo.dot}`} />
              <span>{iucnInfo.name}</span>
            </div>
          </div>

          {species.photoAttribution && (
            <p className="text-[11px] text-emerald-300/50 truncate">
              Fotoğraf: {species.photoAttribution}
            </p>
          )}

          {/* Quick links to primary data sources */}
          <div className="flex items-center gap-2 pt-1">
            {species.gbifUrl && (
              <a
                href={species.gbifUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 text-xs font-medium bg-[#13241b] hover:bg-emerald-950/80 border border-emerald-800/40 rounded-lg text-emerald-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <span>GBIF Tür Kaydı</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {species.inaturalistUrl && (
              <a
                href={species.inaturalistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 text-xs font-medium bg-[#13241b] hover:bg-emerald-950/80 border border-emerald-800/40 rounded-lg text-emerald-200 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <span>iNaturalist</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right: Species Details & 4 Precision KPI Metrics */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline gap-3 mb-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {species.turkishName || species.canonicalName}
              </h2>
              <span className="text-lg italic font-serif text-emerald-300/80">
                {species.scientificName}
              </span>
            </div>

            {species.englishName && (
              <p className="text-sm text-emerald-200/60 mb-4">
                İngilizce: <span className="font-medium text-emerald-100">{species.englishName}</span>
              </p>
            )}

            {species.summary && (
              <p className="text-sm text-emerald-100/80 leading-relaxed mb-6 line-clamp-3 bg-[#0b1510]/50 p-3.5 rounded-xl border border-emerald-900/40">
                {species.summary.replace(/<\/?[^>]+(>|$)/g, "")}
              </p>
            )}
          </div>

          {/* 4 Precision Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            {/* Metric 1: Toplam Kayıt */}
            <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                Toplam Gözlem
              </span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {totalRecords.toLocaleString('tr-TR')}
              </div>
              <span className="text-[11px] text-emerald-300/60 block mt-0.5">
                {countryName} veri tabanı
              </span>
            </div>

            {/* Metric 2: Koordinatlı Kayıt Oranı */}
            <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                Haritalanan Kayıt
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">
                {mappedRecordsCount}
                <span className="text-xs font-normal text-emerald-400/70 ml-1">
                  (%{coordinatePercentage})
                </span>
              </div>
              <span className="text-[11px] text-emerald-300/60 block mt-0.5">
                GPS koordinatlı
              </span>
            </div>

            {/* Metric 3: Gözlem Yıl Aralığı */}
            <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                Tarih Aralığı
              </span>
              <div className="text-lg font-bold font-mono text-white tabular-nums pt-1">
                {dateRange.minYear && dateRange.maxYear 
                  ? `${dateRange.minYear} – ${dateRange.maxYear}`
                  : 'Belirtilmemiş'}
              </div>
              <span className="text-[11px] text-emerald-300/60 block mt-0.5">
                Arşivlenmiş yıllar
              </span>
            </div>

            {/* Metric 4: Koordinatsız Kayıtlar */}
            <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                Koordinatsız Kayıt
              </span>
              <div className="text-2xl font-bold font-mono text-amber-300/90 tabular-nums">
                {unmappedRecordsCount}
              </div>
              <span className="text-[11px] text-emerald-300/60 block mt-0.5">
                Analizde korundu
              </span>
            </div>
          </div>

          {/* Bilimsel Metodoloji & Popülasyon Ayrımı Uyarısı */}
          <div className="mt-4 p-3.5 bg-amber-950/30 border border-amber-600/30 rounded-xl flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-amber-300 block mb-0.5">
                Bilimsel Metodoloji Uyarısı:
              </strong>
              Gözlem kayıtlarının yıllara göre artması veya azalması doğrudan canlı popülasyonunun arttığı veya azaldığı anlamına gelmez. Dijital veri tabanlarının yaygınlaşması, mobil gözlem uygulamaları (vatandaş bilimi) ve araştırma seferlerinin sıklığı kayıt sayılarını belirgin biçimde etkiler.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
