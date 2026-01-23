# Arbolado Urbano de Montevideo

Base de datos unificada del arbolado público de Montevideo, Uruguay.

## Objetivo

Crear un dataset completo y georreferenciado de los ~235,000 árboles públicos de Montevideo, combinando:
- Censo municipal de arbolado (datos detallados por árbol)
- Servicio WFS con coordenadas geográficas
- Base de puertas (direcciones) para geocodificación

## Estado actual

- **234,464 árboles** en total
- **100% con coordenadas** (234,464)

## Estructura

```
data/
  raw/                    # Datos originales (no modificar)
    archivo_comunal*.csv  # 18 archivos del censo por CCZ
    codigos-de-especie.csv
    wfs_arboles.geojson   # Árboles con coordenadas del WFS
    wfs_puertas.geojson   # Direcciones para geocodificación
    referencias.txt       # Descripción de columnas del censo
  processed/
    arboles_montevideo.csv      # Censo unificado
    arboles_montevideo_geo.csv  # Dataset principal con coordenadas
    reporte_arbolado.html       # Reporte de análisis

scripts/
  merge_datasets.py      # Une censo + WFS
  geocode_final.py       # Geocodificación principal (matching inteligente de calles)
  geocode_nominatim.py   # Geocodificación con OpenStreetMap (para casos difíciles)
  geocode_improved.py    # Versión anterior (deprecado)
  geocode_puertas.py     # Versión inicial (deprecado)
  analyze_data.py        # Análisis estadístico
  generate_report.py     # Genera reporte HTML
```

## Columnas principales del dataset

- `Arbol`: ID único del árbol
- `lat`, `lng`: Coordenadas geográficas
- `Nombre científico`, `Nombre común`: Especie
- `Calle`, `Numero`: Dirección
- `CCZ`: Centro Comunal Zonal (1-18)
- `CAP`: Circunferencia a altura de pecho (cm)
- `Altura`: Altura del árbol (m)
- `EV`: Estado vegetativo (1=Muy bueno a 7=Tocón)
- `origen`: 'censo' o 'wfs_only'

## Comandos

```bash
# Ejecutar scripts
python3 scripts/merge_datasets.py
python3 scripts/geocode_puertas.py
python3 scripts/analyze_data.py
python3 scripts/generate_report.py

# Abrir reporte
open data/processed/reporte_arbolado.html
```

## Fuentes de datos

- Catálogo de Datos Abiertos de Uruguay: https://catalogodatos.gub.uy
- IDE Montevideo (WFS): https://sig.montevideo.gub.uy
