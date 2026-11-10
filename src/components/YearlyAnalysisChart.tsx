import React, { useState } from 'react';
import { YearlyStat } from '../types/biodiversity';
import { TrendingUp, Award, Calendar, BarChart3, Filter } from 'lucide-react';

interface YearlyAnalysisChartProps {
  yearlyStats: YearlyStat[];
  peakYear: { year: number; count: number } | null;
  lowestYear: { year: number; count: number } | null;
  scientificName: string;
}

export const YearlyAnalysisChart: React.FC<YearlyAnalysisChartProps> = ({
  yearlyStats,
  peakYear,
  lowestYear,
  scientificName
}) => {
  const [hoveredYear, setHoveredYear] = useState<YearlyStat | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'recent20' | 'recent10'>('all');

  if (!yearlyStats || yearlyStats.length === 0) {
    return (
      <div className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 text-center text-emerald-300/60">
        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Bu türe ait yıllara göre arşivlenmiş gözlem verisi bulunamadı.</p>
      </div>
    );
  }

  // Filter according to selection
  const currentYear = new Date().getFullYear();
  let displayedStats = [...yearlyStats];
  if (timeFilter === 'recent20') {
    displayedStats = yearlyStats.filter(s => s.year >= currentYear - 20);
  } else if (timeFilter === 'recent10') {
    displayedStats = yearlyStats.filter(s => s.year >= currentYear - 10);
  }

  // Find max count for proportional heights
  const maxCount = Math.max(...displayedStats.map(s => s.count), 1);
  const totalObsInView = displayedStats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div id="analiz" className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 lg:p-8 shadow-xl">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-900/40">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Yıllara Göre Gözlem Dağılımı</span>
          </h3>
          <p className="text-xs text-emerald-300/70 mt-1">
            GBIF veri tabanında arşivlenen tarihli gözlemlerin kronolojik grafiği
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center gap-1 p-1 bg-[#0b1510] rounded-xl border border-emerald-800/40 shrink-0">
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Tüm Yıllar ({yearlyStats.length})
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('recent20')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeFilter === 'recent20'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Son 20 Yıl
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('recent10')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeFilter === 'recent10'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-300/70 hover:text-white'
            }`}
          >
            Son 10 Yıl
          </button>
        </div>
      </div>

      {/* KPI Cards: Peak Year vs Lowest Year */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {/* Peak Year */}
        <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80 block">
              Zirve Yıl (En Çok Kayıt)
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {peakYear ? `${peakYear.year}` : '—'}
              <span className="text-xs font-normal text-emerald-300/80 ml-2">
                ({peakYear ? `${peakYear.count} kayıt` : ''})
              </span>
            </div>
          </div>
        </div>

        {/* Lowest / Earliest Year */}
        <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/80 block">
              En Az / İlk Kayıt Yılı
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {lowestYear ? `${lowestYear.year}` : '—'}
              <span className="text-xs font-normal text-amber-300/80 ml-2">
                ({lowestYear ? `${lowestYear.count} kayıt` : ''})
              </span>
            </div>
          </div>
        </div>

        {/* Active Inspection Total */}
        <div className="bg-[#0b1510]/80 p-4 rounded-xl border border-emerald-800/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-400/80 block">
              Görüntülenen Dönem
            </span>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {totalObsInView.toLocaleString('tr-TR')}
              <span className="text-xs font-normal text-teal-300/80 ml-2">
                toplam kayıt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Stage */}
      <div className="relative pt-6 pb-2">
        {/* Active Hover Monospace Tooltip HUD */}
        <div className="h-7 mb-2 flex items-center justify-between text-xs font-mono">
          {hoveredYear ? (
            <div className="text-emerald-300 font-semibold bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-md">
              Yıl: <span className="text-white">{hoveredYear.year}</span> — Gözlem Kaydı: <span className="text-white tabular-nums">{hoveredYear.count} adet</span> ({Math.round((hoveredYear.count / totalObsInView) * 100)}%)
            </div>
          ) : (
            <div className="text-emerald-400/60 text-[11px]">
              Sütunların üzerine gelerek detaylı kayıt sayısını inceleyin
            </div>
          )}
          <span className="text-emerald-400/60 text-[11px]">Maksimum: {maxCount} kayıt</span>
        </div>

        {/* The Bars Container */}
        <div className="relative h-60 w-full flex items-end gap-1.5 sm:gap-2 px-1 pt-6 pb-6 border-b border-emerald-800/40">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-x-0 top-6 border-t border-dashed border-emerald-900/40 pointer-events-none" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-emerald-900/30 pointer-events-none" />

          {displayedStats.map((item) => {
            const heightPercent = Math.max(6, Math.round((item.count / maxCount) * 100));
            const isPeak = peakYear && item.year === peakYear.year;
            const isHovered = hoveredYear?.year === item.year;

            return (
              <div
                key={item.year}
                className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                onMouseEnter={() => setHoveredYear(item)}
                onMouseLeave={() => setHoveredYear(null)}
              >
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[28px] rounded-t-sm transition-all duration-200 ${
                    isPeak
                      ? 'bg-gradient-to-t from-emerald-600 to-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-300/50'
                      : isHovered
                      ? 'bg-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-emerald-600/70 group-hover:bg-emerald-500'
                  }`}
                />

                {/* X-Axis Year Label */}
                <div className="absolute -bottom-6 w-full text-center">
                  <span className={`text-[10px] font-mono tabular-nums block truncate ${
                    isPeak ? 'text-amber-300 font-bold' : isHovered ? 'text-white font-semibold' : 'text-emerald-300/60'
                  }`}>
                    {String(item.year).slice(-2)}'
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis Caption */}
        <div className="mt-7 flex items-center justify-between text-[11px] font-mono text-emerald-400/60">
          <span>{displayedStats[0]?.year}</span>
          <span>Gözlem Yılı Kronolojisi</span>
          <span>{displayedStats[displayedStats.length - 1]?.year}</span>
        </div>
      </div>
    </div>
  );
};
