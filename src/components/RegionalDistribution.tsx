import React, { useState } from 'react';
import { RegionStat } from '../types/biodiversity';
import { MapPin, Navigation, HelpCircle, Layers, ArrowUpDown } from 'lucide-react';

interface RegionalDistributionProps {
  regionalStats: RegionStat[];
  unlocatedCount: number;
  totalRecords: number;
  onSelectRegion?: (regionName: string) => void;
}

export const RegionalDistribution: React.FC<RegionalDistributionProps> = ({
  regionalStats,
  unlocatedCount,
  totalRecords,
  onSelectRegion
}) => {
  const [showAll, setShowAll] = useState(false);

  if (!regionalStats || regionalStats.length === 0) {
    return (
      <div className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 text-center text-emerald-300/60">
        <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Bu türe ait il veya bölge bazında ayrıştırılmış kayıt bulunamadı.</p>
      </div>
    );
  }

  const maxCount = Math.max(...regionalStats.map(r => r.count), 1);
  const displayedRegions = showAll ? regionalStats : regionalStats.slice(0, 8);
  const topRegion = regionalStats[0];

  return (
    <div className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col justify-between">
      <div>
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-900/40">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Bölgelere Göre Dağılım</span>
            </h3>
            <p className="text-xs text-emerald-300/70 mt-1">
              Türün gözlemlendiği iller ve GBIF arşiv fasetleri üzerinden hesaplanan bölgesel yoğunluk analizi
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-mono text-emerald-400/80 uppercase block">
              Tespit Edilen İl
            </span>
            <span className="text-lg font-bold font-mono text-white tabular-nums">
              {regionalStats.length} İl
            </span>
            <span className="text-[10px] text-emerald-300/60 font-mono block">
              ({totalRecords.toLocaleString('tr-TR')} arşiv kaydı)
            </span>
          </div>
        </div>

        {/* Top Region Highlight Banner */}
        {topRegion && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 to-[#13241b] border border-emerald-700/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold font-mono text-sm">
                #1
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/80">
                  En Yüksek Gözlem Yoğunluğu
                </span>
                <h4 className="text-base font-bold text-white">
                  {topRegion.region}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold font-mono text-emerald-300 tabular-nums">
                {topRegion.count}
                <span className="text-xs font-normal text-emerald-400/80 ml-1">kayıt</span>
              </div>
              <span className="text-[11px] text-emerald-300/60 font-mono">
                Toplamın %{Math.round((topRegion.count / totalRecords) * 100)}'si
              </span>
            </div>
          </div>
        )}

        {/* Region Bars List */}
        <div className="space-y-3">
          {displayedRegions.map((item, idx) => {
            const barWidthPercent = Math.max(5, Math.round((item.count / maxCount) * 100));
            const shareOfTotal = totalRecords > 0 ? Math.round((item.count / totalRecords) * 100) : 0;

            return (
              <div
                key={item.region}
                onClick={() => onSelectRegion && onSelectRegion(item.region)}
                className="group p-2 rounded-lg hover:bg-[#0b1510]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400/60 w-5 text-right tabular-nums">
                      {idx + 1}.
                    </span>
                    <span className="font-semibold text-emerald-100 group-hover:text-emerald-300 transition-colors">
                      {item.region}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-white tabular-nums">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-emerald-400/60">
                      (%{shareOfTotal})
                    </span>
                  </div>
                </div>

                {/* Progress Meter Bar */}
                <div className="h-2 w-full bg-[#0b1510] rounded-full overflow-hidden p-0.5 border border-emerald-900/40">
                  <div
                    style={{ width: `${barWidthPercent}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-400'
                        : idx < 3
                        ? 'bg-emerald-400'
                        : 'bg-emerald-600/70'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand / Collapse Button if more than 8 regions */}
        {regionalStats.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full py-2.5 text-xs font-semibold text-emerald-300 hover:text-white bg-[#0b1510]/80 hover:bg-[#0b1510] border border-emerald-800/40 rounded-xl transition-colors cursor-pointer"
          >
            {showAll ? 'Daha Az İl Göster' : `Tüm İlleri Listele (${regionalStats.length} İl)`}
          </button>
        )}
      </div>

      {/* Unlocated / Unspecified Location Records Notice */}
      <div className="mt-6 pt-4 border-t border-emerald-900/40">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b1510]/80 border border-emerald-800/30 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-300/80">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Konum / İl Adı Belirtilmemiş Kayıtlar</span>
          </div>
          <div className="font-mono font-bold text-amber-300 tabular-nums">
            {unlocatedCount} Kayıt
            <span className="text-[10px] font-normal text-emerald-400/60 ml-1.5">
              (Analizde korundu)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
