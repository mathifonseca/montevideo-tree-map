#!/usr/bin/env python3
"""
Merge del censo de arbolado con los datos georeferenciados del WFS.
"""

import json
import pandas as pd
from pathlib import Path

# Rutas
BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

def load_wfs_data():
    """Cargar datos del WFS y extraer coordenadas."""
    print("Cargando WFS...")
    with open(RAW_DIR / "wfs_arboles.geojson", 'r') as f:
        wfs_data = json.load(f)

    rows = []
    for f in wfs_data['features']:
        row = f['properties'].copy()
        if f['geometry'] and f['geometry']['coordinates']:
            row['lng'] = f['geometry']['coordinates'][0]
            row['lat'] = f['geometry']['coordinates'][1]
        rows.append(row)

    wfs_df = pd.DataFrame(rows)
    print(f"  {len(wfs_df):,} árboles en WFS")
    return wfs_df

def load_censo_data():
    """Cargar datos del censo procesado."""
    print("Cargando censo...")
    censo_df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo.csv", low_memory=False)
    print(f"  {len(censo_df):,} árboles en censo")
    return censo_df

def merge_datasets(censo_df, wfs_df):
    """Mergear censo con coordenadas del WFS."""
    print("\nMergeando datasets...")

    # Preparar WFS - solo necesitamos ID y coordenadas
    wfs_coords = wfs_df[['arbol', 'lat', 'lng', 'nom_comun']].copy()
    wfs_coords = wfs_coords.rename(columns={
        'arbol': 'Arbol',
        'nom_comun': 'Nombre común'
    })

    # Asegurar que Arbol sea del mismo tipo en ambos
    def safe_int(x):
        try:
            return int(float(x))
        except:
            return None

    wfs_coords['Arbol'] = wfs_coords['Arbol'].apply(safe_int)
    censo_df['Arbol'] = censo_df['Arbol'].apply(safe_int)

    # Eliminar filas sin ID válido
    wfs_coords = wfs_coords.dropna(subset=['Arbol'])
    censo_df = censo_df.dropna(subset=['Arbol'])

    # Merge: left join para mantener todos los del censo
    merged = censo_df.merge(
        wfs_coords[['Arbol', 'lat', 'lng', 'Nombre común']],
        on='Arbol',
        how='left'
    )

    # Estadísticas
    con_coords = merged['lat'].notna().sum()
    sin_coords = merged['lat'].isna().sum()

    print(f"  Total merged: {len(merged):,}")
    print(f"  Con coordenadas: {con_coords:,} ({con_coords/len(merged)*100:.1f}%)")
    print(f"  Sin coordenadas: {sin_coords:,} ({sin_coords/len(merged)*100:.1f}%)")

    return merged

def add_wfs_only_trees(merged_df, wfs_df, censo_df):
    """Agregar árboles que están solo en el WFS (no en el censo)."""
    print("\nAgregando árboles solo del WFS...")

    def safe_int(x):
        try:
            return int(float(x))
        except:
            return None

    wfs_df['arbol_int'] = wfs_df['arbol'].apply(safe_int)
    censo_ids = set(censo_df['Arbol'].apply(safe_int).dropna())
    wfs_only = wfs_df[~wfs_df['arbol_int'].isin(censo_ids)].copy()

    print(f"  Árboles solo en WFS: {len(wfs_only):,}")

    # Mapear columnas del WFS al formato del censo
    wfs_mapped = pd.DataFrame({
        'Arbol': wfs_only['arbol'],
        'Nombre científico': wfs_only['nom_cientifico'],
        'Nombre común': wfs_only['nom_comun'],
        'Altura': wfs_only['altura'],
        'CAP': wfs_only['cap'] * 100,  # Convertir m a cm
        'Distancia': wfs_only['distancia'],
        'lat': wfs_only.apply(lambda r: r.get('lat') if 'lat' in r else None, axis=1),
        'lng': wfs_only.apply(lambda r: r.get('lng') if 'lng' in r else None, axis=1),
    })

    # Extraer coordenadas para los del WFS
    for idx, row in wfs_only.iterrows():
        wfs_mapped.loc[wfs_mapped['Arbol'] == row['arbol'], 'lat'] = row.get('lat')
        wfs_mapped.loc[wfs_mapped['Arbol'] == row['arbol'], 'lng'] = row.get('lng')

    # Agregar columna de origen
    merged_df['origen'] = 'censo'
    wfs_mapped['origen'] = 'wfs_only'

    # Concatenar
    final = pd.concat([merged_df, wfs_mapped], ignore_index=True)
    print(f"  Total final: {len(final):,}")

    return final

def main():
    print("=" * 60)
    print("MERGE DE DATASETS: CENSO + WFS")
    print("=" * 60)

    # Cargar datos
    wfs_df = load_wfs_data()
    censo_df = load_censo_data()

    # Merge principal
    merged = merge_datasets(censo_df, wfs_df)

    # Agregar árboles solo del WFS
    final = add_wfs_only_trees(merged, wfs_df, censo_df)

    # Reordenar columnas - poner lat/lng al principio para fácil acceso
    priority_cols = ['Arbol', 'lat', 'lng', 'Nombre científico', 'Nombre común', 'Calle', 'Numero', 'CCZ']
    other_cols = [c for c in final.columns if c not in priority_cols]
    final = final[[c for c in priority_cols if c in final.columns] + other_cols]

    # Guardar
    output_path = PROCESSED_DIR / "arboles_montevideo_geo.csv"
    final.to_csv(output_path, index=False)

    print("\n" + "=" * 60)
    print("RESUMEN FINAL")
    print("=" * 60)
    print(f"Total de árboles: {len(final):,}")
    print(f"Con coordenadas: {final['lat'].notna().sum():,} ({final['lat'].notna().sum()/len(final)*100:.1f}%)")
    print(f"Sin coordenadas: {final['lat'].isna().sum():,}")
    print(f"\nArchivo guardado: {output_path}")
    print(f"Tamaño: {output_path.stat().st_size / 1024 / 1024:.1f} MB")

if __name__ == "__main__":
    main()
