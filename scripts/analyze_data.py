#!/usr/bin/env python3
"""
Script para unificar y analizar los datos del censo de arbolado de Montevideo.
"""

import pandas as pd
import os
from pathlib import Path

# Rutas
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"
PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"

def load_species_codes():
    """Cargar tabla de códigos de especies."""
    df = pd.read_csv(RAW_DIR / "codigos-de-especie.csv", encoding="utf-8")
    df.columns = df.columns.str.strip()
    return df

def normalize_columns(df):
    """Normalizar nombres de columnas para consistencia."""
    df.columns = df.columns.str.strip()
    # Mapeo de nombres alternativos
    rename_map = {
        "Cod_calle": "Cod Calle",
        "Cod_Entre": "Cod Entre",
        "Cod_Y": "Cod Y",
        "Nombre Científico": "Nombre científico",
    }
    df = df.rename(columns=rename_map)
    # Eliminar columnas duplicadas o sin nombre
    df = df.loc[:, ~df.columns.str.startswith("Unnamed")]
    return df

def fix_date_values(value):
    """
    Corregir valores que fueron erróneamente formateados como fechas.
    Ej: '04/05/10' -> 4 (el primer número es el valor real)
    """
    import re
    if pd.isna(value):
        return value
    value_str = str(value)
    # Si parece una fecha DD/MM/YY, extraer el primer número
    match = re.match(r'^(\d{1,2})/\d{2}/\d{2}$', value_str)
    if match:
        return int(match.group(1))
    # Si ya es un número, devolverlo como está
    try:
        return int(float(value_str))
    except ValueError:
        return None

def fix_decimal_errors(df):
    """
    Corregir errores de punto decimal.
    Valores muy altos son probablemente valores con coma mal interpretada.
    Ej: 997 debería ser 9.97
    """
    # Altura: valores > 50m son probablemente errores (dividir por 100)
    if 'Altura' in df.columns:
        mask = df['Altura'] > 50
        df.loc[mask, 'Altura'] = df.loc[mask, 'Altura'] / 100

    # Diámetro Copa: valores > 30m son probablemente errores (dividir por 100)
    if 'Diametro Copa' in df.columns:
        mask = df['Diametro Copa'] > 30
        df.loc[mask, 'Diametro Copa'] = df.loc[mask, 'Diametro Copa'] / 100

    return df

def clean_numeric_columns(df):
    """Limpiar columnas numéricas que tienen valores con formato fecha."""
    numeric_cols = ['Altura', 'Diametro Copa', 'Ancho Vereda', 'CAP', 'Distancia']

    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].apply(fix_date_values)

    # Corregir errores de punto decimal
    df = fix_decimal_errors(df)

    return df

def load_and_unify_trees():
    """Cargar y unificar todos los archivos CCZ."""
    all_dfs = []

    for i in range(1, 19):
        filepath = RAW_DIR / f"archivo_comunal{i}.csv"
        if filepath.exists():
            df = pd.read_csv(filepath, encoding="utf-8", low_memory=False)
            df = normalize_columns(df)
            df["CCZ"] = i
            all_dfs.append(df)
            print(f"  CCZ {i:2d}: {len(df):,} árboles")

    unified = pd.concat(all_dfs, ignore_index=True)
    # Asegurar que no haya columnas duplicadas
    unified = unified.loc[:, ~unified.columns.duplicated()]
    return unified

def analyze_data_quality(df):
    """Analizar calidad de los datos."""
    print("\n" + "="*60)
    print("ANÁLISIS DE CALIDAD DE DATOS")
    print("="*60)

    total = len(df)
    print(f"\nTotal de registros: {total:,}")

    print("\n--- Completitud de campos ---")
    for col in df.columns:
        non_null = df[col].notna().sum()
        non_empty = df[col].astype(str).str.strip().ne("").sum()
        pct = (non_empty / total) * 100
        print(f"  {col:25s}: {non_empty:>7,} ({pct:5.1f}%)")

    # Análisis de campos numéricos problemáticos
    print("\n--- Campos numéricos con datos problemáticos ---")
    numeric_fields = ["CAP", "Altura", "Diametro Copa", "Ancho Vereda", "Distancia"]

    for field in numeric_fields:
        if field in df.columns:
            # Detectar valores que parecen fechas o no numéricos
            values = df[field].astype(str)
            date_like = values.str.contains(r"\d{2}/\d{2}/\d{2}", na=False).sum()
            if date_like > 0:
                print(f"  {field}: {date_like:,} valores parecen fechas")

    # Estado vegetativo
    print("\n--- Distribución de Estado Vegetativo (EV) ---")
    ev_labels = {
        "1": "Muy bueno",
        "2": "Bueno",
        "3": "Regular",
        "4": "Malo",
        "5": "Muy malo",
        "6": "Muerto",
        "7": "Tocón"
    }
    if "EV" in df.columns:
        ev_counts = df["EV"].astype(str).value_counts()
        for ev in ["1", "2", "3", "4", "5", "6", "7"]:
            if ev in ev_counts.index:
                count = ev_counts[ev]
                label = ev_labels.get(ev, "Desconocido")
                pct = (count / total) * 100
                print(f"  {ev} - {label:15s}: {count:>7,} ({pct:5.1f}%)")

    # Top especies
    print("\n--- Top 15 especies más comunes ---")
    if "Nombre científico" in df.columns:
        species_counts = df["Nombre científico"].value_counts().head(15)
        for i, (species, count) in enumerate(species_counts.items(), 1):
            pct = (count / total) * 100
            print(f"  {i:2d}. {species:35s}: {count:>6,} ({pct:4.1f}%)")

    # Árboles por CCZ
    print("\n--- Árboles por CCZ ---")
    ccz_counts = df["CCZ"].value_counts().sort_index()
    for ccz, count in ccz_counts.items():
        pct = (count / total) * 100
        bar = "█" * int(pct / 2)
        print(f"  CCZ {ccz:2d}: {count:>6,} ({pct:4.1f}%) {bar}")

    # Interferencias
    print("\n--- Interferencias ---")
    if "Int.Aerea" in df.columns:
        aerial = (df["Int.Aerea"] == "S").sum()
        print(f"  Interferencia aérea: {aerial:,} ({aerial/total*100:.1f}%)")
    if "Int.Sub" in df.columns:
        sub = (df["Int.Sub"] == "S").sum()
        print(f"  Interferencia subterránea: {sub:,} ({sub/total*100:.1f}%)")

    return df

def save_unified_data(df):
    """Guardar datos unificados."""
    output_path = PROCESSED_DIR / "arboles_montevideo.csv"
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"\nDatos guardados en: {output_path}")
    print(f"Tamaño del archivo: {output_path.stat().st_size / 1024 / 1024:.1f} MB")

def main():
    print("="*60)
    print("CENSO DE ARBOLADO DE MONTEVIDEO - ANÁLISIS DE DATOS")
    print("="*60)

    print("\n1. Cargando tabla de especies...")
    species_df = load_species_codes()
    print(f"   {len(species_df)} especies en el catálogo")

    print("\n2. Cargando y unificando archivos CCZ...")
    trees_df = load_and_unify_trees()

    print("\n3. Limpiando valores con formato fecha...")
    trees_df = clean_numeric_columns(trees_df)

    print("\n4. Analizando calidad de datos...")
    trees_df = analyze_data_quality(trees_df)

    print("\n5. Guardando datos unificados...")
    save_unified_data(trees_df)

    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print(f"Total de árboles: {len(trees_df):,}")
    print(f"Especies únicas: {trees_df['Nombre científico'].nunique()}")
    print(f"Calles únicas: {trees_df['Calle'].nunique()}")
    print("="*60)

if __name__ == "__main__":
    main()
