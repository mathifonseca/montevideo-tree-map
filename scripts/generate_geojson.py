#!/usr/bin/env python3
"""
Generar GeoJSON optimizado para visualización en mapa.
"""

import pandas as pd
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"

def main():
    print("Cargando datos...")
    df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", low_memory=False)

    print(f"Total árboles: {len(df):,}")

    # Filtrar solo los que tienen coordenadas válidas
    df = df[df['lat'].notna() & df['lng'].notna()]
    print(f"Con coordenadas válidas: {len(df):,}")

    # Crear features
    features = []
    for _, row in df.iterrows():
        # Propiedades relevantes para el mapa
        props = {
            'id': int(row['Arbol']) if pd.notna(row['Arbol']) else None,
            'nombre_cientifico': row['Nombre científico'] if pd.notna(row['Nombre científico']) else None,
            'nombre_comun': row['Nombre común'] if pd.notna(row['Nombre común']) else None,
            'calle': row['Calle'] if pd.notna(row['Calle']) else None,
            'numero': int(row['Numero']) if pd.notna(row['Numero']) and row['Numero'] > 0 else None,
            'ccz': int(row['CCZ']) if pd.notna(row['CCZ']) else None,
            'altura': float(row['Altura']) if pd.notna(row['Altura']) else None,
            'cap': float(row['CAP']) if pd.notna(row['CAP']) else None,
            'diametro_copa': float(row['Diametro Copa']) if pd.notna(row['Diametro Copa']) else None,
            'estado': int(row['EV']) if pd.notna(row['EV']) else None,
        }

        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [float(row['lng']), float(row['lat'])]
            },
            'properties': props
        }
        features.append(feature)

    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    # Guardar
    output_path = PROCESSED_DIR / "arboles.geojson"
    print(f"\nGuardando {len(features):,} árboles...")

    with open(output_path, 'w') as f:
        json.dump(geojson, f)

    size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"Guardado en: {output_path}")
    print(f"Tamaño: {size_mb:.1f} MB")

    # También generar lista de especies únicas
    especies = df['Nombre común'].dropna().unique()
    especies = sorted([e for e in especies if e])

    especies_path = PROCESSED_DIR / "especies.json"
    with open(especies_path, 'w') as f:
        json.dump(especies, f, ensure_ascii=False, indent=2)

    print(f"\nEspecies únicas: {len(especies)}")
    print(f"Guardado en: {especies_path}")

if __name__ == "__main__":
    main()
