import React, { useState } from 'react';
import { SpeciesAnalysis } from '../types/biodiversity';
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
  ArrowRight
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
  report: string;
  steps: AgentExecutionStep[];
  analysis: SpeciesAnalysis | null;
  speciesName: string;
  agentMode: string;
}

interface ResearchAgentProps {
  onLoadSpeciesToAtlas: (scientificName: string, country?: string) => void;
  activeSpeciesName?: string;
}

const PRESET_QUERIES = [
  {
    label: 'Bozayı Trendleri',
    query: "Türkiye'de Bozayı (Ursus arctos) gözlem kayıtlarını ve en yoğun görüldüğü illeri araştır",
  },
  {
    label: 'Akdeniz Foku Dağılımı',
    query: "Kritik tehlikedeki Akdeniz Foku (Monachus monachus) için kıyı gözlem kayıtlarını ve koruma durumunu analiz et",
  },
  {
    label: 'Endemik Toros Kurbağası',
    query: "Toros Kurbağası (Rana holtzi) kayıtlarını çıkar ve kritik tehdit analizini yap",
  },
  {
    label: 'Vaşak Kayıtları',
    query: "Bayağı Vaşak (Lynx lynx) gözlem kayıtlarının il bazlı dağılımı ve zirve yıllarını belirle",
  },
  {
    label: 'Bozkurt Dağılımı',
    query: "Bozkurt (Canis lupus) popülasyon gözlem eğilimi ve GPS koordinatlı kayıt oranını incele",
  },
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
              Yapay zekâ destekli otonom araştırma asistanı; doğal dildeki araştırma talebinizi anlar, GBIF açık bilim veri tabanından gerçek gözlem kayıtlarını çeker, zamansal ve coğrafi dağılımı analiz edip bilimsel sentez raporu üretir.
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
      <div className="mt-2 mb-8">
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
            placeholder="Ajan için araştırma görevi yazın... (Örn: Türkiye'de son 20 yılda Bozayı gözlem kayıtlarını ve en çok görüldüğü illeri analiz et)"
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
              Kullanıcı görevi çözümleniyor, GBIF API'sinden canlı bilimsel veriler ve koordinatlar çekiliyor...
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {!isLoading && result && (
        <div className="space-y-6 pt-2">
          
          {/* Agent Workflow Execution Audit Trail */}
          {result.steps && result.steps.length > 0 && (
            <div className="bg-[#0b1510]/70 border border-emerald-900/60 rounded-2xl p-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ajan Çalışma Akışı & Doğrulama Adımları ({result.steps.length} Adım)</span>
              </h3>

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
                  {result.analysis.countryName} arşivi
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

          {/* Synthesis Report Content */}
          <div className="p-6 rounded-2xl bg-[#0b1510] border border-emerald-800/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-900/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Ajan Araştırma ve Sentez Raporu</h3>
              </div>

              {/* Synchronize button: Loads species into main map & overview */}
              {result.analysis && (
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
              <div className="text-emerald-300/80">
                Ajan Modu: {result.agentMode === 'gemini_function_calling' ? 'Gemini 3.8 Flash (Tool Calling)' : 'GBIF Analitik Sentez'}
              </div>
            </div>
          </div>

        </div>
      )}

    </section>
  );
};
