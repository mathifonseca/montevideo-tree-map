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
    ├── messages/
    │   ├── es.json             # Spanish translations
    │   └── en.json             # English translations
    ├── src/
    │   ├── i18n/
    │   │   └── request.ts      # Locale configuration
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
    │   │   ├── StatsModal.tsx
    │   │   ├── LanguageSelector.tsx
    │   │   ├── ThemeToggle.tsx
    │   │   ├── ThemeProvider.tsx
    │   │   └── *.test.tsx      # Component tests (114 tests)
    │   └── test/               # Test infrastructure
    │       ├── setup.ts        # Global setup
    │       ├── mocks/          # Mapbox, geolocation, API mocks
    │       └── utils/          # Custom render helper
    └── public/
        ├── trees.pmtiles       # Vector tiles for the map (4.5MB)
        ├── trees-data.json.gz  # Detailed data by ID, gzipped (4.1MB)
        ├── species.json        # Species list (359 species)
        └── species-counts.json # Tree count by species
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
- MapLibre GL JS + PMTiles (vector tiles)
- Tailwind CSS
- next-themes (dark/light mode)
- next-intl (internationalization)
- Formspree (forms)
- Vitest + React Testing Library + MSW (testing)
- Vercel (deploy)

### Implemented Features
- Interactive map with 234,464 trees
- Colors by species (15 main species + default)
- Selected tree info panel with share button
- Species photos from Wikipedia/Wikimedia Commons
- Image carousel with swipe on mobile
- Filter by species with search and dynamic count
- Filter by CCZ zone (18 municipal zones)
- Address search (Mapbox Geocoding API)
- Statistics modal with top species chart
- Deep linking (URL with ?arbol=ID)
- Color legend
- Report missing tree (Formspree)
- Feedback form (Formspree)
- "About this project" modal
- Geolocation button
- Responsive design (bottom sheet on mobile)
- Internationalization (Spanish/English)
- Dark/Light mode toggle (dynamic basemap)

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
- **114 tests** across 11 test files covering all components and page integration
- Mocks for MapLibre GL (including PMTiles protocol), geolocation, Wikipedia/Formspree APIs, next-intl, next-themes
- Test files colocated with components (`*.test.tsx`)
- Setup and mocks in `src/test/`

### CI/CD
- GitHub Actions workflow (`.github/workflows/ci.yml`)
- Runs on push/PR to main branch
- Steps: install → test → build

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
- **Filters.tsx** (17 tests): search, dropdown, selection, clear, legend, CCZ filter, address search
- **TreePanel.tsx** (15 tests): display, location, characteristics, Wikipedia fetch, carousel, dead tree, share button
- **ReportModal.tsx** (13 tests): form submission, species autocomplete, sending/error/success states, reset
- **Map.tsx** (8 tests): initialization, filtering, report mode cursor, cleanup
- **FeedbackModal.tsx** (9 tests): validation, submission, error handling, state reset
- **AboutModal.tsx** (8 tests): content, links, close actions
- **StatsModal.tsx** (8 tests): summary counts, species chart, close button

#### Integration Tests
- **page.tsx** (14 tests): layout, modal management, report mode, species filter, CCZ filter, stats modal

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
  --maximum-zoom=16 \
  --drop-densest-as-needed \
  --extend-zooms-if-still-dropping \
  --force \
  web/public/trees.json
```

### Phase 5: New Features (web/)

#### Filtered Tree Count
- Shows "51.795 de 234.464 árboles" when species is selected
- Uses Spanish locale formatting (dots as thousands separator)
- species-counts.json provides counts per species

#### CCZ Zone Filter
- Dropdown with 18 municipal zones
- Combined filtering with species (both can be active)
- CCZ field added to PMTiles (`c` property)

#### Address Search
- Mapbox Geocoding API integration
- Debounced search (300ms delay)
- Limited to Montevideo bounding box
- Flies to selected location with zoom 17

#### Statistics Modal
- Summary cards: total trees, species count, zone count
- Bar chart of top 10 species
- Accessible via chart icon button

#### Deep Linking / Share
- URLs include `?arbol=ID` parameter
- Share button in TreePanel (Web Share API or clipboard fallback)
- Map centers on tree when opened from shared URL

#### Data Compression
- trees-data.json.gz: 54MB → 4.1MB (92% reduction)
- Client-side decompression with pako
- PMTiles: 4.5MB total (includes CCZ field)

#### CI/CD
- GitHub Actions workflow for automated testing
- Runs on push/PR to main branch
- Steps: checkout → setup Node.js → install → test → build

### Phase 6: Internationalization (web/)

#### next-intl Setup
- Library: next-intl for Next.js App Router
- Server-side locale detection via cookies
- NextIntlClientProvider wraps entire app
- Default language: Spanish (es)

#### Translation Files
- `messages/es.json`: Spanish translations (~140 UI strings + 359 species)
- `messages/en.json`: English translations (~140 UI strings + 359 species)
- Species names translated for common species (~70), rest keep Spanish name

#### Language Selector
- Dropdown in top-right corner with flag icons
- Options: 🇺🇾 Español / 🇬🇧 English
- Saves preference in cookie (`locale`)
- Persists across sessions

#### Locale-aware Features
- Wikipedia API fetches from es.wikipedia.org or en.wikipedia.org based on locale
- Species names translated in TreePanel, Filters legend, and StatsModal
- Fallback to original name if translation missing

#### Components Updated
All 9 main components use `useTranslations` hook:
- page.tsx, Map.tsx, TreePanel.tsx, Filters.tsx
- ReportModal.tsx, FeedbackModal.tsx, AboutModal.tsx, StatsModal.tsx
- LanguageSelector.tsx (new)

#### Test Updates
- Mock for next-intl in `src/test/mocks/next-intl.tsx`
- All tests pass with mock translations

### Phase 7: Dark/Light Mode (web/)

#### next-themes Setup
- Library: next-themes for Next.js App Router
- Configured with `darkMode: 'class'` in Tailwind
- ThemeProvider wraps app (inside NextIntlClientProvider)
- Default theme: dark (maintains original experience)
- System preference support enabled

#### ThemeToggle Component
- Button in top-right corner (first in row)
- Sun icon in dark mode, moon icon in light mode
- Click toggles between light/dark
- Persists preference in localStorage

#### Dynamic Basemap
- Map switches between CartoDB styles:
  - Dark: `dark-matter-gl-style`
  - Light: `positron-gl-style`
- Trees layer re-added after style change
- Center/zoom preserved during switch

#### Updated Components
All components updated with light/dark color classes:
- `bg-gray-900` → `bg-white dark:bg-gray-900`
- `text-white` → `text-gray-900 dark:text-white`
- `border-gray-700` → `border-gray-200 dark:border-gray-700`
- etc.

#### New Files
- `tailwind.config.ts`: darkMode configuration
- `ThemeProvider.tsx`: next-themes wrapper
- `ThemeToggle.tsx`: toggle button component

#### Test Updates
- Mock for next-themes in `src/test/mocks/next-themes.tsx`
- Tests for ThemeToggle (7), LanguageSelector (7), ThemeProvider (3)
- All 114 tests pass

---

## Data Sources

- [Open Data Catalog](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008)
- [IDE Montevideo (WFS)](https://sig.montevideo.gub.uy)
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy)

## Inspiration

- [Gieß den Kiez](https://giessdenkiez.de) - Berlin tree map

## Author

[Mathi Fonseca](https://mathifonseca.me)
