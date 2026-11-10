import React from 'react';
import { Shield, AlertCircle, Info, BookOpen, ExternalLink } from 'lucide-react';

export const ConservationGuide: React.FC = () => {
  const iucnCategories = [
    { code: 'EX', name: 'Tükenmiş (Extinct)', desc: 'Son bireyin de öldüğüne dair hiçbir şüphe kalmamış türler.', color: 'border-slate-600 text-slate-300 bg-slate-900/60' },
    { code: 'EW', name: 'Doğada Tükenmiş (Extinct in the Wild)', desc: 'Yalnızca esaret altında, botanik bahçelerinde veya doğal yaşam alanı dışında yaşayan türler.', color: 'border-purple-600 text-purple-300 bg-purple-950/60' },
    { code: 'CR', name: 'Kritik Tehlikede (Critically Endangered)', desc: 'Doğada neslinin tükenmesi konusunda aşırı derecede yüksek risk altında olan türler (Örn: Toros Kurbağası).', color: 'border-rose-600 text-rose-300 bg-rose-950/60' },
    { code: 'EN', name: 'Tehlikede (Endangered)', desc: 'Doğada neslinin tükenme riski çok yüksek olan türler (Örn: Akdeniz Foku, Kelaynak, Yeşil Kaplumbağa).', color: 'border-orange-600 text-orange-300 bg-orange-950/60' },
    { code: 'VU', name: 'Hassas (Vulnerable)', desc: 'Doğada tükenme tehlikesiyle karşı karşıya olan ve koruma önlemleri gerektiren türler (Örn: Toy Kuşu, Caretta caretta).', color: 'border-amber-600 text-amber-300 bg-amber-950/60' },
    { code: 'NT', name: 'Tehdite Yakın (Near Threatened)', desc: 'Şu anda tehlike altında olmayan fakat yakın gelecekte tehlike sınırına girebilecek türler (Örn: Çizgili Sırtlan).', color: 'border-yellow-600 text-yellow-300 bg-yellow-950/60' },
    { code: 'LC', name: 'Asgari Endişe (Least Concern)', desc: 'Yaygın ve geniş popülasyonlara sahip, yakın gelecekte tükenme riski bulunmayan türler (Örn: Bozayı, Bozkurt).', color: 'border-emerald-600 text-emerald-300 bg-emerald-950/60' },
    { code: 'DD', name: 'Veri Yetersiz (Data Deficient)', desc: 'Dağılımı veya popülasyon durumu hakkında doğrudan ya da dolaylı yeterli bilgi bulunmayan türler.', color: 'border-slate-500 text-slate-300 bg-slate-900/40' }
  ];

  return (
    <section id="metodoloji" className="my-12 bg-[#0b1510] border border-emerald-900/60 rounded-3xl p-6 lg:p-8 shadow-2xl">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-emerald-900/40">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bilimsel Rehber</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            IUCN Koruma Kategorileri & Bilimsel Metodoloji
          </h2>
          <p className="text-xs text-emerald-200/70 mt-1 max-w-2xl">
            Canlı Atlası, küresel biyoçeşitlilik açık verilerini ve IUCN Kırmızı Liste ölçütlerini bilimsel metodoloji ilkelerine sadık kalarak sunar.
          </p>
        </div>

        <a
          href="https://www.iucnredlist.org"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#13241b] hover:bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>IUCN Red List Resmi Sitesi</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Critical Scientific Clarification Box */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-[#111e17] border border-emerald-700/50 flex flex-col md:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs text-emerald-100/90 leading-relaxed space-y-2">
          <h4 className="text-sm font-bold text-white">
            Gözlem Sayısı ile Canlı Popülasyonu Arasındaki Temel Fark
          </h4>
          <p>
            GBIF üzerindeki <strong>gözlem kayıtlarının sayısı</strong> (occurrence count), o canlı türünün doğadaki toplam nüfusunu (popülasyonunu) ifade etmez. Bir türün son yıllarda daha çok kaydedilmesi, türün çoğaldığını değil; doğa gözlemcilerinin, fotokapanların ve dijital vatandaş bilimi (iNaturalist vb.) platformlarının kullanımının arttığını gösterir.
          </p>
          <p className="text-emerald-300 font-medium">
            Örnek: Bozayı (Ursus arctos) Türkiye genelinde "Asgari Endişe" (LC) küresel statüsündedir ancak yerel yaşam alanlarının bölünmesi gibi tehditler bağımsız bilimsel raporlarla takip edilir.
          </p>
        </div>
      </div>

      {/* IUCN Categories Grid */}
      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4">
        IUCN Kırmızı Liste Koruma Dereceleri
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {iucnCategories.map((cat) => (
          <div
            key={cat.code}
            className={`p-4 rounded-xl border transition-all ${cat.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-black tracking-widest px-2 py-0.5 rounded bg-black/40">
                {cat.code}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white mb-1.5">
              {cat.name}
            </h4>
            <p className="text-[11px] text-emerald-100/70 leading-relaxed">
              {cat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
