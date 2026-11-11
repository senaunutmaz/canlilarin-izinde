import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { 
  fetchSpeciesAnalysis, 
  matchSpecies, 
  extractSpeciesAndParameters,
  extractComparisonSpecies,
  COMMON_TURKISH_SPECIES 
} from './src/services/gbif.ts';
import { SpeciesAnalysis, ResearchParameters } from './src/types/biodiversity.ts';

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

// 1. Tool Declarations for Gemini Multi-Tool Function Calling
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
      startYear: {
        type: Type.INTEGER,
        description: 'Start year for the occurrence query if specified (e.g. 2016).',
      },
      endYear: {
        type: Type.INTEGER,
        description: 'End year for the occurrence query if specified (e.g. 2026).',
      },
    },
    required: ['scientificOrCommonName'],
  },
};

const searchSpeciesTaxonomyDeclaration: FunctionDeclaration = {
  name: 'searchSpeciesTaxonomy',
  description: 'Matches and validates a common or scientific species name against the GBIF taxonomy and iNaturalist databases, returning official taxonomy, kingdom, family, and IUCN Red List conservation status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      speciesName: {
        type: Type.STRING,
        description: 'Common name (Turkish/English) or scientific binomial name of the species to search.',
      },
    },
    required: ['speciesName'],
  },
};

const compareTwoSpeciesDeclaration: FunctionDeclaration = {
  name: 'compareTwoSpecies',
  description: 'Performs side-by-side comparative analytics of two species (e.g. Bozayı and Bozkurt) comparing total GBIF observations, GPS mapped records, and regional centers.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      speciesA: {
        type: Type.STRING,
        description: 'Scientific or common name of the first species.',
      },
      speciesB: {
        type: Type.STRING,
        description: 'Scientific or common name of the second species.',
      },
      countryCode: {
        type: Type.STRING,
        description: 'Two-letter ISO country code (e.g. "TR").',
      },
    },
    required: ['speciesA', 'speciesB'],
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

  const addStep = (title: string, detail: string, status: AgentExecutionStep['status'] = 'completed') => {
    steps.push({
      id: `step-${steps.length + 1}`,
      title,
      detail,
      status,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  addStep('Görev Analizi Başlatıldı', `Kullanıcı sorgusu: "${userQuery}" inceleniyor.`, 'in_progress');

  // Adım 1: Doğal dil sorgusundan parametreleri ve türü ayıkla
  const paramResult = extractSpeciesAndParameters(userQuery, country);

  // Kural: Tür adı tespit edilemiyorsa ASLA araştırma raporu üretme!
  if (!paramResult.foundSpecies || !paramResult.parameters) {
    addStep('Tür Tespit Edilemedi', paramResult.error || 'Canlı türü saptanamadı.', 'failed');
    res.json({
      success: false,
      requiresClarification: true,
      error: paramResult.error,
      steps,
      analysis: null,
      speciesName: null,
      parameters: null,
      agentMode: 'input_validation',
    });
    return;
  }

  const params: ResearchParameters = paramResult.parameters;
  addStep(
    'Araştırma Parametreleri Ayrıştırıldı',
    `Tür: ${params.speciesName} (${params.scientificName}) | Coğrafya: ${params.country} (${params.countryCode || 'Global'}) | Tarih: ${params.dateRangeText} | Analiz: ${params.analysisType}`
  );

  // Adım 2: GBIF'ten gerçek verileri çek
  // Adım 2: GBIF'ten gerçek verileri çek
  let primaryAnalysis: SpeciesAnalysis | null = null;
  let secondaryAnalysis: SpeciesAnalysis | null = null;

  try {
    addStep(
      'GBIF Açık Bilim Sorgusu Yapılıyor',
      `GBIF API üzerinden ${params.scientificName} için veriler getiriliyor (Filtre: ${params.dateRangeText}, Coğrafya: ${params.countryCode || 'Global'})...`,
      'in_progress'
    );

    primaryAnalysis = await fetchSpeciesAnalysis(params.scientificName, {
      countryCode: params.countryCode,
      startYear: params.startYear,
      endYear: params.endYear,
      fetchExtraPages: true,
    });

    addStep(
      'GBIF Açık Bilim Verileri Alındı',
      `Toplam ${primaryAnalysis.totalRecords} kayıt, ${primaryAnalysis.mappedRecordsCount} doğrulanmış GPS koordinatı, ${primaryAnalysis.regionalStats.length} il verisi arşivlendi.`
    );

    // İki tür karşılaştırma isteği kontrolü
    const compCheck = extractComparisonSpecies(userQuery);
    if (compCheck.isComparison && (compCheck.speciesA || compCheck.speciesB)) {
      const otherSpecies = compCheck.speciesA === params.scientificName ? compCheck.speciesB : compCheck.speciesA;
      if (otherSpecies && otherSpecies !== params.scientificName) {
        try {
          addStep(
            'Karşılaştırmalı Tür Analizi Başlatıldı',
            `2. Tür: ${otherSpecies} için GBIF kayıtları getiriliyor...`,
            'in_progress'
          );
          secondaryAnalysis = await fetchSpeciesAnalysis(otherSpecies, {
            countryCode: params.countryCode,
            startYear: params.startYear,
            endYear: params.endYear,
            fetchExtraPages: true,
          });
          addStep(
            '2. Tür Verileri Hazırlandı',
            `${secondaryAnalysis.species.turkishName || otherSpecies}: ${secondaryAnalysis.totalRecords} kayıt, ${secondaryAnalysis.mappedRecordsCount} GPS koordinatı.`
          );
        } catch (secErr) {
          console.warn('İkinci tür çekilemedi:', secErr);
        }
      }
    }
  } catch (gbifErr: any) {
    console.error('GBIF fetch error:', gbifErr);
    addStep('GBIF Bağlantı Hatası', 'GBIF API sunucularına bağlanırken bir sorun oluştu.', 'failed');
    res.status(500).json({
      success: false,
      error: 'GBIF açık bilim verilerine erişilirken bir hata oluştu: ' + (gbifErr.message || 'Bilinmeyen hata'),
      steps,
    });
    return;
  }

  // Kural: Sıfır (0) kayıt bulunursa sahte rapor üretme!
  if (primaryAnalysis.totalRecords === 0) {
    addStep('Sıfır Kayıt Bildirimi', 'GBIF arşivinde belirtilen kriterlere uygun gözlem kaydı bulunamadı.');

    const zeroRecordReport = `### ⚠️ GBIF Açık Bilim Arşivinde Kayıt Bulunamadı

- **İncelenen Tür:** ${primaryAnalysis.species.turkishName || primaryAnalysis.species.canonicalName} (*${primaryAnalysis.species.scientificName}*)
- **Hedef Coğrafya:** ${primaryAnalysis.countryName} (${params.countryCode || 'Tüm Dünya'})
- **Sorgulanan Tarih Aralığı:** ${params.dateRangeText}
- **Bulunan Toplam Kayıt:** **0 adet**

---

### 🔍 Bilimsel Durum Değerlendirmesi
GBIF (Global Biodiversity Information Facility) açık arşivinde belirtilen filtre kriterlerinde doğrulanmış dijital gözlem kaydı bulunmamaktadır.

**Olası Nedenler:**
1. **Coğrafi Kapsam:** Canlı türü seçilen coğrafyada doğal olarak yayılış göstermiyor olabilir.
2. **Dijital Veri Eksikliği:** Bölgedeki saha araştırmaları henüz GBIF veritabanına aktarılmamış veya vatandaş bilimi gözlemleri doğrulanmamış olabilir.
3. **Tarih Aralığı Kısıtı:** Belirtilen yıllar arasında bu canlıya ait gözlem seferi kaydedilmemiş olabilir.

---

### 💡 Çözüm ve Tavsiyeler
- Arama kapsamını sağ üstteki filtreden **"Tüm Dünya (Global)"** olarak genişleterek küresel yayılımı inceleyebilirsiniz.
- Tarih filtresini kaldırarak tüm arşiv geçmişine bakabilirsiniz.
- Farklı bir canlı türü seçerek araştırmanızı sürdürebilirsiniz.`;

    res.json({
      success: true,
      isZeroRecords: true,
      report: zeroRecordReport,
      steps,
      analysis: primaryAnalysis,
      secondaryAnalysis: null,
      speciesName: params.speciesName,
      parameters: params,
      agentMode: 'gbif_verified',
    });
    return;
  }

  // Adım 3: Gerçek verileri sentezle (Gemini 2.5 Flash veya GBIF Analitik Motoru)
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
Görevin: GBIF açık bilim veritabanından çekilmiş gerçek verileri analiz edip kullanıcıya anlaşılır, Türkçe ve akademik bir araştırma raporu sunmaktır.

KURALLAR:
1. Asla veri, il veya koordinat uydurma. Yalnızca sana sağlanan gerçek GBIF analiz verilerini kullan.
2. Bilimsel Metodoloji İlkesi: Gözlem kayıtlarının sayısını canlının gerçek popülasyon sayısı olarak yorumlama. Vatandaş bilimi, dijitalleşme ve araştırma seferlerinin sıklığı kayıt sayısını artırır. Bu ayrımı raporda açıkça belirt.
3. Raporu şu başlıklar altında Markdown formatında ve akıcı Türkçe ile sun:
   - **🔬 1. Yönetici Özeti & Tür Kimliği** (Türkçe adı, bilimsel adı, familyası ve IUCN Kırmızı Liste statüsü)
   - **📊 2. GBIF Gözlem Trendleri & Zaman Dağılımı** (Toplam kayıt, GPS koordinatlı oranı, en çok gözlem yapılan zirve yılı ve son durum)
   - **📍 3. Coğrafi Yayılım & Bölgesel Sıcak Noktalar** (En yoğun kayıt bulunan iller/bölgeler ve yaşam alanları)
   - **🛡️ 4. Koruma Statüsü & Tehdit Değerlendirmesi** (IUCN durumu, ekolojik tehditler)
   - **📌 5. Bilimsel Metodoloji Notu & Araştırmacı Tavsiyeleri**
4. Eğer kullanıcı iki türü kıyaslamışsa raporuna karşılaştırma tablosu ekle.
5. Kısa, teknik ve güvenilir ol. Kaynak olarak GBIF ve iNaturalist'e atıfta bulun.`;

      // Helper to execute with timeout
      const withTimeout = <T>(promise: Promise<T>, ms = 12000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI zaman aşımı (Timeout)')), ms)),
        ]);
      };

      const topProvinces = primaryAnalysis.regionalStats.slice(0, 5).map(r => `${r.region} (%${r.percentage.toFixed(1)})`).join(', ');

      let promptForGemini = `Araştırma Görevi: ${userQuery}
Parametreler:
- Canlı Türü: ${params.speciesName} (${params.scientificName})
- Coğrafya: ${primaryAnalysis.countryName}
- Tarih Aralığı: ${params.dateRangeText}

GBIF Gerçek Verileri (1. Tür):
- Toplam Doğrulanmış Kayıt: ${primaryAnalysis.totalRecords}
- GPS Koordinatlı Kayıt Sayısı: ${primaryAnalysis.mappedRecordsCount}
- Konum Belirtilmemiş Kayıt Sayısı: ${primaryAnalysis.unlocatedCount}
- En Çok Gözlem Yapılan Zirve Yılı: ${primaryAnalysis.peakYear ? `${primaryAnalysis.peakYear.year} (${primaryAnalysis.peakYear.count} kayıt)` : 'Belirtilmemiş'}
- En Düşük Gözlem Yılı: ${primaryAnalysis.lowestYear ? `${primaryAnalysis.lowestYear.year} (${primaryAnalysis.lowestYear.count} kayıt)` : 'Belirtilmemiş'}
- En Çok Kayıt Bulunan İller: ${topProvinces || 'Bölgesel veri kısıtlı'}
- IUCN Koruma Durumu: ${primaryAnalysis.species.iucnStatus || 'NE'} (${primaryAnalysis.species.iucnCategoryName || 'Değerlendirilmemiş'})`;

      if (secondaryAnalysis) {
        const secProvinces = secondaryAnalysis.regionalStats.slice(0, 5).map(r => `${r.region} (%${r.percentage.toFixed(1)})`).join(', ');
        promptForGemini += `\n\nGBIF Gerçek Verileri (2. Tür Karşılaştırma):
- Tür: ${secondaryAnalysis.species.turkishName || secondaryAnalysis.species.canonicalName} (${secondaryAnalysis.species.scientificName})
- Toplam Doğrulanmış Kayıt: ${secondaryAnalysis.totalRecords}
- GPS Koordinatlı Kayıt Sayısı: ${secondaryAnalysis.mappedRecordsCount}
- En Çok Gözlem Yapılan Zirve Yılı: ${secondaryAnalysis.peakYear ? `${secondaryAnalysis.peakYear.year} (${secondaryAnalysis.peakYear.count} kayıt)` : 'Belirtilmemiş'}
- En Çok Kayıt Bulunan İller: ${secProvinces || 'Bölgesel veri kısıtlı'}
- IUCN Durumu: ${secondaryAnalysis.species.iucnStatus || 'NE'} (${secondaryAnalysis.species.iucnCategoryName || 'Değerlendirilmemiş'})`;
      }

      promptForGemini += `\n\nLütfen bu gerçek veriler ışığında bilimsel araştırma raporunu oluştur.`;

      const aiResponse = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: promptForGemini }] }],
          config: { 
            systemInstruction,
            tools: [{ 
              functionDeclarations: [
                fetchGbifDataDeclaration, 
                searchSpeciesTaxonomyDeclaration, 
                compareTwoSpeciesDeclaration
              ] 
            }],
          },
        })
      );

      // Check if function calls were triggered
      if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
        addStep('Yapay Zekâ Araç Çağrısı Gerçekleştirildi', `${aiResponse.functionCalls.map(f => f.name).join(', ')} araçları çalıştırıldı.`);
        
        const functionResponses = await Promise.all(
          aiResponse.functionCalls.map(async (call) => {
            let resData: any = {};
            if (call.name === 'searchSpeciesTaxonomy') {
              const spName = (call.args as any)?.speciesName || params.scientificName;
              resData = await matchSpecies(spName);
            } else if (call.name === 'fetchGbifSpeciesData') {
              const spName = (call.args as any)?.scientificOrCommonName || params.scientificName;
              resData = await fetchSpeciesAnalysis(spName, {
                countryCode: (call.args as any)?.countryCode || params.countryCode,
                startYear: (call.args as any)?.startYear,
                endYear: (call.args as any)?.endYear,
              });
            } else if (call.name === 'compareTwoSpecies') {
              const spA = (call.args as any)?.speciesA || params.scientificName;
              const spB = (call.args as any)?.speciesB || 'Canis lupus';
              const [dA, dB] = await Promise.all([
                fetchSpeciesAnalysis(spA, { countryCode: params.countryCode }),
                fetchSpeciesAnalysis(spB, { countryCode: params.countryCode }),
              ]);
              resData = {
                speciesA: { name: spA, records: dA.totalRecords, mapped: dA.mappedRecordsCount },
                speciesB: { name: spB, records: dB.totalRecords, mapped: dB.mappedRecordsCount },
              };
            }
            return {
              name: call.name,
              response: { result: resData },
            };
          })
        );

        const candidateContent = aiResponse.candidates?.[0]?.content || {
          role: 'model',
          parts: [{ text: '' }],
        };

        // Turn 2
        const secondTurn = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              { role: 'user', parts: [{ text: promptForGemini }] },
              candidateContent,
              {
                role: 'user',
                parts: functionResponses.map(fr => ({
                  functionResponse: {
                    name: fr.name,
                    response: fr.response,
                  },
                })),
              },
            ],
            config: { systemInstruction },
          })
        );

        if (secondTurn.text && secondTurn.text.trim().length > 100) {
          addStep('Akademik Sentez Tamamlandı', 'Gemini 2.5 Flash çok adımlı fonksiyon çağırma (Function Calling) ile raporu derledi.');
          res.json({
            success: true,
            report: secondTurn.text,
            steps,
            analysis: primaryAnalysis,
            secondaryAnalysis,
            speciesName: params.speciesName,
            parameters: params,
            agentMode: 'gemini_function_calling',
          });
          return;
        }
      }

      const aiText = aiResponse.text;
      if (aiText && aiText.trim().length > 100) {
        addStep('Bilimsel Araştırma Raporu Sentezlendi', 'Gemini 2.5 Flash yapay zekâ modeli ile akademik sentez tamamlandı.');
        res.json({
          success: true,
          report: aiText,
          steps,
          analysis: primaryAnalysis,
          secondaryAnalysis,
          speciesName: params.speciesName,
          parameters: params,
          agentMode: 'gemini_function_calling',
        });
        return;
      }
    } catch (aiError) {
      console.warn('Gemini generation fallback triggered:', aiError);
      addStep('GBIF Analitik Motoru Devreye Alındı', 'Doğrudan GBIF bilimsel veri analiz motoru ile rapor derleniyor.');
    }
  }

  // Fallback Engine: Deterministic scientific report directly from live GBIF verified data
  const s = primaryAnalysis.species;
  const name = params.speciesName;
  const topRegionsText = primaryAnalysis.regionalStats.slice(0, 5)
    .map((r, i) => `${i + 1}. **${r.region}** (${r.count} kayıt - %${r.percentage.toFixed(1)})`)
    .join('\n');
  const peakText = primaryAnalysis.peakYear 
    ? `${primaryAnalysis.peakYear.year} yılı (${primaryAnalysis.peakYear.count} gözlem)` 
    : 'Veri yetersiz';

  let deterministicReport = `### 🔬 1. Yönetici Özeti & Tür Kimliği
- **Türkçe Adı:** ${name}
- **Bilimsel Adı:** *${s.scientificName}*
- **Sınıflandırma:** ${s.kingdom || 'Animalia'} › ${s.phylum || 'Chordata'} › ${s.family || 'Familya'}
- **IUCN Kırmızı Liste Durumu:** **${s.iucnStatus || 'NE'}** (${s.iucnCategoryName || 'Değerlendirilmemiş'})
- **Veri Kaynağı:** GBIF Açık Bilim Ağı & iNaturalist Taksonomi Arşivi

---

### 📊 2. GBIF Gözlem Trendleri & Zaman Dağılımı (${primaryAnalysis.countryName})
- **Sorgulanan Tarih Aralığı:** ${params.dateRangeText}
- **Toplam Arşiv Kaydı:** ${primaryAnalysis.totalRecords.toLocaleString('tr-TR')} adet
- **Doğrulanmış GPS Koordinatlı:** ${primaryAnalysis.mappedRecordsCount} kayıt (%${primaryAnalysis.totalRecords > 0 ? Math.round((primaryAnalysis.mappedRecordsCount / primaryAnalysis.totalRecords) * 100) : 0})
- **Konum/İl Bilgisi Eksik Kayıt:** ${primaryAnalysis.unlocatedCount} adet
- **En Yüksek Gözlem Kaydı (Zirve):** **${peakText}**

---

### 📍 3. Coğrafi Yayılım & Bölgesel Sıcak Noktalar
${primaryAnalysis.countryName} genelinde en fazla gözlem kaydı bulunan ilk 5 il/bölge:
${topRegionsText || 'Bölgesel veri bulunamadı.'}`;

  if (secondaryAnalysis) {
    const s2 = secondaryAnalysis.species;
    const name2 = s2.turkishName || s2.canonicalName;
    const topRegions2 = secondaryAnalysis.regionalStats.slice(0, 3)
      .map((r, i) => `${i + 1}. ${r.region} (${r.count} kayıt)`)
      .join(', ');

    deterministicReport += `\n\n---

### ⚖️ 4. Karşılaştırmalı Biyoçeşitlilik Özeti (${name} vs ${name2})
- **Toplam Kayıt Karşılaştırması:** ${name}: **${primaryAnalysis.totalRecords} adet** | ${name2}: **${secondaryAnalysis.totalRecords} adet**
- **GPS Koordinatlı Kayıt:** ${name}: ${primaryAnalysis.mappedRecordsCount} nokta | ${name2}: ${secondaryAnalysis.mappedRecordsCount} nokta
- **IUCN Durumu:** ${name}: ${s.iucnStatus || 'NE'} | ${name2}: ${s2.iucnStatus || 'NE'}
- **Öne Çıkan İller (${name2}):** ${topRegions2 || 'Veri kısıtlı'}`;
  }

  deterministicReport += `\n\n---

### 🛡️ ${secondaryAnalysis ? '5' : '4'}. Koruma Statüsü & Ekolojik Değerlendirme
*${s.scientificName}* türü, habitat bütünlüğü ve ekolojik koruma koridorları açısından izlenmesi gereken kilit bir taksondur. Doğrulanmış GPS noktaları etkileşimli harita üzerinde incelenebilir.

---

### 📌 ${secondaryAnalysis ? '6' : '5'}. Bilimsel Metodoloji Notu
GBIF veri tabanındaki yıllık gözlem dalgalanmaları doğrudan canlı popülasyonunu ifade etmez; araştırma seferlerinin yoğunluğu, saha metodolojisi ve vatandaş bilimi dijitalleşmesi kayıt sayılarını doğrudan etkiler.`;

  addStep('Analitik Sentez Raporu Tamamlandı', 'Tüm parametreler ve bölgesel yoğunluklar GBIF motoruyla hesaplandı.');

  res.json({
    success: true,
    report: deterministicReport,
    steps,
    analysis: primaryAnalysis,
    secondaryAnalysis,
    speciesName: name,
    parameters: params,
    agentMode: 'deterministic_gbif',
  });
});

// Direct Species Query Endpoint
app.get('/api/species/:name', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;
  const country = (req.query.country as string) || 'TR';
  const startYear = req.query.startYear ? parseInt(req.query.startYear as string, 10) : undefined;
  const endYear = req.query.endYear ? parseInt(req.query.endYear as string, 10) : undefined;

  try {
    const analysis = await fetchSpeciesAnalysis(name, {
      countryCode: country === 'GLOBAL' ? '' : country,
      startYear,
      endYear,
      fetchExtraPages: true,
    });
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Tür verileri alınamadı.' });
  }
});

// Direct Species Taxonomy Match Endpoint
app.get('/api/species/match/:name', async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;
  try {
    const matched = await matchSpecies(name);
    res.json(matched);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Tür eşleştirilemedi.' });
  }
});

// Direct Side-by-Side Species Comparison Endpoint
app.post('/api/species/compare', async (req: Request, res: Response): Promise<void> => {
  const { speciesA, speciesB, country = 'TR' } = req.body;
  if (!speciesA || !speciesB) {
    res.status(400).json({ error: 'Lütfen karşılaştırılacak iki canlı türünü belirtin.' });
    return;
  }
  try {
    const [analysisA, analysisB] = await Promise.all([
      fetchSpeciesAnalysis(speciesA, { countryCode: country === 'GLOBAL' ? '' : country }),
      fetchSpeciesAnalysis(speciesB, { countryCode: country === 'GLOBAL' ? '' : country }),
    ]);
    res.json({
      success: true,
      speciesA: analysisA,
      speciesB: analysisB,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Karşılaştırma verisi alınamadı.' });
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

// Export Express app for Vercel serverless runtime
export default app;

// Only start standalone HTTP server when not in serverless Vercel environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Server başlatılamadı:', err);
  });
}

