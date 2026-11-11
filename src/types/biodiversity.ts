/**
 * Canlı Atlası - Biyoçeşitlilik Veri Tipleri
 * GBIF API, iNaturalist ve IUCN veri yapıları
 */

export interface SpeciesInfo {
  usageKey?: number;
  scientificName: string;
  canonicalName: string;
  turkishName?: string;
  englishName?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  classHierarchy?: string;
  order?: string;
  family?: string;
  genus?: string;
  rank?: string;
  taxonomicStatus?: string;
  matchType?: string;
  confidence?: number;
  synonymOf?: string;
  isMatched?: boolean;
  photoUrl?: string;
  photoAttribution?: string;
  iucnStatus?: 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE' | string;
  iucnCategoryName?: string;
  iucnSource?: string;
  iucnEvaluationDate?: string;
  iucnVerified?: boolean;
  summary?: string;
  inaturalistUrl?: string;
  gbifUrl?: string;
}

export interface GBIFOccurrence {
  key: number;
  scientificName: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  year?: number;
  month?: number;
  day?: number;
  eventDate?: string;
  country?: string;
  countryCode?: string;
  stateProvince?: string;
  locality?: string;
  basisOfRecord?: string;
  institutionCode?: string;
  collectionCode?: string;
  catalogNumber?: string;
  recordedBy?: string;
  datasetName?: string;
  license?: string;
  references?: string;
}

export interface YearlyStat {
  year: number;
  count: number;
}

export interface RegionStat {
  region: string;
  count: number;
  percentage: number;
}

export interface SpeciesAnalysis {
  species: SpeciesInfo;
  countryCode: string;
  countryName: string;
  totalRecords: number; // GBIF veritabanındaki toplam kayıt sayısı (Archive Count)
  downloadedRecordsCount: number; // İndirilen ve harita/detayda incelenen kayıt sayısı (Sample Count)
  mappedRecordsCount: number; // İndirilenler arasında geçerli ve doğrulanmış GPS koordinatlı olanlar
  unmappedRecordsCount: number; // İndirilenler arasında koordinatı olmayan veya (0,0) geçersiz olanlar
  unlocatedCount: number; // Arşivde il/bölge adı belirtilmemiş kayıt sayısı
  dateRange: {
    minYear: number | null;
    maxYear: number | null;
  };
  peakYear: {
    year: number;
    count: number;
  } | null;
  lowestYear: {
    year: number;
    count: number;
  } | null;
  yearlyStats: YearlyStat[];
  regionalStats: RegionStat[];
  occurrences: GBIFOccurrence[];
  appliedFilters?: {
    countryCode?: string;
    countryName?: string;
    startYear?: number;
    endYear?: number;
    taxonKey?: number;
  };
  isArchiveFacetCalculated: boolean;
  dataQualityNotice?: string;
  queriedAt: string;
}

export interface ResearchParameters {
  speciesName: string;
  scientificName: string;
  country: string;
  countryCode: string;
  startYear?: number;
  endYear?: number;
  dateRangeText: string;
  analysisType: string;
  geographicScope: string;
}

export interface FetchSpeciesOptions {
  countryCode?: string;
  startYear?: number;
  endYear?: number;
  limit?: number;
  fetchExtraPages?: boolean;
}

export interface DiscoverySpecimen {
  id: string;
  category: 'mammals' | 'birds' | 'reptiles' | 'marine' | 'amphibians' | 'endangered';
  turkishName: string;
  scientificName: string;
  family: string;
  iucnStatus: 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD';
  iucnCategoryName: string;
  description: string;
  habitat: string;
  thumbnailPlaceholderColor?: string;
}
