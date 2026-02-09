'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Colors for legend (must match Map.tsx)
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
];

interface FiltersProps {
  species: string[];
  selectedSpecies: string | null;
  onSpeciesChange: (species: string | null) => void;
  speciesCounts?: Record<string, number>;
  selectedCCZ: number | null;
  onCCZChange: (ccz: number | null) => void;
  onLocationSelect?: (lng: number, lat: number) => void;
}

const TOTAL_TREES = 234464;

interface GeocodingResult {
  place_name: string;
  center: [number, number];
}

export default function Filters({ species, selectedSpecies, onSpeciesChange, speciesCounts, selectedCCZ, onCCZChange, onLocationSelect }: FiltersProps) {
  const t = useTranslations();
  const isOnline = useOnlineStatus();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');
  const [addressResults, setAddressResults] = useState<GeocodingResult[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);

  // Debounced address search
  useEffect(() => {
    if (!addressSearch || addressSearch.length < 3) {
      setAddressResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAddressLoading(true);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addressSearch)}.json?access_token=${token}&country=uy&bbox=-56.45,-35.0,-55.85,-34.7&limit=5`
        );
        const data = await response.json();
        setAddressResults(data.features || []);
      } catch {
        setAddressResults([]);
      }
      setAddressLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [addressSearch]);

  const filteredSpecies = species.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = selectedSpecies && speciesCounts ? speciesCounts[selectedSpecies] : null;
  const displayCount = selectedCount
    ? t('header.filteredCount', { filtered: selectedCount.toLocaleString('es-UY'), total: TOTAL_TREES.toLocaleString('es-UY') })
    : t('header.treeCount', { count: TOTAL_TREES.toLocaleString('es-UY') });

  // Get translated species name for legend
  const getTranslatedSpeciesName = (name: string) => {
    try {
      const translated = t.raw(`species.${name}`) as string | undefined;
      if (translated && !translated.startsWith('species.')) {
        return translated;
      }
    } catch {
      // Translation doesn't exist
    }
    return name;
  };

  return (
    <div className="absolute top-4 left-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-52 md:w-72">
        {/* Header */}
        <div
          className="p-3 border-b border-gray-200 dark:border-gray-700 md:cursor-default cursor-pointer flex justify-between items-center"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="w-8 h-8 md:w-10 md:h-10" />
            <div>
              <h2 className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm">{t('header.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs">{displayCount}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 md:hidden transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Collapsible content - always visible on desktop, toggle on mobile */}
        <div className={`${expanded ? 'block' : 'hidden'} md:block`}>
          {/* Address search - hidden when offline */}
          {onLocationSelect && isOnline && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <label className="text-gray-500 dark:text-gray-400 text-xs block mb-2">{t('filters.searchAddress')}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('filters.addressPlaceholder')}
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 focus:border-green-500 focus:outline-none"
                />
                {addressLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
              <AnimatePresence>
                {addressResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="mt-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-auto shadow-xl"
                  >
                    {addressResults.map((result, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onLocationSelect(result.center[0], result.center[1]);
                          setAddressSearch('');
                          setAddressResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        {result.place_name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Species filter */}
          <div className="p-3">
          <label className="text-gray-500 dark:text-gray-400 text-xs block mb-2">{t('filters.filterBySpecies')}</label>
          <div className="relative">
            <input
              type="text"
              placeholder={t('filters.speciesPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none"
            />

            {selectedSpecies && (
              <button
                onClick={() => {
                  onSpeciesChange(null);
                  setSearch('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && search && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute left-3 right-3 mt-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-60 overflow-auto shadow-xl z-10"
              >
                {filteredSpecies.slice(0, 20).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onSpeciesChange(s);
                      setSearch(s);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    {s}
                  </button>
                ))}
                {filteredSpecies.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{t('common.noResults')}</p>
                )}
                {filteredSpecies.length > 20 && (
                  <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                    +{filteredSpecies.length - 20} {t('common.more')}...
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected species badge */}
          <AnimatePresence>
            {selectedSpecies && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="mt-2 flex items-center gap-2"
              >
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                  {selectedSpecies}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CCZ filter */}
          <div className="mt-3">
            <label className="text-gray-500 dark:text-gray-400 text-xs block mb-2">{t('filters.filterByZone')}</label>
            <select
              value={selectedCCZ ?? ''}
              onChange={(e) => onCCZChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none"
            >
              <option value="">{t('filters.allZones')}</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((ccz) => (
                <option key={ccz} value={ccz}>
                  CCZ {ccz}
                </option>
              ))}
            </select>
            {selectedCCZ && (
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 truncate" title={t(`ccz.${selectedCCZ}`)}>
                {t(`ccz.${selectedCCZ}`)}
              </p>
            )}
          </div>
        </div>

          {/* Legend - always visible on desktop */}
          <div className="hidden md:block p-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{t('filters.mostCommonSpecies')}</p>
            <div className="space-y-1">
              {SPECIES_COLORS.map(([name, color]) => (
                <button
                  key={name}
                  onClick={() => onSpeciesChange(name)}
                  className="flex items-center gap-2 w-full hover:bg-gray-800 rounded px-1 py-0.5 -mx-1"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-600 dark:text-gray-300 text-xs truncate">{getTranslatedSpeciesName(name)}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 px-1 py-0.5">
                <span className="w-3 h-3 rounded-full flex-shrink-0 bg-green-400" />
                <span className="text-gray-400 dark:text-gray-500 text-xs">{t('common.otherSpecies')}</span>
              </div>
            </div>
          </div>

          {/* Legend toggle - mobile only */}
          <div className="md:hidden p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setLegendOpen(!legendOpen)}
              className="flex items-center justify-between w-full text-gray-500 dark:text-gray-400 text-xs"
            >
              <span>{t('filters.mostCommonSpecies')}</span>
              <svg
                className={`w-4 h-4 transition-transform ${legendOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {legendOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 mt-2">
                    {SPECIES_COLORS.map(([name, color]) => (
                      <button
                        key={name}
                        onClick={() => onSpeciesChange(name)}
                        className="flex items-center gap-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 -mx-1"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-gray-600 dark:text-gray-300 text-xs truncate">{getTranslatedSpeciesName(name)}</span>
                      </button>
                    ))}
                    <div className="flex items-center gap-2 px-1 py-0.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0 bg-green-400" />
                      <span className="text-gray-400 dark:text-gray-500 text-xs">{t('common.otherSpecies')}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
