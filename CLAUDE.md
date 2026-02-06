# Montevideo Urban Trees

Unified database and interactive map of Montevideo's public trees, Uruguay.

## Project Summary

**234,464 public trees** in Montevideo with geographic coordinates, species information, vegetative condition, dimensions, and location. Data comes from the 2008 municipal census combined with geographic layers from the City's WFS service.

## Repository Structure

```
arbolesmvd/
├── data/
│   ├── raw/                    # Original data (do not modify)
│   │   ├── archivo_comunal*.csv  # 18 census files by CCZ
│   │   ├── codigos-de-especie.csv
│   │   ├── wfs_arboles.geojson   # Trees with coordinates from WFS
│   │   └── wfs_puertas.geojson   # Addresses for geocoding
│   └── processed/
│       ├── arboles_montevideo.csv      # Unified census
│       └── arboles_montevideo_geo.csv  # Main dataset with coordinates
├── scripts/
│   ├── merge_datasets.py       # Merge census + WFS
│   ├── geocode_final.py        # Main geocoding
│   ├── geocode_nominatim.py    # Geocoding with OSM
│   ├── clean_common_names.py   # Species name normalization (~33k fixes)
│   ├── generate_geojson.py     # Generate web JSON/PMTiles files
│   ├── analyze_data.py         # Statistical analysis
│   └── generate_report.py      # Generate HTML report
└── web/                        # Next.js application
    ├── vitest.config.ts        # Test configuration
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── page.test.tsx
    │   ├── components/
    │   │   ├── Map.tsx
    │   │   ├── TreePanel.tsx
    │   │   ├── Filters.tsx
    │   │   ├── ReportModal.tsx
    │   │   ├── FeedbackModal.tsx
    │   │   ├── AboutModal.tsx
    │   │   └── *.test.tsx      # Component tests
    │   └── test/               # Test infrastructure
    │       ├── setup.ts        # Global setup
    │       ├── mocks/          # Mapbox, geolocation, API mocks
    │       └── utils/          # Custom render helper
    └── public/
        ├── trees.pmtiles       # Vector tiles for the map (6.4MB)
        ├── trees.json          # GeoJSON backup (32MB)
        ├── trees-data.json     # Detailed data by ID (54MB)
        └── species.json        # Species list (359 species)
```

## Main Dataset Columns

- `Arbol`: Unique tree ID
- `lat`, `lng`: Geographic coordinates
- `Nombre científico`, `Nombre común`: Species
- `Calle`, `Numero`: Address
- `CCZ`: Communal Center Zone (1-18)
- `CAP`: Circumference at breast height (cm)
- `Altura`: Tree height (m)
- `Diámetro de copa`: Crown diameter (m)
- `EV`: Vegetative condition (1=Very good to 7=Stump)

## Web Application

### Stack
- Next.js 16 with App Router
- Mapbox GL JS + PMTiles (vector tiles)
- Tailwind CSS
- Formspree (forms)
- Vitest + React Testing Library + MSW (testing)
- Vercel (deploy)

### Implemented Features
- Interactive map with 234,464 trees
- Colors by species (15 main species + default)
- Selected tree info panel
- Species photos from Wikipedia/Wikimedia Commons
- Image carousel with swipe on mobile
- Filter by species with search
- Color legend
- Report missing tree (Formspree)
- Feedback form (Formspree)
- "About this project" modal
- Geolocation button
- Responsive design (bottom sheet on mobile)

### Environment Variables
```
NEXT_PUBLIC_MAPBOX_TOKEN=xxx
```

### Commands
```bash
cd web
npm install
npm run dev            # Development
npm run build          # Production build
npm test               # Tests in watch mode
npm run test:run       # Single test run (CI)
npm run test:coverage  # Coverage report
```

### Testing
- **Stack**: Vitest + React Testing Library + MSW
- **73 tests** across 7 test files covering all components and page integration
- Mocks for Mapbox GL (including PMTiles protocol), geolocation, Wikipedia/Formspree APIs
- Test files colocated with components (`*.test.tsx`)
- Setup and mocks in `src/test/`

---

## Development History

### Phase 1: Data Processing (scripts/)

1. **Census unification**: Merged 18 CSV files by CCZ into a single dataset
2. **Geocoding**: 100% of trees with coordinates via:
   - Matching with City's WFS
   - Geocoding by address (street + number)
   - Nominatim (OpenStreetMap) for difficult cases
3. **Common name cleanup** (`clean_common_names.py`):
   - 100% coverage: all 234,464 trees now have common names
   - 359 unique species (unified duplicates and variants)
   - Fixed abbreviations ("P. radiata" → "Pino radiata")
   - Fixed truncated names ("Tuya orien." → "Tuya oriental")
   - Normalized accents ("Paraiso" → "Paraíso")
   - 566 scientific name corrections (typos like "Bahuinia" → "Bauhinia")
   - 2,553 data entry error fixes (wrong species assigned)
   - Special cases like "Ejemplar seco" (dead trees)

### Phase 2: Web Application (web/)

#### Initial Structure
- Next.js with App Router
- Mapbox with dark style (dark-v11)
- GeoJSON loading with all trees
- Side panel with tree info

#### Data Improvements
- Split into `trees.json` (map points) and `trees-data.json` (full data)
- Minimal properties in GeoJSON (`i`=ID, `e`=species) for performance
- PMTiles vector tiles (6.4MB vs 32MB GeoJSON = 80% smaller)
- Automatic point density reduction at lower zoom levels

#### Species Filter
- Dropdown with search
- Filter applied to Mapbox layer
- Regenerated trees.json with updated common names

#### Colors by Species
- 15 colors for most common species
- Mapbox `match` expression for point coloring
- Always visible legend

#### Species Photos
- Wikipedia API integration (Spanish summary)
- Wikimedia Commons integration (images)
- Modal carousel with navigation
- In-memory cache to avoid repeated requests
- Exclusion of invalid species ("Ejemplar seco", "Dudas", etc.)

#### Forms
- **Report missing tree**: Formspree (https://formspree.io/f/mbdodqbo)
  - Click coordinates on map
  - Species (optional)
  - Description
- **General feedback**: Formspree (https://formspree.io/f/xnjdjwav)
  - Type (suggestion, error, other)
  - Message

#### "About this project" Modal
- Brief description
- Inspiration (Gieß den Kiez)
- Data sources
- Credits (Mathi Fonseca)

#### UI/UX
- Compact buttons in top-right corner
- Report mode indicator
- z-index fix so buttons don't get covered by panel
- Hide "Location" section when empty

#### Responsive (Mobile)
- TreePanel as bottom sheet (70vh) with rounded corners
- Collapsible filters with chevron
- Legend as separate accordion
- Reduced filter panel width (w-52)
- Dark backdrop for bottom sheet

#### Geolocation
- "My location" button in bottom-right corner
- Uses navigator.geolocation.getCurrentPosition
- Centers map with zoom 17
- Spinner while getting location

#### Carousel Swipe
- Touch events to detect swipe (50px threshold)
- Navigate between images with finger
- Non-draggable image for better UX

### Phase 3: Testing (web/)

#### Test Infrastructure
- Vitest with jsdom environment and React plugin
- MSW for API mocking (Wikipedia, Wikimedia Commons, Formspree, local JSON)
- Custom Mapbox GL mock class with constructor spy
- Navigator geolocation mock with success/error helpers
- Custom render helper with userEvent

#### Component Tests
- **Filters.tsx** (11 tests): search, dropdown, selection, clear, legend, overflow
- **TreePanel.tsx** (13 tests): display, location, characteristics, Wikipedia fetch, carousel, dead tree indicator
- **ReportModal.tsx** (13 tests): form submission, species autocomplete, sending/error/success states, reset
- **Map.tsx** (12 tests): initialization, filtering, geolocation, report mode cursor, cleanup
- **FeedbackModal.tsx** (9 tests): validation, submission, error handling, state reset
- **AboutModal.tsx** (8 tests): content, links, close actions

#### Integration Tests
- **page.tsx** (8 tests): layout, modal management, report mode toggle, species filter end-to-end

### Troubleshooting

#### Large Files in Git
- trees.json (30MB) and trees-data.json (50MB) exceeded GitHub limit
- Solution: Compression with gzip and .gitattributes

#### TypeScript
- Type error in `colorExpression` → cast to `mapboxgl.ExpressionSpecification`

#### Map Loading
- Map wasn't loading (infinite loop) → fix in useEffect cleanup and refs for callbacks

### Phase 4: Data Quality (scripts/)

#### Species Name Normalization (`clean_common_names.py`)
Comprehensive cleanup of the "Nombre común" field:

1. **Comma names** (5 fixes): "Gomero, F.elastica." → "Gomero"
2. **Truncated names** (40+ fixes): "Tuya orien." → "Tuya oriental"
3. **Abbreviations** (36 fixes): "P. radiata" → "Pino radiata", "E. globulus" → "Eucalipto blanco"
4. **Accent normalization** (20+ fixes): "Paraiso" → "Paraíso", "Jacaranda" → "Jacarandá"
5. **Scientific→common mapping** (300+ species): assigns common name based on scientific name
6. **Scientific name corrections** (25 fixes): "Bahuinia" → "Bauhinia", "Olea europea" → "Olea europaea"
7. **Unification** (37 mappings): standardizes when same species has multiple common names

Results:
- 97,232 trees without common name → 0 (100% coverage)
- 377+ inconsistent species → 359 unified species
- ~33,000 total corrections

#### Vector Tiles Generation
Using tippecanoe to create PMTiles:
```bash
tippecanoe -o web/public/trees.pmtiles \
  --name="Árboles de Montevideo" \
  --layer=trees \
  --minimum-zoom=10 \
  --maximum-zoom=18 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --force \
  web/public/trees.json
```

---

## Data Sources

- [Open Data Catalog](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008)
- [IDE Montevideo (WFS)](https://sig.montevideo.gub.uy)
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy)

## Inspiration

- [Gieß den Kiez](https://giessdenkiez.de) - Berlin tree map

## Author

[Mathi Fonseca](https://mathifonseca.me)
