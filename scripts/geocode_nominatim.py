#!/usr/bin/env python3
"""
Geocodificar árboles restantes usando Nominatim (OpenStreetMap).
"""

import pandas as pd
import requests
import time
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "ArboladoMVD/1.0 (geocoding urban trees in Montevideo)"}


def geocodificar_nominatim(calle, numero=None, entre=None):
    """Geocodificar una dirección usando Nominatim."""
    # Construir query
    if numero and numero > 0:
        query = f"{calle} {int(numero)}, Montevideo, Uruguay"
    elif entre:
        query = f"{calle} y {entre}, Montevideo, Uruguay"
    else:
        query = f"{calle}, Montevideo, Uruguay"

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "uy",
    }

    try:
        response = requests.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10)
        response.raise_for_status()
        results = response.json()

        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        pass

    return None, None


def main():
    print("=" * 60)
    print("GEOCODIFICACIÓN CON NOMINATIM")
    print("=" * 60)

    # Cargar datos
    df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", low_memory=False)

    sin_coords = df[df['lat'].isna()].copy()
    print(f"Árboles sin coordenadas: {len(sin_coords)}")

    if len(sin_coords) == 0:
        print("No hay árboles pendientes.")
        return

    # Agrupar por calle para no repetir queries
    calles_unicas = sin_coords.groupby('Calle').agg({
        'Numero': 'first',
        'Entre': 'first'
    }).reset_index()

    print(f"Calles únicas a geocodificar: {len(calles_unicas)}")
    print("\nIniciando geocodificación (1 req/segundo por rate limit)...\n")

    resultados = {}
    encontrados = 0

    for i, row in calles_unicas.iterrows():
        calle = row['Calle']
        numero = row['Numero'] if pd.notna(row['Numero']) else None
        entre = row['Entre'] if pd.notna(row['Entre']) else None

        lat, lng = geocodificar_nominatim(calle, numero, entre)

        if lat:
            resultados[calle] = (lat, lng)
            encontrados += 1
            print(f"  ✓ {calle[:50]}")
        else:
            # Intentar solo con nombre de calle
            lat, lng = geocodificar_nominatim(calle)
            if lat:
                resultados[calle] = (lat, lng)
                encontrados += 1
                print(f"  ✓ {calle[:50]} (solo calle)")
            else:
                print(f"  ✗ {calle[:50]}")

        # Rate limit: 1 request por segundo
        time.sleep(1.1)

    print(f"\nEncontrados: {encontrados}/{len(calles_unicas)}")

    # Aplicar coordenadas
    aplicados = 0
    for idx, row in sin_coords.iterrows():
        if row['Calle'] in resultados:
            lat, lng = resultados[row['Calle']]
            df.at[idx, 'lat'] = lat
            df.at[idx, 'lng'] = lng
            aplicados += 1

    print(f"Árboles geocodificados: {aplicados}")

    # Estadísticas finales
    con_coords = df['lat'].notna().sum()
    sin_coords_final = df['lat'].isna().sum()

    print("\n" + "=" * 60)
    print("RESULTADO FINAL")
    print("=" * 60)
    print(f"Total árboles: {len(df):,}")
    print(f"Con coordenadas: {con_coords:,} ({con_coords/len(df)*100:.2f}%)")
    print(f"Sin coordenadas: {sin_coords_final:,} ({sin_coords_final/len(df)*100:.2f}%)")

    if sin_coords_final > 0:
        print(f"\nCalles aún sin geocodificar:")
        sin_df = df[df['lat'].isna()]
        for calle, count in sin_df['Calle'].value_counts().items():
            print(f"  [{count:3}] {calle}")

    # Guardar
    df.to_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", index=False)
    print(f"\nGuardado.")


if __name__ == "__main__":
    main()
