'use client';

import { useState, useEffect } from 'react';

interface ReportModalProps {
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  species: string[];
}

const FORMSPREE_URL = 'https://formspree.io/f/mbdodqbo';

export default function ReportModal({ coords, onClose, species }: ReportModalProps) {
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

  if (!coords) return null;

  const filteredSpecies = species.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    setSending(true);
    setError(false);

    const speciesName = selectedSpecies || search || 'Desconocida';
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Reportar árbol</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-lg mb-2">Reporte enviado</p>
            <p className="text-gray-400 text-sm mb-4">Gracias por contribuir al mapa.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Coordinates */}
            <div>
              <label className="text-gray-400 text-xs block mb-1">Ubicación</label>
              <p className="text-white font-mono text-sm bg-gray-800 rounded px-3 py-2">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            </div>

            {/* Species */}
            <div className="relative">
              <label className="text-gray-400 text-xs block mb-1">Especie (opcional)</label>
              <input
                type="text"
                placeholder="Buscar o escribir especie..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none"
              />
              {showDropdown && search && (
                <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-auto z-10">
                  {filteredSpecies.slice(0, 10).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedSpecies(s);
                        setSearch(s);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-gray-400 text-xs block mb-1">Notas (opcional)</label>
              <textarea
                placeholder="Ej: En el Parque Rodó, cerca de la fuente..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">Error al enviar. Intentá de nuevo.</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar reporte
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
