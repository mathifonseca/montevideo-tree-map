'use client';

import { useEffect, useState } from 'react';

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

// Cache for species info
interface SpeciesInfo {
  images: string[];
  description: string | null;
  wikipediaUrl: string | null;
}

const speciesCache: Record<string, SpeciesInfo> = {};

// Names that aren't real species - don't search for these
const SKIP_SPECIES_SEARCH = [
  'Ejemplar seco',
  'Dudas',
  'Transparente',
  'Crasa',
  'Cactacea',
];

async function fetchSpeciesInfo(scientificName: string): Promise<SpeciesInfo> {
  if (scientificName in speciesCache) {
    return speciesCache[scientificName];
  }

  const result: SpeciesInfo = { images: [], description: null, wikipediaUrl: null };

  try {
    // Fetch Wikipedia summary and images in parallel
    const [wikiResponse, commonsResponse] = await Promise.all([
      fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`),
      fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(scientificName)}&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`),
    ]);

    // Parse Wikipedia response
    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      result.description = wikiData.extract || null;
      result.wikipediaUrl = wikiData.content_urls?.desktop?.page || null;
    }

    // Parse Commons response
    if (commonsResponse.ok) {
      const commonsData = await commonsResponse.json();
      const pages = commonsData.query?.pages || {};

      for (const page of Object.values(pages) as any[]) {
        const url = page.imageinfo?.[0]?.thumburl;
        if (url && !url.includes('.svg')) {
          result.images.push(url);
        }
      }
      result.images = result.images.slice(0, 6);
    }
  } catch {
    // Keep default empty result
  }

  speciesCache[scientificName] = result;
  return result;
}

interface TreePanelProps {
  treeId: number | null;
  onClose: () => void;
  treesData: Record<string, TreeData> | null;
}

const ESTADO_LABELS: Record<number, string> = {
  1: 'Muy bueno',
  2: 'Bueno',
  3: 'Regular',
  4: 'Malo',
  5: 'Seco',
  6: 'Cepa',
  7: 'Tocón',
};

const ESTADO_COLORS: Record<number, string> = {
  1: 'bg-green-500',
  2: 'bg-green-400',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
  6: 'bg-gray-500',
  7: 'bg-gray-700',
};

export default function TreePanel({ treeId, onClose, treesData }: TreePanelProps) {
  const [tree, setTree] = useState<TreeData | null>(null);
  const [speciesInfo, setSpeciesInfo] = useState<SpeciesInfo>({ images: [], description: null, wikipediaUrl: null });
  const [infoLoading, setInfoLoading] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (treeId && treesData) {
      setTree(treesData[treeId.toString()] || null);
    } else {
      setTree(null);
    }
  }, [treeId, treesData]);

  // Fetch species info
  useEffect(() => {
    const scientificName = tree?.nombre_cientifico;
    const commonName = tree?.nombre_comun;

    // Skip if no name or if it's a placeholder name
    const shouldSkip = !scientificName ||
      SKIP_SPECIES_SEARCH.includes(scientificName) ||
      SKIP_SPECIES_SEARCH.includes(commonName || '');

    if (shouldSkip) {
      setSpeciesInfo({ images: [], description: null, wikipediaUrl: null });
      return;
    }

    setInfoLoading(true);
    setCarouselIndex(0);
    fetchSpeciesInfo(scientificName).then((info) => {
      setSpeciesInfo(info);
      setInfoLoading(false);
    });
  }, [tree?.nombre_cientifico, tree?.nombre_comun]);

  const nextImage = () => {
    setCarouselIndex((i) => (i + 1) % speciesInfo.images.length);
  };

  const prevImage = () => {
    setCarouselIndex((i) => (i - 1 + speciesInfo.images.length) % speciesInfo.images.length);
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!carouselOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCarouselOpen(false);
      if (e.key === 'ArrowRight') {
        setCarouselIndex((i) => (i + 1) % speciesInfo.images.length);
      }
      if (e.key === 'ArrowLeft') {
        setCarouselIndex((i) => (i - 1 + speciesInfo.images.length) % speciesInfo.images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carouselOpen, speciesInfo.images.length]);

  if (!treeId || !tree) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 w-96 h-full bg-gray-900 border-l border-gray-700 shadow-xl overflow-auto z-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">
              {tree.nombre_comun || 'Árbol'}
            </h2>
            {tree.nombre_cientifico && (
              <p className="text-gray-400 italic text-sm">{tree.nombre_cientifico}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dead tree indicator */}
      {(tree.nombre_cientifico === 'Ejemplar seco' || tree.nombre_comun === 'Ejemplar seco') && (
        <div className="h-32 bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-gray-500 text-sm mt-2">Ejemplar seco</p>
          </div>
        </div>
      )}

      {/* Species Image */}
      {(speciesInfo.images.length > 0 || infoLoading) && (
        <div
          className="relative h-48 bg-gray-800 cursor-pointer group"
          onClick={() => speciesInfo.images.length > 0 && setCarouselOpen(true)}
        >
          {infoLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 text-sm">Cargando...</div>
            </div>
          ) : speciesInfo.images[0] ? (
            <>
              <img
                src={speciesInfo.images[0]}
                alt={tree?.nombre_cientifico || 'Árbol'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                  Ver {speciesInfo.images.length} fotos
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Species Description */}
      {speciesInfo.description && (
        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
            {speciesInfo.description}
          </p>
          {speciesInfo.wikipediaUrl && (
            <a
              href={speciesInfo.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-sm mt-2"
            >
              Leer más en Wikipedia
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Carousel Modal */}
      {carouselOpen && speciesInfo.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setCarouselOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setCarouselOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous button */}
          {speciesInfo.images.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-[80vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={speciesInfo.images[carouselIndex]}
              alt={`${tree?.nombre_cientifico} - ${carouselIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="text-center mt-4">
              <p className="text-white/70 text-sm">
                {carouselIndex + 1} / {speciesInfo.images.length}
              </p>
              <p className="text-white/50 text-xs mt-1">
                {tree?.nombre_cientifico}
              </p>
            </div>
          </div>

          {/* Next button */}
          {speciesInfo.images.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Dots */}
          {speciesInfo.images.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
              {speciesInfo.images.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === carouselIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Estado */}
        {tree.estado && (
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Estado vegetativo</h3>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${ESTADO_COLORS[tree.estado] || 'bg-gray-500'}`} />
              <span className="text-white">{ESTADO_LABELS[tree.estado] || 'Desconocido'}</span>
            </div>
          </div>
        )}

        {/* Ubicación */}
        {(tree.calle || tree.ccz) && (
          <div>
            <h3 className="text-gray-400 text-sm mb-2">Ubicación</h3>
            <div className="text-white">
              {tree.calle && (
                <p>
                  {tree.calle}
                  {tree.numero && ` ${tree.numero}`}
                </p>
              )}
              {tree.ccz && <p className="text-gray-400 text-sm">CCZ {tree.ccz}</p>}
            </div>
          </div>
        )}

        {/* Características */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Características</h3>
          <div className="grid grid-cols-3 gap-4">
            {tree.altura && (
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{tree.altura}</p>
                <p className="text-gray-400 text-xs">Altura (m)</p>
              </div>
            )}
            {tree.cap && (
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{tree.cap}</p>
                <p className="text-gray-400 text-xs">CAP (cm)</p>
              </div>
            )}
            {tree.diametro_copa && (
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{tree.diametro_copa}</p>
                <p className="text-gray-400 text-xs">Copa (m)</p>
              </div>
            )}
          </div>
        </div>

        {/* Coordenadas */}
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Coordenadas</h3>
          <p className="text-white font-mono text-sm">
            {tree.lat.toFixed(6)}, {tree.lng.toFixed(6)}
          </p>
        </div>

        {/* ID */}
        <div className="text-gray-500 text-xs">
          ID: {treeId}
        </div>
      </div>
    </div>
  );
}
