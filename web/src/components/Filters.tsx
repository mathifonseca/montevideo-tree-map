'use client';

import { useState, useEffect } from 'react';

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

const CCZ_LABELS: Record<number, string> = {
  1: 'CCZ 1 - Ciudad Vieja, Centro, Barrio Sur, Palermo, Parque Rodó',
  2: 'CCZ 2 - Aguada, Cordón, La Comercial, Tres Cruces, Brazo Oriental',
  3: 'CCZ 3 - Prado, Capurro, Bella Vista, Reducto, Atahualpa, Jacinto Vera',
  4: 'CCZ 4 - Cerrito, La Teja, Paso Molino, Belvedere',
  5: 'CCZ 5 - Cerro, Casabó, Pajas Blancas',
  6: 'CCZ 6 - Villa del Cerro, Santa Catalina, La Paloma',
  7: 'CCZ 7 - Colón, Lezica, Melilla, Nuevo París',
  8: 'CCZ 8 - Sayago, Conciliación, Peñarol',
  9: 'CCZ 9 - Arroyo Seco, Paso de la Arena, Santiago Vázquez',
  10: 'CCZ 10 - Pocitos, Punta Carretas, Parque Batlle',
  11: 'CCZ 11 - Buceo, Parque Batlle, Villa Dolores, Malvín Norte',
  12: 'CCZ 12 - Malvín, Punta Gorda, Carrasco',
  13: 'CCZ 13 - Unión, Mercado Modelo, Villa Española',
  14: 'CCZ 14 - La Blanqueada, Larrañaga, Aires Puros',
  15: 'CCZ 15 - Maroñas, Villa García, Manga',
  16: 'CCZ 16 - Piedras Blancas, Villa Española Norte',
  17: 'CCZ 17 - Casavalle, Jardines del Hipódromo, Las Acacias',
  18: 'CCZ 18 - Carrasco Norte, Barra de Carrasco, Paso Carrasco',
};

interface GeocodingResult {
  place_name: string;
  center: [number, number];
}

export default function Filters({ species, selectedSpecies, onSpeciesChange, speciesCounts, selectedCCZ, onCCZChange, onLocationSelect }: FiltersProps) {
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
    ? `${selectedCount.toLocaleString('es-UY')} de ${TOTAL_TREES.toLocaleString('es-UY')} árboles`
    : `${TOTAL_TREES.toLocaleString('es-UY')} árboles`;

  return (
    <div className="absolute top-4 left-4">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-52 md:w-72">
        {/* Header */}
        <div
          className="p-3 border-b border-gray-700 md:cursor-default cursor-pointer flex justify-between items-center"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <h2 className="text-white font-semibold text-xs md:text-sm">Arbolado urbano de Montevideo</h2>
            <p className="text-gray-400 text-xs">{displayCount}</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 md:hidden transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Collapsible content - always visible on desktop, toggle on mobile */}
        <div className={`${expanded ? 'block' : 'hidden'} md:block`}>
          {/* Address search */}
          {onLocationSelect && (
            <div className="p-3 border-b border-gray-700">
              <label className="text-gray-400 text-xs block mb-2">Buscar dirección</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: 18 de Julio 1234"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none"
                />
                {addressLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}
              </div>
              {addressResults.length > 0 && (
                <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-40 overflow-auto shadow-xl">
                  {addressResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onLocationSelect(result.center[0], result.center[1]);
                        setAddressSearch('');
                        setAddressResults([]);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      {result.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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

          {/* CCZ filter */}
          <div className="mt-3">
            <label className="text-gray-400 text-xs block mb-2">Filtrar por zona</label>
            <select
              value={selectedCCZ ?? ''}
              onChange={(e) => onCCZChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-green-500 focus:outline-none"
            >
              <option value="">Todas las zonas</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((ccz) => (
                <option key={ccz} value={ccz}>
                  CCZ {ccz}
                </option>
              ))}
            </select>
            {selectedCCZ && (
              <p className="text-gray-500 text-xs mt-1 truncate" title={CCZ_LABELS[selectedCCZ]}>
                {CCZ_LABELS[selectedCCZ]?.split(' - ')[1]}
              </p>
            )}
          </div>
        </div>

          {/* Legend - always visible on desktop */}
          <div className="hidden md:block p-3 border-t border-gray-700">
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

          {/* Legend toggle - mobile only */}
          <div className="md:hidden p-3 border-t border-gray-700">
            <button
              onClick={() => setLegendOpen(!legendOpen)}
              className="flex items-center justify-between w-full text-gray-400 text-xs"
            >
              <span>Especies más comunes</span>
              <svg
                className={`w-4 h-4 transition-transform ${legendOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {legendOpen && (
              <div className="space-y-1 mt-2">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
