/**
 * Canlı Atlası - GBIF ve iNaturalist Veri Servisi
 * Gerçek açık veri kaynakları üzerinden biyoçeşitlilik gözlem ve tür bilgisi çekme modülü.
 */

import { DiscoverySpecimen, GBIFOccurrence, RegionStat, SpeciesAnalysis, SpeciesInfo, YearlyStat } from '../types/biodiversity';

// Yaygın Türkçe canlı isimleri ve bilimsel ad eşleşmeleri
export const COMMON_TURKISH_SPECIES: Record<string, { scientificName: string; turkishName: string; iucn: string; category: string }> = {
  'bozayı': { scientificName: 'Ursus arctos', turkishName: 'Bozayı', iucn: 'LC', category: 'Memeliler' },
  'boz ayı': { scientificName: 'Ursus arctos', turkishName: 'Bozayı', iucn: 'LC', category: 'Memeliler' },
  'ayı': { scientificName: 'Ursus arctos', turkishName: 'Bozayı', iucn: 'LC', category: 'Memeliler' },
  'vaşak': { scientificName: 'Lynx lynx', turkishName: 'Bayağı Vaşak', iucn: 'LC', category: 'Memeliler' },
  'kurt': { scientificName: 'Canis lupus', turkishName: 'Bozkurt', iucn: 'LC', category: 'Memeliler' },
  'bozkurt': { scientificName: 'Canis lupus', turkishName: 'Bozkurt', iucn: 'LC', category: 'Memeliler' },
  'yaban kedisi': { scientificName: 'Felis silvestris', turkishName: 'Yaban Kedisi', iucn: 'LC', category: 'Memeliler' },
  'akdeniz foku': { scientificName: 'Monachus monachus', turkishName: 'Akdeniz Foku', iucn: 'EN', category: 'Deniz Canlıları' },
  'çizgili sırtlan': { scientificName: 'Hyaena hyaena', turkishName: 'Çizgili Sırtlan', iucn: 'NT', category: 'Memeliler' },
  'caretta caretta': { scientificName: 'Caretta caretta', turkishName: 'İribaş Deniz Kaplumbağası', iucn: 'VU', category: 'Sürüngenler' },
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
  'aslan': { scientificName: 'Panthera leo', turkishName: 'Aslan', iucn: 'VU', category: 'Memeliler' },
  'leopar': { scientificName: 'Panthera pardus', turkishName: 'Anadolu Leoparı', iucn: 'VU', category: 'Memeliler' },
  'kaplan': { scientificName: 'Panthera tigris', turkishName: 'Kaplan', iucn: 'EN', category: 'Memeliler' }
};

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
  
  // Önce Türkçe eşleşmelerimize bakalım
  let targetScientific = query.trim();
  let predefinedTurkishName = '';
  let predefinedIucn = 'LC';

  if (COMMON_TURKISH_SPECIES[cleanQuery]) {
    targetScientific = COMMON_TURKISH_SPECIES[cleanQuery].scientificName;
    predefinedTurkishName = COMMON_TURKISH_SPECIES[cleanQuery].turkishName;
    predefinedIucn = COMMON_TURKISH_SPECIES[cleanQuery].iucn;
  }

  try {
    const gbifRes = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(targetScientific)}`);
    const gbifData = await gbifRes.json();

    const scientificName = gbifData.scientificName || gbifData.canonicalName || targetScientific;
    const canonicalName = gbifData.canonicalName || scientificName.split('(')[0].trim();

    // iNaturalist üzerinden fotoğraf ve Türkçe isim desteği
    const inatInfo = await fetchInatTaxon(canonicalName || scientificName);

    return {
      usageKey: gbifData.usageKey,
      scientificName: scientificName,
      canonicalName: canonicalName,
      turkishName: predefinedTurkishName || inatInfo?.turkishName || canonicalName,
      englishName: inatInfo?.englishName,
      kingdom: gbifData.kingdom || inatInfo?.kingdom || 'Animalia',
      phylum: gbifData.phylum || inatInfo?.phylum || 'Chordata',
      class: gbifData.class || inatInfo?.class,
      order: gbifData.order || inatInfo?.order,
      family: gbifData.family || inatInfo?.family,
      genus: gbifData.genus || inatInfo?.genus,
      rank: gbifData.rank || 'SPECIES',
      taxonomicStatus: gbifData.status || 'ACCEPTED',
      photoUrl: inatInfo?.photoUrl,
      photoAttribution: inatInfo?.photoAttribution,
      iucnStatus: inatInfo?.iucnStatus || predefinedIucn || 'LC',
      iucnCategoryName: inatInfo?.iucnCategoryName || getIucnLabel(inatInfo?.iucnStatus || predefinedIucn),
      summary: inatInfo?.summary,
      inaturalistUrl: inatInfo?.inatUrl,
      gbifUrl: gbifData.usageKey ? `https://www.gbif.org/species/${gbifData.usageKey}` : `https://www.gbif.org/species/search?q=${encodeURIComponent(canonicalName)}`
    };
  } catch (error) {
    console.error('GBIF species match error:', error);
    // Güvenli yerel yapı
    return {
      scientificName: targetScientific,
      canonicalName: targetScientific,
      turkishName: predefinedTurkishName || targetScientific,
      kingdom: 'Animalia',
      rank: 'SPECIES',
      iucnStatus: predefinedIucn,
      iucnCategoryName: getIucnLabel(predefinedIucn),
      gbifUrl: `https://www.gbif.org/species/search?q=${encodeURIComponent(targetScientific)}`
    };
  }
}

/**
 * iNaturalist API'den fotoğraf, Türkçe isim ve özet çekme
 */
async function fetchInatTaxon(scientificName: string) {
  try {
    const res = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&locale=tr`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const taxon = data.results[0];
      
      let iucnCode = 'LC';
      let iucnLabel = 'Asgari Endişe (Least Concern)';

      if (taxon.conservation_status) {
        iucnCode = taxon.conservation_status.status || 'LC';
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
 * IUCN kodundan anlaşılır Türkçe etiket üretme
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
    default: return 'Bilinmiyor / İnceleniyor';
  }
}

/**
 * Belirli bir canlı türünün GBIF gözlem verilerini, yıllara ve bölgelere göre dağılımını çekme
 * @param scientificName Bilimsel ad (örn: Ursus arctos)
 * @param countryCode Ülke kodu (varsayılan: TR - Türkiye, boş string tüm dünya)
 */
export async function fetchSpeciesAnalysis(scientificName: string, countryCode: string = 'TR'): Promise<SpeciesAnalysis> {
  // Önce türün kimlik bilgilerini çöz
  const species = await matchSpecies(scientificName);

  // GBIF Occurrence Search URL'i oluştur
  const countryParam = countryCode ? `&country=${countryCode}` : '';
  const searchName = species.canonicalName || species.scientificName;
  const gbifUrl = `https://api.gbif.org/v1/occurrence/search?scientificName=${encodeURIComponent(searchName)}${countryParam}&limit=300&facet=year&facet=stateProvince&facetLimit=60`;

  let totalRecords = 0;
  let yearlyStats: YearlyStat[] = [];
  let regionalStats: RegionStat[] = [];
  let occurrences: GBIFOccurrence[] = [];
  let unlocatedCount = 0;

  try {
    const res = await fetch(gbifUrl);
    const data = await res.json();

    totalRecords = data.count || 0;

    // Yıl verilerini ayrıştır (GBIF facets)
    const yearFacet = data.facets?.find((f: { field: string }) => f.field === 'YEAR');
    if (yearFacet && yearFacet.counts?.length > 0) {
      yearlyStats = yearFacet.counts
        .filter((c: { name: string; count: number }) => c.name && !isNaN(Number(c.name)))
        .map((c: { name: string; count: number }) => ({
          year: parseInt(c.name, 10),
          count: c.count
        }))
        .sort((a: YearlyStat, b: YearlyStat) => a.year - b.year);
    }

    // İl / Bölge verilerini ayrıştır (GBIF facets)
    const stateFacet = data.facets?.find((f: { field: string }) => f.field === 'STATE_PROVINCE');
    let facetRegionTotal = 0;

    if (stateFacet && stateFacet.counts?.length > 0) {
      regionalStats = stateFacet.counts
        .filter((c: { name: string; count: number }) => c.name && c.name.trim().length > 0)
        .map((c: { name: string; count: number }) => {
          facetRegionTotal += c.count;
          return {
            region: cleanProvinceName(c.name),
            count: c.count,
            percentage: totalRecords > 0 ? Math.round((c.count / totalRecords) * 100) : 0
          };
        })
        .sort((a: RegionStat, b: RegionStat) => b.count - a.count);
    }

    // Gerçek koordinatlı gözlem kayıtlarını ayıkla (Leaflet için)
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
        stateProvince: typeof r.stateProvince === 'string' ? cleanProvinceName(r.stateProvince) : undefined,
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

    // Eğer GBIF facets boş döndüyse (bazı genel sorgularda), gelen sonuçlar üzerinden topla
    if (yearlyStats.length === 0 && occurrences.length > 0) {
      const yearMap = new Map<number, number>();
      occurrences.forEach(o => {
        if (o.year) {
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
          percentage: totalRecords > 0 ? Math.round((count / totalRecords) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);
    }

    // Konum bilgisi (stateProvince) belirtilmemiş kayıt sayısı
    unlocatedCount = Math.max(0, totalRecords - facetRegionTotal);

  } catch (err) {
    console.error('GBIF occurrences fetch failed:', err);
  }

  // Koordinatı olan kayıtlar
  const mappedRecords = occurrences.filter(
    o => typeof o.decimalLatitude === 'number' && typeof o.decimalLongitude === 'number' && !isNaN(o.decimalLatitude) && !isNaN(o.decimalLongitude)
  );

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

  return {
    species,
    countryCode,
    countryName: countryCode === 'TR' ? 'Türkiye' : 'Tüm Dünya',
    totalRecords,
    mappedRecordsCount: mappedRecords.length,
    unmappedRecordsCount: Math.max(0, totalRecords - mappedRecords.length),
    unlocatedCount,
    dateRange: {
      minYear,
      maxYear
    },
    peakYear,
    lowestYear,
    yearlyStats,
    regionalStats,
    occurrences: mappedRecords, // Harita için sadece gerçek koordinatı olanlar
    queriedAt: new Date().toISOString()
  };
}

/**
 * İl adlarındaki olası fazlalıkları temizleme
 */
function cleanProvinceName(raw: string): string {
  let name = raw.replace(/\b(Province|İli|Ili|Vilayeti)\b/gi, '').trim();
  // İlk harfleri düzgün büyük yapma
  return name.charAt(0).toUpperCase() + name.slice(1);
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
