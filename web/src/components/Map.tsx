'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  onTreeSelect: (treeId: number | null) => void;
  selectedSpecies: string | null;
}

export default function Map({ onTreeSelect, selectedSpecies }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const onTreeSelectRef = useRef(onTreeSelect);
  const [loading, setLoading] = useState(true);

  // Keep ref updated
  useEffect(() => {
    onTreeSelectRef.current = onTreeSelect;
  }, [onTreeSelect]);

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

      // Trees layer
      map.current!.addLayer({
        id: 'trees-point',
        type: 'circle',
        source: 'trees',
        paint: {
          'circle-color': '#4ade80',
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
          'circle-stroke-color': '#166534',
        },
      });

      setLoading(false);

      // Click on tree
      map.current!.on('click', 'trees-point', (e) => {
        const feature = e.features![0];
        const treeId = feature.properties!.i;
        onTreeSelectRef.current(treeId);
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
    </div>
  );
}
