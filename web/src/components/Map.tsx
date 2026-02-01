'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  onTreeSelect: (treeId: number | null) => void;
  selectedSpecies: string | null;
  reportMode?: boolean;
  onReportClick?: (lat: number, lng: number) => void;
}

// Color palette for top species
const SPECIES_COLORS: [string, string][] = [
  ['Paraiso', '#f59e0b'],
  ['Fresno americano', '#3b82f6'],
  ['Platano', '#8b5cf6'],
  ['Tipa', '#ec4899'],
  ['Arce negundo', '#ef4444'],
  ['Fresno europeo', '#06b6d4'],
  ['Laurel rosa', '#f43f5e'],
  ['Anacahuita', '#84cc16'],
  ['Jacaranda', '#a855f7'],
  ['Olmo procera', '#14b8a6'],
  ['Sauce llorón', '#22c55e'],
  ['Sauce lloron', '#22c55e'],
  ['Eucalipto blanco', '#64748b'],
  ['Arce blanco', '#f97316'],
  ['Palo borracho rosa', '#db2777'],
];

// Build color expression for Mapbox
const colorExpression = [
  'match',
  ['get', 'e'],
  ...SPECIES_COLORS.flat(),
  '#4ade80', // default
] as mapboxgl.ExpressionSpecification;

export default function Map({ onTreeSelect, selectedSpecies, reportMode, onReportClick }: MapProps) {
  const [locating, setLocating] = useState(false);

  const handleLocateMe = () => {
    if (!map.current) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 17,
        });
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocating(false);
        alert('No se pudo obtener tu ubicación');
      },
      { enableHighAccuracy: true }
    );
  };
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const onTreeSelectRef = useRef(onTreeSelect);
  const reportModeRef = useRef(reportMode);
  const onReportClickRef = useRef(onReportClick);
  const [loading, setLoading] = useState(true);

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
    if (map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    console.log('Mapbox token:', token ? 'present' : 'MISSING');
    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-56.1645, -34.9011], // Montevideo
      zoom: 12,
    });

    map.current.on('error', (e) => {
      console.error('Mapbox error:', e);
    });

    map.current.on('load', async () => {
      console.log('Map loaded, fetching trees...');
      try {
        const response = await fetch('/trees.json');
        console.log('Response received:', response.status);
        const data = await response.json();
        console.log('Data parsed, features:', data.features?.length);

      map.current!.addSource('trees', {
        type: 'geojson',
        data,
      });
      console.log('Source added');

      // Trees layer with colors by species
      map.current!.addLayer({
        id: 'trees-point',
        type: 'circle',
        source: 'trees',
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
          'circle-stroke-color': '#000',
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
    };
  }, []);

  // Filter by species
  useEffect(() => {
    if (!map.current) return;

    const applyFilter = () => {
      if (!map.current?.getLayer('trees-point')) return;

      if (selectedSpecies) {
        map.current.setFilter('trees-point', ['==', ['get', 'e'], selectedSpecies]);
      } else {
        map.current.setFilter('trees-point', null);
      }
    };

    if (map.current.isStyleLoaded() && map.current.getLayer('trees-point')) {
      applyFilter();
    } else {
      map.current.once('idle', applyFilter);
    }
  }, [selectedSpecies]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-white text-lg">Cargando árboles...</div>
        </div>
      )}

      {/* Locate me button */}
      <button
        onClick={handleLocateMe}
        disabled={locating}
        className="absolute bottom-6 right-4 z-20 p-3 bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg hover:bg-gray-800 disabled:opacity-50"
        title="Mi ubicación"
      >
        {locating ? (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
