'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

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

async function fetchSpeciesInfo(scientificName: string, locale: string): Promise<SpeciesInfo> {
  const cacheKey = `${scientificName}_${locale}`;
  if (cacheKey in speciesCache) {
    return speciesCache[cacheKey];
  }

  const result: SpeciesInfo = { images: [], description: null, wikipediaUrl: null };
  const wikiLang = locale === 'en' ? 'en' : 'es';

  try {
    // Fetch Wikipedia summary and images in parallel
    const [wikiResponse, commonsResponse] = await Promise.all([
      fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scientificName)}`),
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

  speciesCache[cacheKey] = result;
  return result;
}

interface TreePanelProps {
  treeId: number | null;
  onClose: () => void;
  treesData: Record<string, TreeData> | null;
}

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
  const t = useTranslations();
  const locale = useLocale();
  const [tree, setTree] = useState<TreeData | null>(null);
  const [speciesInfo, setSpeciesInfo] = useState<SpeciesInfo>({ images: [], description: null, wikipediaUrl: null });
  const [infoLoading, setInfoLoading] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Get translated species name
  const getTranslatedSpeciesName = (name: string | null) => {
    if (!name) return t('common.tree');
    try {
      const translated = t.raw(`species.${name}`) as string | undefined;
      // If translation exists and doesn't look like a key path, use it
      if (translated && !translated.startsWith('species.')) {
        return translated;
      }
    } catch {
      // Translation doesn't exist
    }
    return name;
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?arbol=${treeId}`;
    const treeName = tree?.nombre_comun
      ? getTranslatedSpeciesName(tree.nombre_comun)
      : t('common.tree');
    const title = `${treeName} - ${t('header.title')}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    fetchSpeciesInfo(scientificName, locale).then((info) => {
      setSpeciesInfo(info);
      setInfoLoading(false);
    });
  }, [tree?.nombre_cientifico, tree?.nombre_comun, locale]);

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

  const isVisible = !!(treeId && tree);

  // Panel content that's shared between mobile and desktop
  const renderPanelContent = () => {
    if (!tree) return null;

    const displayName = getTranslatedSpeciesName(tree.nombre_comun);

    return (
      <>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {displayName}
              </h2>
              {tree.nombre_cientifico && (
                <p className="text-gray-500 dark:text-gray-400 italic text-sm">{tree.nombre_cientifico}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 relative"
                title={t('buttons.share')}
              >
                {copied ? (
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dead tree indicator */}
        {(tree.nombre_cientifico === 'Ejemplar seco' || tree.nombre_comun === 'Ejemplar seco') && (
          <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t('treePanel.deadTree')}</p>
            </div>
          </div>
        )}

        {/* Species Image */}
        {(speciesInfo.images.length > 0 || infoLoading) && (
          <div
            className="relative h-48 bg-gray-100 dark:bg-gray-800 cursor-pointer group"
            onClick={() => speciesInfo.images.length > 0 && setCarouselOpen(true)}
          >
            {infoLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</div>
              </div>
            ) : speciesInfo.images[0] ? (
              <>
                <img
                  src={speciesInfo.images[0]}
                  alt={tree?.nombre_cientifico || t('common.tree')}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    {t('common.viewPhotos', { count: speciesInfo.images.length })}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Species Description */}
        {speciesInfo.description && (
          <div className="px-4 py-3 bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
              {speciesInfo.description}
            </p>
            {speciesInfo.wikipediaUrl && (
              <a
                href={speciesInfo.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-sm mt-2"
              >
                {t('common.readMoreWikipedia')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Estado */}
          {tree.estado && (
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('treePanel.vegetativeState')}</h3>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${ESTADO_COLORS[tree.estado] || 'bg-gray-500'}`} />
                <span className="text-gray-900 dark:text-white">{t(`vegetativeState.${tree.estado}`) || t('common.unknown')}</span>
              </div>
            </div>
          )}

          {/* Ubicación */}
          {(tree.calle || tree.ccz) && (
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('treePanel.location')}</h3>
              <div className="text-gray-900 dark:text-white">
                {tree.calle && (
                  <p>
                    {tree.calle}
                    {tree.numero && ` ${tree.numero}`}
                  </p>
                )}
                {tree.ccz && <p className="text-gray-500 dark:text-gray-400 text-sm">CCZ {tree.ccz}</p>}
              </div>
            </div>
          )}

          {/* Características */}
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('treePanel.characteristics')}</h3>
            <div className="grid grid-cols-3 gap-4">
              {tree.altura && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-500 dark:text-green-400">{tree.altura}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{t('treePanel.height')}</p>
                </div>
              )}
              {tree.cap && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-500 dark:text-green-400">{tree.cap}</p>
                  <p
                    className="text-gray-500 dark:text-gray-400 text-xs cursor-help underline decoration-dotted"
                    title={t('treePanel.capTooltip')}
                  >
                    {t('treePanel.cap')}
                  </p>
                </div>
              )}
              {tree.diametro_copa && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-500 dark:text-green-400">{tree.diametro_copa}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{t('treePanel.crown')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Coordenadas */}
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm mb-2">{t('treePanel.coordinates')}</h3>
            <p className="text-gray-900 dark:text-white font-mono text-sm">
              {tree.lat.toFixed(6)}, {tree.lng.toFixed(6)}
            </p>
          </div>

          {/* ID */}
          <div className="text-gray-400 dark:text-gray-500 text-xs">
            {t('treePanel.id')}: {treeId}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 dark:bg-black/50 z-10 md:hidden"
              onClick={onClose}
            />

            {/* Mobile bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-0 left-0 right-0 h-[70vh] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-xl overflow-auto z-20 rounded-t-2xl md:hidden"
            >
              {renderPanelContent()}
            </motion.div>

            {/* Desktop side panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="hidden md:block absolute top-0 right-0 w-96 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-auto z-20"
            >
              {renderPanelContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Carousel Modal - separate AnimatePresence for independent animation */}
      <AnimatePresence>
        {carouselOpen && speciesInfo.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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

            {/* Image with animation */}
            <motion.div
              key={carouselIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl max-h-[80vh] px-4 md:px-16"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (touchStart === null) return;
                const diff = touchStart - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) {
                  if (diff > 0) {
                    setCarouselIndex((i) => (i + 1) % speciesInfo.images.length);
                  } else {
                    setCarouselIndex((i) => (i - 1 + speciesInfo.images.length) % speciesInfo.images.length);
                  }
                }
                setTouchStart(null);
              }}
            >
              <img
                src={speciesInfo.images[carouselIndex]}
                alt={`${tree?.nombre_cientifico} - ${carouselIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain select-none"
                draggable={false}
              />
              <div className="text-center mt-4">
                <p className="text-white/70 text-sm">
                  {carouselIndex + 1} / {speciesInfo.images.length}
                </p>
                <p className="text-white/50 text-xs mt-1">
                  {tree?.nombre_cientifico}
                </p>
              </div>
            </motion.div>

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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
