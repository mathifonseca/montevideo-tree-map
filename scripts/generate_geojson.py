#!/usr/bin/env python3
"""
Generar archivos JSON optimizados para la aplicación web.

Genera en web/public/:
  - trees.json      GeoJSON minimal (i=id, e=especie) para el mapa
  - trees-data.json Datos completos por id para el panel
  - species.json    Lista única de especies ordenada
"""

import pandas as pd
import json
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
WEB_PUBLIC = BASE_DIR / "web" / "public"


def main():
    print("Cargando datos...")
    df = pd.read_csv(PROCESSED_DIR / "arboles_montevideo_geo.csv", low_memory=False)

    print(f"Total árboles: {len(df):,}")

    # Filtrar solo los que tienen coordenadas válidas
    df = df[df["lat"].notna() & df["lng"].notna()]
    print(f"Con coordenadas válidas: {len(df):,}")

    # ── trees.json (GeoJSON minimal) ─────────────────────────────────────
    print("\nGenerando trees.json...")
    features = []
    for _, row in df.iterrows():
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    round(float(row["lng"]), 6),
                    round(float(row["lat"]), 6),
                ],
            },
            "properties": {
                "i": int(row["Arbol"]),
                "e": row["Nombre común"] if pd.notna(row["Nombre común"]) else "",
            },
        }
        features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}

    trees_path = WEB_PUBLIC / "trees.json"
    with open(trees_path, "w") as f:
        json.dump(geojson, f)

    size_mb = trees_path.stat().st_size / 1024 / 1024
    print(f"  {trees_path} ({size_mb:.1f} MB, {len(features):,} árboles)")

    # ── trees-data.json (datos completos por id) ─────────────────────────
    print("Generando trees-data.json...")
    trees_data = {}
    for _, row in df.iterrows():
        tree_id = str(int(row["Arbol"]))
        trees_data[tree_id] = {
            "nombre_cientifico": row["Nombre científico"]
            if pd.notna(row["Nombre científico"])
            else None,
            "nombre_comun": row["Nombre común"]
            if pd.notna(row["Nombre común"])
            else None,
            "calle": row["Calle"] if pd.notna(row["Calle"]) else None,
            "numero": int(row["Numero"])
            if pd.notna(row["Numero"]) and row["Numero"] > 0
            else None,
            "ccz": int(row["CCZ"]) if pd.notna(row["CCZ"]) else None,
            "altura": float(row["Altura"]) if pd.notna(row["Altura"]) else None,
            "cap": float(row["CAP"]) if pd.notna(row["CAP"]) else None,
            "diametro_copa": float(row["Diametro Copa"])
            if pd.notna(row["Diametro Copa"])
            else None,
            "estado": int(row["EV"]) if pd.notna(row["EV"]) else None,
            "lat": round(float(row["lat"]), 6),
            "lng": round(float(row["lng"]), 6),
        }

    data_path = WEB_PUBLIC / "trees-data.json"
    with open(data_path, "w") as f:
        json.dump(trees_data, f, ensure_ascii=False)

    size_mb = data_path.stat().st_size / 1024 / 1024
    print(f"  {data_path} ({size_mb:.1f} MB, {len(trees_data):,} entradas)")

    # ── species.json (lista de especies) ─────────────────────────────────
    print("Generando species.json...")
    especies = df["Nombre común"].dropna().unique()
    especies = sorted([e for e in especies if e])

    species_path = WEB_PUBLIC / "species.json"
    with open(species_path, "w") as f:
        json.dump(especies, f, ensure_ascii=False, indent=2)

    print(f"  {species_path} ({len(especies)} especies)")

    print("\nListo.")


if __name__ == "__main__":
    main()
