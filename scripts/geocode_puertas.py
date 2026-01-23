#!/usr/bin/env python3
"""
Geocodificar árboles usando la base de puertas de Montevideo.
"""

import json
import pandas as pd
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

# Mapeo manual de calles problemáticas (solo matches verificados)
MAPEO_CALLES = {
    'ARTIGAS BULEVAR GRAL': 'BV GRAL ARTIGAS',
    'BELLONI AVENIDA JOSE': 'AV JOSE BELLONI',
    'RIVERA AVENIDA GRAL': 'AV GRAL RIVERA',
    'BATLLE Y ORDOÑEZ BULEVAR JOSE': 'BV JOSE BATLLE Y ORDOÑEZ',
    'DE HERRERA AVENIDA LUIS ALBERTO': 'AV DR LUIS ALBERTO DE HERRERA',
    'SARAVIA BULEVAR APARICIO': 'BV APARICIO SARAVIA',
    'LARRAÑAGA AVENIDA DAMASO ANTONIO': 'AV DAMASO ANTONIO LARRAÑAGA',
    'FLORES GRAL AVENIDA': 'AV GRAL FLORES',
    'FLORES GRAL. AVENIDA': 'AV GRAL FLORES',
    'SAN MARTIN AVENIDA GRAL': 'AV GRAL SAN MARTIN',
    'ITALIA AVENIDA': 'AV ITALIA',
    '8 DE OCTUBRE AVENIDA': 'AV 8 DE OCTUBRE',
    'MILLAN AVENIDA': 'AV MILLAN',
    'LEZICA AVENIDA': 'AV LEZICA',
    'ISLAS CANARIAS AVENIDA': 'AV ISLAS CANARIAS',
    'JIMENEZ DE ARECHAGA DR JUSTINO': 'AV DR JUSTINO JIMENEZ DE ARECHAGA',
    'BATLLE BERRES AVENIDA LUIS': 'AV LUIS BATLLE BERRES',
    'ACOSTA Y LARA ARQ HORACIO': 'ARQ HORACIO ACOSTA Y LARA',
    'CARRASCO CAMINO': 'CAMI CARRASCO',
    '18 DE JULIO AVENIDA': 'AV 18 DE JULIO',
    'AGRACIADA AVENIDA': 'AV AGRACIADA',
    'BRASIL AVENIDA': 'AV BRASIL',
}

def normalizar_calle(nombre):
    """Normalizar nombre de calle para matching."""
    if pd.isna(nombre):
        return ''

    nombre = str(nombre).upper().strip()

    # Primero verificar mapeo manual
    nombre_limpio = nombre.replace('.', '').strip()
    if nombre_limpio in MAPEO_CALLES:
        return MAPEO_CALLES[nombre_limpio]

    # Remover tildes
    reemplazos = {'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'N'}
    for k, v in reemplazos.items():
        nombre = nombre.replace(k, v)

    # Remover puntuación
    nombre = re.sub(r'[.,]', '', nombre)

    # Normalizar tipos de vía (al final o al principio)
    # Primero, mover tipos del final al principio en formato estándar
    tipos = [
        (r'\bAVENIDA\b', 'AV'),
        (r'\bBULEVAR\b', 'BV'),
        (r'\bCAMINO\b', 'CAMI'),
        (r'\bRAMBLA\b', 'RBLA'),
        (r'\bPASAJE\b', 'PSJE'),
        (r'\bCALLE\b', ''),
        (r'\bGRAL\b', 'GRAL'),
        (r'\bGENERAL\b', 'GRAL'),
        (r'\bDOCTOR\b', 'DR'),
        (r'\bARQUITECTO\b', 'ARQ'),
        (r'\bARQ\b', 'ARQ'),
        (r'\bING\b', 'ING'),
        (r'\bCORONEL\b', 'CNEL'),
        (r'\bTENIENTE\b', 'TTE'),
        (r'\bCAPIT[AÁ]N\b', 'CAP'),
    ]

    for pattern, replacement in tipos:
        nombre = re.sub(pattern, replacement, nombre)

    # Eliminar espacios múltiples
    nombre = re.sub(r'\s+', ' ', nombre).strip()

    return nombre

def crear_variantes_calle(nombre):
    """Crear variantes del nombre para aumentar probabilidad de match."""
    variantes = set()
    variantes.add(nombre)

    # Si termina con tipo de vía, moverlo al principio
    tipos = ['AV', 'BV', 'RBLA', 'CAMI', 'PSJE']
    for tipo in tipos:
        if nombre.endswith(f' {tipo}'):
            base = nombre.replace(f' {tipo}', '').strip()
            variantes.add(f'{tipo} {base}')
        if nombre.startswith(f'{tipo} '):
            base = nombre.replace(f'{tipo} ', '').strip()
            variantes.add(f'{base} {tipo}')
            variantes.add(base)

    # Variantes con/sin títulos
    titulos = ['DR', 'GRAL', 'ARQ', 'ING', 'CNEL', 'TTE', 'CAP']
    for titulo in titulos:
        if f' {titulo} ' in nombre or nombre.startswith(f'{titulo} '):
            # Sin título
            sin_titulo = re.sub(rf'\b{titulo}\b\s*', '', nombre).strip()
            variantes.add(sin_titulo)
            # Título en otra posición
            parts = nombre.split()
            if titulo in parts:
                parts.remove(titulo)
                variantes.add(' '.join(parts))

    return variantes

def cargar_puertas():
    """Cargar y procesar base de puertas."""
    print("Cargando base de puertas...")
    with open(RAW_DIR / "wfs_puertas.geojson", 'r') as f:
        data = json.load(f)

    puertas = []
    for feat in data['features']:
        props = feat['properties']
        coords = feat['geometry']['coordinates'] if feat['geometry'] else [None, None]
        puertas.append({
            'nom_calle': props.get('nom_calle', ''),
            'num_puerta': props.get('num_puerta'),
            'lng': coords[0],
            'lat': coords[1]
        })

    df = pd.DataFrame(puertas)
    df['calle_norm'] = df['nom_calle'].apply(normalizar_calle)
    print(f"  {len(df):,} direcciones cargadas")
    return df

def crear_indice_puertas(puertas_df):
    """Crear índice de búsqueda con variantes."""
    print("Creando índice de búsqueda...")
    indice = {}

    for _, row in puertas_df.iterrows():
        if pd.isna(row['lat']) or pd.isna(row['lng']):
            continue

        calle = row['calle_norm']
        num = row['num_puerta']
        coords = (row['lat'], row['lng'])

        # Agregar todas las variantes
        variantes = crear_variantes_calle(calle)
        for var in variantes:
            key = f"{var}_{num}"
            if key not in indice:
                indice[key] = coords

    print(f"  {len(indice):,} claves en el índice")
    return indice

def geocodificar_arboles(arboles_df, indice):
    """Geocodificar árboles usando el índice."""
    print("\nGeocodificando árboles...")

    sin_coords = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"  {len(sin_coords):,} árboles sin coordenadas")

    # Normalizar calles de árboles
    sin_coords['calle_norm'] = sin_coords['Calle'].apply(normalizar_calle)

    encontrados = 0
    nuevas_coords = []

    for idx, row in sin_coords.iterrows():
        lat, lng = None, None
        calle = row['calle_norm']
        num = row['Numero']

        if pd.notna(num) and num > 0:
            num = int(num)
            # Probar con variantes de la calle
            variantes = crear_variantes_calle(calle)
            for var in variantes:
                key = f"{var}_{num}"
                if key in indice:
                    lat, lng = indice[key]
                    encontrados += 1
                    break

        nuevas_coords.append({'idx': idx, 'lat': lat, 'lng': lng})

    print(f"  Encontrados: {encontrados:,} ({encontrados/len(sin_coords)*100:.1f}%)")
    return nuevas_coords

def main():
    print("=" * 60)
    print("GEOCODIFICACIÓN USANDO BASE DE PUERTAS")
    print("=" * 60)

    # Cargar datos
    puertas_df = cargar_puertas()
    arboles_df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", low_memory=False)

    # Crear índice
    indice = crear_indice_puertas(puertas_df)

    # Geocodificar
    nuevas_coords = geocodificar_arboles(arboles_df, indice)

    # Aplicar nuevas coordenadas
    print("\nAplicando coordenadas...")
    for item in nuevas_coords:
        if item['lat'] is not None:
            arboles_df.at[item['idx'], 'lat'] = item['lat']
            arboles_df.at[item['idx'], 'lng'] = item['lng']

    # Estadísticas finales
    con_coords = arboles_df['lat'].notna().sum()
    sin_coords = arboles_df['lat'].isna().sum()

    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    print(f"Total árboles: {len(arboles_df):,}")
    print(f"Con coordenadas: {con_coords:,} ({con_coords/len(arboles_df)*100:.1f}%)")
    print(f"Sin coordenadas: {sin_coords:,} ({sin_coords/len(arboles_df)*100:.1f}%)")

    # Guardar
    output_path = PROCESSED_DIR / "arboles_montevideo_geo.csv"
    arboles_df.to_csv(output_path, index=False)
    print(f"\nGuardado en: {output_path}")

if __name__ == "__main__":
    main()
