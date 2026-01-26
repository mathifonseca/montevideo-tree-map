# Arbolado Urbano de Montevideo

Mapa interactivo para explorar los **234,464 árboles** que adornan las veredas de Montevideo, Uruguay.

**Demo en vivo**: [arbolesmvd.vercel.app](https://arbolesmvd.vercel.app) *(o tu URL de Vercel)*

## Funcionalidades

- **Mapa interactivo** con todos los árboles de Montevideo coloreados por especie
- **Panel de información** con datos detallados de cada árbol (especie, ubicación, altura, estado, etc.)
- **Fotos de especies** obtenidas de Wikipedia/Wikimedia Commons con carrusel
- **Filtro por especie** con búsqueda y leyenda de colores
- **Reportar árbol faltante** vía Formspree
- **Geolocalización** para centrar el mapa en tu ubicación
- **Diseño responsive** con bottom sheet en móvil y panel lateral en desktop

## Stack Técnico

- **Framework**: [Next.js 16](https://nextjs.org/) con App Router
- **Mapa**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Formularios**: [Formspree](https://formspree.io/) (sin backend)
- **Imágenes**: Wikipedia/Wikimedia Commons API
- **Deploy**: [Vercel](https://vercel.com/)

## Arquitectura

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout con metadata y fuentes
│   │   └── page.tsx            # Página principal (estado global)
│   └── components/
│       ├── Map.tsx             # Mapa Mapbox con capas de árboles
│       ├── TreePanel.tsx       # Panel info árbol + carrusel fotos
│       ├── Filters.tsx         # Filtro especies + leyenda colores
│       ├── ReportModal.tsx     # Modal reportar árbol faltante
│       ├── FeedbackModal.tsx   # Modal feedback general
│       └── AboutModal.tsx      # Modal "Sobre este proyecto"
├── public/
│   ├── trees.json              # GeoJSON con puntos (30MB)
│   ├── trees-data.json         # Datos detallados por ID (50MB)
│   └── species.json            # Lista de especies para filtro
└── package.json
```

### Flujo de datos

1. **trees.json** - GeoJSON con 234,464 features. Cada punto tiene propiedades mínimas (`i`=ID, `e`=especie) para rendimiento.
2. **trees-data.json** - Objeto con datos completos de cada árbol, indexado por ID. Se carga al inicio y se consulta cuando el usuario selecciona un árbol.
3. **species.json** - Array de nombres de especies para el dropdown de filtro.

### Colores por especie

Las 15 especies más comunes tienen colores asignados (definidos en `Map.tsx` y `Filters.tsx`). El resto se muestra en verde (`#4ade80`).

## Desarrollo

### Requisitos

- Node.js 18+
- Token de Mapbox (crear cuenta gratuita en [mapbox.com](https://mapbox.com))

### Instalación

```bash
cd web
npm install
```

### Configuración

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_de_mapbox
```

### Ejecutar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Fuentes de datos

- [Censo de arbolado 2008](https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008) - Intendencia de Montevideo
- [GeoWeb Montevideo](https://geoweb.montevideo.gub.uy/geonetwork/srv/spa/catalog.search) - Capas geográficas

## Inspiración

Basado en [Gieß den Kiez](https://giessdenkiez.de), un proyecto de Berlín que mapea árboles urbanos y permite a los ciudadanos registrar cuando los riegan.

## Autor

Creado por [Mathi Fonseca](https://mathifonseca.me)

---

*Los datos provienen del censo municipal de 2008. Algunas ubicaciones pueden haber cambiado.*
