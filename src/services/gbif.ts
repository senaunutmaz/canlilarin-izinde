/**
 * Canlı Atlası - GBIF ve iNaturalist Veri Servisi
 * Gerçek açık veri kaynakları üzerinden biyoçeşitlilik gözlem ve tür bilgisi çekme modülü.
 */

import { 
  DiscoverySpecimen, 
  GBIFOccurrence, 
  RegionStat, 
  SpeciesAnalysis, 
  SpeciesInfo, 
  YearlyStat,
  ResearchParameters,
  FetchSpeciesOptions 
} from '../types/biodiversity';

// In-Memory TTL Önbellek Sistemi (GBIF ve iNaturalist verilerini 15 dakika boyunca saklar)
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const GBIF_CACHE = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 dakika

export function getCached<T>(key: string): T | null {
  const entry = GBIF_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    GBIF_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): void {
  // Bellek şişmesini önlemek için en fazla 200 kayıt tut
  if (GBIF_CACHE.size > 200) {
    const oldestKey = GBIF_CACHE.keys().next().value;
    if (oldestKey) GBIF_CACHE.delete(oldestKey);
  }
  GBIF_CACHE.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Zaman aşımı (Timeout) ve otomatik yeniden deneme (Retry) mekanizmalı fetch sarmalayıcısı
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  maxRetries = 2,
  timeoutMs = 8000
): Promise<Response> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 350 * attempt));
        continue;
      }
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < maxRetries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 350 * attempt));
      } else {
        break;
      }
    }
  }

  throw lastError || new Error(`Ağ isteği başarısız: ${url}`);
}

// Yaygın Türkçe canlı isimleri ve bilimsel ad eşleşmeleri
export const COMMON_TURKISH_SPECIES: Record<string, { scientificName: string; turkishName: string; iucn: string; category: string }> = {
  'bozayı': { scientificName: 'Ursus arctos', turkishName: 'Bozayı', iucn: 'LC', category: 'Memeliler' },
  'boz ayı': { scientificName: 'Ursus arctos', turkishName: 'Bozayı', iucn: 'LC', category: 'Memeliler' },
  'ayı': { scientificName: 'Ursus arctos', turkishName: 'Bozayı', iucn: 'LC', category: 'Memeliler' },
  'vaşak': { scientificName: 'Lynx lynx', turkishName: 'Bayağı Vaşak', iucn: 'LC', category: 'Memeliler' },
  'bayağı vaşak': { scientificName: 'Lynx lynx', turkishName: 'Bayağı Vaşak', iucn: 'LC', category: 'Memeliler' },
  'kurt': { scientificName: 'Canis lupus', turkishName: 'Bozkurt', iucn: 'LC', category: 'Memeliler' },
  'bozkurt': { scientificName: 'Canis lupus', turkishName: 'Bozkurt', iucn: 'LC', category: 'Memeliler' },
  'yaban kedisi': { scientificName: 'Felis silvestris', turkishName: 'Yaban Kedisi', iucn: 'LC', category: 'Memeliler' },
  'akdeniz foku': { scientificName: 'Monachus monachus', turkishName: 'Akdeniz Foku', iucn: 'EN', category: 'Deniz Canlıları' },
  'deniz foku': { scientificName: 'Monachus monachus', turkishName: 'Akdeniz Foku', iucn: 'EN', category: 'Deniz Canlıları' },
  'çizgili sırtlan': { scientificName: 'Hyaena hyaena', turkishName: 'Çizgili Sırtlan', iucn: 'NT', category: 'Memeliler' },
  'sırtlan': { scientificName: 'Hyaena hyaena', turkishName: 'Çizgili Sırtlan', iucn: 'NT', category: 'Memeliler' },
  'caretta caretta': { scientificName: 'Caretta caretta', turkishName: 'İribaş Deniz Kaplumbağası', iucn: 'VU', category: 'Sürüngenler' },
  'caretta': { scientificName: 'Caretta caretta', turkishName: 'İribaş Deniz Kaplumbağası', iucn: 'VU', category: 'Sürüngenler' },
  'deniz kaplumbağası': { scientificName: 'Caretta caretta', turkishName: 'İribaş Deniz Kaplumbağası', iucn: 'VU', category: 'Sürüngenler' },
  'yeşil deniz kaplumbağası': { scientificName: 'Chelonia mydas', turkishName: 'Yeşil Deniz Kaplumbağası', iucn: 'EN', category: 'Sürüngenler' },
  'kelaynak': { scientificName: 'Geronticus eremita', turkishName: 'Kelaynak', iucn: 'EN', category: 'Kuşlar' },
  'kaya kartalı': { scientificName: 'Aquila chrysaetos', turkishName: 'Kaya Kartalı', iucn: 'LC', category: 'Kuşlar' },
  'şah kartal': { scientificName: 'Aquila heliaca', turkishName: 'Şah Kartal', iucn: 'VU', category: 'Kuşlar' },
  'toy': { scientificName: 'Otis tarda', turkishName: 'Toy Kuşu', iucn: 'VU', category: 'Kuşlar' },
  'toy kuşu': { scientificName: 'Otis tarda', turkishName: 'Toy Kuşu', iucn: 'VU', category: 'Kuşlar' },
  'kafkas engereği': { scientificName: 'Vipera kaznakovi', turkishName: 'Kafkas Burunlu Engereği', iucn: 'EN', category: 'Sürüngenler' },
  'toros kurbağası': { scientificName: 'Rana holtzi', turkishName: 'Toros Kurbağası', iucn: 'CR', category: 'Amfibiler' },
  'kafkas semenderi': { scientificName: 'Mertensiella caucasica', turkishName: 'Kafkas Semenderi', iucn: 'VU', category: 'Amfibiler' },
  'şişeburunlu yunus': { scientificName: 'Tursiops truncatus', turkishName: 'Afalina (Şişeburunlu Yunus)', iucn: 'LC', category: 'Deniz Canlıları' },
  'afalina': { scientificName: 'Tursiops truncatus', turkishName: 'Afalina (Şişeburunlu Yunus)', iucn: 'LC', category: 'Deniz Canlıları' },
  'aslan': { scientificName: 'Panthera leo', turkishName: 'Aslan', iucn: 'VU', category: 'Memeliler' },
  'leopar': { scientificName: 'Panthera pardus', turkishName: 'Anadolu Leoparı', iucn: 'VU', category: 'Memeliler' },
  'anadolu leoparı': { scientificName: 'Panthera pardus', turkishName: 'Anadolu Leoparı', iucn: 'VU', category: 'Memeliler' },
  'anadolu parsı': { scientificName: 'Panthera pardus', turkishName: 'Anadolu Leoparı', iucn: 'VU', category: 'Memeliler' },
  'kaplan': { scientificName: 'Panthera tigris', turkishName: 'Kaplan', iucn: 'EN', category: 'Memeliler' }
};

export interface SpeciesRule {
  scientificName: string;
  turkishName: string;
  family: string;
  patterns: RegExp[];
}

export const SPECIES_RECOGNITION_RULES: SpeciesRule[] = [
  // 1. Bozayı (Ursus arctos) - "boz ayıların", "bozayılar", "ursus arctos"
  {
    scientificName: 'Ursus arctos',
    turkishName: 'Bozayı',
    family: 'Ursidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(boz\s*ay[ıi]|ursus\s+arctos)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 2. Vaşak (Lynx lynx) - "vaşak", "vaşaklar", "vaşakların", "vaşağın"
  {
    scientificName: 'Lynx lynx',
    turkishName: 'Bayağı Vaşak',
    family: 'Felidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(baya[gğ]ı\s+va[sş]ak|lynx\s+lynx)(?=[^\p{L}\p{N}]|$)/iu,
      /(?:^|[^\p{L}\p{N}])va[sş]a[kğ](?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 3. Bozkurt / Kurt (Canis lupus) - "bozkurt", "kurt", "kurtların", "kurdun"
  {
    scientificName: 'Canis lupus',
    turkishName: 'Bozkurt',
    family: 'Canidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(bozkurt|canis\s+lupus)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
      /(?:^|[^\p{L}\p{N}])(kurt|kurd)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 4. Caretta caretta - "caretta caretta", "carettaların", "deniz kaplumbağası"
  {
    scientificName: 'Caretta caretta',
    turkishName: 'İribaş Deniz Kaplumbağası',
    family: 'Cheloniidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(caretta(?:\s+caretta)?)(?=[^\p{L}\p{N}]|$)/iu,
      /(?:^|[^\p{L}\p{N}])deniz\s+kaplumba[gğ]as[ıi](?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 5. Akdeniz Foku (Monachus monachus) - "akdeniz foku", "akdeniz foklarının"
  {
    scientificName: 'Monachus monachus',
    turkishName: 'Akdeniz Foku',
    family: 'Phocidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(akdeniz\s+foku|monachus\s+monachus|deniz\s+foku)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
      /(?:^|[^\p{L}\p{N}])fok(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 6. Toros Kurbağası (Rana holtzi)
  {
    scientificName: 'Rana holtzi',
    turkishName: 'Toros Kurbağası',
    family: 'Ranidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(toros\s+kurba[gğ]as[ıi]|rana\s+holtzi)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 7. Kelaynak (Geronticus eremita)
  {
    scientificName: 'Geronticus eremita',
    turkishName: 'Kelaynak',
    family: 'Threskiornithidae',
    patterns: [
      /(?:^|[^\p{L}\p{N}])(kelayna[kğ]|geronticus\s+eremita)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}\p{N}]|$)/iu,
    ],
  },
  // 8. Çizgili Sırtlan (Hyaena hyaena)
  {
    scientificName: 'Hyaena hyaena',
    turkishName: 'Çizgili Sırtlan',
    family: 'Hyaenidae',
    patterns: [
      /\b([cç]izgili\s+s[ıi]rtlan|hyaena\s+hyaena)\b/iu,
      /\bs[ıi]rtlan(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 9. Yaban Kedisi (Felis silvestris)
  {
    scientificName: 'Felis silvestris',
    turkishName: 'Yaban Kedisi',
    family: 'Felidae',
    patterns: [
      /\b(yaban\s+kedisi|felis\s+silvestris)(?:ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 10. Anadolu Leoparı / Pars (Panthera pardus)
  {
    scientificName: 'Panthera pardus',
    turkishName: 'Anadolu Leoparı',
    family: 'Felidae',
    patterns: [
      /\b(anadolu\s+leopar[ıi]|anadolu\s+pars[ıi]|panthera\s+pardus)\b/iu,
      /\b(leopar|pars)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 11. Kafkas Semenderi (Mertensiella caucasica)
  {
    scientificName: 'Mertensiella caucasica',
    turkishName: 'Kafkas Semenderi',
    family: 'Salamandridae',
    patterns: [
      /\b(kafkas\s+semenderi|mertensiella\s+caucasica)(?:ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 12. Kaya Kartalı (Aquila chrysaetos)
  {
    scientificName: 'Aquila chrysaetos',
    turkishName: 'Kaya Kartalı',
    family: 'Accipitridae',
    patterns: [
      /\b(kaya\s+kartal[ıi]|aquila\s+chrysaetos)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 13. Şah Kartal (Aquila heliaca)
  {
    scientificName: 'Aquila heliaca',
    turkishName: 'Şah Kartal',
    family: 'Accipitridae',
    patterns: [
      /\b([sş]ah\s+kartal[ıi]?|aquila\s+heliaca)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 14. Toy Kuşu (Otis tarda)
  {
    scientificName: 'Otis tarda',
    turkishName: 'Toy Kuşu',
    family: 'Otididae',
    patterns: [
      /\b(toy(\s+ku[sş]u)?|otis\s+tarda)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 15. Yeşil Deniz Kaplumbağası (Chelonia mydas)
  {
    scientificName: 'Chelonia mydas',
    turkishName: 'Yeşil Deniz Kaplumbağası',
    family: 'Cheloniidae',
    patterns: [
      /\b(ye[sş]il\s+deniz\s+kaplumba[gğ]as[ıi]|chelonia\s+mydas)\b/iu,
    ],
  },
  // 16. Kafkas Engereği (Vipera kaznakovi)
  {
    scientificName: 'Vipera kaznakovi',
    turkishName: 'Kafkas Burunlu Engereği',
    family: 'Viperidae',
    patterns: [
      /\b(kafkas\s+engere[gğ]i|vipera\s+kaznakovi)(?:ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 17. Afalina / Yunus (Tursiops truncatus)
  {
    scientificName: 'Tursiops truncatus',
    turkishName: 'Afalina (Şişeburunlu Yunus)',
    family: 'Delphinidae',
    patterns: [
      /\b([sş]i[sş]eburunlu\s+yunus|tursiops\s+truncatus|afalina)\b/iu,
      /\byunus(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 18. Aslan (Panthera leo)
  {
    scientificName: 'Panthera leo',
    turkishName: 'Aslan',
    family: 'Felidae',
    patterns: [
      /\b(aslan|panthera\s+leo)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 19. Kaplan (Panthera tigris)
  {
    scientificName: 'Panthera tigris',
    turkishName: 'Kaplan',
    family: 'Felidae',
    patterns: [
      /\b(kaplan|panthera\s+tigris)(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?\b/iu,
    ],
  },
  // 20. Genel Ayı (Ursus arctos) - checked last if not matched as boz ayı
  {
    scientificName: 'Ursus arctos',
    turkishName: 'Bozayı',
    family: 'Ursidae',
    patterns: [
      /(?:^|[^\p{L}])(ay[ıi])(?:lar|ler)?(?:[ıiuü]|n[ıiuü]|[ıiuü]n|n[ıiuü]n|[ae]|y[ae]|[dt][ae]|[dt][ae]n)?(?=[^\p{L}]|$)/iu,
    ],
  },
];

/**
 * Doğal dildeki kullanıcı araştırma talebini parametrelere ayırma fonksiyonu
 */
export function extractSpeciesAndParameters(
  rawQuery: string,
  defaultCountry: string = 'TR'
): {
  foundSpecies: boolean;
  parameters?: ResearchParameters;
  resolvedScientificName?: string;
  error?: string;
} {
  const text = (rawQuery || '').trim();
  if (!text) {
    return {
      foundSpecies: false,
      error: 'Lütfen bir araştırma görevi veya soru girin.',
    };
  }

  // Normalize Turkish characters and punctuation
  const normalized = text
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, '"');

  // 1. Match against biological rules
  let matchedRule: SpeciesRule | null = null;
  for (const rule of SPECIES_RECOGNITION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        matchedRule = rule;
        break;
      }
    }
    if (matchedRule) break;
  }

  let scientificName = matchedRule?.scientificName;
  let turkishName = matchedRule?.turkishName;

  // 2. Check for Latin binomial names (e.g. "Ursus arctos", "Lutra lutra")
  if (!matchedRule) {
    const binomialMatch = normalized.match(/\b([A-Z][a-z]{2,}\s+[a-z]{3,})\b/);
    if (binomialMatch && binomialMatch[1]) {
      const candidate = binomialMatch[1];
      const isTurkishStopPhrase = /\b(türkiye|türkiyede|kayıt|kayıtları|kayıtlarını|gözlem|gözlemleri|yıllık|verileri|raporu|bana|lütfen|hakkında|nedir|hangi|nerede|arşiv|analiz|harita|atlas|tüm|bölge|bölgeler|iller|yıllara|en|fazla|bulunan|bilgi|ver)\b/i.test(candidate);
      if (!isTurkishStopPhrase) {
        scientificName = candidate;
        turkishName = candidate;
      }
    }
  }

  // 3. Fallback to dictionary direct lookups
  if (!scientificName) {
    const lowerClean = normalized.toLowerCase();
    for (const [key, val] of Object.entries(COMMON_TURKISH_SPECIES)) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^\\p{L}])${escaped}(?:lar|ler)?(?:[^\\p{L}]|$)`, 'iu');
      if (regex.test(lowerClean)) {
        scientificName = val.scientificName;
        turkishName = val.turkishName;
        break;
      }
    }
  }

  if (!scientificName) {
    return {
      foundSpecies: false,
      error: 'Araştırılacak canlı türü tespit edilemedi. Lütfen araştırmak istediğiniz canlı türünün adını (Türkçe veya bilimsel adıyla) belirtin (Örn: Bozayı, Vaşak, Bozkurt, Caretta caretta, Akdeniz Foku veya Ursus arctos).',
    };
  }

  // 4. Extract Year Range
  const currentYear = new Date().getFullYear();
  let startYear: number | undefined;
  let endYear: number | undefined;
  let dateRangeText = 'Tüm Tarihsel Kayıtlar (GBIF Arşivi)';

  // "son X yıl" / "son X yıllık" / "son X yılda" / "son X yıldaki" / "son X yılın"
  const lastNYearsMatch = normalized.match(/\bson\s+(\d+|on|beş|yirmi|üç|iki)\s+yıl(?:lık|da|daki|dan|den|ın|in|ı|i)?\b/iu);
  if (lastNYearsMatch) {
    let numYears = 10;
    const word = lastNYearsMatch[1].toLowerCase();
    if (word === 'on') numYears = 10;
    else if (word === 'beş') numYears = 5;
    else if (word === 'yirmi') numYears = 20;
    else if (word === 'üç') numYears = 3;
    else if (word === 'iki') numYears = 2;
    else numYears = parseInt(word, 10);

    if (!isNaN(numYears) && numYears > 0) {
      startYear = currentYear - numYears;
      endYear = currentYear;
      dateRangeText = `Son ${numYears} yıl (${startYear} – ${endYear})`;
    }
  }

  // "YYYY - YYYY" or "YYYY ile YYYY"
  if (!startYear) {
    const rangeMatch = normalized.match(/\b(19\d\d|20\d\d)\s*(?:[-–—/]|ile|ve)\s*(19\d\d|20\d\d)\b/iu);
    if (rangeMatch) {
      startYear = parseInt(rangeMatch[1], 10);
      endYear = parseInt(rangeMatch[2], 10);
      if (startYear > endYear) {
        const tmp = startYear;
        startYear = endYear;
        endYear = tmp;
      }
      dateRangeText = `${startYear} – ${endYear} Yılları Arası`;
    }
  }

  // "YYYY sonrası" / "YYYY yılından sonra"
  if (!startYear) {
    const afterMatch = normalized.match(/\b(19\d\d|20\d\d)\s*(?:yılından\s+sonra|sonrası|itibaren)\b/iu);
    if (afterMatch) {
      startYear = parseInt(afterMatch[1], 10);
      endYear = currentYear;
      dateRangeText = `${startYear} Yılından Günümüze`;
    }
  }

  // 5. Extract Country
  let country = defaultCountry === 'TR' ? 'Türkiye' : 'Küresel / Tüm Dünya';
  let countryCode = defaultCountry;

  if (/\b(küresel|dünya|dünyada|dünya\s+genelinde|global)\b/iu.test(normalized)) {
    country = 'Küresel / Tüm Dünya';
    countryCode = '';
  } else if (/\b(türkiye(?:'deki|deki|'de|de)?|turkey|anadolu(?:'da|da)?)\b/iu.test(normalized)) {
    country = 'Türkiye';
    countryCode = 'TR';
  }

  // 6. Extract Analysis Type and Geographic Scope
  const analysisType = /\b(yıllara\s+göre|zamansal|yıllık|değişim|trend|artış|azalış)\b/iu.test(normalized)
    ? 'Yıllık gözlem sayıları ve zamansal trend analizi'
    : 'Genel biyoçeşitlilik ve arşiv kayıt analizi';

  const geographicScope = /\b(il|iller|bölge|bölgeler|dağılım|nerede|yoğunluk|sıcak\s+nokta)\b/iu.test(normalized)
    ? 'En fazla kayıt bulunan iller ve coğrafi sıcak noktalar'
    : 'Ulusal ve bölgesel coğrafi dağılım';

  return {
    foundSpecies: true,
    resolvedScientificName: scientificName,
    parameters: {
      speciesName: turkishName || scientificName,
      scientificName,
      country,
      countryCode,
      startYear,
      endYear,
      dateRangeText,
      analysisType,
      geographicScope,
    },
  };
}

/**
 * Kullanıcı metninde iki farklı türün karşılaştırılmak istenip istenmediğini kontrol eder
 */
export function extractComparisonSpecies(
  rawQuery: string
): { isComparison: boolean; speciesA?: string; speciesB?: string } {
  const text = (rawQuery || '').trim();
  if (!text) return { isComparison: false };

  const isCompareIntent = /\b(karşılaştır|kıyasla|kıyas|farkı|farkları|vs|versus)\b/iu.test(text) ||
    /\b(ile|ve)\b/iu.test(text);

  if (!isCompareIntent) return { isComparison: false };

  const matchedSpecies: { scientificName: string; turkishName: string }[] = [];

  for (const rule of SPECIES_RECOGNITION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        if (!matchedSpecies.some(m => m.scientificName === rule.scientificName)) {
          matchedSpecies.push({ scientificName: rule.scientificName, turkishName: rule.turkishName });
        }
        break;
      }
    }
    if (matchedSpecies.length >= 2) break;
  }

  if (matchedSpecies.length >= 2) {
    return {
      isComparison: true,
      speciesA: matchedSpecies[0].scientificName,
      speciesB: matchedSpecies[1].scientificName,
    };
  }

  return { isComparison: false };
}


// Keşif alanı için 6 ana kategoride seçilmiş türler
export const DISCOVERY_SPECIMENS: DiscoverySpecimen[] = [
  // Memeliler
  {
    id: 'ursus-arctos',
    category: 'mammals',
    turkishName: 'Bozayı',
    scientificName: 'Ursus arctos',
    family: 'Ursidae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe (Least Concern)',
    description: 'Türkiye\'nin en büyük kara memelisi. Karadeniz, Doğu Anadolu ve İç Anadolu\'nun ormanlık ve dağlık alanlarında yaşar.',
    habitat: 'Yoğun iğne yapraklı ve karışık dağ ormanları'
  },
  {
    id: 'lynx-lynx',
    category: 'mammals',
    turkishName: 'Bayağı Vaşak',
    scientificName: 'Lynx lynx',
    family: 'Felidae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe (Least Concern)',
    description: 'Gizemli ve usta bir avcı olan vaşak, kulak uçlarındaki püskülleri ve benekli postuyla tanınır. Bolu, Kastamonu ve Kars ormanlarında gözlemlenir.',
    habitat: 'Sarp kayalık ormanlık araziler'
  },
  {
    id: 'canis-lupus',
    category: 'mammals',
    turkishName: 'Bozkurt',
    scientificName: 'Canis lupus',
    family: 'Canidae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe (Least Concern)',
    description: 'Anadolu ekosisteminin tepe yırtıcılarından biri. Sürüler halinde avlanan kurtlar ekolojik dengenin kilit taşıdır.',
    habitat: 'Bozkırlar, ormanlar ve dağlık platolar'
  },
  {
    id: 'hyaena-hyaena',
    category: 'mammals',
    turkishName: 'Çizgili Sırtlan',
    scientificName: 'Hyaena hyaena',
    family: 'Hyaenidae',
    iucnStatus: 'NT',
    iucnCategoryName: 'Tehdite Yakın (Near Threatened)',
    description: 'Güneydoğu Anadolu ve Akdeniz\'in kayalık vadilerinde yaşayan, leşçil ve gececil ender bir tür.',
    habitat: 'Kurak vadiler, kayalık bozkırlar ve kanyonlar'
  },
  {
    id: 'felis-silvestris',
    category: 'mammals',
    turkishName: 'Yaban Kedisi',
    scientificName: 'Felis silvestris',
    family: 'Felidae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe (Least Concern)',
    description: 'Evcil kedilere benzese de daha iri, daha kalın kuyruklu ve vahşi olan orman kedisi.',
    habitat: 'Geniş yapraklı ve karışık ormanlar'
  },

  // Kuşlar
  {
    id: 'aquila-chrysaetos',
    category: 'birds',
    turkishName: 'Kaya Kartalı',
    scientificName: 'Aquila chrysaetos',
    family: 'Accipitridae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe (Least Concern)',
    description: 'Geniş kanat açıklığı ve heybetli süzülüşüyle Türkiye\'nin yüksek dağ zirvelerinin hükümdarı.',
    habitat: 'Yüksek dağlar ve sarp kayalık boğazlar'
  },
  {
    id: 'geronticus-eremita',
    category: 'birds',
    turkishName: 'Kelaynak',
    scientificName: 'Geronticus eremita',
    family: 'Threskiornithidae',
    iucnStatus: 'EN',
    iucnCategoryName: 'Tehlikede (Endangered)',
    description: 'Dünyada sadece Birecik (Şanlıurfa) ve Fas\'ta kalan, biyoçeşitlilik koruma projelerinin simgesi olan kadim göçmen kuş.',
    habitat: 'Fırat nehri kıyısındaki kayalık yarlar ve yarı kurak otlaklar'
  },
  {
    id: 'otis-tarda',
    category: 'birds',
    turkishName: 'Toy Kuşu',
    scientificName: 'Otis tarda',
    family: 'Otididae',
    iucnStatus: 'VU',
    iucnCategoryName: 'Hassas (Vulnerable)',
    description: 'Türkiye\'nin ve dünyanın uçabilen en ağır kuşlarından biridir. İç ve Doğu Anadolu bozkırlarında yaşar.',
    habitat: 'Geniş açık düzlükler ve bozkır tarım alanları'
  },
  {
    id: 'aquila-heliaca',
    category: 'birds',
    turkishName: 'Şah Kartal',
    scientificName: 'Aquila heliaca',
    family: 'Accipitridae',
    iucnStatus: 'VU',
    iucnCategoryName: 'Hassas (Vulnerable)',
    description: 'Baş ve ensesindeki altın sarısı tüyleriyle ayırt edilen, yaşlı meşe ve çam ağaçlarında yuvalayan nadir kartal.',
    habitat: 'Açık ormanlık araziler ve ağaçlı bozkırlar'
  },

  // Sürüngenler
  {
    id: 'caretta-caretta',
    category: 'reptiles',
    turkishName: 'İribaş Deniz Kaplumbağası',
    scientificName: 'Caretta caretta',
    family: 'Cheloniidae',
    iucnStatus: 'VU',
    iucnCategoryName: 'Hassas (Vulnerable)',
    description: 'Akdeniz kumsallarını (İztuzu, Patara, Belek) yuvalama alanı olarak kullanan deniz kaplumbağası.',
    habitat: 'Açık deniz ve Akdeniz kumsalları'
  },
  {
    id: 'chelonia-mydas',
    category: 'reptiles',
    turkishName: 'Yeşil Deniz Kaplumbağası',
    scientificName: 'Chelonia mydas',
    family: 'Cheloniidae',
    iucnStatus: 'EN',
    iucnCategoryName: 'Tehlikede (Endangered)',
    description: 'Otçul beslenen ve Akdeniz\'de özellikle İskenderun ve Akyatan lagünlerini kullanan kritik tür.',
    habitat: 'Deniz çayırları ve korunaklı koylar'
  },
  {
    id: 'vipera-kaznakovi',
    category: 'reptiles',
    turkishName: 'Kafkas Burunlu Engereği',
    scientificName: 'Vipera kaznakovi',
    family: 'Viperidae',
    iucnStatus: 'EN',
    iucnCategoryName: 'Tehlikede (Endangered)',
    description: 'Doğu Karadeniz\'in nemli vadilerinde (Artvin, Rize) yaşayan, göz alıcı kırmızı ve siyah desenli zehirli yılan.',
    habitat: 'Karadeniz nemli dere yatakları ve orman kenarları'
  },
  {
    id: 'varanus-griseus',
    category: 'reptiles',
    turkishName: 'Çöl Varanı',
    scientificName: 'Varanus griseus',
    family: 'Varanidae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe',
    description: 'Türkiye\'nin en büyük kertenkelesidir. Şanlıurfa Birecik ve Ceylanpınar yarı çöl arazilerinde bulunur.',
    habitat: 'Kumulluklar, killi topraklar ve yarı çöl alanlar'
  },

  // Deniz Canlıları
  {
    id: 'monachus-monachus',
    category: 'marine',
    turkishName: 'Akdeniz Foku',
    scientificName: 'Monachus monachus',
    family: 'Phocidae',
    iucnStatus: 'EN',
    iucnCategoryName: 'Tehlikede (Endangered)',
    description: 'Dünya popülasyonu 1000 civarında olan, Ege ve Akdeniz kıyılarındaki su altı mağaralarında barınan en nadir memelilerden biri.',
    habitat: 'İnsan baskısından uzak kayalık kıyı mağaraları'
  },
  {
    id: 'tursiops-truncatus',
    category: 'marine',
    turkishName: 'Şişeburunlu Yunus (Afalina)',
    scientificName: 'Tursiops truncatus',
    family: 'Delphinidae',
    iucnStatus: 'LC',
    iucnCategoryName: 'Asgari Endişe (Least Concern)',
    description: 'Boğazlar ve kıyı sularında düzenli olarak izlenen, zeki ve sosyal deniz memelisi.',
    habitat: 'Kıyısal sular ve boğaz akıntı bölgeleri'
  },
  {
    id: 'acipenser-sturio',
    category: 'marine',
    turkishName: 'Kolon Mersin Balığı',
    scientificName: 'Acipenser sturio',
    family: 'Acipenseridae',
    iucnStatus: 'CR',
    iucnCategoryName: 'Kritik Düzeyde Tehlikede (Critically Endangered)',
    description: 'Geçmişte Kızılırmak ve Sakarya nehirlerine yumurtlamak için giren, nesli tükenme eşiğindeki fosil balık.',
    habitat: 'Karadeniz suları ve büyük nehir deltaları'
  },

  // Amfibiler
  {
    id: 'rana-holtzi',
    category: 'amphibians',
    turkishName: 'Toros Kurbağası',
    scientificName: 'Rana holtzi',
    family: 'Ranidae',
    iucnStatus: 'CR',
    iucnCategoryName: 'Kritik Tehlikede (Critically Endangered)',
    description: 'Dünyada SADECE Niğde Bolkar Dağları\'ndaki Karagöl ve Çiniligöl\'de (2500m+) yaşayan endemik canlı.',
    habitat: 'Yüksek buzul gölleri ve alpin dağ çayırları'
  },
  {
    id: 'mertensiella-caucasica',
    category: 'amphibians',
    turkishName: 'Kafkas Semenderi',
    scientificName: 'Mertensiella caucasica',
    family: 'Salamandridae',
    iucnStatus: 'VU',
    iucnCategoryName: 'Hassas (Vulnerable)',
    description: 'Kuyruk dibindeki özel çıkıntısıyla bilinen, Doğu Karadeniz yaylalarının soğuk dağ derelerinde yaşayan endemik tür.',
    habitat: 'Soğuk dağ dereleri ve gölgeli nemli orman altları'
  },

  // Tehlike Altındakiler
  {
    id: 'endangered-geronticus',
    category: 'endangered',
    turkishName: 'Kelaynak',
    scientificName: 'Geronticus eremita',
    family: 'Threskiornithidae',
    iucnStatus: 'EN',
    iucnCategoryName: 'Tehlikede (Endangered)',
    description: 'Doğal üreme kolonileri insan müdahalesi ve pestisitler nedeniyle neredeyse yok olan, yapay koruma altındaki tür.',
    habitat: 'Güneydoğu Anadolu yarı çöl kayalıkları'
  },
  {
    id: 'endangered-monachus',
    category: 'endangered',
    turkishName: 'Akdeniz Foku',
    scientificName: 'Monachus monachus',
    family: 'Phocidae',
    iucnStatus: 'EN',
    iucnCategoryName: 'Tehlikede (Endangered)',
    description: 'Kıyı yapılaşması ve balıkçı ağları nedeniyle yaşam alanları daralan Akdeniz\'in en hassas canlısı.',
    habitat: 'Foça, Karaburun ve Kaş kıyı mağaraları'
  },
  {
    id: 'endangered-holtzi',
    category: 'endangered',
    turkishName: 'Toros Kurbağası',
    scientificName: 'Rana holtzi',
    family: 'Ranidae',
    iucnStatus: 'CR',
    iucnCategoryName: 'Kritik Tehlikede (CR)',
    description: 'Göllere sonradan aşılanan yabancı balık türleri ve aşırı turizm baskısı yüzünden tükenme riski yaşayan endemik hazine.',
    habitat: 'Bolkar Dağları Karagöl ve Çiniligöl'
  }
];

/**
 * GBIF API Tür Çözümleme
 */
export async function matchSpecies(query: string): Promise<SpeciesInfo> {
  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `species-match:${cleanQuery}`;
  const cached = getCached<SpeciesInfo>(cacheKey);
  if (cached) return cached;
  
  // Önce Türkçe eşleşmelerimize bakalım
  let targetScientific = query.trim();
  let predefinedTurkishName = '';
  let predefinedIucn: string | undefined = undefined;
  let iucnSource = 'Resmi IUCN değerlendirme kaydı bulunamadı (NE)';
  let iucnVerified = false;

  if (COMMON_TURKISH_SPECIES[cleanQuery]) {
    targetScientific = COMMON_TURKISH_SPECIES[cleanQuery].scientificName;
    predefinedTurkishName = COMMON_TURKISH_SPECIES[cleanQuery].turkishName;
    predefinedIucn = COMMON_TURKISH_SPECIES[cleanQuery].iucn;
    iucnSource = 'IUCN Kırmızı Liste / Canlı Atlası Referans Envanteri';
    iucnVerified = true;
  }

  try {
    const gbifRes = await fetchWithRetry(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(targetScientific)}&verbose=true`);
    const gbifData = await gbifRes.json();

    let resolvedData = gbifData;
    let isMatched = gbifData.matchType !== 'NONE';

    // Eğer doğrudan matchType NONE ise veya güven skoru çok düşükse, GBIF Species Search ile alternatif ara
    if (!isMatched || (gbifData.confidence && gbifData.confidence < 50)) {
      try {
        const searchRes = await fetchWithRetry(`https://api.gbif.org/v1/species/search?q=${encodeURIComponent(targetScientific)}&limit=3`);
        const searchData = await searchRes.json();
        if (searchData.results && searchData.results.length > 0) {
          const bestCandidate = searchData.results.find((r: any) => r.taxonomicStatus === 'ACCEPTED') || searchData.results[0];
          if (bestCandidate) {
            resolvedData = {
              usageKey: bestCandidate.key,
              scientificName: bestCandidate.scientificName,
              canonicalName: bestCandidate.canonicalName,
              kingdom: bestCandidate.kingdom,
              phylum: bestCandidate.phylum,
              class: bestCandidate.class,
              order: bestCandidate.order,
              family: bestCandidate.family,
              genus: bestCandidate.genus,
              rank: bestCandidate.rank,
              status: bestCandidate.taxonomicStatus,
              confidence: 75,
              matchType: 'SEARCH_API',
            };
            isMatched = true;
          }
        }
      } catch (searchErr) {
        console.warn('GBIF species search fallback failed:', searchErr);
      }
    }

    const scientificName = resolvedData.scientificName || resolvedData.canonicalName || targetScientific;
    const canonicalName = resolvedData.canonicalName || scientificName.split('(')[0].trim();

    // Eşanlamlı (Synonym) kontrolü
    let synonymOf: string | undefined;
    if (resolvedData.status === 'SYNONYM' && resolvedData.accepted) {
      synonymOf = resolvedData.accepted;
    }

    // iNaturalist üzerinden fotoğraf ve Türkçe isim desteği
    const inatInfo = await fetchInatTaxon(canonicalName || scientificName);

    let finalIucn = predefinedIucn;
    let finalIucnCategory = getIucnLabel(predefinedIucn);

    if (inatInfo?.iucnStatus) {
      finalIucn = inatInfo.iucnStatus;
      finalIucnCategory = inatInfo.iucnCategoryName || getIucnLabel(finalIucn);
      iucnSource = 'iNaturalist & IUCN Kırmızı Liste Ortak Veri Ağı';
      iucnVerified = true;
    } else if (predefinedIucn) {
      finalIucn = predefinedIucn;
      finalIucnCategory = getIucnLabel(predefinedIucn);
    } else {
      // Kesin kural: Veri yoksa ASLA otomatik 'LC' atama, 'NE' (Not Evaluated) göster!
      finalIucn = 'NE';
      finalIucnCategory = 'Değerlendirilmemiş (Not Evaluated)';
      iucnSource = 'Resmi IUCN değerlendirme kaydı bulunamadı (NE)';
      iucnVerified = false;
    }

    const result: SpeciesInfo = {
      usageKey: resolvedData.usageKey,
      scientificName: scientificName,
      canonicalName: canonicalName,
      turkishName: predefinedTurkishName || inatInfo?.turkishName || canonicalName,
      englishName: inatInfo?.englishName,
      kingdom: resolvedData.kingdom || inatInfo?.kingdom || 'Animalia',
      phylum: resolvedData.phylum || inatInfo?.phylum || 'Chordata',
      class: resolvedData.class || inatInfo?.class,
      order: resolvedData.order || inatInfo?.order,
      family: resolvedData.family || inatInfo?.family,
      genus: resolvedData.genus || inatInfo?.genus,
      rank: resolvedData.rank || 'SPECIES',
      taxonomicStatus: resolvedData.status || 'ACCEPTED',
      matchType: resolvedData.matchType,
      confidence: resolvedData.confidence,
      synonymOf,
      isMatched,
      photoUrl: inatInfo?.photoUrl,
      photoAttribution: inatInfo?.photoAttribution,
      iucnStatus: finalIucn,
      iucnCategoryName: finalIucnCategory,
      iucnSource,
      iucnVerified,
      summary: inatInfo?.summary,
      inaturalistUrl: inatInfo?.inatUrl,
      gbifUrl: resolvedData.usageKey ? `https://www.gbif.org/species/${resolvedData.usageKey}` : `https://www.gbif.org/species/search?q=${encodeURIComponent(canonicalName)}`
    };

    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error('GBIF species match error:', error);
    const fallbackIucn = predefinedIucn || 'NE';
    const result: SpeciesInfo = {
      scientificName: targetScientific,
      canonicalName: targetScientific,
      turkishName: predefinedTurkishName || targetScientific,
      kingdom: 'Animalia',
      rank: 'SPECIES',
      isMatched: false,
      iucnStatus: fallbackIucn,
      iucnCategoryName: getIucnLabel(fallbackIucn),
      iucnSource: predefinedIucn ? 'Canlı Atlası Referans Envanteri' : 'Değerlendirilmemiş (Ağ Hatası / Çevrimdışı)',
      iucnVerified: Boolean(predefinedIucn),
      gbifUrl: `https://www.gbif.org/species/search?q=${encodeURIComponent(targetScientific)}`
    };
    return result;
  }
}

/**
 * iNaturalist API'den fotoğraf, Türkçe isim ve özet çekme
 */
async function fetchInatTaxon(scientificName: string) {
  try {
    const res = await fetchWithRetry(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&locale=tr`, undefined, 1, 6000);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const taxon = data.results[0];
      
      let iucnCode: string | undefined;
      let iucnLabel: string | undefined;

      // Yalnızca iNaturalist resmi koruma statüsü tanımlanmışsa ayıkla
      if (taxon.conservation_status && taxon.conservation_status.status) {
        iucnCode = String(taxon.conservation_status.status).toUpperCase();
        iucnLabel = taxon.conservation_status.status_name || getIucnLabel(iucnCode);
      }

      return {
        turkishName: taxon.preferred_common_name,
        englishName: taxon.english_common_name,
        photoUrl: taxon.default_photo?.medium_url || taxon.default_photo?.url,
        photoAttribution: taxon.default_photo?.attribution,
        kingdom: taxon.iconic_taxon_name,
        phylum: taxon.ancestor_ids?.length ? undefined : undefined,
        class: taxon.rank === 'class' ? taxon.name : undefined,
        order: taxon.rank === 'order' ? taxon.name : undefined,
        family: taxon.rank === 'family' ? taxon.name : undefined,
        genus: taxon.rank === 'genus' ? taxon.name : undefined,
        iucnStatus: iucnCode,
        iucnCategoryName: iucnLabel,
        summary: taxon.wikipedia_summary,
        inatUrl: `https://www.inaturalist.org/taxa/${taxon.id}`
      };
    }
  } catch (e) {
    console.warn('iNaturalist API unavailable:', e);
  }
  return null;
}

/**
 * IUCN kodundan anlaşılır Türkçe etiket üretme (NE ve DD ayrımı korunmuştur)
 */
export function getIucnLabel(code?: string): string {
  switch (code?.toUpperCase()) {
    case 'EX': return 'Nesli Tükenmiş (Extinct)';
    case 'EW': return 'Doğada Tükenmiş (Extinct in the Wild)';
    case 'CR': return 'Kritik Düzeyde Tehlikede (Critically Endangered)';
    case 'EN': return 'Tehlikede (Endangered)';
    case 'VU': return 'Hassas (Vulnerable)';
    case 'NT': return 'Tehdite Yakın (Near Threatened)';
    case 'LC': return 'Asgari Endişe (Least Concern)';
    case 'DD': return 'Veri Yetersiz (Data Deficient)';
    case 'NE': return 'Değerlendirilmemiş (Not Evaluated)';
    default: return 'Değerlendirilmemiş (Not Evaluated)';
  }
}

/**
 * Belirli bir canlı türünün GBIF gözlem verilerini, yıllara ve bölgelere göre dağılımını çekme
 * @param scientificName Bilimsel ad veya Türkçe ad (örn: Ursus arctos, Bozayı)
 * @param optionsOrCountry Ülke kodu veya detaylı filtre opsiyonları
 */
export async function fetchSpeciesAnalysis(
  scientificName: string,
  optionsOrCountry: string | FetchSpeciesOptions = 'TR'
): Promise<SpeciesAnalysis> {
  // Normalize options
  const options: FetchSpeciesOptions = typeof optionsOrCountry === 'string'
    ? { countryCode: optionsOrCountry }
    : (optionsOrCountry || {});

  const countryCode = options.countryCode !== undefined ? options.countryCode : 'TR';
  const startYear = options.startYear;
  const endYear = options.endYear;
  const limit = options.limit || 300;
  const fetchExtraPages = options.fetchExtraPages ?? true;

  const cacheKey = `analysis:${scientificName.toLowerCase()}:${countryCode}:${startYear || ''}:${endYear || ''}:${limit}`;
  const cachedAnalysis = getCached<SpeciesAnalysis>(cacheKey);
  if (cachedAnalysis) return cachedAnalysis;

  // 1. Türün taksonomik kimlik ve taxonKey (usageKey) bilgilerini çöz
  const species = await matchSpecies(scientificName);

  // 2. GBIF Occurrence Search URL parametrelerini oluştur
  const countryParam = countryCode ? `&country=${countryCode}` : '';
  
  let yearParam = '';
  if (startYear && endYear) {
    yearParam = `&year=${startYear},${endYear}`;
  } else if (startYear) {
    yearParam = `&year=${startYear},2030`;
  } else if (endYear) {
    yearParam = `&year=1800,${endYear}`;
  }

  // TaxonKey (usageKey) varsa en kesin taksonomik filtre olarak kullan
  const searchName = species.canonicalName || species.scientificName;
  const taxonParam = species.usageKey 
    ? `taxonKey=${species.usageKey}` 
    : `scientificName=${encodeURIComponent(searchName)}`;

  // Tüm 81 ili ve tüm yılları eksiksiz kapsamak için facetLimit artırıldı
  const gbifUrl = `https://api.gbif.org/v1/occurrence/search?${taxonParam}${countryParam}${yearParam}&limit=${limit}&facet=year&facet=stateProvince&facetLimit=200`;

  let totalRecords = 0;
  let yearlyStats: YearlyStat[] = [];
  let regionalStats: RegionStat[] = [];
  let occurrences: GBIFOccurrence[] = [];
  let unlocatedCount = 0;

  try {
    const res = await fetchWithRetry(gbifUrl);
    const data = await res.json();

    totalRecords = typeof data.count === 'number' ? data.count : 0;

    // Ölçeklenebilir Sayfalama: Örneklem için concurrent istekler yap
    if (totalRecords > limit && fetchExtraPages) {
      try {
        const maxRecordsToFetch = Math.min(1200, totalRecords);
        const pagePromises: Promise<any>[] = [];
        for (let offset = limit; offset < maxRecordsToFetch; offset += limit) {
          const batchLimit = Math.min(limit, maxRecordsToFetch - offset);
          const pageUrl = `https://api.gbif.org/v1/occurrence/search?${taxonParam}${countryParam}${yearParam}&offset=${offset}&limit=${batchLimit}`;
          pagePromises.push(
            fetchWithRetry(pageUrl)
              .then(r => r.json())
              .catch(err => {
                console.warn(`GBIF pagination offset ${offset} failed:`, err);
                return { results: [] };
              })
          );
        }

        const pageResults = await Promise.all(pagePromises);
        for (const pr of pageResults) {
          if (pr.results && Array.isArray(pr.results)) {
            data.results = [...(data.results || []), ...pr.results];
          }
        }
      } catch (pageErr) {
        console.warn('GBIF scalable pagination error:', pageErr);
      }
    }

    // Yıl verilerini ayrıştır (GBIF arşivinin %100 facet verisinden)
    const yearFacet = data.facets?.find((f: { field: string }) => f.field === 'YEAR');
    if (yearFacet && Array.isArray(yearFacet.counts) && yearFacet.counts.length > 0) {
      yearlyStats = yearFacet.counts
        .filter((c: { name: string; count: number }) => c.name && !isNaN(Number(c.name)))
        .map((c: { name: string; count: number }) => ({
          year: parseInt(c.name, 10),
          count: c.count
        }))
        .sort((a: YearlyStat, b: YearlyStat) => a.year - b.year);
    }

    // İl / Bölge verilerini ayrıştır (GBIF arşivinin %100 facet verisinden)
    const stateFacet = data.facets?.find((f: { field: string }) => f.field === 'STATE_PROVINCE');
    let facetRegionTotal = 0;

    if (stateFacet && Array.isArray(stateFacet.counts) && stateFacet.counts.length > 0) {
      const validRegionMap = new Map<string, number>();

      stateFacet.counts.forEach((c: { name: string; count: number }) => {
        const cleanName = cleanProvinceName(c.name, countryCode);
        if (cleanName) {
          validRegionMap.set(cleanName, (validRegionMap.get(cleanName) || 0) + c.count);
          facetRegionTotal += c.count;
        }
      });

      regionalStats = Array.from(validRegionMap.entries())
        .map(([region, count]) => ({
          region,
          count,
          percentage: totalRecords > 0 ? (count / totalRecords) * 100 : 0
        }))
        .sort((a: RegionStat, b: RegionStat) => b.count - a.count);
    }

    // Gerçek koordinatlı gözlem kayıtlarını ayıkla
    if (data.results && Array.isArray(data.results)) {
      occurrences = data.results.map((r: Record<string, unknown>) => ({
        key: Number(r.key),
        scientificName: String(r.scientificName || species.scientificName),
        decimalLatitude: typeof r.decimalLatitude === 'number' ? r.decimalLatitude : undefined,
        decimalLongitude: typeof r.decimalLongitude === 'number' ? r.decimalLongitude : undefined,
        year: typeof r.year === 'number' ? r.year : undefined,
        month: typeof r.month === 'number' ? r.month : undefined,
        day: typeof r.day === 'number' ? r.day : undefined,
        eventDate: typeof r.eventDate === 'string' ? r.eventDate : undefined,
        country: typeof r.country === 'string' ? r.country : (countryCode === 'TR' ? 'Türkiye' : undefined),
        countryCode: typeof r.countryCode === 'string' ? r.countryCode : countryCode,
        stateProvince: typeof r.stateProvince === 'string' ? cleanProvinceName(r.stateProvince, countryCode) : undefined,
        locality: typeof r.locality === 'string' ? r.locality : undefined,
        basisOfRecord: typeof r.basisOfRecord === 'string' ? translateBasisOfRecord(r.basisOfRecord) : 'Gözlem Kaydı',
        institutionCode: typeof r.institutionCode === 'string' ? r.institutionCode : undefined,
        catalogNumber: typeof r.catalogNumber === 'string' ? r.catalogNumber : undefined,
        recordedBy: typeof r.recordedBy === 'string' ? r.recordedBy : undefined,
        datasetName: typeof r.datasetName === 'string' ? r.datasetName : undefined,
        license: typeof r.license === 'string' ? r.license : undefined,
        references: typeof r.references === 'string' ? r.references : undefined
      }));
    }

    // Eğer GBIF facets boşsa, gelen occurrence sonuçları üzerinden topla
    if (yearlyStats.length === 0 && occurrences.length > 0) {
      const yearMap = new Map<number, number>();
      occurrences.forEach(o => {
        if (o.year && !isNaN(o.year)) {
          yearMap.set(o.year, (yearMap.get(o.year) || 0) + 1);
        }
      });
      yearlyStats = Array.from(yearMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);
    }

    if (regionalStats.length === 0 && occurrences.length > 0) {
      const regMap = new Map<string, number>();
      occurrences.forEach(o => {
        if (o.stateProvince) {
          regMap.set(o.stateProvince, (regMap.get(o.stateProvince) || 0) + 1);
        }
      });
      regionalStats = Array.from(regMap.entries())
        .map(([region, count]) => ({
          region,
          count,
          percentage: totalRecords > 0 ? (count / totalRecords) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count);
    }

    // Konum bilgisi (stateProvince) belirtilmemiş kayıt sayısı
    unlocatedCount = Math.max(0, totalRecords - facetRegionTotal);

  } catch (err) {
    console.error('GBIF occurrences fetch failed:', err);
    throw err;
  }

  // Koordinatı DOĞRULANMIŞ olan kayıtlar (Türkiye aramasında Türkiye poligonu içinde olanlar)
  const mappedRecords = occurrences.filter(o => {
    if (typeof o.decimalLatitude !== 'number' || typeof o.decimalLongitude !== 'number') return false;
    if (isNaN(o.decimalLatitude) || isNaN(o.decimalLongitude)) return false;
    if (o.decimalLatitude === 0 && o.decimalLongitude === 0) return false;
    if (countryCode === 'TR') {
      return isWithinTurkeyBounds(o.decimalLatitude, o.decimalLongitude);
    }
    return o.decimalLatitude >= -90 && o.decimalLatitude <= 90 &&
           o.decimalLongitude >= -180 && o.decimalLongitude <= 180;
  });

  const downloadedRecordsCount = occurrences.length;
  const mappedRecordsCount = mappedRecords.length;
  const unmappedRecordsCount = Math.max(0, downloadedRecordsCount - mappedRecordsCount);

  // Yıl aralığı
  const years = yearlyStats.map(y => y.year);
  const minYear = years.length > 0 ? Math.min(...years) : null;
  const maxYear = years.length > 0 ? Math.max(...years) : null;

  // En çok kayıt olan yıl (Zirve Yıl)
  let peakYear: { year: number; count: number } | null = null;
  let lowestYear: { year: number; count: number } | null = null;

  if (yearlyStats.length > 0) {
    const sortedByCount = [...yearlyStats].sort((a, b) => b.count - a.count);
    peakYear = sortedByCount[0];
    lowestYear = sortedByCount[sortedByCount.length - 1];
  }

  const analysisResult: SpeciesAnalysis = {
    species,
    countryCode,
    countryName: countryCode === 'TR' ? 'Türkiye' : 'Tüm Dünya',
    totalRecords,
    downloadedRecordsCount,
    mappedRecordsCount,
    unmappedRecordsCount,
    unlocatedCount,
    dateRange: {
      minYear,
      maxYear
    },
    peakYear,
    lowestYear,
    yearlyStats,
    regionalStats,
    occurrences: mappedRecords, // Haritada yalnızca doğrulanmış gerçek koordinatlar
    appliedFilters: {
      countryCode,
      countryName: countryCode === 'TR' ? 'Türkiye' : 'Tüm Dünya',
      startYear,
      endYear,
      taxonKey: species.usageKey,
    },
    isArchiveFacetCalculated: true,
    dataQualityNotice: totalRecords > downloadedRecordsCount 
      ? `GBIF arşivinde ${totalRecords.toLocaleString('tr-TR')} toplam kayıt bulunmaktadır. İl ve yıl dağılımı tüm arşiv facet verisinden (%100) hesaplanmış, harita için ${downloadedRecordsCount.toLocaleString('tr-TR')} kayıtlık doğrulanmış örneklem indirilmiştir.`
      : undefined,
    queriedAt: new Date().toISOString()
  };

  setCached(cacheKey, analysisResult);
  return analysisResult;
}

export const TURKEY_PROVINCES: Record<string, string> = {
  'adana': 'Adana', 'adiyaman': 'Adıyaman', 'adıyaman': 'Adıyaman', 'afyon': 'Afyonkarahisar', 'afyonkarahisar': 'Afyonkarahisar',
  'agri': 'Ağrı', 'ağrı': 'Ağrı', 'aksaray': 'Aksaray', 'amasya': 'Amasya', 'ankara': 'Ankara', 'antalya': 'Antalya',
  'ardahan': 'Ardahan', 'artvin': 'Artvin', 'aydin': 'Aydın', 'aydın': 'Aydın', 'balikesir': 'Balıkesir', 'balıkesir': 'Balıkesir',
  'bartin': 'Bartın', 'bartın': 'Bartın', 'batman': 'Batman', 'bayburt': 'Bayburt', 'bilecik': 'Bilecik', 'bingol': 'Bingöl',
  'bingöl': 'Bingöl', 'bitlis': 'Bitlis', 'bolu': 'Bolu', 'burdur': 'Burdur', 'bursa': 'Bursa', 'canakkale': 'Çanakkale',
  'çanakkale': 'Çanakkale', 'cankiri': 'Çankırı', 'çankırı': 'Çankırı', 'corum': 'Çorum', 'çorum': 'Çorum', 'denizli': 'Denizli',
  'diyarbakir': 'Diyarbakır', 'diyarbakır': 'Diyarbakır', 'duzce': 'Düzce', 'düzce': 'Düzce', 'edirne': 'Edirne',
  'elazig': 'Elazığ', 'elazığ': 'Elazığ', 'erzincan': 'Erzincan', 'erzurum': 'Erzurum', 'eskisehir': 'Eskişehir',
  'eskişehir': 'Eskişehir', 'gaziantep': 'Gaziantep', 'giresun': 'Giresun', 'gumushane': 'Gümüşhane', 'gümüşhane': 'Gümüşhane',
  'hakkari': 'Hakkâri', 'hakkâri': 'Hakkâri', 'hatay': 'Hatay', 'igdir': 'Iğdır', 'ığdır': 'Iğdır', 'isparta': 'Isparta',
  'ısparta': 'Isparta', 'istanbul': 'İstanbul', 'i̇stanbul': 'İstanbul', 'izmir': 'İzmir', 'i̇zmir': 'İzmir',
  'kahramanmaras': 'Kahramanmaraş', 'kahramanmaraş': 'Kahramanmaraş', 'maraş': 'Kahramanmaraş', 'karabuk': 'Karabük', 'karabük': 'Karabük',
  'karaman': 'Karaman', 'kars': 'Kars', 'kastamonu': 'Kastamonu', 'kayseri': 'Kayseri', 'kilis': 'Kilis',
  'kirikkale': 'Kırıkkale', 'kırıkkale': 'Kırıkkale', 'kirklareli': 'Kırklareli', 'kırklareli': 'Kırklareli',
  'kirsehir': 'Kırşehir', 'kırşehir': 'Kırşehir', 'kocaeli': 'Kocaeli', 'izmit': 'Kocaeli', 'konya': 'Konya', 'kutahya': 'Kütahya',
  'kütahya': 'Kütahya', 'malatya': 'Malatya', 'manisa': 'Manisa', 'mardin': 'Mardin', 'mersin': 'Mersin',
  'içel': 'Mersin', 'icel': 'Mersin', 'mugla': 'Muğla', 'muğla': 'Muğla', 'mus': 'Muş', 'muş': 'Muş', 'nevsehir': 'Nevşehir',
  'nevşehir': 'Nevşehir', 'nigde': 'Niğde', 'niğde': 'Niğde', 'ordu': 'Ordu', 'osmaniye': 'Osmaniye', 'rize': 'Rize',
  'sakarya': 'Sakarya', 'adapazarı': 'Sakarya', 'samsun': 'Samsun', 'sanliurfa': 'Şanlıurfa', 'şanlıurfa': 'Şanlıurfa', 'urfa': 'Şanlıurfa',
  'siirt': 'Siirt', 'sinop': 'Sinop', 'sivas': 'Sivas', 'sirnak': 'Şırnak', 'şırnak': 'Şırnak', 'tekirdag': 'Tekirdağ',
  'tekirdağ': 'Tekirdağ', 'tokat': 'Tokat', 'trabzon': 'Trabzon', 'tunceli': 'Tunceli', 'usak': 'Uşak', 'uşak': 'Uşak',
  'van': 'Van', 'yalova': 'Yalova', 'yozgat': 'Yozgat', 'zonguldak': 'Zonguldak'
};

const TURKEY_ISO_CODES: Record<string, string> = {
  'TR-01': 'Adana', 'TR-02': 'Adıyaman', 'TR-03': 'Afyonkarahisar', 'TR-04': 'Ağrı', 'TR-05': 'Amasya',
  'TR-06': 'Ankara', 'TR-07': 'Antalya', 'TR-08': 'Artvin', 'TR-09': 'Aydın', 'TR-10': 'Balıkesir',
  'TR-11': 'Bilecik', 'TR-12': 'Bingöl', 'TR-13': 'Bitlis', 'TR-14': 'Bolu', 'TR-15': 'Burdur',
  'TR-16': 'Bursa', 'TR-17': 'Çanakkale', 'TR-18': 'Çankırı', 'TR-19': 'Çorum', 'TR-20': 'Denizli',
  'TR-21': 'Diyarbakır', 'TR-22': 'Edirne', 'TR-23': 'Elazığ', 'TR-24': 'Erzincan', 'TR-25': 'Erzurum',
  'TR-26': 'Eskişehir', 'TR-27': 'Gaziantep', 'TR-28': 'Giresun', 'TR-29': 'Gümüşhane', 'TR-30': 'Hakkâri',
  'TR-31': 'Hatay', 'TR-32': 'Isparta', 'TR-33': 'Mersin', 'TR-34': 'İstanbul', 'TR-35': 'İzmir',
  'TR-36': 'Kars', 'TR-37': 'Kastamonu', 'TR-38': 'Kayseri', 'TR-39': 'Kırklareli', 'TR-40': 'Kırşehir',
  'TR-41': 'Kocaeli', 'TR-42': 'Konya', 'TR-43': 'Kütahya', 'TR-44': 'Malatya', 'TR-45': 'Manisa',
  'TR-46': 'Kahramanmaraş', 'TR-47': 'Mardin', 'TR-48': 'Muğla', 'TR-49': 'Muş', 'TR-50': 'Nevşehir',
  'TR-51': 'Niğde', 'TR-52': 'Ordu', 'TR-53': 'Rize', 'TR-54': 'Sakarya', 'TR-55': 'Samsun',
  'TR-56': 'Siirt', 'TR-57': 'Sinop', 'TR-58': 'Sivas', 'TR-59': 'Tekirdağ', 'TR-60': 'Tokat',
  'TR-61': 'Trabzon', 'TR-62': 'Tunceli', 'TR-63': 'Şanlıurfa', 'TR-64': 'Uşak', 'TR-65': 'Van',
  'TR-66': 'Yozgat', 'TR-67': 'Zonguldak', 'TR-68': 'Aksaray', 'TR-69': 'Bayburt', 'TR-70': 'Karaman',
  'TR-71': 'Kırıkkale', 'TR-72': 'Batman', 'TR-73': 'Şırnak', 'TR-74': 'Bartın', 'TR-75': 'Ardahan',
  'TR-76': 'Iğdır', 'TR-77': 'Yalova', 'TR-78': 'Karabük', 'TR-79': 'Kilis', 'TR-80': 'Osmaniye',
  'TR-81': 'Düzce'
};

/**
 * Türkiye coğrafi sınırları içinde koordinat doğrulama (-90..90, -180..180 ve TR poligonu)
 */
export function isWithinTurkeyBounds(lat?: number, lon?: number): boolean {
  if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) return false;
  return lat >= 35.8 && lat <= 42.2 && lon >= 25.6 && lon <= 44.8 && !(lat === 0 && lon === 0);
}

/**
 * İl adlarındaki olası fazlalıkları temizleme, ISO kodlarını ve Türkçe adları konsolide etme
 */
export function cleanProvinceName(raw?: string, countryCode = 'TR'): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();

  if (countryCode === 'TR') {
    const upperCode = trimmed.toUpperCase();
    if (TURKEY_ISO_CODES[upperCode]) {
      return TURKEY_ISO_CODES[upperCode];
    }

    const cleaned = trimmed
      .replace(/\b(Province|İli|Ili|Vilayeti|Valiliği|State|Region|District|Municipality|Merkez)\b/gi, '')
      .replace(/[0-9]/g, '')
      .trim()
      .toLowerCase();

    if (TURKEY_PROVINCES[cleaned]) {
      return TURKEY_PROVINCES[cleaned];
    }
  }

  const name = trimmed.replace(/\b(Province|İli|Ili|Vilayeti|Valiliği|State|Region|District)\b/gi, '').trim();
  if (/^\d+$/.test(name) || name.length < 2 || /^(null|undefined|tr|turkey|türkiye|none|unknown)$/i.test(name)) {
    return '';
  }
  return name.charAt(0).toLocaleUpperCase('tr-TR') + name.slice(1);
}

/**
 * GBIF BasisOfRecord kodlarını anlaşılır Türkçeye çevirme
 */
export function translateBasisOfRecord(basis?: string): string {
  switch (basis) {
    case 'HUMAN_OBSERVATION': return 'Saha İnsan Gözlemi';
    case 'PRESERVED_SPECIMEN': return 'Müze / Koleksiyon Örneği';
    case 'MACHINE_OBSERVATION': return 'Fotokapan / Sensör Kaydı';
    case 'OBSERVATION': return 'Doğrulanmış Gözlem';
    case 'MATERIAL_SAMPLE': return 'Biyolojik Numune';
    case 'LIVING_SPECIMEN': return 'Yaşayan Örnek / Botanik Parkı';
    case 'FOSSIL_SPECIMEN': return 'Fosil Kaydı';
    default: return basis || 'Gözlem Kaydı';
  }
}
