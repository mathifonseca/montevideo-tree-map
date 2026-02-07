'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface ReportModalProps {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  species: string[];
}

const FORMSPREE_URL = 'https://formspree.io/f/mbdodqbo';

export default function ReportModal({ coords, onClose, species }: ReportModalProps) {
  const t = useTranslations();
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (coords) {
      setSelectedSpecies('');
      setNotes('');
      setSearch('');
      setSent(false);
      setError(false);
    }
  }, [coords]);

  const filteredSpecies = species.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!coords) return;

    setSending(true);
    setError(false);

    const speciesName = selectedSpecies || search || t('common.unknown');
    const mapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordenadas: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
          especie: speciesName,
          notas: notes || '(sin notas)',
          mapa: mapsUrl,
        }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {coords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-full max-w-md"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-white font-semibold">{t('reportModal.title')}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <p className="text-white text-lg mb-2">{t('reportModal.success')}</p>
                  <p className="text-gray-400 text-sm mb-4">{t('reportModal.thankYou')}</p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  >
                    {t('common.close')}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-4 space-y-4"
                >
                  {/* Coordinates */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">{t('reportModal.location')}</label>
                    <p className="text-white font-mono text-sm bg-gray-800 rounded px-3 py-2">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                  </div>

                  {/* Species */}
                  <div className="relative">
                    <label className="text-gray-400 text-xs block mb-1">{t('reportModal.species')}</label>
                    <input
                      type="text"
                      placeholder={t('reportModal.speciesPlaceholder')}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none transition-colors"
                    />
                    <AnimatePresence>
                      {showDropdown && search && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-auto z-10"
                        >
                          {filteredSpecies.slice(0, 10).map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setSelectedSpecies(s);
                                setSearch(s);
                                setShowDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">{t('reportModal.notes')}</label>
                    <textarea
                      placeholder={t('reportModal.notesPlaceholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-sm"
                      >
                        {t('common.error')}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {sending ? (
                      t('common.sending')
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {t('reportModal.submit')}
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
