#!/usr/bin/env python3
"""
Geocodificación final de árboles con matching inteligente de calles.
"""

import json
import pandas as pd
import numpy as np
import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"


def normalizar_base(nombre):
    """Normalización base de nombre de calle."""
    if pd.isna(nombre):
        return ''

    nombre = str(nombre).upper().strip()

    # Remover tildes
    for a, b in [('Á','A'),('É','E'),('Í','I'),('Ó','O'),('Ú','U'),('Ñ','N')]:
        nombre = nombre.replace(a, b)

    # Remover puntuación y normalizar espacios
    nombre = re.sub(r'[.,()]', ' ', nombre)
    nombre = re.sub(r'\s+', ' ', nombre).strip()

    # Normalizar abreviaciones
    reemplazos = [
        (r'\bAVENIDA\b', 'AV'), (r'\bBULEVAR\b', 'BV'), (r'\bCAMINO\b', 'CNO'),
        (r'\bRAMBLA\b', 'RBLA'), (r'\bPASAJE\b', 'PSJE'), (r'\bCALLE\b', ''),
        (r'\bGENERAL\b', 'GRAL'), (r'\bDOCTOR\b', 'DR'), (r'\bARQUITECTO\b', 'ARQ'),
        (r'\bINGENIERO\b', 'ING'), (r'\bCORONEL\b', 'CNEL'), (r'\bTENIENTE\b', 'TTE'),
        (r'\bCAPITAN\b', 'CAP'), (r'\bALMIRANTE\b', 'ALM'), (r'\bPRESBITERO\b', 'PBRO'),
        (r'\bCOMANDANTE\b', 'CTE'), (r'\bCOMODORO\b', 'CDRO'), (r'\bGOBERNADOR\b', 'GOB'),
        (r'\bPRESIDENTE\b', 'PTE'), (r'\bMARISCAL\b', 'MCAL'), (r'\bPROFESOR\b', 'PROF'),
        (r'\bMAESTRO\b', 'MTRO'), (r'\bPBTRO\b', 'PBRO'),
    ]
    for pattern, repl in reemplazos:
        nombre = re.sub(pattern, repl, nombre)

    return re.sub(r'\s+', ' ', nombre).strip()


def extraer_palabras_significativas(nombre):
    """Extraer palabras significativas (no títulos/tipos de vía)."""
    palabras = nombre.split()
    no_significativas = {
        'AV', 'BV', 'CNO', 'RBLA', 'PSJE', 'DR', 'GRAL', 'ING', 'ARQ',
        'CNEL', 'TTE', 'CAP', 'ALM', 'PBRO', 'CTE', 'CDRO', 'GOB', 'PTE',
        'DE', 'DEL', 'LA', 'LOS', 'LAS', 'Y', 'DON', 'DONA', 'MCAL',
        'PROF', 'MTRO', 'NAL', 'SIR', 'FRAY', 'SAN', 'SANTA'
    }
    return [p for p in palabras if p not in no_significativas and len(p) > 1]


def calcular_similitud(palabras1, palabras2):
    """Calcular similitud entre dos conjuntos de palabras."""
    if not palabras1 or not palabras2:
        return 0

    set1 = set(palabras1)
    set2 = set(palabras2)

    # Coincidencias exactas
    comunes = set1 & set2

    # Si todas las palabras significativas coinciden, es un match perfecto
    if set1 == set2:
        return 1.0

    # Similitud Jaccard ajustada
    union = set1 | set2
    if not union:
        return 0

    return len(comunes) / len(union)


def buscar_mejor_match(calle_norm, palabras_calle, indice_palabras):
    """Buscar el mejor match para una calle en el índice."""
    if not palabras_calle:
        return None, 0

    candidatos = {}

    # Buscar calles que comparten al menos una palabra significativa
    for palabra in palabras_calle:
        if palabra in indice_palabras:
            for calle, palabras in indice_palabras[palabra]:
                candidatos[calle] = palabras

    if not candidatos:
        return None, 0

    mejor_match = None
    mejor_score = 0

    for candidato, palabras_candidato in candidatos.items():
        score = calcular_similitud(palabras_calle, palabras_candidato)

        # Bonus si tienen mismo número de palabras
        if len(palabras_calle) == len(palabras_candidato):
            score += 0.05

        if score > mejor_score:
            mejor_score = score
            mejor_match = candidato

    return mejor_match, mejor_score


def cargar_puertas():
    """Cargar base de puertas y crear índices."""
    print("Cargando base de puertas...")
    with open(RAW_DIR / "wfs_puertas.geojson", 'r') as f:
        data = json.load(f)

    # Índice: calle_norm -> [(num, lat, lng), ...]
    indice_calles = defaultdict(list)
    # Índice: palabra -> [(calle_norm, palabras), ...]
    indice_palabras = defaultdict(list)
    # Set de calles normalizadas
    calles_set = set()

    for feat in data['features']:
        props = feat['properties']
        coords = feat['geometry']['coordinates'] if feat['geometry'] else None

        if not coords or coords[0] is None:
            continue

        calle_orig = props.get('nom_calle', '')
        calle_norm = normalizar_base(calle_orig)
        num = props.get('num_puerta')

        if not calle_norm:
            continue

        calles_set.add(calle_norm)

        if num and int(num) > 0:
            indice_calles[calle_norm].append((int(num), coords[1], coords[0]))

    # Crear índice de palabras
    for calle in calles_set:
        palabras = extraer_palabras_significativas(calle)
        for palabra in palabras:
            indice_palabras[palabra].append((calle, palabras))

    # Ordenar cada calle por número
    for calle in indice_calles:
        indice_calles[calle].sort(key=lambda x: x[0])

    print(f"  {len(calles_set):,} calles únicas")
    print(f"  {sum(len(v) for v in indice_calles.values()):,} direcciones")

    return indice_calles, indice_palabras, calles_set


def interpolar_posicion(num_buscado, puntos):
    """Interpolar posición entre puntos conocidos."""
    if not puntos:
        return None, None

    puntos_ord = sorted(puntos, key=lambda x: x[0])

    if num_buscado <= puntos_ord[0][0]:
        return puntos_ord[0][1], puntos_ord[0][2]
    if num_buscado >= puntos_ord[-1][0]:
        return puntos_ord[-1][1], puntos_ord[-1][2]

    for i in range(len(puntos_ord) - 1):
        n1, lat1, lng1 = puntos_ord[i]
        n2, lat2, lng2 = puntos_ord[i + 1]

        if n1 <= num_buscado <= n2:
            if n2 == n1:
                return lat1, lng1
            t = (num_buscado - n1) / (n2 - n1)
            return lat1 + t * (lat2 - lat1), lng1 + t * (lng2 - lng1)

    return None, None


def geocodificar_arbol(row, indice_calles, indice_palabras, calles_set, cache_matches):
    """Geocodificar un árbol."""
    calle_norm = normalizar_base(row['Calle'])

    if not calle_norm:
        return None, None, None

    # Buscar calle en cache o encontrar match
    if calle_norm in cache_matches:
        calle_match = cache_matches[calle_norm]
    elif calle_norm in calles_set:
        calle_match = calle_norm
        cache_matches[calle_norm] = calle_norm
    else:
        palabras = extraer_palabras_significativas(calle_norm)
        calle_match, score = buscar_mejor_match(calle_norm, palabras, indice_palabras)
        if score >= 0.5:  # Umbral de similitud
            cache_matches[calle_norm] = calle_match
        else:
            cache_matches[calle_norm] = None
            calle_match = None

    if not calle_match or calle_match not in indice_calles:
        return None, None, None

    puntos = indice_calles[calle_match]
    num = row['Numero']

    # Si tiene número, interpolar
    if pd.notna(num) and num > 0:
        lat, lng = interpolar_posicion(int(num), puntos)
        if lat:
            return lat, lng, 'numero'

    # Si no, usar centroide de la calle
    if puntos:
        lats = [p[1] for p in puntos]
        lngs = [p[2] for p in puntos]
        return np.mean(lats), np.mean(lngs), 'centroide_calle'

    return None, None, None


def main():
    print("=" * 70)
    print("GEOCODIFICACIÓN FINAL")
    print("=" * 70)

    # Cargar datos
    indice_calles, indice_palabras, calles_set = cargar_puertas()
    arboles_df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", low_memory=False)

    print(f"\nTotal árboles: {len(arboles_df):,}")
    ya_tienen = arboles_df['lat'].notna().sum()
    print(f"Ya tienen coordenadas: {ya_tienen:,}")

    # Procesar solo los que no tienen coordenadas
    sin_coords_mask = arboles_df['lat'].isna()
    sin_coords_idx = arboles_df[sin_coords_mask].index
    print(f"Por procesar: {len(sin_coords_idx):,}")

    # Cache de matches de calles
    cache_matches = {}

    # Estadísticas
    stats = {'numero': 0, 'centroide_calle': 0, 'no_encontrado': 0}

    # Geocodificar
    print("\nGeocodificando (Ronda 1: match de calles)...")
    for idx in sin_coords_idx:
        row = arboles_df.loc[idx]
        lat, lng, metodo = geocodificar_arbol(row, indice_calles, indice_palabras, calles_set, cache_matches)

        if lat:
            arboles_df.at[idx, 'lat'] = lat
            arboles_df.at[idx, 'lng'] = lng
            stats[metodo] += 1
        else:
            stats['no_encontrado'] += 1

    print(f"  Por número: {stats['numero']:,}")
    print(f"  Centroide calle: {stats['centroide_calle']:,}")
    print(f"  No encontrado: {stats['no_encontrado']:,}")

    # Ronda 2: Vecinos de cuadra
    print("\nGeocodificando (Ronda 2: vecinos de cuadra)...")
    sin_coords_r2 = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"  Pendientes: {len(sin_coords_r2):,}")

    con_coords_df = arboles_df[arboles_df['lat'].notna()].copy()
    con_coords_df['cuadra'] = (
        con_coords_df['Calle'].fillna('').astype(str) + '|' +
        con_coords_df['Entre'].fillna('').astype(str) + '|' +
        con_coords_df['Y'].fillna('').astype(str)
    )

    cuadras = con_coords_df.groupby('cuadra').agg({'lat': 'mean', 'lng': 'mean'}).to_dict('index')

    stats['vecino_cuadra'] = 0
    for idx, row in sin_coords_r2.iterrows():
        cuadra = f"{row['Calle'] or ''}|{row['Entre'] or ''}|{row['Y'] or ''}"
        if cuadra in cuadras:
            arboles_df.at[idx, 'lat'] = cuadras[cuadra]['lat']
            arboles_df.at[idx, 'lng'] = cuadras[cuadra]['lng']
            stats['vecino_cuadra'] += 1

    print(f"  Geocodificados: {stats['vecino_cuadra']:,}")

    # Ronda 3: Vecinos de calle en mismo CCZ
    print("\nGeocodificando (Ronda 3: misma calle en CCZ)...")
    sin_coords_r3 = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"  Pendientes: {len(sin_coords_r3):,}")

    con_coords_df = arboles_df[arboles_df['lat'].notna()].copy()
    con_coords_df['ccz_calle'] = (
        con_coords_df['CCZ'].fillna(0).astype(int).astype(str) + '|' +
        con_coords_df['Calle'].fillna('').astype(str)
    )

    ccz_calles = con_coords_df.groupby('ccz_calle').agg({'lat': 'mean', 'lng': 'mean'}).to_dict('index')

    stats['ccz_calle'] = 0
    for idx, row in sin_coords_r3.iterrows():
        key = f"{int(row['CCZ']) if pd.notna(row['CCZ']) else 0}|{row['Calle'] or ''}"
        if key in ccz_calles:
            arboles_df.at[idx, 'lat'] = ccz_calles[key]['lat']
            arboles_df.at[idx, 'lng'] = ccz_calles[key]['lng']
            stats['ccz_calle'] += 1

    print(f"  Geocodificados: {stats['ccz_calle']:,}")

    # Resultado final
    sin_final = arboles_df['lat'].isna().sum()
    con_final = arboles_df['lat'].notna().sum()

    print("\n" + "=" * 70)
    print("RESULTADO FINAL")
    print("=" * 70)
    print(f"Total árboles: {len(arboles_df):,}")
    print(f"Con coordenadas: {con_final:,} ({con_final/len(arboles_df)*100:.1f}%)")
    print(f"Sin coordenadas: {sin_final:,} ({sin_final/len(arboles_df)*100:.1f}%)")

    if sin_final > 0:
        print(f"\nCalles sin geocodificar (top 20):")
        sin_df = arboles_df[arboles_df['lat'].isna()]
        for calle, count in sin_df['Calle'].value_counts().head(20).items():
            print(f"  [{count:4}] {calle}")

    # Guardar
    output_path = PROCESSED_DIR / "arboles_montevideo_geo.csv"
    arboles_df.to_csv(output_path, index=False)
    print(f"\nGuardado en: {output_path}")


if __name__ == "__main__":
    main()
