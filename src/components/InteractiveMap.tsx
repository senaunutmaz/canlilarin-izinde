import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GBIFOccurrence, SpeciesInfo } from '../types/biodiversity';
import { Compass, RotateCcw, Info, MapPin } from 'lucide-react';

interface InteractiveMapProps {
  occurrences: GBIFOccurrence[];
  totalRecords: number;
  species: SpeciesInfo;
  secondaryOccurrences?: GBIFOccurrence[];
  secondarySpecies?: SpeciesInfo;
}

type TileTheme = 'topo' | 'dark' | 'satellite' | 'osm';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  occurrences,
  totalRecords,
  species,
  secondaryOccurrences,
  secondarySpecies,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Default to Topographic Nature Map (Esri World Topo - 100% free, no API key required)
  const [tileTheme, setTileTheme] = useState<TileTheme>('topo');
  const [selectedRecord, setSelectedRecord] = useState<GBIFOccurrence | null>(null);

  // Filter valid geographic coordinates (-90..90, -180..180)
  const validOccurrences = occurrences.filter(
    (o): o is GBIFOccurrence & { decimalLatitude: number; decimalLongitude: number } =>
      typeof o.decimalLatitude === 'number' &&
      typeof o.decimalLongitude === 'number' &&
      !isNaN(o.decimalLatitude) &&
      !isNaN(o.decimalLongitude) &&
      o.decimalLatitude >= -90 &&
      o.decimalLatitude <= 90 &&
      o.decimalLongitude >= -180 &&
      o.decimalLongitude <= 180
  );

  const validSecondary = (secondaryOccurrences || []).filter(
    (o): o is GBIFOccurrence & { decimalLatitude: number; decimalLongitude: number } =>
      typeof o.decimalLatitude === 'number' &&
      typeof o.decimalLongitude === 'number' &&
      !isNaN(o.decimalLatitude) &&
      !isNaN(o.decimalLongitude) &&
      o.decimalLatitude >= -90 &&
      o.decimalLatitude <= 90 &&
      o.decimalLongitude >= -180 &&
      o.decimalLongitude <= 180
  );

  // 1. Initialize Map Instance ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard against Leaflet container reuse in React StrictMode
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create Leaflet Map centered on Turkey
    const map = L.map(mapContainerRef.current, {
      center: [39.0, 35.2],
      zoom: 6,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // Markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // ResizeObserver ensures map tile sizes re-calculate on render/resize
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Periodic invalidateSize guarantees tiles load as DOM stabilizes
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Tile Layer updates smoothly without requiring any API keys
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }

    let url: string;
    let options: L.TileLayerOptions;

    switch (tileTheme) {
      case 'dark':
        // 100% Free OpenStreetMap with high-contrast dark nature CSS filter (No API key needed)
        url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        options = {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          className: 'dark-nature-tiles',
          maxZoom: 19,
        };
        break;

      case 'satellite':
        // 100% Free Esri World Imagery (No API key needed)
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        options = {
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS',
          maxZoom: 18,
        };
        break;

      case 'osm':
        // 100% Free OpenStreetMap standard (No API key needed)
        url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        options = {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          maxZoom: 19,
        };
        break;

      case 'topo':
      default:
        // 100% Free Esri World Topo Map (No API key needed, rich topographical relief)
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
        options = {
          attribution: 'Tiles &copy; Esri, GEBCO, Garmin, FAO, NOAA, USGS',
          maxZoom: 19,
        };
        break;
    }

    const tileLayer = L.tileLayer(url, options).addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Invalidate size on tile change
    map.invalidateSize();
  }, [tileTheme]);

  // 3. Update Markers when occurrences or comparison change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const bounds: [number, number][] = [];

    // Custom DivIcon marker
    const createMarkerIcon = (color: string, ringColor: string) => {
      return L.divIcon({
        className: 'custom-nature-pin',
        html: `
          <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background-color: ${color}; opacity: 0.35;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${ringColor}; z-index: 2;"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        popupAnchor: [0, -10],
      });
    };

    const primaryIcon = createMarkerIcon('#10b981', 'rgba(16, 185, 129, 0.9)');
    const secondaryIcon = createMarkerIcon('#f59e0b', 'rgba(245, 158, 11, 0.9)');

    // Add Primary Species Markers
    validOccurrences.forEach((occ) => {
      bounds.push([occ.decimalLatitude, occ.decimalLongitude]);

      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 700; color: #34d399; font-size: 13px; margin-bottom: 2px;">
            ${species.turkishName || species.canonicalName}
          </div>
          <div style="font-style: italic; color: #a7f3d0; font-size: 11px; margin-bottom: 6px;">
            ${species.scientificName}
          </div>
          <div style="border-top: 1px solid rgba(52, 211, 153, 0.25); padding-top: 6px; display: flex; flex-direction: column; gap: 3px;">
            <div><strong>Konum:</strong> ${occ.stateProvince || occ.locality || 'Belirtilmemiş'}</div>
            <div><strong>Yıl:</strong> ${occ.year || (occ.eventDate ? occ.eventDate.slice(0, 4) : 'Belirtilmemiş')}</div>
            <div><strong>Kayıt Türü:</strong> ${occ.basisOfRecord || 'Saha Gözlemi'}</div>
            <div style="font-family: monospace; font-size: 10px; color: #93c5fd; margin-top: 2px;">
              ${occ.decimalLatitude.toFixed(4)}°K, ${occ.decimalLongitude.toFixed(4)}°D
            </div>
          </div>
          <a href="https://www.gbif.org/occurrence/${occ.key}" target="_blank" style="display: inline-block; margin-top: 6px; color: #6ee7b7; text-decoration: underline; font-size: 11px;">
            GBIF Kayıt Ayrıntısı &rarr;
          </a>
        </div>
      `;

      const marker = L.marker([occ.decimalLatitude, occ.decimalLongitude], { icon: primaryIcon })
        .bindPopup(popupHtml);

      marker.on('click', () => setSelectedRecord(occ));
      layer.addLayer(marker);
    });

    // Add Secondary Species Markers (if in comparison mode)
    if (secondarySpecies && validSecondary.length > 0) {
      validSecondary.forEach((occ) => {
        bounds.push([occ.decimalLatitude, occ.decimalLongitude]);

        const popupHtml = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 700; color: #fbbf24; font-size: 13px; margin-bottom: 2px;">
              ${secondarySpecies.turkishName || secondarySpecies.canonicalName}
            </div>
            <div style="font-style: italic; color: #fde68a; font-size: 11px; margin-bottom: 6px;">
              ${secondarySpecies.scientificName}
            </div>
            <div style="border-top: 1px solid rgba(251, 191, 36, 0.25); padding-top: 6px; display: flex; flex-direction: column; gap: 3px;">
              <div><strong>Konum:</strong> ${occ.stateProvince || occ.locality || 'Belirtilmemiş'}</div>
              <div><strong>Yıl:</strong> ${occ.year || (occ.eventDate ? occ.eventDate.slice(0, 4) : 'Belirtilmemiş')}</div>
              <div><strong>Kayıt Türü:</strong> ${occ.basisOfRecord || 'Saha Gözlemi'}</div>
              <div style="font-family: monospace; font-size: 10px; color: #fef08a; margin-top: 2px;">
                ${occ.decimalLatitude.toFixed(4)}°K, ${occ.decimalLongitude.toFixed(4)}°D
              </div>
            </div>
            <a href="https://www.gbif.org/occurrence/${occ.key}" target="_blank" style="display: inline-block; margin-top: 6px; color: #fde68a; text-decoration: underline; font-size: 11px;">
              GBIF Kayıt Ayrıntısı &rarr;
            </a>
          </div>
        `;

        const marker = L.marker([occ.decimalLatitude, occ.decimalLongitude], { icon: secondaryIcon })
          .bindPopup(popupHtml);

        marker.on('click', () => setSelectedRecord(occ));
        layer.addLayer(marker);
      });
    }

    // Center map view on points or Turkey
    if (bounds.length === 1) {
      map.setView(bounds[0], 8);
    } else if (bounds.length > 1) {
      try {
        map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 11 });
      } catch (e) {
        console.warn('Bounds fitting error:', e);
      }
    } else {
      map.setView([39.0, 35.2], 6);
    }

    // Refresh tile size after fitting bounds
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

  }, [validOccurrences.length, validSecondary.length, species.scientificName, secondarySpecies?.scientificName]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.invalidateSize();
    if (validOccurrences.length > 1) {
      const bounds = validOccurrences.map(o => [o.decimalLatitude, o.decimalLongitude] as [number, number]);
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 11 });
    } else if (validOccurrences.length === 1) {
      mapInstanceRef.current.setView([validOccurrences[0].decimalLatitude, validOccurrences[0].decimalLongitude], 8);
    } else {
      mapInstanceRef.current.setView([39.0, 35.2], 6);
    }
  };

  return (
    <div id="harita" className="bg-[#111e17] border border-emerald-900/60 rounded-2xl p-6 lg:p-8 shadow-xl">
      {/* Map Header and Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-emerald-900/40">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            <span>Etkileşimli Gözlem Haritası</span>
          </h3>
          <p className="text-xs text-emerald-300/70 mt-1">
            Doğrulanmış gerçek GBIF GPS koordinatları ve coğrafi yayılım noktaları (Açık ve Ücretsiz Harita Altyapısı)
          </p>
        </div>

        {/* Action Controls & Tile Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#0b1510] rounded-xl border border-emerald-800/40 text-xs">
            <button
              type="button"
              onClick={() => setTileTheme('topo')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                tileTheme === 'topo' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Doğa & Topoğrafya
            </button>
            <button
              type="button"
              onClick={() => setTileTheme('dark')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                tileTheme === 'dark' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Koyu Doğa
            </button>
            <button
              type="button"
              onClick={() => setTileTheme('satellite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                tileTheme === 'satellite' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Uydu
            </button>
            <button
              type="button"
              onClick={() => setTileTheme('osm')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                tileTheme === 'osm' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Standart
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetView}
            title="Haritayı Odakla / Sıfırla"
            className="p-2 bg-[#0b1510] hover:bg-emerald-950/80 text-emerald-300 hover:text-white rounded-xl border border-emerald-800/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Canvas Stage */}
      <div className="relative w-full h-[460px] sm:h-[530px] rounded-xl overflow-hidden border border-emerald-800/40 shadow-inner bg-[#0b1510]">
        
        {/* Leaflet container element with full dimensions */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full"
          style={{ minHeight: '460px', width: '100%', height: '100%' }}
        />

        {/* Floating Map HUD Legend Overlay */}
        <div className="absolute top-4 right-4 z-[500] bg-[#0b1510]/95 backdrop-blur-md p-3.5 rounded-xl border border-emerald-700/60 text-xs shadow-2xl max-w-xs pointer-events-auto">
          <div className="font-semibold text-white mb-2 flex items-center justify-between gap-3">
            <span>Harita Göstergeleri</span>
            <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/40">
              {validOccurrences.length} / {totalRecords} Nokta
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-200">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm shadow-emerald-500/50 shrink-0" />
              <span className="truncate">
                {species.turkishName || species.canonicalName} ({validOccurrences.length} nokta)
              </span>
            </div>

            {secondarySpecies && (
              <div className="flex items-center gap-2 text-amber-200 pt-1.5 border-t border-emerald-900/60">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm shadow-amber-500/50 shrink-0" />
                <span className="truncate">
                  {secondarySpecies.turkishName || secondarySpecies.canonicalName} ({validSecondary.length} nokta)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informational overlay when no coordinates exist */}
        {validOccurrences.length === 0 && (
          <div className="absolute inset-0 z-[450] bg-[#0b1510]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-700/50 max-w-md shadow-2xl">
              <MapPin className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white mb-1">Doğrulanmış GPS Koordinatı Bulunmuyor</h4>
              <p className="text-xs text-emerald-200/80 leading-relaxed mb-3">
                Bu canlı türü için GBIF veri tabanındaki {totalRecords} kaydın tümü il ve bölge düzeyinde listelenmiştir. Coğrafi dağılımı incelemek için lütfen yukarıdaki <strong>Bölgesel Dağılım</strong> tablosuna göz atın.
              </p>
              <div className="text-[11px] font-mono text-emerald-400">
                Bilimsel dürüstlük gereği konumu belirsiz kayıtlar için temsili veya sahte nokta üretilmez.
              </div>
            </div>
          </div>
        )}

        {/* Scientific Guarantee Notice */}
        <div className="absolute bottom-4 left-4 z-[500] bg-[#0b1510]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-800/40 text-[11px] text-emerald-300/80 shadow-lg hidden sm:flex items-center gap-2 pointer-events-none">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Yalnızca doğrulanmış gerçek GPS koordinatları işaretlenir; koordinatı olmayan kayıtlar için yer uydurulmaz.</span>
        </div>
      </div>

      {/* Under-Map Metrics */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-emerald-300/80 pt-2">
        <div className="flex items-center gap-2">
          <span>Haritada Gösterilen: <strong className="text-white font-bold">{validOccurrences.length} kayıt</strong></span>
          <span aria-hidden="true">·</span>
          <span>Koordinatsız: <strong className="text-amber-300 font-bold">{Math.max(0, totalRecords - validOccurrences.length)} kayıt</strong></span>
        </div>
        <div className="text-emerald-400/60 hidden sm:block">
          Yakınlaştırmak için haritaya çift tıklayın veya fare tekerini kullanın
        </div>
      </div>
    </div>
  );
};
