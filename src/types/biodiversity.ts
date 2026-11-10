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
  order?: string;
  family?: string;
  genus?: string;
  rank?: string;
  taxonomicStatus?: string;
  photoUrl?: string;
  photoAttribution?: string;
  iucnStatus?: 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE' | string;
  iucnCategoryName?: string;
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
  totalRecords: number;
  mappedRecordsCount: number;
  unmappedRecordsCount: number;
  unlocatedCount: number;
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
  queriedAt: string;
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
