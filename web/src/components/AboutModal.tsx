'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const t = useTranslations('aboutModal');
  const tCommon = useTranslations('common');

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
            className="absolute inset-0 bg-black/30 dark:bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-lg"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-gray-900 dark:text-white font-semibold">{t('title')}</h2>
              <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* What */}
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {t.rich('description', {
                    strong: (chunks) => <strong className="font-semibold">{chunks}</strong>,
                  })}
                </p>
              </div>

              {/* Inspiration */}
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">{t('inspiration')}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t.rich('inspirationText', {
                    link: (chunks) => (
                      <a
                        href="https://giessdenkiez.de"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 underline transition-colors"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              </div>

              {/* Data sources */}
              <div>
                <h3 className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide mb-2">{t('dataSources')}</h3>
                <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
                  <li>
                    <a
                      href="https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 underline transition-colors"
                    >
                      {t('census')}
                    </a>
                    {' '}- {t('censusSource')}
                  </li>
                  <li>
                    <a
                      href="https://geoweb.montevideo.gub.uy/geonetwork/srv/spa/catalog.search"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 underline transition-colors"
                    >
                      {t('geoweb')}
                    </a>
                    {' '}- {t('geowebSource')}
                  </li>
                </ul>
              </div>

              {/* Author */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {t('createdBy')}{' '}
                  <a
                    href="https://mathifonseca.me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 underline transition-colors"
                  >
                    Mathi Fonseca
                  </a>
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  {t('openToIdeas')}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {tCommon('close')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
