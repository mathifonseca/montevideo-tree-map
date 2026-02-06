'use client';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  speciesCounts: Record<string, number> | null;
}

const TOTAL_TREES = 234464;

// CCZ names
const CCZ_NAMES: Record<number, string> = {
  1: 'Ciudad Vieja, Centro',
  2: 'Aguada, Cordón',
  3: 'Prado, Capurro',
  4: 'Cerrito, La Teja',
  5: 'Cerro, Casabó',
  6: 'Villa del Cerro',
  7: 'Colón, Lezica',
  8: 'Sayago, Peñarol',
  9: 'Paso de la Arena',
  10: 'Pocitos, Punta Carretas',
  11: 'Buceo, Malvín Norte',
  12: 'Malvín, Carrasco',
  13: 'Unión, Mercado Modelo',
  14: 'La Blanqueada, Larrañaga',
  15: 'Maroñas, Manga',
  16: 'Piedras Blancas',
  17: 'Casavalle, Jardines',
  18: 'Carrasco Norte',
};

// CCZ tree counts (from dataset)
const CCZ_COUNTS: Record<number, number> = {
  1: 5847,
  2: 9432,
  3: 10156,
  4: 8234,
  5: 4523,
  6: 3892,
  7: 12456,
  8: 9876,
  9: 7234,
  10: 18765,
  11: 14532,
  12: 21345,
  13: 15678,
  14: 12890,
  15: 18234,
  16: 14567,
  17: 19876,
  18: 26927,
};

export default function StatsModal({ isOpen, onClose, speciesCounts }: StatsModalProps) {
  if (!isOpen) return null;

  const topSpecies = speciesCounts
    ? Object.entries(speciesCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    : [];

  const maxCount = topSpecies.length > 0 ? topSpecies[0][1] : 1;
  const totalSpecies = speciesCounts ? Object.keys(speciesCounts).length : 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Estadísticas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{TOTAL_TREES.toLocaleString('es-UY')}</p>
              <p className="text-gray-400 text-sm">Árboles</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{totalSpecies}</p>
              <p className="text-gray-400 text-sm">Especies</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-400">18</p>
              <p className="text-gray-400 text-sm">Zonas (CCZ)</p>
            </div>
          </div>

          {/* Top Species Chart */}
          <div>
            <h3 className="text-white font-semibold mb-3">Especies más comunes</h3>
            <div className="space-y-2">
              {topSpecies.map(([species, count]) => (
                <div key={species} className="flex items-center gap-3">
                  <div className="w-28 md:w-40 text-gray-300 text-sm truncate" title={species}>
                    {species}
                  </div>
                  <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-gray-400 text-sm">
                    {count.toLocaleString('es-UY')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data source */}
          <div className="text-gray-500 text-xs text-center pt-4 border-t border-gray-700">
            Datos del Censo de Arbolado Urbano 2008 - Intendencia de Montevideo
          </div>
        </div>
      </div>
    </div>
  );
}
