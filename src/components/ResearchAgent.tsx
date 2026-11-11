import React, { useState } from 'react';
import { SpeciesAnalysis, ResearchParameters } from '../types/biodiversity';
import { 
  Bot, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Layers, 
  MapPin, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink, 
  RotateCcw, 
  Loader2,
  FileText,
  Compass,
  ArrowRight,
  HelpCircle,
  Calendar,
  Filter,
  Check
} from 'lucide-react';

interface AgentExecutionStep {
  id: string;
  title: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
}

interface AgentResearchResponse {
  success: boolean;
  requiresClarification?: boolean;
  isZeroRecords?: boolean;
  report?: string;
  error?: string;
  steps: AgentExecutionStep[];
  analysis: SpeciesAnalysis | null;
  speciesName: string | null;
  parameters?: ResearchParameters | null;
  agentMode: string;
}

interface ResearchAgentProps {
  onLoadSpeciesToAtlas: (scientificName: string, country?: string) => void;
  activeSpeciesName?: string;
}

const PRESET_QUERIES = [
  {
    label: 'Test 1: Bozayı 10 Yıllık GBIF Analizi',
    query: "Türkiye'deki boz ayıların son 10 yıllık GBIF gözlem kayıtlarını araştır. En fazla kayıt bulunan illeri belirle ve yıllara göre değişimi açıkla.",
  },
  {
    label: 'Test 2: Vaşak Yıllık Dağılımı',
    query: "Türkiye'de vaşak gözlemlerinin yıllara göre dağılımını incele.",
  },
  {
    label: 'Test 3: Caretta caretta Dağılımı',
    query: "Türkiye'deki Caretta caretta gözlem kayıtlarını ve coğrafi dağılımını araştır.",
  },
  {
    label: 'Test 4: Son 10 Yılda Bozayı Yoğunluğu',
    query: "Son 10 yılda Türkiye'de en fazla gözlemlenen bozayı kayıtlarının hangi bölgelerde olduğunu bul.",
  },
  {
    label: 'Akdeniz Foku Kıyı Kayıtları',
    query: "Kritik tehlikedeki Akdeniz Foku (Monachus monachus) için kıyı gözlem kayıtlarını ve koruma durumunu analiz et",
  },
];

const QUICK_SPECIES_OPTIONS = [
  { name: 'Bozayı', sci: 'Ursus arctos' },
  { name: 'Bayağı Vaşak', sci: 'Lynx lynx' },
  { name: 'Bozkurt', sci: 'Canis lupus' },
  { name: 'Caretta caretta', sci: 'Caretta caretta' },
  { name: 'Akdeniz Foku', sci: 'Monachus monachus' },
  { name: 'Toros Kurbağası', sci: 'Rana holtzi' },
  { name: 'Kelaynak', sci: 'Geronticus eremita' },
];

export const ResearchAgent: React.FC<ResearchAgentProps> = ({ onLoadSpeciesToAtlas, activeSpeciesName }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('TR');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResearchResponse | null>(null);

  const handleExecuteResearch = async (queryToRun?: string) => {
    const finalQuery = (queryToRun || prompt).trim();
    if (!finalQuery) return;

    if (queryToRun) {
      setPrompt(queryToRun);
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/agent/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, country: selectedCountry }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ajan araştırması yürütülemedi.');
      }

      const data: AgentResearchResponse = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Agent research failed:', err);
      setErrorMessage(err.message || 'Ajan bağlantısında bir aksaklık oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEngineBadge = (mode: string) => {
    switch (mode) {
      case 'gemini_function_calling':
        return {
          label: 'Gemini 2.5 Flash (Yapay Zekâ Ajanı - Function Calling)',
          color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
        };
      case 'deterministic_gbif':
        return {
          label: 'GBIF Bilimsel Analitik Motoru (Doğrudan Çözümleyici)',
          color: 'text-teal-300 border-teal-500/40 bg-teal-950/60',
        };
      case 'gbif_verified':
        return {
          label: 'GBIF Açık Bilim Doğrulanmış Kayıt Motoru',
          color: 'text-amber-300 border-amber-500/40 bg-amber-950/60',
        };
      default:
        return {
          label: 'Canlı Atlası Analiz Motoru',
          color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
        };
    }
  };

  return (
    <section id="ajan" className="bg-[#111e17] border border-emerald-800/60 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header with Agent Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-emerald-900/50">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Biyoçeşitlilik Araştırma Ajanı</span>
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>AI Agent & GBIF Engine</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/70 max-w-2xl">
              Doğal dildeki araştırma talebinizi ayrıştırır; canlı türünü, hedef bölgeyi ve tarih aralığını tespit ederek GBIF açık bilim veritabanından doğrulanmış gözlem kayıtlarını çeker ve akademik sentez raporu üretir.
            </p>
          </div>
        </div>

        {/* Coğrafya Filtresi */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <span className="text-xs text-emerald-300/70 font-medium">Hedef Bölge:</span>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-1.5 bg-[#0b1510] text-xs text-white rounded-xl border border-emerald-800/50 focus:outline-none focus:border-emerald-400 font-medium cursor-pointer"
          >
            <option value="TR">Türkiye (TR)</option>
            <option value="">Tüm Dünya (Global)</option>
          </select>
        </div>
      </div>

      {/* Preset Quick Research Chips */}
      <div className="py-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 shrink-0 mr-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hazır Araştırma Görevleri:</span>
        </span>
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleExecuteResearch(preset.query)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-xl bg-[#0b1510]/80 hover:bg-emerald-950/80 border border-emerald-800/40 hover:border-emerald-500/50 text-emerald-200 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Agent Search Console */}
      <div className="mt-2 mb-6">
        <div className="relative rounded-2xl bg-[#0b1510] border border-emerald-700/50 p-2 flex flex-col sm:flex-row items-stretch gap-2 shadow-inner focus-within:border-emerald-400 transition-colors">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleExecuteResearch();
              }
            }}
            placeholder="Ajan için araştırma görevi yazın... (Örn: Türkiye'deki boz ayıların son 10 yıllık GBIF gözlem kayıtlarını araştır. En fazla kayıt bulunan illeri belirle ve yıllara göre değişimi açıkla.)"
            rows={2}
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white focus:outline-none placeholder-emerald-400/40 resize-none font-sans"
          />

          <div className="flex sm:flex-col justify-end gap-2 shrink-0">
            <button
              onClick={() => handleExecuteResearch()}
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2.5 sm:py-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Araştırılıyor...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Görevi Yürüt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-700/60 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Clarification Alert (When species is not identified) */}
      {!isLoading && result && result.requiresClarification && (
        <div className="mb-6 p-6 rounded-2xl bg-amber-950/40 border border-amber-600/50 space-y-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-200 mb-1">Araştırılacak Canlı Türü Tespit Edilemedi</h4>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                {result.error || 'Yazdığınız cümlede doğrulanmış bir canlı türü tespit edilemedi. Lütfen incelemek istediğiniz türü belirterek yeniden deneyin.'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-800/40">
            <p className="text-xs font-semibold text-amber-300 mb-2">Hızlıca araştırabileceğiniz yaygın türler:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SPECIES_OPTIONS.map((spec) => (
                <button
                  key={spec.sci}
                  onClick={() => handleExecuteResearch(`Türkiye'deki ${spec.name} (${spec.sci}) gözlem kayıtlarını ve bölgesel dağılımını araştır.`)}
                  className="px-3 py-1.5 rounded-xl bg-[#0b1510] hover:bg-amber-900/40 border border-amber-700/40 text-amber-200 text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{spec.name}</span>
                  <span className="italic text-[10px] text-amber-400/70">({spec.sci})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Animation HUD */}
      {isLoading && (
        <div className="py-12 px-6 rounded-2xl bg-[#0b1510]/60 border border-emerald-900/60 flex flex-col items-center justify-center text-center space-y-4 my-6">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-900/60 border-t-emerald-400 animate-spin" />
            <Bot className="w-7 h-7 text-emerald-400 absolute inset-0 m-auto" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">Ajan Araştırmayı Yürütüyor</h4>
            <p className="text-xs text-emerald-300/70 max-w-md">
              Doğal dil sorgusu ayrıştırılıyor, GBIF API'sinden canlı bilimsel veriler ve koordinatlar çekiliyor...
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {!isLoading && result && !result.requiresClarification && (
        <div className="space-y-6 pt-2">
          
          {/* Agent Workflow Execution Audit Trail */}
          {result.steps && result.steps.length > 0 && (
            <div className="bg-[#0b1510]/70 border border-emerald-900/60 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ajan Çalışma Akışı & Doğrulama Adımları ({result.steps.length} Adım)</span>
                </h3>
                
                {/* Engine attribution badge */}
                <span className={`text-[11px] font-mono px-3 py-1 rounded-full border font-semibold ${getEngineBadge(result.agentMode).color}`}>
                  {getEngineBadge(result.agentMode).label}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.steps.map((step, idx) => (
                  <div key={step.id} className="p-3 bg-[#111e17] rounded-xl border border-emerald-800/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400/80 mb-1">
                        <span>Adım {idx + 1}</span>
                        <span>{step.timestamp}</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-1">{step.title}</p>
                      <p className="text-[11px] text-emerald-300/70 leading-relaxed line-clamp-2">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Research Parameters HUD Card */}
          {result.parameters && (
            <div className="bg-[#0b1510] border border-emerald-800/50 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Ayrıştırılan Araştırma Parametreleri</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#111e17] border border-emerald-900/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 block mb-0.5">
                    Hedef Canlı Türü
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {result.parameters.speciesName}
                  </p>
                  <span className="text-[10px] italic font-serif text-emerald-300/70 block">
                    {result.parameters.scientificName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#111e17] border border-emerald-900/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 block mb-0.5">
                    Hedef Coğrafya
                  </span>
                  <p className="text-xs font-bold text-white">
                    {result.parameters.country}
                  </p>
                  <span className="text-[10px] font-mono text-emerald-300/70 block">
                    ISO Kodu: {result.parameters.countryCode || 'Global (Tüm Dünya)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#111e17] border border-emerald-900/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 block mb-0.5">
                    Tarih Aralığı
                  </span>
                  <p className="text-xs font-bold text-emerald-300 truncate">
                    {result.parameters.dateRangeText}
                  </p>
                  <span className="text-[10px] text-emerald-400/60 block">
                    GBIF Yıl Filtresi
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#111e17] border border-emerald-900/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/70 block mb-0.5">
                    İstenen Analiz Kapsamı
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {result.parameters.analysisType}
                  </p>
                  <span className="text-[10px] text-emerald-300/70 block truncate">
                    {result.parameters.geographicScope}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Key Findings KPI Grid (if analysis present) */}
          {result.analysis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#0b1510] border border-emerald-800/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                  İncelenen Canlı
                </span>
                <p className="text-sm font-bold text-white truncate">
                  {result.analysis.species.turkishName || result.analysis.species.canonicalName}
                </p>
                <span className="text-[10px] italic font-serif text-emerald-300/70 block mt-0.5">
                  {result.analysis.species.scientificName}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1510] border border-emerald-800/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                  Toplam GBIF Kaydı
                </span>
                <p className="text-xl font-bold font-mono text-white tabular-nums">
                  {result.analysis.totalRecords.toLocaleString('tr-TR')}
                </p>
                <span className="text-[10px] text-emerald-300/70 block mt-0.5">
                  {result.analysis.countryName} ({result.analysis.mappedRecordsCount} koordinatlı)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1510] border border-emerald-800/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                  Zirve Gözlem Yılı
                </span>
                <p className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
                  {result.analysis.peakYear ? result.analysis.peakYear.year : 'Belirtilmemiş'}
                </p>
                <span className="text-[10px] text-emerald-300/70 block mt-0.5">
                  {result.analysis.peakYear ? `${result.analysis.peakYear.count} kayıt kaydedildi` : 'Veri yetersiz'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0b1510] border border-emerald-800/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 block mb-1">
                  En Yoğun İl / Bölge
                </span>
                <p className="text-sm font-bold text-amber-300 truncate">
                  {result.analysis.regionalStats[0]?.region || 'Genel Dağılım'}
                </p>
                <span className="text-[10px] text-emerald-300/70 block mt-0.5">
                  {result.analysis.regionalStats[0] ? `%${result.analysis.regionalStats[0].percentage.toFixed(1)} gözlem payı` : 'Bölgesel veri yok'}
                </span>
              </div>
            </div>
          )}

          {/* Zero Records Warning Notification */}
          {result.isZeroRecords && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200">
                Belirtilen tarih veya coğrafya kriterlerinde GBIF açık bilim arşivinde kayıt bulunamadı. Lütfen sağ üstteki coğrafya filtresini <strong>"Tüm Dünya (Global)"</strong> yaparak veya tarih kısıtını kaldırarak tekrar deneyin.
              </p>
            </div>
          )}

          {/* Synthesis Report Content */}
          <div className="p-6 rounded-2xl bg-[#0b1510] border border-emerald-800/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Ajan Araştırma ve Sentez Raporu</h3>
              </div>

              {/* Synchronize button: Loads species into main map & overview */}
              {result.analysis && result.analysis.totalRecords > 0 && (
                <button
                  onClick={() => {
                    onLoadSpeciesToAtlas(result.analysis!.species.scientificName, selectedCountry);
                    window.scrollTo({ top: 380, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
                  title="Bu canlıyı ana harita, yıllık grafik ve tür genel bakışına aktar"
                >
                  <Compass className="w-4 h-4" />
                  <span>Bu Canlıyı Ana Harita & Atlasa Aktar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Markdown Report Body */}
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans space-y-4 whitespace-pre-wrap">
              {result.report}
            </div>

            {/* Source citations footer */}
            <div className="pt-4 mt-4 border-t border-emerald-900/40 flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-400/60 font-mono">
              <div className="flex items-center gap-3">
                <span>Birincil Veri: Küresel GBIF API v1</span>
                <span>•</span>
                <span>Taksonomi: iNaturalist & Catalogue of Life</span>
              </div>
              <div className="text-emerald-300/90 font-semibold">
                Çalışan Motor: {getEngineBadge(result.agentMode).label}
              </div>
            </div>
          </div>

        </div>
      )}

    </section>
  );
};

