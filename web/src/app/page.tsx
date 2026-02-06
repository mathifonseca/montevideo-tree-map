'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type mapboxgl from 'mapbox-gl';
import pako from 'pako';
import TreePanel from '@/components/TreePanel';
import Filters from '@/components/Filters';
import ReportModal from '@/components/ReportModal';
import FeedbackModal from '@/components/FeedbackModal';
import AboutModal from '@/components/AboutModal';
import StatsModal from '@/components/StatsModal';

// Dynamic import to avoid SSR issues with Mapbox
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <p className="text-white">Cargando mapa...</p>
    </div>
  ),
});

interface TreeData {
  nombre_cientifico: string | null;
  nombre_comun: string | null;
  calle: string | null;
  numero: number | null;
  ccz: number | null;
  altura: number | null;
  cap: number | null;
  diametro_copa: number | null;
  estado: number | null;
  lat: number;
  lng: number;
}

export default function Home() {
  const [selectedTree, setSelectedTree] = useState<number | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [selectedCCZ, setSelectedCCZ] = useState<number | null>(null);
  const [species, setSpecies] = useState<string[]>([]);
  const [treesData, setTreesData] = useState<Record<string, TreeData> | null>(null);
  const [speciesCounts, setSpeciesCounts] = useState<Record<string, number> | null>(null);
  const [reportMode, setReportMode] = useState(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Read tree ID from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const treeId = params.get('arbol');
    if (treeId) {
      const id = parseInt(treeId, 10);
      if (!isNaN(id)) {
        setSelectedTree(id);
      }
    }
  }, []);

  // Center map on selected tree from URL when data loads
  useEffect(() => {
    if (!selectedTree || !treesData || !mapRef.current) return;

    const tree = treesData[selectedTree.toString()];
    if (tree?.lat && tree?.lng) {
      mapRef.current.flyTo({
        center: [tree.lng, tree.lat],
        zoom: 17,
      });
    }
  }, [treesData]); // Only run when treesData first loads

  // Update URL when tree is selected
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedTree) {
      url.searchParams.set('arbol', selectedTree.toString());
    } else {
      url.searchParams.delete('arbol');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedTree]);

  const handleLocateMe = () => {
    if (!mapRef.current) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
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

  // Load species list and counts
  useEffect(() => {
    fetch('/species.json')
      .then((res) => res.json())
      .then(setSpecies)
      .catch(console.error);

    fetch('/species-counts.json')
      .then((res) => res.json())
      .then(setSpeciesCounts)
      .catch(console.error);
  }, []);

  // Load trees data (for panel info) - gzipped for 92% smaller download
  useEffect(() => {
    fetch('/trees-data.json.gz')
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const decompressed = pako.inflate(new Uint8Array(buffer), { to: 'string' });
        return JSON.parse(decompressed);
      })
      .then(setTreesData)
      .catch(console.error);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      <Map
        onTreeSelect={setSelectedTree}
        selectedSpecies={selectedSpecies}
        selectedCCZ={selectedCCZ}
        reportMode={reportMode}
        onReportClick={(lat, lng) => {
          setReportCoords({ lat, lng });
          setReportMode(false);
        }}
        mapRef={mapRef}
      />

      {/* UI overlay - isolate creates its own stacking context above WebGL canvas on iOS */}
      <div className="absolute inset-0 z-20 pointer-events-none isolate">
        <div className="pointer-events-auto">
          <Filters
            species={species}
            selectedSpecies={selectedSpecies}
            onSpeciesChange={setSelectedSpecies}
            speciesCounts={speciesCounts ?? undefined}
            selectedCCZ={selectedCCZ}
            onCCZChange={setSelectedCCZ}
            onLocationSelect={(lng, lat) => {
              mapRef.current?.flyTo({
                center: [lng, lat],
                zoom: 17,
              });
            }}
          />
        </div>

        {/* Top right buttons */}
        <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
          <button
            onClick={() => setReportMode(!reportMode)}
            className={`p-2.5 rounded-lg shadow-lg transition-colors ${
              reportMode
                ? 'bg-amber-600 text-white'
                : 'bg-gray-900 text-white border border-gray-700 hover:bg-gray-800'
            }`}
            title={reportMode ? 'Click en el mapa para reportar' : 'Reportar árbol faltante'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            onClick={() => setFeedbackOpen(true)}
            className="p-2.5 rounded-lg shadow-lg bg-gray-900 text-white border border-gray-700 hover:bg-gray-800"
            title="Enviar feedback"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>

          <button
            onClick={() => setStatsOpen(true)}
            className="p-2.5 rounded-lg shadow-lg bg-gray-900 text-white border border-gray-700 hover:bg-gray-800"
            title="Estadísticas"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          <button
            onClick={() => setAboutOpen(true)}
            className="p-2.5 rounded-lg shadow-lg bg-gray-900 text-white border border-gray-700 hover:bg-gray-800"
            title="Sobre este proyecto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Report mode indicator */}
        {reportMode && (
          <div className="absolute top-16 right-4 bg-amber-600 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg pointer-events-auto">
            Click en el mapa para reportar
          </div>
        )}

        {/* Locate me button */}
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-24 md:bottom-6 right-4 p-3 bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg hover:bg-gray-800 disabled:opacity-50 pointer-events-auto"
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

      <TreePanel
        treeId={selectedTree}
        onClose={() => setSelectedTree(null)}
        treesData={treesData}
      />

      <ReportModal
        coords={reportCoords}
        onClose={() => setReportCoords(null)}
        species={species}
      />

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />

      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      <StatsModal
        isOpen={statsOpen}
        onClose={() => setStatsOpen(false)}
        speciesCounts={speciesCounts}
      />
    </main>
  );
}
