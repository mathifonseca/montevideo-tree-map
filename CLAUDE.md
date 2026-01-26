# Arbolado Urbano de Montevideo

Base de datos unificada y mapa interactivo del arbolado público de Montevideo, Uruguay.

## Resumen del proyecto

**234,464 árboles** públicos de Montevideo con coordenadas geográficas, información de especie, estado vegetativo, dimensiones y ubicación. Los datos provienen del censo municipal de 2008 combinado con capas geográficas del WFS de la Intendencia.

## Estructura del repositorio

```
arbolesmvd/
├── data/
│   ├── raw/                    # Datos originales (no modificar)
│   │   ├── archivo_comunal*.csv  # 18 archivos del censo por CCZ
│   │   ├── codigos-de-especie.csv
│   │   ├── wfs_arboles.geojson   # Árboles con coordenadas del WFS
│   │   └── wfs_puertas.geojson   # Direcciones para geocodificación
│   └── processed/
│       ├── arboles_montevideo.csv      # Censo unificado
│       └── arboles_montevideo_geo.csv  # Dataset principal con coordenadas
├── scripts/
│   ├── merge_datasets.py       # Une censo + WFS
│   ├── geocode_final.py        # Geocodificación principal
│   ├── geocode_nominatim.py    # Geocodificación con OSM
│   ├── analyze_data.py         # Análisis estadístico
│   └── generate_report.py      # Genera reporte HTML
└── web/                        # Aplicación Next.js
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   └── components/
    │       ├── Map.tsx
    │       ├── TreePanel.tsx
    │       ├── Filters.tsx
    │       ├── ReportModal.tsx
    │       ├── FeedbackModal.tsx
    │       └── AboutModal.tsx
    └── public/
        ├── trees.json          # GeoJSON para el mapa (30MB)
        ├── trees-data.json     # Datos detallados (50MB)
        └── species.json        # Lista de especies
```

## Columnas principales del dataset

- `Arbol`: ID único del árbol
- `lat`, `lng`: Coordenadas geográficas
- `Nombre científico`, `Nombre común`: Especie
- `Calle`, `Numero`: Dirección
- `CCZ`: Centro Comunal Zonal (1-18)
- `CAP`: Circunferencia a altura de pecho (cm)
- `Altura`: Altura del árbol (m)
- `Diámetro de copa`: Diámetro de la copa (m)
- `EV`: Estado vegetativo (1=Muy bueno a 7=Tocón)

## Aplicación web

### Stack
- Next.js 16 con App Router
- Mapbox GL JS
- Tailwind CSS
- Formspree (formularios)
- Vercel (deploy)

### Funcionalidades implementadas
- Mapa interactivo con 234,464 árboles
- Colores por especie (15 especies principales + default)
- Panel de información del árbol seleccionado
- Fotos de especies desde Wikipedia/Wikimedia Commons
- Carrusel de imágenes con swipe en móvil
- Filtro por especie con búsqueda
- Leyenda de colores
- Reportar árbol faltante (Formspree)
- Formulario de feedback (Formspree)
- Modal "Sobre este proyecto"
- Botón de geolocalización
- Diseño responsive (bottom sheet en móvil)

### Variables de entorno
```
NEXT_PUBLIC_MAPBOX_TOKEN=xxx
```

### Comandos
```bash
cd web
npm install
npm run dev      # Desarrollo
npm run build    # Build producción
```

---

## Historial de desarrollo

### Fase 1: Procesamiento de datos (scripts/)

1. **Unificación del censo**: Merge de 18 archivos CSV por CCZ en un único dataset
2. **Geocodificación**: 100% de los árboles con coordenadas mediante:
   - Matching con WFS de la Intendencia
   - Geocodificación por dirección (calle + número)
   - Nominatim (OpenStreetMap) para casos difíciles
3. **Limpieza de nombres comunes**:
   - 97,229 árboles sin nombre común → asignados desde nombre científico
   - Corrección de abreviaturas ("P. radiata" → "Pino radiata")
   - Casos especiales como "Ejemplar seco" (árboles muertos)

### Fase 2: Aplicación web (web/)

#### Estructura inicial
- Next.js con App Router
- Mapbox con estilo oscuro (dark-v11)
- Carga de GeoJSON con todos los árboles
- Panel lateral con información del árbol

#### Mejoras de datos
- Separación en `trees.json` (puntos para mapa) y `trees-data.json` (datos completos)
- Propiedades mínimas en GeoJSON (`i`=ID, `e`=especie) para rendimiento

#### Filtro por especie
- Dropdown con búsqueda
- Filtro aplicado a la capa de Mapbox
- Regeneración de trees.json con nombres comunes actualizados

#### Colores por especie
- 15 colores para especies más comunes
- Expresión `match` de Mapbox para colorear puntos
- Leyenda siempre visible

#### Fotos de especies
- Integración con Wikipedia API (resumen en español)
- Integración con Wikimedia Commons (imágenes)
- Carrusel modal con navegación
- Cache en memoria para evitar requests repetidos
- Exclusión de especies no válidas ("Ejemplar seco", "Dudas", etc.)

#### Formularios
- **Reportar árbol faltante**: Formspree (https://formspree.io/f/mbdodqbo)
  - Coordenadas del click en el mapa
  - Especie (opcional)
  - Descripción
- **Feedback general**: Formspree (https://formspree.io/f/xnjdjwav)
  - Tipo (sugerencia, error, otro)
  - Mensaje

#### Modal "Sobre este proyecto"
- Descripción breve
- Inspiración (Gieß den Kiez)
- Fuentes de datos
- Créditos (Mathi Fonseca)

#### UI/UX
- Botones compactos en esquina superior derecha
- Indicador de modo reporte
- Fix z-index para que botones no se tapen con panel
- Ocultar sección "Ubicación" cuando está vacía

#### Responsive (móvil)
- TreePanel como bottom sheet (70vh) con bordes redondeados
- Filtros colapsables con chevron
- Leyenda como acordeón separado
- Ancho reducido del panel de filtros (w-52)
- Backdrop oscuro para bottom sheet

#### Geolocalización
- Botón "Mi ubicación" en esquina inferior derecha
- Usa navigator.geolocation.getCurrentPosition
- Centra el mapa con zoom 17
- Spinner mientras obtiene ubicación

#### Swipe en carrusel
- Touch events para detectar swipe (umbral 50px)
- Navegación entre imágenes con dedo
- Imagen no draggable para mejor UX

### Solución de problemas

#### Archivos grandes en Git
- trees.json (30MB) y trees-data.json (50MB) excedían límite de GitHub
- Solución: Compresión con gzip y .gitattributes

#### TypeScript
- Error de tipo en `colorExpression` → cast a `mapboxgl.ExpressionSpecification`

#### Map loading
- El mapa no cargaba (loop infinito) → fix en cleanup de useEffect y refs para callbacks

---

## Fuentes de datos

- [Catálogo de Datos Abiertos](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008)
- [IDE Montevideo (WFS)](https://sig.montevideo.gub.uy)
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy)

## Inspiración

- [Gieß den Kiez](https://giessdenkiez.de) - Mapa de árboles de Berlín

## Autor

[Mathi Fonseca](https://mathifonseca.me)
