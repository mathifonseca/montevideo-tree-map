# Análisis Comparativo: NaturalistaUY y Fuentes Locales

## Resumen Ejecutivo

Este documento analiza [NaturalistaUY](https://www.naturalista.uy/) como producto comparable, y evalúa fuentes locales oficiales como alternativa a Wikipedia para información de especies.

---

## 1. Análisis de NaturalistaUY

### 1.1 ¿Qué es?
Plataforma de ciencia ciudadana para Uruguay, parte de la red global iNaturalist. Permite a usuarios registrar observaciones de vida silvestre y contribuir a bases de datos científicas como GBIF.

### 1.2 Funcionalidades Principales

| Feature | Descripción | ¿Aplicable a nosotros? |
|---------|-------------|------------------------|
| **Mapa de observaciones** | Vista de mapa/grid/lista con filtros | ✅ Ya tenemos mapa |
| **Filtros avanzados** | Por taxonomía, fecha, lugar, observador | ⚠️ Tenemos filtros básicos |
| **Ficha de especie** | Info taxonómica, fotos, estado conservación | ✅ Podríamos mejorar |
| **Comunidad** | Usuarios, proyectos, foros | ❌ Fuera de scope |
| **Ciencia ciudadana** | Reportar observaciones | ⚠️ Tenemos "reportar árbol" |
| **Guías de campo** | Identificación de especies | 🤔 Interesante |
| **Apps móviles** | iOS/Android con modo offline | ✅ Ya tenemos PWA |

### 1.3 Página de Especie en NaturalistaUY

Ejemplo: [Eucalyptus robusta](https://www.naturalista.uy/taxa/162761-Eucalyptus-robusta)

**Información mostrada:**
- Nombre científico y común (español/inglés)
- Taxonomía completa (Reino → Especie)
- Estado de conservación IUCN (ej: "Near Threatened")
- Fotos de la comunidad con licencias
- Mapa de distribución global
- Estadísticas (observaciones, regiones)
- Clasificación: Nativa/Introducida
- Resumen de Wikipedia
- Checklists por región

**Lo que nos falta (sin soporte de usuarios):**
- Estado de conservación IUCN
- Distribución global
- Taxonomía completa

### 1.4 Features Interesantes para Considerar

1. **Estado de conservación**: Mostrar si la especie está amenazada
2. **Mapa de distribución**: Dónde más existe esta especie en el mundo
3. **Estacionalidad mejorada**: Ya tenemos `bloomingSeason` para 306/359 especies, pero solo indica la estación (ej: "spring"). Podríamos expandir a meses específicos y agregar info de caída de hojas.

---

## 2. Análisis de Fuentes Locales Oficiales

### 2.1 Municipio C - Fichas de Especies

**URL**: https://municipioc.montevideo.gub.uy/especies-vegetales

**Ejemplo analizado**: [Timbó](https://municipioc.montevideo.gub.uy/timbó), [Paraíso](https://municipioc.montevideo.gub.uy/paraíso), [Jacarandá](https://municipioc.montevideo.gub.uy/jacarandá)

**Información disponible:**

| Campo | Ejemplo (Paraíso) |
|-------|-------------------|
| Nombre común | Paraíso, Cinamomo, Agriaz, Lila |
| Nombre científico | Melia azedarach |
| División | Magnoliophyta |
| Clase | Magnoliopsida |
| Orden | Sapindales |
| Familia | Meliaceae |
| Género | Melia |
| Origen | Asia (Himalaya) |
| Follaje | Caduco |
| Altura | 8-15m |
| Diámetro copa | 4-8m |
| Descripción hojas | Opuestas, compuestas, 15-45cm |
| Flores | Pentámeras, púrpura/lila, fragantes |
| Fruto | Drupa globular, 1cm, verde a amarillo |
| Floración | Mediados a fines de primavera |
| Crecimiento | Rápido |
| Tolerancia | Heladas ligeras, suelos ácidos/alcalinos |
| Usos históricos | Rosarios, tinte textil, madera |
| Valor ornamental | Sombra, decoración |

**Ventajas sobre Wikipedia:**
- ✅ Información específica para Uruguay
- ✅ Datos locales verificados
- ✅ Contexto cultural uruguayo
- ✅ Sin problemas de idioma/traducción
- ✅ Fuente oficial gubernamental

**Desventajas:**
- ❌ Solo ~13 especies en Municipio C
- ❌ No hay API, habría que scrapear
- ❌ Datos estáticos (no se actualizan)

### 2.2 Municipio B - "Plantar es Cuidar"

**URL**: https://municipiob.montevideo.gub.uy/plantar-es-cuidar

**26 especies documentadas** con información similar:
- Arce Blanco, Arce Tridente, Catalpa, Ciruelo de Jardín
- Espumilla, Francisco Álvarez, Fresno Europeo, Garrocha
- Hovenia, Ibirapitá, Jacarandá, Koelreuteria
- Lapachillo, Lapacho, Liquidambar, Palo de Fierro
- Paraíso, Pata de Vaca, Pindó, Plátano
- Palo Amarillo, Tilo, Tulipanero

### 2.3 Otros Municipios

**Búsqueda realizada:** Encontré menciones en otros municipios pero sin fichas detalladas:

| Municipio | URL | Contenido |
|-----------|-----|-----------|
| Municipio G | [Cuidemos nuestros árboles](https://municipiog.montevideo.gub.uy/cuidemos-nuestros-árboles) | Menciona Jacarandá, Arce blanco, Ciruelos |
| Municipio D | [Más árboles para el Cerrito](https://municipiod.montevideo.gub.uy/más-árboles-para-el-cerrito) | Fresnos, arces, paraísos, espumillas, lapachos |
| Municipio F | [Más árboles para nuestra zona](https://municipiof.montevideo.gub.uy/comunicacion/noticias/mas-arboles-para-nuestra-zona) | Árboles frutales en escuelas |

**Conclusión:** Municipio B y C son las mejores fuentes municipales. Los demás solo tienen menciones, no fichas.

### 2.4 Guía del Ministerio de Ambiente (2023)

**URL**: [Guía de identificación de especies arbóreas nativas de Uruguay](https://www.gub.uy/ministerio-ambiente/comunicacion/publicaciones/guia-identificacion-especies-arboreas-nativas-uruguay-version-2023)

**PDF**: https://www.gub.uy/ministerio-ambiente/sites/ministerio-ambiente/files/documentos/publicaciones/Guia_de_identificacion_de_especies_arboreas_nativas_de_Uruguay_compressed.pdf

**Contenido por ficha:**
- Nombre científico y familia
- Nombres comunes
- Características: porte, follaje, hoja, flor, fruto
- Hábitat y distribución
- Propagación
- Usos
- Fotos ilustrativas

**Cobertura:** Todas las especies arbóreas nativas de Uruguay (~40 especies relevantes para nosotros)

### 2.5 Otras Fuentes Gubernamentales

| Fuente | URL | Contenido |
|--------|-----|-----------|
| **Zoo de Montevideo** | [Montes del Uruguay](https://zoo.montevideo.gub.uy) | PDFs sobre árboles nativos |
| **Jardín Botánico** | [Manual Flora Indígena](https://jardinbotanico.montevideo.gub.uy) | Curso de reconocimiento de flora |
| **CARU** | [Árboles del Río Uruguay](https://pmb.parlamento.gub.uy) | Fichas técnicas río Uruguay |
| **MVOTMA/DINAMA** | [Guía especies nativas](https://www.dinama.gub.uy) | Versión anterior de la guía |

---

## 3. Comparativa: Wikipedia vs Fuentes Locales

| Aspecto | Wikipedia | Fuentes Locales |
|---------|-----------|-----------------|
| Cobertura | 359 especies (casi todas) | ~50-60 especies (sumando todas las fuentes) |
| Idioma | Español (a veces pobre) | Español uruguayo |
| Relevancia local | Genérica | Específica Uruguay |
| Actualización | Frecuente | Estática |
| API disponible | ✅ Sí | ❌ No |
| Fotos | Wikimedia Commons | Fotos locales (PDFs) |
| Usos culturales | Genéricos | Contexto regional |
| Confiabilidad | Variable | Oficial/verificada |

### 3.1 Recomendación: Enfoque Híbrido ✅

1. **Prioridad 1**: Usar fuentes locales cuando existan (Municipios, Ministerio)
2. **Prioridad 2**: Wikipedia como fallback para especies no cubiertas
3. **Prioridad 3**: Crear dataset propio `species-metadata.json` consolidado

**Implementación práctica:**
- Extraer datos de ~50 especies de fuentes locales (manual o semi-automático)
- Mantener Wikipedia/Wikimedia para fotos y descripción de las otras ~300 especies
- Campo `localSource` en metadata para indicar origen de los datos

---

## 4. Features a Considerar

### 4.1 Mejoras al TreePanel (Info de Especie)

| Feature | Fuente | Prioridad | Esfuerzo |
|---------|--------|-----------|----------|
| Época de floración (meses) | Municipios | Alta | Bajo |
| Usos tradicionales | Municipios | Media | Bajo |
| Altura típica | Municipios | Alta | Bajo |
| Diámetro copa típico | Municipios | Alta | Bajo |
| Tolerancia (frío, viento) | Municipios | Baja | Bajo |
| Estado conservación IUCN | NaturalistaUY/IUCN | Media | Medio |
| Valor ecológico | Municipios | Media | Bajo |

### 4.2 Nuevas Funcionalidades

| Feature | Descripción | Prioridad | Esfuerzo | Estado |
|---------|-------------|-----------|----------|--------|
| **Calendario de floración** | Vista colapsable mostrando qué florece cada mes. Al expandir muestra las especies con meses de floración. | Alta | Medio | ✅ Hacer |
| **Mapa de calor por especie** | Dónde hay más concentración de X especie | Media | Medio | 🤔 Evaluar |
| **Rutas temáticas** | Ver explicación abajo | Baja | Alto | 🤔 Evaluar |

#### Explicación: Rutas Temáticas

**Concepto:** Recorridos predefinidos para explorar árboles a pie o en bici.

**Ejemplos:**
- "Ruta de los Jacarandás en flor" - Recorrido por calles con Jacarandás (Nov-Dic)
- "Árboles nativos del Prado" - Tour por el parque con especies autóctonas
- "Gigantes de Montevideo" - Los árboles más grandes/antiguos

**Implementación:**
- Definir polilínea del recorrido
- Listar árboles destacados en el camino
- Mostrar duración estimada, distancia
- Mejor época para hacer el recorrido

**Complejidad:** Alta porque requiere curación manual de contenido.

### 4.3 Datos Actuales vs Deseados

**Estado actual de `species-metadata.json`:**
- 359 especies
- Campos: `native`, `origin`, `foliage`, `bloomingSeason`, `uses`, `scientificName`
- `bloomingSeason`: 306 especies tienen dato (pero solo estación, no meses)

**Campos a agregar:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `bloomingMonths` | Meses específicos de floración | `[10, 11]` (Oct-Nov) |
| `heightRange` | Altura típica min-max en metros | `[8, 15]` |
| `crownRange` | Diámetro copa típico min-max | `[4, 8]` |
| `flowerColor` | Color de las flores | `"purple"`, `"white"` |
| `fruitSeason` | Meses de fructificación | `[1, 2, 3]` |
| `growthRate` | Velocidad de crecimiento | `"fast"`, `"medium"`, `"slow"` |
| `localSource` | Fuente local de datos | `"municipioc.montevideo.gub.uy"` |

---

## 5. Plan de Acción Propuesto

### Fase 1: Enriquecer species-metadata.json (Corto plazo)
- [ ] Agregar `bloomingMonths` para las especies más comunes (~50)
- [ ] Agregar `heightRange` desde fuentes municipales
- [ ] Agregar `crownRange` desde fuentes municipales
- [ ] Agregar `flowerColor` para especies con floración destacada
- [ ] Documentar `localSource` para tracking

### Fase 2: Mejorar TreePanel (Corto plazo)
- [ ] Mostrar meses de floración con íconos de meses
- [ ] Mostrar altura típica vs altura del ejemplar (ej: "Este: 12m | Típico: 8-15m")
- [ ] Indicador "En flor" si el mes actual está en `bloomingMonths`

### Fase 3: Calendario de floración en StatsModal (Mediano plazo)
- [ ] Nueva sección colapsada "Calendario de floración"
- [ ] Al expandir: grid de 12 meses con especies que florecen
- [ ] Click en mes → muestra lista de especies
- [ ] Destacar mes actual

---

## 6. Fuentes de Datos Consolidadas

### Fuentes Locales Oficiales (Prioridad 1)

| Fuente | Especies | Datos disponibles |
|--------|----------|-------------------|
| Municipio B | ~26 | Altura, follaje, floración, origen, usos |
| Municipio C | ~13 | Taxonomía completa, floración, tolerancias |
| Ministerio Ambiente | ~40 nativas | Fichas completas con fotos |
| Zoo Montevideo | ~20 nativas | Contexto ecológico |
| Jardín Botánico | ~30 | Manual de identificación |

**Total estimado:** ~60 especies únicas con datos locales detallados

### Fuentes Externas (Prioridad 2)

| Fuente | Uso |
|--------|-----|
| Wikipedia ES | Descripción, fotos fallback |
| Wikimedia Commons | Fotos de especies |
| iNaturalist API | Estado IUCN, distribución |

---

## 7. Preguntas Resueltas

| Pregunta | Decisión |
|----------|----------|
| ¿Soporte de usuarios? | ❌ No por ahora |
| ¿Galería comunitaria? | ❌ No por ahora |
| ¿Filtro "floreciendo ahora"? | ❌ No (complejo para poco valor) |
| ¿Comparador de especies? | ❌ No |
| ¿Calendario de floración? | ✅ Sí, colapsado en StatsModal |
| ¿Rutas temáticas? | 🤔 Futuro, requiere curación manual |
| ¿Mapa de calor? | 🤔 Evaluar esfuerzo/beneficio |

---

## 8. Notas Técnicas

### API de iNaturalist (para estado IUCN)
```
GET https://api.inaturalist.org/v1/taxa/{taxon_id}
```
Retorna: taxonomía, fotos, conservación, distribución.

### Estructura propuesta para species-metadata.json v2
```json
{
  "Paraíso": {
    "native": false,
    "origin": "Asia (Himalaya)",
    "foliage": "deciduous",
    "bloomingSeason": "spring",
    "bloomingMonths": [10, 11],
    "flowerColor": "purple",
    "heightRange": [8, 15],
    "crownRange": [4, 8],
    "uses": ["ornamental", "shade"],
    "growthRate": "fast",
    "scientificName": "Melia azedarach",
    "localSource": "municipioc.montevideo.gub.uy"
  }
}
```

---

*Documento creado: 2024-02-12*
*Última actualización: 2024-02-12*
