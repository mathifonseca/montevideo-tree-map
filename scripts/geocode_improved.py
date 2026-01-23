#!/usr/bin/env python3
"""
Geocodificación mejorada de árboles usando múltiples estrategias:
1. Match exacto con base de puertas
2. Interpolación entre números cercanos
3. Ubicación por intersección de calles (para árboles sin número)
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

# Mapeo manual de calles problemáticas
MAPEO_CALLES = {
    'ARTIGAS BULEVAR GRAL': 'BV GRAL ARTIGAS',
    'BELLONI AVENIDA JOSE': 'AV JOSE BELLONI',
    'RIVERA AVENIDA GRAL': 'AV GRAL RIVERA',
    'BATLLE Y ORDOÑEZ BULEVAR JOSE': 'BV JOSE BATLLE Y ORDOÑEZ',
    'DE HERRERA AVENIDA LUIS ALBERTO': 'AV DR LUIS ALBERTO DE HERRERA',
    'SARAVIA BULEVAR APARICIO': 'BV APARICIO SARAVIA',
    'LARRAÑAGA AVENIDA DAMASO ANTONIO': 'AV DAMASO ANTONIO LARRANAGA',
    'LARRANAGA AVENIDA DAMASO ANTONIO': 'AV DAMASO ANTONIO LARRANAGA',
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
    'CARRASCO CAMINO': 'CNO CARRASCO',
    '18 DE JULIO AVENIDA': 'AV 18 DE JULIO',
    'AGRACIADA AVENIDA': 'AV AGRACIADA',
    'BRASIL AVENIDA': 'AV BRASIL',
    'VARELA AVENIDA JOSE PEDRO': 'AV JOSE PEDRO VARELA',
    'GARZON AVENIDA GRAL EUGENIO': 'AV GRAL EUGENIO GARZON',
    'GARZON AVENIDA GRAL. EUGENIO': 'AV GRAL EUGENIO GARZON',
    'DE MENDOZA AVENIDA DON PEDRO': 'AV DON PEDRO DE MENDOZA',
    'GOMEZ CAMINO GENERAL LEANDRO': 'CAMI GRAL LEANDRO GOMEZ',
    'GOMEZ CAMINO GRAL LEANDRO': 'CNO GRAL LEANDRO GOMEZ',
    'GOMEZ CAMINO GENERAL LEANDRO': 'CNO GRAL LEANDRO GOMEZ',
    'GALEANO CAMINO TTE': 'CNO TTE GALEANO',
    'GALEANO CAMINO TTE.': 'CNO TTE GALEANO',
    'DE PENA CAMINO CARLOS MARIA': 'CNO CARLOS MARIA DE PENA',
    'HORNOS GRAL': 'GRAL HORNOS',
    'HORNOS GRAL.': 'GRAL HORNOS',
    'TAJES GRAL MAXIMO': 'GRAL MAXIMO TAJES',
    'TAJES GRAL. MAXIMO': 'GRAL MAXIMO TAJES',
    'DE LA VEGA CARLOS': 'CARLOS DE LA VEGA',
    'ORTICOCHEA MARIA': 'MARIA ORTICOCHEA',
    'RAMIREZ AVENIDA DR CARLOS MARIA': 'AV CARLOS MARIA RAMIREZ',
    'RAMIREZ AVENIDA DR. CARLOS MARIA': 'AV CARLOS MARIA RAMIREZ',
    'RAIZ CAMINO CORONEL': 'CNO CORONEL RAIZ',
    'RAIZ CAMINO CNEL': 'CNO CORONEL RAIZ',
    'ALBERDI AVENIDA DR JUAN BAUTISTA': 'AV DR JUAN BAUTISTA ALBERDI',
    'ALBERDI AVENIDA DR. JUAN BAUTISTA': 'AV DR JUAN BAUTISTA ALBERDI',
    'DE IBARRA AVENIDA CAP LEAL': 'AV CAP LEAL DE IBARRA',
    'DE IBARRA AVENIDA CAP. LEAL': 'AV CAP LEAL DE IBARRA',
    'HERRERA Y OBES BULEVAR DR MANUEL': 'BV MANUEL HERRERA Y OBES',
    'HERRERA Y OBES BULEVAR DR. MANUEL': 'BV MANUEL HERRERA Y OBES',
    'SANTOS CAMINO GRAL MAXIMO': 'CNO GRAL MAXIMO SANTOS',
    'SANTOS CAMINO GRAL. MAXIMO': 'CNO GRAL MAXIMO SANTOS',
    'SERVANDO GOMEZ CAMINO': 'CNO SERVANDO GOMEZ',
    # Calles con nombres invertidos o espacios extra
    'LLUPES JOSE': 'JOSE LLUPES',
    'LAGUNA JULIAN': 'JULIAN LAGUNA',
    'NARINO GRAL': 'GRAL NARINO',
    'NARIÑO GRAL': 'GRAL NARINO',
    'NARIÑO GRAL.': 'GRAL NARINO',
    'REQUENA DR JOAQUIN': 'DR JOAQUIN REQUENA',
    'URIARTE MARIANO': 'MARIANO URIARTE',
    'PICCIOLI GERONIMO': 'GERONIMO PICCIOLI',
    'FRENCH GRAL': 'GRAL FRENCH',
    'MURILLO PEDRO DOMINGO': 'PEDRO DOMINGO MURILLO',
    'ZUM FELDE ALBERTO': 'ALBERTO ZUM FELDE',
    'PAULLIER JUAN': 'JUAN PAULLIER',
    'RIVAS AV SANTIAGO': 'AV SANTIAGO RIVAS',
    'GARIBALDI AV GRAL JOSE': 'AV GRAL GARIBALDI',
    'GARIBALDI AVENIDA GRAL JOSE': 'AV GRAL GARIBALDI',
    'RICALDONI AV DR AMERICO': 'AV DR AMERICO RICALDONI',
    'LOPEZ AV ESTANISLAO': 'AV ESTANISLAO LOPEZ',
    'MUNOZ GRAL AGUSTIN': 'GRAL AGUSTIN MUNOZ',
    'HARWOOD AV ALMIRANTE': 'AV ALM HARWOOD',
    'HARWOOD AVENIDA ALMIRANTE': 'AV ALM HARWOOD',
    'RAIZ CNO CORONEL': 'CNO CORONEL RAIZ',
    'RAIZ CNO CNEL': 'CNO CORONEL RAIZ',
    'LANZA DR AQUILES R': 'DR AQUILES R LANZA',
    'RODRIGUEZ CORREA ING MANUEL': 'ING MANUEL RODRIGUEZ CORREA',
    'PENCO DR JOSE MARIA': 'DR JOSE MARIA PENCO',
    'AMEGHINO': 'FLORENTINO AMEGHINO',
    'ROSSI AV DR SANTIN CARLOS': 'AV DR SANTIN CARLOS ROSSI',
    'ROSSI AVENIDA DR SANTIN CARLOS': 'AV DR SANTIN CARLOS ROSSI',
    'NERY AV DR CARLOS': 'AV DR CARLOS NERY',
    'NERY AVENIDA DR CARLOS': 'AV DR CARLOS NERY',
    'MOLINA JUAN CAYETANO': 'JUAN CAYETANO MOLINA',
    'FERRER SERRA DR SALVADOR': 'DR SALVADOR FERRER SERRA',
    'RIQUET BENITO': 'BENITO RIQUET',
    'MORELLI DR JUAN B': 'DR JUAN B MORELLI',
    'SILVA DR JOSE MARIA': 'DR JOSE MARIA SILVA',
    'DE DIOS PEZA JUAN': 'JUAN DE DIOS PEZA',
    'AGULLO PRESBITERO COSME': 'PRESB COSME AGULLO',
    'LACOSTA CAMINO CAP CORALIO C': 'CNO CAP CORALIO C LACOSTA',
    'DE UBEDA FRAY MANUEL': 'FRAY MANUEL DE UBEDA',
    'PONCE AVENIDA ING LUIS P': 'AV ING LUIS P PONCE',
    'PONCE AV ING LUIS P': 'AV ING LUIS P PONCE',
    'DE BOLIVAR AVENIDA SAN CARLOS': 'AV SAN CARLOS DE BOLIVAR',
    'DE BOLIVAR AV SAN CARLOS': 'AV SAN CARLOS DE BOLIVAR',
    'MARTINEZ DR MARTIN C': 'DR MARTIN C MARTINEZ',
    'GARCIA LAGOS IDELFONSO': 'DR HORACIO GARCIA LAGOS',
    'ACEVEDO DIAZ EDUARDO': 'ACEVEDO DIAZ',
    # Más mapeos de calles problemáticas
    'RAIZ CAMINO CORONEL': 'CNO CORONEL RAIZ',
    'RICALDONI AVENIDA DR AMERICO': 'AV DR AMERICO RICALDONI',
    'RODRIGUEZ CORREA ING MANUEL': 'ING MANUEL RODRIGUEZ CORREA',
    'MOLINA JUAN CAYETANO': 'JUAN C MOLINA',
    'RIQUET BENITO': 'ENRIQUETA COMPTE Y RIQUE',
    'AGULLO PBRO COSME': 'PBRO COSME AGULLO',
    'PAZ AVENIDA GRAL JOSE MARIA': 'AV GRAL JOSE MARIA PAZ',
    'PAZ AV GRAL JOSE MARIA': 'AV GRAL JOSE MARIA PAZ',
    'HABANA': 'LA HABANA',
    'COE COMODORO': 'CDRO COE',
    'COUTURE DR EDUARDO J': 'DR EDUARDO J COUTURE',
    'FIOL DE PEREDA ALEJANDRO': 'ALEJANDRO FIOL DE PEREDA',
    'DEL PINO GOBERNADOR': 'GOBERNADOR DEL PINO',
    'BLANES VIALE AVENIDA PEDRO': 'AV PEDRO BLANES VIALE',
    'BLANES VIALE AV PEDRO': 'AV PEDRO BLANES VIALE',
    'HERRERA Y REISSIG JULIO': 'AV JULIO HERRERA Y REISSIG',
    'DE LA TORRE LUIS': 'LUIS DE LA TORRE',
    'VIDAL DR JOSE MARIA': 'DR JOSE MARIA VIDAL',
    'BLANCO ACEVEDO DR EDUARDO': 'DR EDUARDO BLANCO ACEVEDO',
    'BERRO PEDRO FRANCISCO': 'PEDRO FRANCISCO BERRO',
    'LOPEZ CAMINO CARLOS A': 'CNO CARLOS A LOPEZ',
    'ARGERICH': 'CNEL LUIS ARGERICH',
    'CARAPE AVENIDA COSTANERA FELIPE': 'AV COSTANERA FELIPE CARAPE',
    'CARAPE AV COSTANERA FELIPE': 'AV COSTANERA FELIPE CARAPE',
    'ANZANI': 'FRANCISCO ANZANI',
    'MORQUIO AVENIDA DR LUIS': 'AV DR LUIS MORQUIO',
    'MORQUIO AV DR LUIS': 'AV DR LUIS MORQUIO',
    'ROLETTI GRAL JULIO AMADEO': 'GRAL JULIO AMADEO ROLETTI',
    'BLANCO BULEVAR JUAN BENITO': 'JUAN BENITO BLANCO',
    'BLANCO BV JUAN BENITO': 'JUAN BENITO BLANCO',
    'ERLICH DR PABLO': 'DR PABLO ERLICH',
    # Más calles problemáticas encontradas en análisis
    'LINIERS': 'SANTIAGO DE LINIERS',
    'RAMBLA ROOSEVELT FRANKLIN D': 'RBLA FRANKLIN D ROOSEVELT',
    'ROOSEVELT RAMBLA FRANKLIN D': 'RBLA FRANKLIN D ROOSEVELT',
    'GARCIA DE ZUÑIGA ING EDUARDO': 'ING EDUARDO GARCIA DE ZUÑIGA',
    'GARCIA DE ZUNIGA ING EDUARDO': 'ING EDUARDO GARCIA DE ZUÑIGA',
    'SANCHEZ FONTANS DR JOSE': 'DR JOSE SANCHEZ FONTANS',
    'DE GOUVEIA DE MICHELENA GRACIELA': 'GRACIELA DE GOUVEIA DE MICHELENA',
    'SUSVIELA DE RODRIGUEZ AGUEDA': 'AGUEDA SUSVIELA DE RODRIGUEZ',
    'MARTINEZ VIGIL DR CARLOS': 'DR CARLOS MARTINEZ VIGIL',
    'ERRO PASAJE ENRIQUE R': 'PSJE ENRIQUE R ERRO',
    'PITTINI PADRE PABLO': 'PBRO PABLO PITTINI',
    'TRAVIESO DR CARLOS': 'DR CARLOS TRAVIESO',
    'GARCIA PARDO DR JOSE MARIA': 'DR JOSE MARIA GARCIA PARDO',
    'TORRES JOAQUIN': 'JOAQUIN TORRES',
    'SOSA AVENIDA JULIO MARIA': 'AV JULIO MARIA SOSA',
    'SOSA AV JULIO MARIA': 'AV JULIO MARIA SOSA',
    'DE LA SOTA JUAN MANUEL': 'JUAN MANUEL DE LA SOTA',
    'MORALES DR CARLOS MARIA': 'DR CARLOS MARIA MORALES',
}


def normalizar_calle(nombre):
    """Normalizar nombre de calle para matching."""
    if pd.isna(nombre):
        return ''

    nombre = str(nombre).upper().strip()

    # Remover puntos y normalizar espacios múltiples
    nombre_limpio = re.sub(r'\s+', ' ', nombre.replace('.', '')).strip()

    # Verificar mapeo manual (con tildes originales)
    if nombre_limpio in MAPEO_CALLES:
        return MAPEO_CALLES[nombre_limpio]

    # Remover tildes
    reemplazos = {'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'N'}
    for k, v in reemplazos.items():
        nombre = nombre.replace(k, v)
        nombre_limpio = nombre_limpio.replace(k, v)

    # Verificar mapeo manual (sin tildes)
    if nombre_limpio in MAPEO_CALLES:
        return MAPEO_CALLES[nombre_limpio]

    # Remover puntuación
    nombre = re.sub(r'[.,]', '', nombre)

    # Normalizar tipos de vía
    tipos = [
        (r'\bAVENIDA\b', 'AV'),
        (r'\bBULEVAR\b', 'BV'),
        (r'\bCAMINO\b', 'CNO'),
        (r'\bRAMBLA\b', 'RBLA'),
        (r'\bPASAJE\b', 'PSJE'),
        (r'\bCALLE\b', ''),
        (r'\bGENERAL\b', 'GRAL'),
        (r'\bDOCTOR\b', 'DR'),
        (r'\bARQUITECTO\b', 'ARQ'),
        (r'\bCORONEL\b', 'CNEL'),
        (r'\bTENIENTE\b', 'TTE'),
        (r'\bCAPIT[AÁ]N\b', 'CAP'),
        (r'\bALMIRANTE\b', 'ALM'),
        (r'\bPRESB[IÍ]TERO\b', 'PRESB'),
    ]

    for pattern, replacement in tipos:
        nombre = re.sub(pattern, replacement, nombre)

    nombre = re.sub(r'\s+', ' ', nombre).strip()
    return nombre


def crear_variantes_calle(nombre):
    """Crear variantes del nombre para aumentar probabilidad de match."""
    if not nombre:
        return set()

    variantes = {nombre}

    # Si tiene tipo de vía, crear variantes con y sin él
    tipos = ['AV', 'BV', 'RBLA', 'CNO', 'CAMI', 'PSJE']
    for tipo in tipos:
        if nombre.startswith(f'{tipo} '):
            base = nombre[len(tipo)+1:]
            variantes.add(base)
            variantes.add(f'{base} {tipo}')
        if nombre.endswith(f' {tipo}'):
            base = nombre[:-len(tipo)-1]
            variantes.add(base)
            variantes.add(f'{tipo} {base}')

    # Variantes con/sin títulos
    titulos = ['DR', 'GRAL', 'ARQ', 'ING', 'CNEL', 'TTE', 'CAP']
    for titulo in titulos:
        if f' {titulo} ' in nombre:
            sin_titulo = nombre.replace(f' {titulo} ', ' ')
            variantes.add(sin_titulo)
        if nombre.startswith(f'{titulo} '):
            sin_titulo = nombre[len(titulo)+1:]
            variantes.add(sin_titulo)

    # Invertir orden de palabras (para nombres como "LLUPES JOSE" -> "JOSE LLUPES")
    partes = nombre.split()
    if len(partes) == 2:
        invertido = f'{partes[1]} {partes[0]}'
        variantes.add(invertido)
    elif len(partes) == 3:
        # Probar varias combinaciones
        variantes.add(f'{partes[1]} {partes[2]} {partes[0]}')
        variantes.add(f'{partes[2]} {partes[0]} {partes[1]}')
        variantes.add(f'{partes[0]} {partes[2]} {partes[1]}')

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
        if coords[0] is not None:
            puertas.append({
                'nom_calle': props.get('nom_calle', ''),
                'num_puerta': props.get('num_puerta'),
                'lng': coords[0],
                'lat': coords[1]
            })

    df = pd.DataFrame(puertas)
    df['calle_norm'] = df['nom_calle'].apply(normalizar_calle)
    df['num_puerta'] = pd.to_numeric(df['num_puerta'], errors='coerce')
    print(f"  {len(df):,} direcciones con coordenadas")
    return df


def crear_indices(puertas_df):
    """Crear índices para búsqueda eficiente."""
    print("Creando índices de búsqueda...")

    # Índice exacto: calle_num -> (lat, lng)
    indice_exacto = {}

    # Índice por calle: calle -> [(num, lat, lng), ...]
    indice_calle = defaultdict(list)

    for _, row in puertas_df.iterrows():
        calle = row['calle_norm']
        num = row['num_puerta']
        lat, lng = row['lat'], row['lng']

        if pd.notna(num) and num > 0:
            num = int(num)

            # Índice exacto con variantes
            variantes = crear_variantes_calle(calle)
            for var in variantes:
                key = f"{var}_{num}"
                if key not in indice_exacto:
                    indice_exacto[key] = (lat, lng)

            # Índice por calle (para interpolación)
            indice_calle[calle].append((num, lat, lng))
            for var in variantes:
                if var != calle:
                    indice_calle[var].append((num, lat, lng))

    # Ordenar cada calle por número
    for calle in indice_calle:
        indice_calle[calle].sort(key=lambda x: x[0])

    print(f"  {len(indice_exacto):,} entradas exactas")
    print(f"  {len(indice_calle):,} calles indexadas")

    return indice_exacto, indice_calle


def crear_indice_intersecciones(puertas_df):
    """Crear índice de intersecciones de calles."""
    print("Creando índice de intersecciones...")

    # Agrupar por calle y encontrar rangos
    calles = defaultdict(list)
    for _, row in puertas_df.iterrows():
        calle = row['calle_norm']
        lat, lng = row['lat'], row['lng']
        calles[calle].append((lat, lng))

    # Para cada calle, guardar el centroide de cada segmento
    # Esto es una aproximación - en un caso real usaríamos geometría real
    print(f"  {len(calles):,} calles procesadas")
    return calles


def interpolar_posicion(num_buscado, puntos):
    """Interpolar posición entre puntos conocidos."""
    if not puntos:
        return None, None

    # Encontrar los dos puntos más cercanos
    puntos_ord = sorted(puntos, key=lambda x: x[0])

    # Si está antes del primer punto o después del último, usar el más cercano
    if num_buscado <= puntos_ord[0][0]:
        return puntos_ord[0][1], puntos_ord[0][2]
    if num_buscado >= puntos_ord[-1][0]:
        return puntos_ord[-1][1], puntos_ord[-1][2]

    # Encontrar puntos que lo rodean
    for i in range(len(puntos_ord) - 1):
        n1, lat1, lng1 = puntos_ord[i]
        n2, lat2, lng2 = puntos_ord[i + 1]

        if n1 <= num_buscado <= n2:
            # Interpolar
            if n2 == n1:
                return lat1, lng1

            t = (num_buscado - n1) / (n2 - n1)
            lat = lat1 + t * (lat2 - lat1)
            lng = lng1 + t * (lng2 - lng1)
            return lat, lng

    return None, None


def geocodificar_por_numero(row, indice_exacto, indice_calle):
    """Geocodificar usando número de puerta."""
    calle = normalizar_calle(row['Calle'])
    num = row['Numero']

    if pd.isna(num) or num <= 0:
        return None, None, None

    num = int(num)
    variantes = crear_variantes_calle(calle)

    # Intento 1: Match exacto
    for var in variantes:
        key = f"{var}_{num}"
        if key in indice_exacto:
            lat, lng = indice_exacto[key]
            return lat, lng, 'exacto'

    # Intento 2: Interpolación
    for var in variantes:
        if var in indice_calle and len(indice_calle[var]) >= 2:
            lat, lng = interpolar_posicion(num, indice_calle[var])
            if lat is not None:
                return lat, lng, 'interpolado'

    return None, None, None


def geocodificar_por_interseccion(row, indice_calle):
    """Geocodificar usando intersección de calles."""
    calle = normalizar_calle(row['Calle'])
    entre = normalizar_calle(row.get('Entre', ''))
    y_calle = normalizar_calle(row.get('Y', ''))

    if not calle or (not entre and not y_calle):
        return None, None, None

    variantes_calle = crear_variantes_calle(calle)

    # Buscar puntos de la calle principal
    puntos_calle = []
    for var in variantes_calle:
        if var in indice_calle:
            puntos_calle.extend(indice_calle[var])
            break

    if not puntos_calle:
        return None, None, None

    # Buscar puntos de las transversales
    puntos_entre = []
    puntos_y = []

    if entre:
        for var in crear_variantes_calle(entre):
            if var in indice_calle:
                puntos_entre.extend(indice_calle[var])
                break

    if y_calle:
        for var in crear_variantes_calle(y_calle):
            if var in indice_calle:
                puntos_y.extend(indice_calle[var])
                break

    # Estrategia: encontrar el punto de la calle principal más cercano
    # a las transversales
    mejor_lat, mejor_lng = None, None
    mejor_dist = float('inf')

    # Calcular centroide de transversales como referencia
    ref_points = []
    if puntos_entre:
        lat_e = np.mean([p[1] for p in puntos_entre])
        lng_e = np.mean([p[2] for p in puntos_entre])
        ref_points.append((lat_e, lng_e))
    if puntos_y:
        lat_y = np.mean([p[1] for p in puntos_y])
        lng_y = np.mean([p[2] for p in puntos_y])
        ref_points.append((lat_y, lng_y))

    if not ref_points:
        # Sin transversales, usar centroide de la calle
        lat = np.mean([p[1] for p in puntos_calle])
        lng = np.mean([p[2] for p in puntos_calle])
        return lat, lng, 'centroide_calle'

    # Centroide de referencias
    ref_lat = np.mean([p[0] for p in ref_points])
    ref_lng = np.mean([p[1] for p in ref_points])

    # Encontrar punto más cercano de la calle principal
    for _, lat, lng in puntos_calle:
        dist = (lat - ref_lat)**2 + (lng - ref_lng)**2
        if dist < mejor_dist:
            mejor_dist = dist
            mejor_lat = lat
            mejor_lng = lng

    if mejor_lat is not None:
        return mejor_lat, mejor_lng, 'interseccion'

    return None, None, None


def main():
    print("=" * 60)
    print("GEOCODIFICACIÓN MEJORADA")
    print("=" * 60)

    # Cargar datos
    puertas_df = cargar_puertas()
    arboles_df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", low_memory=False)

    print(f"\nTotal árboles: {len(arboles_df):,}")
    ya_tienen = arboles_df['lat'].notna().sum()
    print(f"Ya tienen coordenadas: {ya_tienen:,}")

    # Crear índices
    indice_exacto, indice_calle = crear_indices(puertas_df)

    # Procesar solo los que no tienen coordenadas
    sin_coords = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"\nProcesando {len(sin_coords):,} árboles sin coordenadas...")

    # Estadísticas
    stats = {'exacto': 0, 'interpolado': 0, 'interseccion': 0, 'centroide_calle': 0, 'no_encontrado': 0}

    # Geocodificar
    nuevas_coords = []
    for idx, row in sin_coords.iterrows():
        lat, lng, metodo = None, None, None

        # Primero intentar por número
        if pd.notna(row['Numero']) and row['Numero'] > 0:
            lat, lng, metodo = geocodificar_por_numero(row, indice_exacto, indice_calle)

        # Si no funcionó, intentar por intersección
        if lat is None:
            lat, lng, metodo = geocodificar_por_interseccion(row, indice_calle)

        if lat is not None:
            stats[metodo] += 1
            nuevas_coords.append({'idx': idx, 'lat': lat, 'lng': lng})
        else:
            stats['no_encontrado'] += 1

    # Aplicar coordenadas de primera ronda
    print("\nAplicando coordenadas (ronda 1)...")
    for item in nuevas_coords:
        arboles_df.at[item['idx'], 'lat'] = item['lat']
        arboles_df.at[item['idx'], 'lng'] = item['lng']

    # RONDA 2: Vecinos de cuadra
    # Para los que aún no tienen coords, buscar otros árboles en la misma cuadra
    print("\n" + "-" * 60)
    print("RONDA 2: Vecinos de cuadra")
    print("-" * 60)

    sin_coords_r2 = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"Árboles sin coordenadas: {len(sin_coords_r2):,}")

    # Crear índice de cuadras con coordenadas
    con_coords_df = arboles_df[arboles_df['lat'].notna()].copy()
    con_coords_df['cuadra_key'] = (
        con_coords_df['Calle'].fillna('').astype(str) + '|' +
        con_coords_df['Entre'].fillna('').astype(str) + '|' +
        con_coords_df['Y'].fillna('').astype(str)
    )

    # Agrupar por cuadra
    cuadras = con_coords_df.groupby('cuadra_key').agg({
        'lat': 'mean',
        'lng': 'mean'
    }).to_dict('index')

    stats['vecino_cuadra'] = 0
    nuevas_coords_r2 = []

    for idx, row in sin_coords_r2.iterrows():
        cuadra_key = f"{row['Calle'] or ''}|{row['Entre'] or ''}|{row['Y'] or ''}"
        if cuadra_key in cuadras:
            lat = cuadras[cuadra_key]['lat']
            lng = cuadras[cuadra_key]['lng']
            nuevas_coords_r2.append({'idx': idx, 'lat': lat, 'lng': lng})
            stats['vecino_cuadra'] += 1

    print(f"Geocodificados por vecino de cuadra: {stats['vecino_cuadra']:,}")

    for item in nuevas_coords_r2:
        arboles_df.at[item['idx'], 'lat'] = item['lat']
        arboles_df.at[item['idx'], 'lng'] = item['lng']

    # RONDA 3: Centroide por CCZ + Calle
    # Para los que aún faltan, usar el centroide de árboles de la misma calle en el mismo CCZ
    print("\n" + "-" * 60)
    print("RONDA 3: Centroide por CCZ + Calle")
    print("-" * 60)

    sin_coords_r3 = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"Árboles sin coordenadas: {len(sin_coords_r3):,}")

    con_coords_df = arboles_df[arboles_df['lat'].notna()].copy()
    con_coords_df['ccz_calle'] = (
        con_coords_df['CCZ'].fillna(0).astype(int).astype(str) + '|' +
        con_coords_df['Calle'].fillna('').astype(str)
    )

    ccz_calles = con_coords_df.groupby('ccz_calle').agg({
        'lat': 'mean',
        'lng': 'mean'
    }).to_dict('index')

    stats['centroide_ccz_calle'] = 0
    nuevas_coords_r3 = []

    for idx, row in sin_coords_r3.iterrows():
        ccz_calle = f"{int(row['CCZ']) if pd.notna(row['CCZ']) else 0}|{row['Calle'] or ''}"
        if ccz_calle in ccz_calles:
            lat = ccz_calles[ccz_calle]['lat']
            lng = ccz_calles[ccz_calle]['lng']
            nuevas_coords_r3.append({'idx': idx, 'lat': lat, 'lng': lng})
            stats['centroide_ccz_calle'] += 1

    print(f"Geocodificados por centroide CCZ+Calle: {stats['centroide_ccz_calle']:,}")

    for item in nuevas_coords_r3:
        arboles_df.at[item['idx'], 'lat'] = item['lat']
        arboles_df.at[item['idx'], 'lng'] = item['lng']

    # RONDA 4: Centroide por CCZ (último recurso)
    print("\n" + "-" * 60)
    print("RONDA 4: Centroide por CCZ")
    print("-" * 60)

    sin_coords_r4 = arboles_df[arboles_df['lat'].isna()].copy()
    print(f"Árboles sin coordenadas: {len(sin_coords_r4):,}")

    con_coords_df = arboles_df[arboles_df['lat'].notna()].copy()
    ccz_centroides = con_coords_df.groupby('CCZ').agg({
        'lat': 'mean',
        'lng': 'mean'
    }).to_dict('index')

    stats['centroide_ccz'] = 0
    nuevas_coords_r4 = []

    for idx, row in sin_coords_r4.iterrows():
        ccz = row['CCZ']
        if pd.notna(ccz) and ccz in ccz_centroides:
            lat = ccz_centroides[ccz]['lat']
            lng = ccz_centroides[ccz]['lng']
            nuevas_coords_r4.append({'idx': idx, 'lat': lat, 'lng': lng})
            stats['centroide_ccz'] += 1

    print(f"Geocodificados por centroide CCZ: {stats['centroide_ccz']:,}")

    for item in nuevas_coords_r4:
        arboles_df.at[item['idx'], 'lat'] = item['lat']
        arboles_df.at[item['idx'], 'lng'] = item['lng']

    # Actualizar no_encontrado
    stats['no_encontrado'] = arboles_df['lat'].isna().sum()

    # Estadísticas finales
    print("\n" + "=" * 60)
    print("ESTADÍSTICAS DE GEOCODIFICACIÓN")
    print("=" * 60)
    print(f"  Match exacto:         {stats['exacto']:,}")
    print(f"  Interpolado:          {stats['interpolado']:,}")
    print(f"  Por intersección:     {stats['interseccion']:,}")
    print(f"  Centroide calle:      {stats['centroide_calle']:,}")
    print(f"  Vecino de cuadra:     {stats['vecino_cuadra']:,}")
    print(f"  Centroide CCZ+Calle:  {stats['centroide_ccz_calle']:,}")
    print(f"  Centroide CCZ:        {stats['centroide_ccz']:,}")
    print(f"  No encontrado:        {stats['no_encontrado']:,}")

    con_coords = arboles_df['lat'].notna().sum()
    sin_coords_final = arboles_df['lat'].isna().sum()

    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    print(f"Total árboles: {len(arboles_df):,}")
    print(f"Con coordenadas: {con_coords:,} ({con_coords/len(arboles_df)*100:.1f}%)")
    print(f"Sin coordenadas: {sin_coords_final:,} ({sin_coords_final/len(arboles_df)*100:.1f}%)")

    # Guardar
    output_path = PROCESSED_DIR / "arboles_montevideo_geo.csv"
    arboles_df.to_csv(output_path, index=False)
    print(f"\nGuardado en: {output_path}")


if __name__ == "__main__":
    main()
