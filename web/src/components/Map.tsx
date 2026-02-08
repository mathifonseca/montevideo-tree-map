'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { addProtocol } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface MapProps {
  onTreeSelect: (treeId: number | null) => void;
  selectedSpecies: string | null;
  selectedCCZ: number | null;
  reportMode?: boolean;
  onReportClick?: (lat: number, lng: number) => void;
  mapRef?: React.MutableRefObject<maplibregl.Map | null>;
}

// Color palette for top species
const SPECIES_COLORS: [string, string][] = [
  ['Paraíso', '#f59e0b'],
  ['Fresno americano', '#3b82f6'],
  ['Plátano de sombra', '#7c3aed'],
  ['Tipa', '#ec4899'],
  ['Arce negundo', '#ef4444'],
  ['Fresno europeo', '#06b6d4'],
  ['Laurel rosa', '#f43f5e'],
  ['Anacahuita', '#84cc16'],
  ['Jacarandá', '#a855f7'],
  ['Olmo europeo', '#14b8a6'],
  ['Eucalipto blanco', '#64748b'],
  ['Sauce llorón', '#22c55e'],
  ['Palo borracho rosa', '#db2777'],
  ['Arce plateado', '#f97316'],
  ['Álamo Carolino', '#8b5cf6'],
];

// Build color expression for Mapbox
const colorExpression: any = [
  'match',
  ['get', 'e'],
  ...SPECIES_COLORS.flat(),
  '#4ade80', // default
];

export default function Map({ onTreeSelect, selectedSpecies, selectedCCZ, reportMode, onReportClick, mapRef }: MapProps) {
  const t = useTranslations('map');
  const { resolvedTheme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const onTreeSelectRef = useRef(onTreeSelect);
  const reportModeRef = useRef(reportMode);
  const onReportClickRef = useRef(onReportClick);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep refs updated
  useEffect(() => {
    onTreeSelectRef.current = onTreeSelect;
  }, [onTreeSelect]);

  useEffect(() => {
    reportModeRef.current = reportMode;
    onReportClickRef.current = onReportClick;
    // Change cursor in report mode
    if (map.current) {
      map.current.getCanvas().style.cursor = reportMode ? 'crosshair' : '';
    }
  }, [reportMode, onReportClick]);

  useEffect(() => {
    if (map.current || !mounted) return;

    // Register PMTiles protocol
    const protocol = new Protocol();
    addProtocol('pmtiles', protocol.tile);

    const initialStyle = resolvedTheme === 'light' ? LIGHT_STYLE : DARK_STYLE;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: initialStyle,
      center: [-56.1645, -34.9011], // Montevideo
      zoom: 12,
    });

    if (mapRef) mapRef.current = map.current;

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
    });

    map.current.on('load', async () => {
      console.log('Map loaded, adding PMTiles source...');
      try {
      // Use PMTiles for vector tiles (6MB vs 32MB GeoJSON)
      map.current!.addSource('trees', {
        type: 'vector',
        url: 'pmtiles:///trees.pmtiles',
      });
      console.log('PMTiles source added');

      // Trees layer with colors by species
      map.current!.addLayer({
        id: 'trees-point',
        type: 'circle',
        source: 'trees',
        'source-layer': 'trees',
        paint: {
          'circle-color': colorExpression,
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 1.5,
            14, 4,
            18, 8
          ],
          'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 0,
            14, 1
          ],
          'circle-stroke-color': resolvedTheme === 'light' ? '#666' : '#000',
        },
      });

      setLoading(false);

      // Click on tree
      map.current!.on('click', 'trees-point', (e) => {
        if (reportModeRef.current) return; // Ignore in report mode
        const feature = e.features![0];
        const treeId = feature.properties!.i;
        onTreeSelectRef.current(treeId);
      });

      // Click on map for report mode
      map.current!.on('click', (e) => {
        if (reportModeRef.current && onReportClickRef.current) {
          onReportClickRef.current(e.lngLat.lat, e.lngLat.lng);
        }
      });

      // Cursor
      map.current!.on('mouseenter', 'trees-point', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'trees-point', () => {
        map.current!.getCanvas().style.cursor = '';
      });
      } catch (error) {
        console.error('Error loading trees:', error);
        setLoading(false);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      if (mapRef) mapRef.current = null;
      (maplibregl as any).removeProtocol('pmtiles');
    };
  }, [mounted]);

  // Track the current style to avoid unnecessary changes
  const currentStyleRef = useRef<string | null>(null);

  // Change basemap when theme changes
  useEffect(() => {
    if (!map.current || !mounted) return;

    const newStyle = resolvedTheme === 'light' ? LIGHT_STYLE : DARK_STYLE;

    // Skip if this is the same style we already have
    if (currentStyleRef.current === newStyle) return;

    // Skip on initial mount (the map is initialized with the correct style)
    if (currentStyleRef.current === null) {
      currentStyleRef.current = newStyle;
      return;
    }

    currentStyleRef.current = newStyle;

    // Store current center and zoom
    const center = map.current.getCenter();
    const zoom = map.current.getZoom();

    // Set the new style
    map.current.setStyle(newStyle);

    // Re-add the trees layer after style loads
    map.current.once('style.load', () => {
      if (!map.current) return;

      // Re-add PMTiles source (setStyle removes all sources)
      map.current.addSource('trees', {
        type: 'vector',
        url: 'pmtiles:///trees.pmtiles',
      });

      // Re-add trees layer
      map.current.addLayer({
        id: 'trees-point',
        type: 'circle',
        source: 'trees',
        'source-layer': 'trees',
        paint: {
          'circle-color': colorExpression,
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 1.5,
            14, 4,
            18, 8
          ],
          'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'],
            10, 0,
            14, 1
          ],
          'circle-stroke-color': resolvedTheme === 'light' ? '#666' : '#000',
        },
      });

      // Restore center and zoom
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    });
  }, [resolvedTheme, mounted]);

  // Filter by species and/or CCZ
  useEffect(() => {
    if (!map.current) return;

    const applyFilter = () => {
      if (!map.current?.getLayer('trees-point')) return;

      const filters: maplibregl.ExpressionSpecification[] = [];
      if (selectedSpecies) {
        filters.push(['==', ['get', 'e'], selectedSpecies]);
      }
      if (selectedCCZ) {
        filters.push(['==', ['get', 'c'], selectedCCZ]);
      }

      if (filters.length === 0) {
        map.current.setFilter('trees-point', null);
      } else if (filters.length === 1) {
        map.current.setFilter('trees-point', filters[0]);
      } else {
        map.current.setFilter('trees-point', ['all', ...filters] as maplibregl.ExpressionSpecification);
      }
    };

    if (map.current.isStyleLoaded() && map.current.getLayer('trees-point')) {
      applyFilter();
    } else {
      map.current.once('idle', applyFilter);
    }
  }, [selectedSpecies, selectedCCZ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {(loading || !mounted) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80">
          <div className="text-gray-900 dark:text-white text-lg">{t('loadingTrees')}</div>
        </div>
      )}
    </div>
  );
}
