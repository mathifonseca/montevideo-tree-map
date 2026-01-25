'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TreePanel from '@/components/TreePanel';
import Filters from '@/components/Filters';

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
  const [species, setSpecies] = useState<string[]>([]);
  const [treesData, setTreesData] = useState<Record<string, TreeData> | null>(null);

  // Load species list
  useEffect(() => {
    fetch('/species.json')
      .then((res) => res.json())
      .then(setSpecies)
      .catch(console.error);
  }, []);

  // Load trees data (for panel info)
  useEffect(() => {
    fetch('/trees-data.json')
      .then((res) => res.json())
      .then(setTreesData)
      .catch(console.error);
  }, []);

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      <Map onTreeSelect={setSelectedTree} selectedSpecies={selectedSpecies} />

      <Filters
        species={species}
        selectedSpecies={selectedSpecies}
        onSpeciesChange={setSelectedSpecies}
      />

      <TreePanel
        treeId={selectedTree}
        onClose={() => setSelectedTree(null)}
        treesData={treesData}
      />
    </main>
  );
}
