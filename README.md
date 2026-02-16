# Montevideo Urban Trees

Interactive map to explore the **234,464 trees** lining the sidewalks of Montevideo, Uruguay.

🌳 **[View the map](https://montevideo-tree-map.vercel.app)**

![Trees](https://img.shields.io/badge/trees-234,464-green) ![Species](https://img.shields.io/badge/species-359-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Mapbox](https://img.shields.io/badge/Mapbox-GL-blue)

## Features

- 🗺️ **Interactive map** with all trees colored by species
- 🌲 **Info panel** with tree details (species, height, condition, location)
- 📷 **Species photos** from Wikipedia with carousel
- 🔍 **Filter by species** with search and dynamic count
- 🏘️ **Filter by zone** (18 CCZ municipal zones)
- 📍 **Address search** using Mapbox Geocoding
- 📊 **Statistics modal** with top species chart
- 🔗 **Share tree** via URL deep linking
- 📍 **Geolocation** to center the map on your location
- 📝 **Report missing tree** to contribute to the map
- 🌙 **Dark/Light mode** with dynamic map basemap
- 🌐 **Internationalization** (Spanish/English)
- 🌸 **Species details** - blooming calendar, height ranges, flower colors, growth rates
- 🌿 **Native/introduced badges** with species origin info
- 📶 **Offline support** with service worker caching
- 📱 **Responsive** - works on mobile and desktop

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | [Next.js 16](https://nextjs.org/) |
| Map | [MapLibre GL JS](https://maplibre.org/) + [PMTiles](https://github.com/protomaps/PMTiles) |
| Styles | [Tailwind CSS](https://tailwindcss.com/) |
| Theme | [next-themes](https://github.com/pacocoursey/next-themes) |
| i18n | [next-intl](https://next-intl-docs.vercel.app/) |
| Forms | [Formspree](https://formspree.io/) |
| Images | Wikipedia / Wikimedia Commons API |
| Testing | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + [MSW](https://mswjs.io/) |
| CI/CD | [GitHub Actions](https://github.com/features/actions) |
| Deploy | [Vercel](https://vercel.com/) |

## Project Structure

```
arbolesmvd/
├── .github/workflows/    # CI/CD (tests + build)
├── data/                 # Raw and processed data
│   ├── raw/              # Census CSVs, WFS GeoJSON
│   └── processed/        # Unified dataset with coordinates
├── scripts/              # Python processing scripts
│   ├── merge_datasets.py
│   ├── geocode_final.py
│   ├── clean_common_names.py  # Species name normalization
│   └── generate_geojson.py    # Web data generation
└── web/                  # Next.js application
    ├── src/
    │   ├── app/          # Pages (App Router)
    │   └── components/   # Map, TreePanel, Filters, StatsModal, etc.
    └── public/           # Tree data (PMTiles + gzipped JSON)
```

## Development

```bash
cd web
npm install
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_token" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Testing

```bash
cd web
npm test               # Watch mode
npm run test:run       # Single run (CI)
npm run test:coverage  # Coverage report
```

## Data Processing

The raw census data was cleaned and normalized:
- **100% species coverage** - all 234,464 trees have common names assigned
- **359 unique species** - duplicates and variants unified
- **566 scientific name corrections** - fixed typos (Bahuinia→Bauhinia, etc.)
- **2,553 data entry fixes** - corrected mismatched species names
- **Vector tiles** - PMTiles format (17MB, all points at all zoom levels)
- **Gzip compression** - trees-data.json.gz (4.1MB vs 54MB)

Run the data pipeline:
```bash
python scripts/clean_common_names.py  # Clean species names
python scripts/generate_geojson.py    # Generate web files
tippecanoe -o web/public/trees.pmtiles --force --layer=trees \
  --minimum-zoom=10 --maximum-zoom=16 \
  --no-feature-limit --no-tile-size-limit -r1 web/public/trees.json
gzip -k -9 web/public/trees-data.json  # Compress data
```

## Data Sources

- [Tree Census 2008](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008) - Montevideo City Government
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy) - Geographic layers

## Inspiration

Based on [Gieß den Kiez](https://giessdenkiez.de), a Berlin project that maps urban trees.

## Author

Created by [Mathi Fonseca](https://mathifonseca.me)

---

*Data comes from the 2008 municipal census. Some locations may have changed.*
