/**
 * Canlı Atlası: Kaybolan Canlıların İzinde – Biyoçeşitliliğin Dijital Hafızası
 * Açık veri tabanlarından (GBIF & iNaturalist) beslenen biyoçeşitlilik analiz platformu.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SpeciesOverview } from './components/SpeciesOverview';
import { YearlyAnalysisChart } from './components/YearlyAnalysisChart';
import { RegionalDistribution } from './components/RegionalDistribution';
import { InteractiveMap } from './components/InteractiveMap';
import { SpeciesDiscovery } from './components/SpeciesDiscovery';
import { SpeciesComparison } from './components/SpeciesComparison';
import { RecordDetailTable } from './components/RecordDetailTable';
import { ConservationGuide } from './components/ConservationGuide';
import { ResearchAgent } from './components/ResearchAgent';
import { Footer } from './components/Footer';
import { fetchSpeciesAnalysis } from './services/gbif';
import { SpeciesAnalysis } from './types/biodiversity';
import { AlertCircle, RefreshCw, Compass } from 'lucide-react';

export default function App() {
  const [primaryAnalysis, setPrimaryAnalysis] = useState<SpeciesAnalysis | null>(null);
  const [secondaryAnalysis, setSecondaryAnalysis] = useState<SpeciesAnalysis | null>(null);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingSecondary, setIsLoadingSecondary] = useState<boolean>(false);
  const [activeCountry, setActiveCountry] = useState<string>('TR');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial load: Ursus arctos (Bozayı) in Turkey (TR)
  useEffect(() => {
    executeSearch('Ursus arctos', 'TR');
  }, []);

  const executeSearch = async (query: string, country: string = 'TR') => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveCountry(country);

    try {
      const data = await fetchSpeciesAnalysis(query, country);
      if (!data || data.totalRecords === 0) {
        // Fallback check: try global if country had 0 records, or notify
        if (country === 'TR') {
          const globalCheck = await fetchSpeciesAnalysis(query, '');
          if (globalCheck.totalRecords > 0) {
            setPrimaryAnalysis(globalCheck);
            setActiveCountry('');
            setIsLoading(false);
            return;
          }
        }
      }
      setPrimaryAnalysis(data);
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage('GBIF sunucularına bağlanırken bir hata oluştu veya bu isimle kayıt bulunamadı. Lütfen yazımı kontrol edip tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSecondary = async (scientificName: string) => {
    setIsLoadingSecondary(true);
    try {
      const data = await fetchSpeciesAnalysis(scientificName, activeCountry);
      setSecondaryAnalysis(data);
    } catch (err) {
      console.error('Secondary species error:', err);
    } finally {
      setIsLoadingSecondary(false);
    }
  };

  const handleToggleCompare = () => {
    const nextMode = !isCompareMode;
    setIsCompareMode(nextMode);
    if (nextMode && !secondaryAnalysis && primaryAnalysis) {
      // Default companion species based on primary
      const defaultSecondary = primaryAnalysis.species.scientificName === 'Ursus arctos' 
        ? 'Canis lupus' 
        : 'Ursus arctos';
      handleSelectSecondary(defaultSecondary);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1510] text-[#e8f0ec] flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Navigation Top Bar */}
      <Navbar
        onQuickSearch={(query) => executeSearch(query, activeCountry)}
        isCompareMode={isCompareMode}
        onToggleCompare={handleToggleCompare}
      />

      {/* Hero Header with Search Console */}
      <HeroSection
        onSearch={executeSearch}
        isLoading={isLoading}
        activeCountry={activeCountry}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Loading Indicator HUD */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-900/60 border-t-emerald-400 animate-spin" />
              <Compass className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              GBIF Açık Bilim Veri Tabanı Taranıyor
            </h3>
            <p className="text-xs text-emerald-300/70 max-w-sm">
              Gerçek gözlem kayıtları, GPS koordinatları, il dağılımı ve iNaturalist taksonomi arşivi çözümleniyor...
            </p>
          </div>
        )}

        {/* Error Notification */}
        {!isLoading && errorMessage && (
          <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <p className="text-sm text-rose-200">{errorMessage}</p>
            </div>
            <button
              onClick={() => executeSearch('Ursus arctos', 'TR')}
              className="px-4 py-2 bg-rose-900/60 hover:bg-rose-800/60 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Bozayı Kaydını Yükle</span>
            </button>
          </div>
        )}

        {/* Loaded Analysis View */}
        {!isLoading && primaryAnalysis && (
          <>
            {/* AI Biodiversity Research Agent */}
            <ResearchAgent
              onLoadSpeciesToAtlas={(sciName, country) => executeSearch(sciName, country || activeCountry)}
              activeSpeciesName={primaryAnalysis.species.scientificName}
            />

            {/* 1. Species Overview Card & Key KPIs */}
            <SpeciesOverview analysis={primaryAnalysis} />

            {/* 2. Analysis Grid: Yearly Chart + Regional Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7">
                <YearlyAnalysisChart
                  yearlyStats={primaryAnalysis.yearlyStats}
                  peakYear={primaryAnalysis.peakYear}
                  lowestYear={primaryAnalysis.lowestYear}
                  scientificName={primaryAnalysis.species.scientificName}
                />
              </div>

              <div className="lg:col-span-5">
                <RegionalDistribution
                  regionalStats={primaryAnalysis.regionalStats}
                  unlocatedCount={primaryAnalysis.unlocatedCount}
                  totalRecords={primaryAnalysis.totalRecords}
                />
              </div>
            </div>

            {/* 3. Interactive Leaflet Map Stage */}
            <InteractiveMap
              occurrences={primaryAnalysis.occurrences}
              totalRecords={primaryAnalysis.totalRecords}
              species={primaryAnalysis.species}
              secondaryOccurrences={isCompareMode ? secondaryAnalysis?.occurrences : undefined}
              secondarySpecies={isCompareMode ? secondaryAnalysis?.species : undefined}
            />

            {/* 4. Comparison Mode Panel (if toggled) */}
            {isCompareMode && (
              <SpeciesComparison
                primaryAnalysis={primaryAnalysis}
                secondaryAnalysis={secondaryAnalysis}
                onSelectSecondarySpecies={handleSelectSecondary}
                isLoadingSecondary={isLoadingSecondary}
              />
            )}

            {/* 5. Raw Scientific Observations Table */}
            <RecordDetailTable
              occurrences={primaryAnalysis.occurrences}
              totalCount={primaryAnalysis.totalRecords}
            />

            {/* 6. Species Discovery Area (6 Categories) */}
            <SpeciesDiscovery
              onSelectSpecies={(sciName) => {
                executeSearch(sciName, activeCountry);
                window.scrollTo({ top: 350, behavior: 'smooth' });
              }}
              activeScientificName={primaryAnalysis.species.scientificName}
            />

            {/* 7. IUCN Conservation Guide & Methodology */}
            <ConservationGuide />
          </>
        )}

      </main>

      {/* Global Nature Footer */}
      <Footer />
    </div>
  );
}
