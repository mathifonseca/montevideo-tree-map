# Montevideo Urban Trees

Interactive map to explore the **234,464 trees** lining the sidewalks of Montevideo, Uruguay.

🌳 **[View the map](https://montevideo-tree-map.vercel.app)**

![Trees](https://img.shields.io/badge/trees-234,464-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Mapbox](https://img.shields.io/badge/Mapbox-GL-blue)

## Features

- 🗺️ **Interactive map** with all trees colored by species
- 🌲 **Info panel** with tree details (species, height, condition, location)
- 📷 **Species photos** from Wikipedia with carousel
- 🔍 **Filter by species** with search and color legend
- 📍 **Geolocation** to center the map on your location
- 📝 **Report missing tree** to contribute to the map
- 📱 **Responsive** - works on mobile and desktop

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | [Next.js 16](https://nextjs.org/) |
| Map | [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) |
| Styles | [Tailwind CSS](https://tailwindcss.com/) |
| Forms | [Formspree](https://formspree.io/) |
| Images | Wikipedia / Wikimedia Commons API |
| Deploy | [Vercel](https://vercel.com/) |

## Project Structure

```
arbolesmvd/
├── data/                 # Raw and processed data
│   ├── raw/              # Census CSVs, WFS GeoJSON
│   └── processed/        # Unified dataset with coordinates
├── scripts/              # Python processing scripts
│   ├── merge_datasets.py
│   ├── geocode_final.py
│   └── ...
└── web/                  # Next.js application
    ├── src/
    │   ├── app/          # Pages (App Router)
    │   └── components/   # Map, TreePanel, Filters, etc.
    └── public/           # Tree GeoJSON files
```

## Development

```bash
cd web
npm install
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_token" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Data Sources

- [Tree Census 2008](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008) - Montevideo City Government
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy) - Geographic layers

## Inspiration

Based on [Gieß den Kiez](https://giessdenkiez.de), a Berlin project that maps urban trees.

## Author

Created by [Mathi Fonseca](https://mathifonseca.me)

---

*Data comes from the 2008 municipal census. Some locations may have changed.*
