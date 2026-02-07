'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

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

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  speciesCounts: Record<string, number> | null;
  treesData: Record<string, TreeData> | null;
}

const TOTAL_TREES = 234464;

const ESTADO_COLORS: Record<number, string> = {
  1: 'bg-green-500',
  2: 'bg-green-400',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
  6: 'bg-gray-500',
  7: 'bg-gray-700',
};

export default function StatsModal({ isOpen, onClose, speciesCounts, treesData }: StatsModalProps) {
  const t = useTranslations();

  // Calculate all statistics
  const stats = useMemo(() => {
    if (!treesData) return null;

    const trees = Object.values(treesData);

    // Estado vegetativo distribution
    const estadoCounts: Record<number, number> = {};
    let totalEstado = 0;

    // CCZ distribution
    const cczCounts: Record<number, number> = {};

    // Street counts
    const streetCounts: Record<string, number> = {};

    // Height distribution
    const heightRanges: Record<string, number> = {
      '0-5m': 0,
      '5-10m': 0,
      '10-15m': 0,
      '15-20m': 0,
      '20+m': 0,
    };

    // Averages
    let totalAltura = 0, countAltura = 0;
    let totalCap = 0, countCap = 0;
    let totalCopa = 0, countCopa = 0;

    for (const tree of trees) {
      // Estado
      if (tree.estado && tree.estado >= 1 && tree.estado <= 7) {
        estadoCounts[tree.estado] = (estadoCounts[tree.estado] || 0) + 1;
        totalEstado++;
      }

      // CCZ
      if (tree.ccz && tree.ccz >= 1 && tree.ccz <= 18) {
        cczCounts[tree.ccz] = (cczCounts[tree.ccz] || 0) + 1;
      }

      // Streets
      if (tree.calle) {
        const street = tree.calle.trim();
        if (street) {
          streetCounts[street] = (streetCounts[street] || 0) + 1;
        }
      }

      // Height
      if (tree.altura && tree.altura > 0) {
        totalAltura += tree.altura;
        countAltura++;
        if (tree.altura < 5) heightRanges['0-5m']++;
        else if (tree.altura < 10) heightRanges['5-10m']++;
        else if (tree.altura < 15) heightRanges['10-15m']++;
        else if (tree.altura < 20) heightRanges['15-20m']++;
        else heightRanges['20+m']++;
      }

      // CAP
      if (tree.cap && tree.cap > 0) {
        totalCap += tree.cap;
        countCap++;
      }

      // Copa
      if (tree.diametro_copa && tree.diametro_copa > 0) {
        totalCopa += tree.diametro_copa;
        countCopa++;
      }
    }

    return {
      estado: Object.entries(estadoCounts)
        .map(([estado, count]) => ({ estado: parseInt(estado), count, pct: (count / totalEstado) * 100 }))
        .sort((a, b) => a.estado - b.estado),
      ccz: Object.entries(cczCounts)
        .map(([ccz, count]) => ({ ccz: parseInt(ccz), count }))
        .sort((a, b) => b.count - a.count),
      topStreets: Object.entries(streetCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      heightRanges: Object.entries(heightRanges),
      avgAltura: countAltura > 0 ? (totalAltura / countAltura).toFixed(1) : '-',
      avgCap: countCap > 0 ? (totalCap / countCap).toFixed(0) : '-',
      avgCopa: countCopa > 0 ? (totalCopa / countCopa).toFixed(1) : '-',
    };
  }, [treesData]);

  const topSpecies = speciesCounts
    ? Object.entries(speciesCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  const maxCount = topSpecies.length > 0 ? topSpecies[0][1] : 1;
  const totalSpecies = speciesCounts ? Object.keys(speciesCounts).length : 0;
  const maxCczCount = stats?.ccz[0]?.count || 1;
  const maxStreetCount = stats?.topStreets[0]?.[1] || 1;
  const maxHeightCount = stats ? Math.max(...stats.heightRanges.map(([, c]) => c)) : 1;

  // Get translated species name
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-gray-900 rounded-lg shadow-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">{t('statsModal.title')}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { value: TOTAL_TREES.toLocaleString('es-UY'), label: t('statsModal.trees') },
                  { value: totalSpecies, label: t('statsModal.species') },
                  { value: 18, label: t('statsModal.zones') },
                  { value: `${stats?.avgAltura || '-'}m`, label: t('statsModal.avgHeight') },
                  { value: `${stats?.avgCap || '-'}cm`, label: t('statsModal.avgCap'), tooltip: t('statsModal.avgCapTooltip') },
                  { value: `${stats?.avgCopa || '-'}m`, label: t('statsModal.avgCrown') },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="bg-gray-800 rounded-lg p-3 text-center"
                  >
                    <p className="text-2xl font-bold text-green-400">{stat.value}</p>
                    <p
                      className={`text-gray-400 text-xs ${stat.tooltip ? 'cursor-help underline decoration-dotted' : ''}`}
                      title={stat.tooltip}
                    >
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Two column layout for charts */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Species */}
                <div>
                  <h3 className="text-white font-semibold mb-3">{t('statsModal.mostCommonSpecies')}</h3>
                  <div className="space-y-2">
                    {topSpecies.map(([species, count], i) => (
                      <motion.div
                        key={species}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.03, duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-24 text-gray-300 text-xs truncate" title={getTranslatedSpeciesName(species)}>
                          {getTranslatedSpeciesName(species)}
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxCount) * 100}%` }}
                            transition={{ delay: 0.4 + i * 0.03, duration: 0.5, ease: 'easeOut' }}
                            className="bg-green-500 h-full rounded-full"
                          />
                        </div>
                        <div className="w-14 text-right text-gray-400 text-xs">
                          {count.toLocaleString('es-UY')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Estado Vegetativo */}
                <div>
                  <h3 className="text-white font-semibold mb-3">{t('statsModal.vegetativeState')}</h3>
                  <div className="space-y-2">
                    {stats?.estado.map(({ estado, count, pct }, i) => (
                      <motion.div
                        key={estado}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.03, duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-20 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ESTADO_COLORS[estado] || 'bg-gray-500'}`} />
                          <span className="text-gray-300 text-xs">{t(`vegetativeState.${estado}`)}</span>
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.4 + i * 0.03, duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${ESTADO_COLORS[estado] || 'bg-gray-500'}`}
                          />
                        </div>
                        <div className="w-12 text-right text-gray-400 text-xs">
                          {pct.toFixed(1)}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Trees by CCZ */}
                <div>
                  <h3 className="text-white font-semibold mb-3">{t('statsModal.treesByZone')}</h3>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {stats?.ccz.map(({ ccz, count }, i) => (
                      <motion.div
                        key={ccz}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.02, duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-12 text-gray-300 text-xs">
                          CCZ {ccz}
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxCczCount) * 100}%` }}
                            transition={{ delay: 0.4 + i * 0.02, duration: 0.5, ease: 'easeOut' }}
                            className="bg-blue-500 h-full rounded-full"
                          />
                        </div>
                        <div className="w-14 text-right text-gray-400 text-xs">
                          {count.toLocaleString('es-UY')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Height Distribution */}
                <div>
                  <h3 className="text-white font-semibold mb-3">{t('statsModal.heightDistribution')}</h3>
                  <div className="space-y-2">
                    {stats?.heightRanges.map(([range, count], i) => (
                      <motion.div
                        key={range}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.03, duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-14 text-gray-300 text-xs">
                          {range}
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxHeightCount) * 100}%` }}
                            transition={{ delay: 0.4 + i * 0.03, duration: 0.5, ease: 'easeOut' }}
                            className="bg-purple-500 h-full rounded-full"
                          />
                        </div>
                        <div className="w-14 text-right text-gray-400 text-xs">
                          {count.toLocaleString('es-UY')}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Streets - Full width */}
              <div>
                <h3 className="text-white font-semibold mb-3">{t('statsModal.streetsWithMostTrees')}</h3>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                  {stats?.topStreets.map(([street, count], i) => (
                    <motion.div
                      key={street}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.03, duration: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-6 text-gray-500 text-xs">
                        {i + 1}.
                      </div>
                      <div className="flex-1 text-gray-300 text-sm truncate" title={street}>
                        {street}
                      </div>
                      <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden max-w-24">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxStreetCount) * 100}%` }}
                          transition={{ delay: 0.4 + i * 0.03, duration: 0.5, ease: 'easeOut' }}
                          className="bg-amber-500 h-full rounded-full"
                        />
                      </div>
                      <div className="w-12 text-right text-gray-400 text-xs">
                        {count.toLocaleString('es-UY')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Data source */}
              <div className="text-gray-500 text-xs text-center pt-4 border-t border-gray-700">
                {t('statsModal.dataSource')}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
