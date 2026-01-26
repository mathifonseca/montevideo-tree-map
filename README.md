# Arbolado Urbano de Montevideo

Mapa interactivo para explorar los **234,464 árboles** que adornan las veredas de Montevideo, Uruguay.

🌳 **[Ver el mapa](https://montevideo-tree-map.vercel.app)**

![Mapa de árboles de Montevideo](https://img.shields.io/badge/árboles-234,464-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Mapbox](https://img.shields.io/badge/Mapbox-GL-blue)

## Funcionalidades

- 🗺️ **Mapa interactivo** con todos los árboles coloreados por especie
- 🌲 **Panel de información** con datos de cada árbol (especie, altura, estado, ubicación)
- 📷 **Fotos de especies** desde Wikipedia con carrusel
- 🔍 **Filtro por especie** con búsqueda y leyenda de colores
- 📍 **Geolocalización** para centrar el mapa en tu ubicación
- 📝 **Reportar árbol faltante** para contribuir al mapa
- 📱 **Responsive** - funciona en móvil y desktop

## Stack Técnico

| Componente | Tecnología |
|------------|------------|
| Framework | [Next.js 16](https://nextjs.org/) |
| Mapa | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) |
| Formularios | [Formspree](https://formspree.io/) |
| Imágenes | Wikipedia / Wikimedia Commons API |
| Deploy | [Vercel](https://vercel.com/) |

## Estructura del proyecto

```
arbolesmvd/
├── data/                 # Datos crudos y procesados
│   ├── raw/              # CSVs del censo, GeoJSON del WFS
│   └── processed/        # Dataset unificado con coordenadas
├── scripts/              # Scripts Python para procesamiento
│   ├── merge_datasets.py
│   ├── geocode_final.py
│   └── ...
└── web/                  # Aplicación Next.js
    ├── src/
    │   ├── app/          # Pages (App Router)
    │   └── components/   # Map, TreePanel, Filters, etc.
    └── public/           # GeoJSON de árboles
```

## Desarrollo

```bash
cd web
npm install
echo "NEXT_PUBLIC_MAPBOX_TOKEN=tu_token" > .env.local
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Fuentes de datos

- [Censo de arbolado 2008](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008) - Intendencia de Montevideo
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy) - Capas geográficas

## Inspiración

Basado en [Gieß den Kiez](https://giessdenkiez.de), un proyecto de Berlín que mapea árboles urbanos.

## Autor

Creado por [Mathi Fonseca](https://mathifonseca.me)

---

*Los datos provienen del censo municipal de 2008. Algunas ubicaciones pueden haber cambiado.*
