'use client';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">Sobre este proyecto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* What */}
          <div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Un mapa interactivo para explorar los <strong className="text-white">234,464 árboles</strong> que
              adornan las veredas de Montevideo. Podés buscar por especie, ver información
              de cada árbol, y reportar árboles que falten en el mapa.
            </p>
          </div>

          {/* Inspiration */}
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Inspiración</h3>
            <p className="text-gray-300 text-sm">
              Basado en{' '}
              <a
                href="https://giessdenkiez.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline"
              >
                Gieß den Kiez
              </a>
              , un proyecto de Berlín que mapea árboles urbanos.
            </p>
          </div>

          {/* Data sources */}
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-2">Fuentes de datos</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>
                <a
                  href="https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  Censo de arbolado 2008
                </a>
                {' '}- Intendencia de Montevideo
              </li>
              <li>
                <a
                  href="https://geoweb.montevideo.gub.uy/geonetwork/srv/spa/catalog.search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 underline"
                >
                  GeoWeb Montevideo
                </a>
                {' '}- Capas geográficas
              </li>
            </ul>
          </div>

          {/* Author */}
          <div className="pt-2 border-t border-gray-700">
            <p className="text-gray-300 text-sm">
              Creado por{' '}
              <a
                href="https://mathifonseca.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 underline"
              >
                Mathi Fonseca
              </a>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Abierto a ideas, sugerencias y colaboraciones.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
