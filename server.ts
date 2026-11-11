import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { fetchSpeciesAnalysis, matchSpecies, COMMON_TURKISH_SPECIES } from './src/services/gbif.ts';
import { SpeciesAnalysis } from './src/types/biodiversity.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3000', 10);

export interface AgentExecutionStep {
  id: string;
  title: string;
  detail: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
}

// 1. Tool Declaration for Gemini Function Calling
const fetchGbifDataDeclaration: FunctionDeclaration = {
  name: 'fetchGbifSpeciesData',
  description: 'Fetches verified scientific occurrence records, observation trends, GPS coordinates, and regional provincial stats from the Global Biodiversity Information Facility (GBIF) API for a species.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      scientificOrCommonName: {
        type: Type.STRING,
        description: 'Scientific name (e.g. Ursus arctos, Canis lupus) or Turkish name (e.g. Bozayı, Kurt, Akdeniz Foku) of the organism.',
      },
      countryCode: {
        type: Type.STRING,
        description: 'Two-letter ISO country code. Use "TR" for Turkey, or empty string "" for worldwide global data.',
      },
    },
    required: ['scientificOrCommonName'],
  },
};

// Research Agent API Endpoint
app.post('/api/agent/research', async (req: Request, res: Response): Promise<void> => {
  const { query, country = 'TR' } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Lütfen bir araştırma görevi veya soru girin.' });
    return;
  }

  const userQuery = query.trim();
  const steps: AgentExecutionStep[] = [];
  let primaryAnalysis: SpeciesAnalysis | null = null;

  const addStep = (title: string, detail: string, status: AgentExecutionStep['status'] = 'completed') => {
    steps.push({
      id: `step-${steps.length + 1}`,
      title,
      detail,
      status,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  addStep('Görev ve Hedef Canlı Çözümleniyor', `Kullanıcı sorgusu: "${userQuery}" inceleniyor. Taksonomi ve coğrafi parametreler tespit ediliyor.`, 'in_progress');

  // Check if Gemini API Key is available and valid
  const rawApiKey = process.env.GEMINI_API_KEY?.trim();
  const isValidApiKey = Boolean(rawApiKey && rawApiKey.length > 15 && !rawApiKey.includes('MY_GEMINI_API_KEY'));

  if (isValidApiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: rawApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Sen "Canlı Atlası" biyoçeşitlilik platformunun kıdemli Biyoçeşitlilik Araştırma Ajanısın (AI Research Agent).
Görevin: Kullanıcının araştırma talebini analiz edip gerekli olduğunda 'fetchGbifSpeciesData' fonksiyonunu çağırarak GBIF bilimsel veri tabanından gerçek kayıtları çekmek ve kapsamlı bir bilimsel sentez raporu oluşturmaktır.

KURALLAR:
1. Asla veri veya koordinat uydurma. Sadece GBIF fonksiyonundan dönen gerçek gözlem verilerini analiz et.
2. Bilimsel Metodoloji İlkesi: Gözlem kayıtlarının sayısını canlının gerçek popülasyon sayısı olarak yorumlama. Vatandaş bilimi, dijitalleşme ve araştırma seferlerinin sıklığı kayıt sayısını artırır. Bu ayrımı raporda açıkça belirt.
3. Raporu şu başlıklar altında Markdown formatında ve akıcı Türkçe ile sun:
   - **🔬 1. Yönetici Özeti & Tür Kimliği** (Türkçe adı, bilimsel adı, familyası ve IUCN Kırmızı Liste statüsü)
   - **📊 2. GBIF Gözlem Trendleri & Zaman Dağılımı** (Toplam kayıt, GPS koordinatlı oranı, en çok gözlem yapılan zirve yılı ve son durum)
   - **📍 3. Coğrafi Yayılım & Bölgesel Sıcak Noktalar** (En yoğun kayıt bulunan iller/bölgeler ve yaşam alanları)
   - **🛡️ 4. Koruma Statüsü & Tehdit Değerlendirmesi** (IUCN durumu, ekolojik tehditler)
   - **📌 5. Araştırmacı Tavsiyeleri & Bilimsel Metodoloji Notu**
4. Kısa, teknik ve güvenilir ol. Kaynak olarak GBIF ve iNaturalist'e atıfta bulun.`;

      // Helper to execute with timeout
      const withTimeout = <T>(promise: Promise<T>, ms = 12000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI zaman aşımı (Timeout)')), ms)),
        ]);
      };

      // Turn 1: Let Gemini identify the species and call the tool
      const turn1Response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `Araştırma Görevi: ${userQuery}\nVarsayılan Ülke: ${country}` }],
            },
          ],
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: [fetchGbifDataDeclaration] }],
          },
        })
      );

      const functionCalls = turn1Response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const args = (call.args || {}) as { scientificOrCommonName?: string; countryCode?: string };
        const targetSpecies = args.scientificOrCommonName || userQuery;
        const targetCountry = typeof args.countryCode === 'string' ? args.countryCode : country;

        addStep(
          'GBIF Veri Fonksiyonu Çağrıldı',
          `Tespit edilen tür: "${targetSpecies}" (Hedef Coğrafya: ${targetCountry || 'Global'}). GBIF API'sine sorgu gönderiliyor.`
        );

        // Execute tool call server-side
        const analysisData = await fetchSpeciesAnalysis(targetSpecies, targetCountry);
        primaryAnalysis = analysisData;

        addStep(
          'GBIF Açık Bilim Verileri Çözümlendi',
          `Toplam ${analysisData.totalRecords} kayıt, ${analysisData.mappedRecordsCount} GPS koordinatı, ${analysisData.regionalStats.length} il verisi başarıyla alındı.`
        );

        // Turn 2: Feed functionResponse back to Gemini for the scientific synthesis
        const turn2Response = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: `Araştırma Görevi: ${userQuery}\nVarsayılan Ülke: ${country}` }],
              },
              turn1Response.candidates?.[0]?.content as any,
              {
                role: 'user',
                parts: [
                  {
                    functionResponse: {
                      name: 'fetchGbifSpeciesData',
                      id: call.id,
                      response: {
                        species: {
                          scientificName: analysisData.species.scientificName,
                          canonicalName: analysisData.species.canonicalName,
                          turkishName: analysisData.species.turkishName,
                          family: analysisData.species.family,
                          iucnStatus: analysisData.species.iucnStatus,
                          iucnCategoryName: analysisData.species.iucnCategoryName,
                        },
                        countryName: analysisData.countryName,
                        totalRecords: analysisData.totalRecords,
                        mappedRecordsCount: analysisData.mappedRecordsCount,
                        unmappedRecordsCount: analysisData.unmappedRecordsCount,
                        dateRange: analysisData.dateRange,
                        peakYear: analysisData.peakYear,
                        lowestYear: analysisData.lowestYear,
                        topRegions: analysisData.regionalStats.slice(0, 8),
                        recentYearlyStats: analysisData.yearlyStats.slice(-10),
                      },
                    },
                  },
                ],
              },
            ],
            config: {
              systemInstruction,
              tools: [{ functionDeclarations: [fetchGbifDataDeclaration] }],
            },
          })
        );

        const finalReport = turn2Response.text || 'Araştırma sentezi tamamlandı.';
        addStep('Bilimsel Araştırma Raporu Sentezlendi', 'Veriler ve akademik değerlendirme başarıyla derlendi.');

        res.json({
          success: true,
          report: finalReport,
          steps,
          analysis: primaryAnalysis,
          speciesName: primaryAnalysis.species.turkishName || primaryAnalysis.species.canonicalName,
          agentMode: 'gemini_function_calling',
        });
        return;
      } else if (turn1Response.text) {
        // Direct answer without tool call
        addStep('Doğrudan Yanıt Oluşturuldu', 'Sorgu doğrudan çözümlendi.');
        res.json({
          success: true,
          report: turn1Response.text,
          steps,
          analysis: null,
          agentMode: 'gemini_direct',
        });
        return;
      }
    } catch (aiError) {
      console.warn('Gemini function calling fallback triggered:', aiError);
      addStep('AI Modeli Yedek Motoru Devreye Alındı', 'GBIF bilimsel analitik motoru üzerinden doğrudan veri analizi gerçekleştiriliyor.');
    }
  }

  // Fallback Engine (Runs when no API key is present or AI service fails):
  // Deterministic biological extraction + live GBIF query
  try {
    let resolvedQuery = userQuery;
    let targetCountry = country;
    const lower = userQuery.toLowerCase();

    // Check geography intent
    if (/\b(küresel|dünya|global|dünyada|dünya genelinde)\b/i.test(lower)) {
      targetCountry = '';
    } else if (/\b(türkiye|türkiye'de|turkey)\b/i.test(lower)) {
      targetCountry = 'TR';
    }

    // 1. Check predefined Turkish common names first (longest match first with word boundaries)
    const sortedKeys = Object.keys(COMMON_TURKISH_SPECIES).sort((a, b) => b.length - a.length);
    let foundCommon = false;

    for (const key of sortedKeys) {
      const regex = new RegExp(`(?:^|\\s|[.,;!?()""''])${key}(?:$|\\s|[.,;!?()""''])`, 'i');
      if (regex.test(lower)) {
        resolvedQuery = COMMON_TURKISH_SPECIES[key].scientificName;
        foundCommon = true;
        break;
      }
    }

    // 2. Check for Latin binomial names (e.g. "Ursus arctos", "Monachus monachus") if not found in common dictionary
    if (!foundCommon) {
      const latinMatch = userQuery.match(/\b([A-Z][a-z]{2,}\s+[a-z]{3,})\b/);
      if (latinMatch && latinMatch[1] && !/\b(türkiye|türkiyede|kayıt|gözlem)\b/i.test(latinMatch[1])) {
        resolvedQuery = latinMatch[1];
      } else {
        // 3. Clean stopwords to isolate unknown species keyword
        const cleaned = lower
          .replace(/\b(türkiye'de|türkiyede|türkiye|son|yılda|yıllık|gözlem|kayıtlarını|kayıtları|kayıt|sayısı|analiz|et|nedir|hakkında|araştır|nerede|yoğunluğu|dağılımı|durumu|durumunu|popülasyon|bilgi|ver|bana|istiyorum|çıkar|raporu)\b/gi, ' ')
          .replace(/[.,;!?()""'']/g, ' ')
          .trim()
          .replace(/\s+/g, ' ');

        if (cleaned.length > 2) {
          resolvedQuery = cleaned;
        }
      }
    }

    addStep('Tür Belirlendi', `Hedef canlı: "${resolvedQuery}" (Coğrafya: ${targetCountry || 'Global'}). GBIF veri tabanına bağlanılıyor...`);
    const analysis = await fetchSpeciesAnalysis(resolvedQuery, targetCountry);
    primaryAnalysis = analysis;

    addStep(
      'GBIF Gözlem ve Koordinat Kayıtları Alındı',
      `Toplam ${analysis.totalRecords} kayıt ve ${analysis.mappedRecordsCount} GPS koordinatı başarıyla işlendi.`
    );

    // Build academic report
    const s = analysis.species;
    const name = s.turkishName || s.canonicalName;
    const topRegionsText = analysis.regionalStats.slice(0, 5).map((r, i) => `${i + 1}. **${r.region}** (${r.count} kayıt - %${r.percentage.toFixed(1)})`).join('\n');
    const peakText = analysis.peakYear ? `${analysis.peakYear.year} yılı (${analysis.peakYear.count} gözlem)` : 'Veri yetersiz';

    const fallbackReport = `### 🔬 1. Yönetici Özeti & Tür Kimliği
- **Türkçe Adı:** ${name}
- **Bilimsel Adı:** *${s.scientificName}*
- **Sınıflandırma:** ${s.kingdom || 'Animalia'} › ${s.phylum || 'Chordata'} › ${s.family || 'Familya'}
- **IUCN Kırmızı Liste Durumu:** **${s.iucnStatus || 'LC'}** (${s.iucnCategoryName || 'Değerlendirilmiş'})

---

### 📊 2. GBIF Gözlem Trendleri & Zaman Dağılımı (${analysis.countryName})
- **Toplam Arşiv Kaydı:** ${analysis.totalRecords.toLocaleString('tr-TR')} adet
- **Doğrulanmış GPS Koordinatlı:** ${analysis.mappedRecordsCount} kayıt (%${analysis.totalRecords > 0 ? Math.round((analysis.mappedRecordsCount / analysis.totalRecords) * 100) : 0})
- **Tarih Aralığı:** ${analysis.dateRange.minYear || '—'} – ${analysis.dateRange.maxYear || '—'}
- **En Yüksek Gözlem Kaydı (Zirve):** **${peakText}**

---

### 📍 3. Coğrafi Yayılım & Bölgesel Sıcak Noktalar
Türkiye genelinde en fazla gözlem kaydı bulunan ilk 5 il/bölge:
${topRegionsText || 'Bölgesel veri bulunamadı.'}

---

### 🛡️ 4. Koruma Statüsü & Ekolojik Değerlendirme
*${s.scientificName}* türü, habitat parçalanması ve insan baskısı faktörleri açısından yakından izlenmesi gereken biyoçeşitlilik göstergesidir. Doğrulanmış GPS noktaları harita üzerinde işaretlenmiştir.

---

### 📌 5. Bilimsel Metodoloji Notu
GBIF veri tabanındaki yıllık gözlem dalgalanmaları doğrudan popülasyon artışını veya azalışını ifade etmez; araştırma seferlerinin sıklığı ve dijital saha kayıtlarının yaygınlaşması kayıt sayılarını belirgin biçimde etkiler.`;

    addStep('Analitik Sentez Raporu Tamamlandı', 'Tüm parametreler ve bölgesel yoğunluklar hesaplandı.');

    res.json({
      success: true,
      report: fallbackReport,
      steps,
      analysis: primaryAnalysis,
      speciesName: name,
      agentMode: 'deterministic_gbif_engine',
    });
  } catch (err: any) {
    console.error('Agent research error:', err);
    res.status(500).json({
      error: 'Araştırma yürütülürken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'),
    });
  }
});

// Start Full-Stack Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve static build
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Canlı Atlası] Sunucu http://localhost:${PORT} üzerinde çalışıyor.`);
  });
}

startServer().catch((err) => {
  console.error('Server başlatılamadı:', err);
});
