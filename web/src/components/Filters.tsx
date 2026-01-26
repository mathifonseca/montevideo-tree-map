'use client';

import { useState, useEffect } from 'react';

// Colors for legend (must match Map.tsx)
const SPECIES_COLORS: [string, string][] = [
  ['Paraiso', '#f59e0b'],
  ['Fresno americano', '#3b82f6'],
  ['Platano', '#8b5cf6'],
  ['Tipa', '#ec4899'],
  ['Arce negundo', '#ef4444'],
  ['Fresno europeo', '#06b6d4'],
  ['Laurel rosa', '#f43f5e'],
  ['Anacahuita', '#84cc16'],
  ['Jacaranda', '#a855f7'],
  ['Olmo procera', '#14b8a6'],
];

interface FiltersProps {
  species: string[];
  selectedSpecies: string | null;
  onSpeciesChange: (species: string | null) => void;
}

export default function Filters({ species, selectedSpecies, onSpeciesChange }: FiltersProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredSpecies = species.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-72">
        {/* Header */}
        <div className="p-3 border-b border-gray-700">
          <h2 className="text-white font-semibold text-sm">Arbolado urbano de Montevideo</h2>
          <p className="text-gray-400 text-xs">234,464 árboles en veredas</p>
        </div>

        {/* Species filter */}
        <div className="p-3">
          <label className="text-gray-400 text-xs block mb-2">Filtrar por especie</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar especie..."
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {isOpen && search && (
            <div className="absolute left-3 right-3 mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-60 overflow-auto shadow-xl">
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
                <p className="px-3 py-2 text-sm text-gray-400">No se encontraron especies</p>
              )}
              {filteredSpecies.length > 20 && (
                <p className="px-3 py-2 text-xs text-gray-500">
                  +{filteredSpecies.length - 20} más...
                </p>
              )}
            </div>
          )}

          {/* Selected species badge */}
          {selectedSpecies && (
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                {selectedSpecies}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-700">
          <p className="text-gray-400 text-xs mb-2">Especies más comunes</p>
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
                <span className="text-gray-300 text-xs truncate">{name}</span>
              </button>
            ))}
            <div className="flex items-center gap-2 px-1 py-0.5">
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-green-400" />
              <span className="text-gray-500 text-xs">Otras especies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
