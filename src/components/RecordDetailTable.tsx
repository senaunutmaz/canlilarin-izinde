import React, { useState } from 'react';
import { GBIFOccurrence } from '../types/biodiversity';
import { Database, Search, ExternalLink, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecordDetailTableProps {
  occurrences: GBIFOccurrence[];
  totalCount: number;
}

export const RecordDetailTable: React.FC<RecordDetailTableProps> = ({ occurrences, totalCount }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filtered = occurrences.filter((occ) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (occ.stateProvince && occ.stateProvince.toLowerCase().includes(q)) ||
      (occ.locality && occ.locality.toLowerCase().includes(q)) ||
      (occ.basisOfRecord && occ.basisOfRecord.toLowerCase().includes(q)) ||
      (occ.year && String(occ.year).includes(q))
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div id="kayitlar" className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 lg:p-8 shadow-xl my-8">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-900/40">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Bilimsel Gözlem Kayıtları Arşivi</span>
          </h3>
          <p className="text-xs text-emerald-300/70 mt-1">
            GBIF veri tabanında taranan gerçek gözlem numuneleri ve saha kayıtları
          </p>
        </div>

        {/* Filter input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-emerald-400/70 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="İl, yıl veya gözlem türü ara..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#0b1510] text-xs text-white rounded-xl border border-emerald-800/40 focus:outline-none focus:border-emerald-400 placeholder-emerald-400/40 font-medium"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-emerald-900/60 text-emerald-400/80 uppercase font-mono tracking-wider text-[10px]">
              <th className="py-3 px-3">Tarih / Yıl</th>
              <th className="py-3 px-3">Bölge / Konum</th>
              <th className="py-3 px-3">Koordinatlar (GPS)</th>
              <th className="py-3 px-3">Kayıt Türü</th>
              <th className="py-3 px-3">Katalog / Kaynak</th>
              <th className="py-3 px-3 text-right">GBIF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-950/60 font-mono">
            {paginated.length > 0 ? (
              paginated.map((occ) => (
                <tr key={occ.key} className="hover:bg-[#13241b] transition-colors">
                  <td className="py-3 px-3 text-white font-medium whitespace-nowrap">
                    {occ.year || (occ.eventDate ? occ.eventDate.slice(0, 10) : 'Tarih Yok')}
                  </td>
                  <td className="py-3 px-3 font-sans text-emerald-200">
                    <span className="font-semibold block">{occ.stateProvince || 'Konum Belirtilmemiş'}</span>
                    {occ.locality && (
                      <span className="text-[11px] text-emerald-400/60 truncate block max-w-xs">{occ.locality}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-emerald-300 tabular-nums whitespace-nowrap">
                    {occ.decimalLatitude && occ.decimalLongitude ? (
                      <span>
                        {occ.decimalLatitude.toFixed(4)}°K, {occ.decimalLongitude.toFixed(4)}°D
                      </span>
                    ) : (
                      <span className="text-amber-400/70 text-[11px]">Koordinatsız</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-sans text-emerald-100">
                    <span className="bg-[#0b1510] border border-emerald-800/30 px-2 py-0.5 rounded text-[11px]">
                      {occ.basisOfRecord || 'Gözlem Kaydı'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-emerald-400/70 text-[11px] truncate max-w-[160px]">
                    {occ.datasetName || occ.institutionCode || 'GBIF Node'}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <a
                      href={`https://www.gbif.org/occurrence/${occ.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                      title="GBIF Kayıt Sayfası"
                    >
                      <span className="text-[10px]">İncele</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-emerald-400/50 font-sans">
                  Aramanıza uygun kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-emerald-900/40 text-xs">
        <span className="text-emerald-300/70 font-mono">
          Gösterilen: <strong className="text-white">{filtered.length}</strong> kayıt (Toplam taranan: {totalCount})
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-[#0b1510] hover:bg-[#13241b] text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-800/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-emerald-200 px-2">
            Sayfa {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-[#0b1510] hover:bg-[#13241b] text-emerald-300 disabled:opacity-30 disabled:cursor-not-allowed border border-emerald-800/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
