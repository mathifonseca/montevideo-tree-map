#!/usr/bin/env python3
"""
Enrich species-metadata.json with 6 new fields per species:
  - bloomingMonths, heightRange, crownRange, flowerColor, growthRate, source

Uses hardcoded botanical data for the top 50 species and heuristics for the rest.
"""

import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
METADATA_PATH = os.path.join(SCRIPT_DIR, "..", "web", "public", "species-metadata.json")

# Placeholder species that get all-null new fields
PLACEHOLDER_NAMES = {"Ejemplar seco", "Sin identificar", "Dudas", "Transparente", "Crasa", "Cactacea", "Cactus"}
PLACEHOLDER_SOURCE = "https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008"

SEASON_TO_MONTHS = {
    "spring": [9, 10, 11],
    "summer": [12, 1, 2],
    "fall": [3, 4, 5],
    "winter": [6, 7, 8],
    "year-round": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}

SOURCE_MUNI_C = "https://municipioc.montevideo.gub.uy/node/79"
SOURCE_MUNI_B = "https://municipiob.montevideo.gub.uy/node/148"

# Top 50 species with precise botanical data
# Format: common_name -> (bloomingMonths, heightRange, crownRange, flowerColor, growthRate, source)
TOP_50 = {
    "Paraíso": ([10, 11], [8, 15], [6, 10], "purple", "fast", SOURCE_MUNI_C),
    "Fresno americano": ([9, 10], [15, 25], [8, 12], "green", "medium", SOURCE_MUNI_C),
    "Plátano de sombra": ([10, 11], [20, 35], [10, 15], "green", "fast", SOURCE_MUNI_C),
    "Tipa": ([10, 11, 12], [10, 18], [8, 15], "yellow", "medium", SOURCE_MUNI_C),
    "Arce negundo": ([9, 10], [10, 15], [6, 10], "green", "fast", SOURCE_MUNI_C),
    "Fresno europeo": ([9, 10], [15, 25], [8, 12], "green", "medium", SOURCE_MUNI_C),
    "Laurel rosa": ([11, 12, 1, 2], [2, 5], [2, 4], "pink", "medium", SOURCE_MUNI_C),
    "Anacahuita": ([10, 11, 12], [4, 8], [3, 6], "white", "slow", SOURCE_MUNI_C),
    "Jacarandá": ([10, 11], [8, 15], [6, 10], "purple", "medium", SOURCE_MUNI_C),
    "Olmo europeo": ([8, 9], [15, 25], [8, 12], "green", "medium", SOURCE_MUNI_C),
    "Eucalipto blanco": ([3, 4, 5], [20, 45], [8, 15], "white", "fast", SOURCE_MUNI_C),
    "Sauce llorón": ([9, 10], [8, 15], [8, 12], "yellow", "fast", SOURCE_MUNI_C),
    "Arce plateado": ([8, 9], [15, 25], [8, 12], "green", "fast", SOURCE_MUNI_C),
    "Palo borracho rosa": ([2, 3, 4], [8, 15], [5, 8], "pink", "medium", SOURCE_MUNI_C),
    "Álamo Carolino": ([9, 10], [15, 25], [6, 10], "green", "fast", SOURCE_MUNI_C),
    "Sauce llorón dorado": ([9, 10], [8, 15], [8, 12], "yellow", "fast", SOURCE_MUNI_B),
    "Ligustro": ([11, 12], [8, 15], [5, 8], "white", "fast", SOURCE_MUNI_B),
    "Ciprés calvo": ([9, 10], [15, 30], [5, 10], "green", "medium", SOURCE_MUNI_B),
    "Catalpa": ([11, 12], [8, 15], [6, 10], "white", "medium", SOURCE_MUNI_B),
    "Rosa de la China": ([10, 11, 12, 1, 2, 3], [1, 3], [1, 2], "red", "medium", SOURCE_MUNI_B),
    "Gomero": (None, [10, 25], [8, 15], None, "medium", SOURCE_MUNI_B),
    "Sauce criollo": ([9, 10], [8, 15], [6, 10], "yellow", "fast", SOURCE_MUNI_B),
    "Parasol de la China": ([11, 12], [8, 15], [5, 8], "yellow", "medium", SOURCE_MUNI_B),
    "Falsa mandioca": ([12, 1, 2], [6, 12], [4, 8], "red", "fast", SOURCE_MUNI_B),
    "Palmera canaria": ([9, 10, 11], [10, 20], [6, 10], "yellow", "slow", SOURCE_MUNI_B),
    "Álamo blanco": ([8, 9], [15, 25], [6, 10], "green", "fast", SOURCE_MUNI_B),
    "Tilo moltkei": ([11, 12], [15, 25], [8, 12], "yellow", "medium", SOURCE_MUNI_B),
    "Casuarina": (None, [15, 25], [5, 8], None, "fast", SOURCE_MUNI_B),
    "Pino radiata": ([9, 10], [15, 30], [6, 10], None, "fast", SOURCE_MUNI_B),
    "Ceibo": ([10, 11, 12], [5, 10], [4, 8], "red", "medium", SOURCE_MUNI_B),
    "Palmera washingtonia": ([11, 12], [10, 20], [3, 5], "cream", "medium"),
    "Liquidambar": ([9, 10], [15, 25], [6, 10], "green", "medium"),
    "Tuya oriental": (None, [5, 10], [2, 4], None, "slow"),
    "Crespón": ([12, 1, 2, 3], [3, 8], [3, 6], "pink", "medium"),
    "Jazmín del Cabo": ([10, 11, 12], [1, 3], [1, 2], "white", "slow"),
    "Ciprés mediterráneo": (None, [15, 25], [2, 4], None, "slow"),
    "Coronilla": ([10, 11], [3, 6], [2, 4], "white", "slow"),
    "Morera": ([9, 10], [8, 15], [6, 10], "green", "fast"),
    "Acacia blanca": ([10, 11], [10, 20], [6, 10], "white", "fast"),
    "Pitósporo": ([10, 11], [3, 6], [2, 4], "cream", "slow"),
    "Ginkgo": ([10], [15, 25], [5, 8], "green", "slow"),
    "Fotinia": ([10, 11], [3, 6], [2, 4], "white", "medium"),
    "Magnolia": ([10, 11, 12], [15, 25], [6, 10], "white", "slow"),
    "Pino": ([9, 10], [10, 25], [5, 10], None, "medium"),
    "Ciruelo rojo": ([8, 9], [5, 8], [4, 6], "pink", "medium"),
    "Arce noruego": ([9, 10], [15, 25], [8, 12], "yellow", "medium"),
    "Alcanfor": ([10, 11], [10, 20], [8, 12], "cream", "medium"),
    "Álamo piramidal": ([9, 10], [15, 30], [3, 5], "green", "fast"),
    "Limpiatubos": ([10, 11, 12], [3, 6], [2, 4], "red", "medium"),
    "Grevillea": ([9, 10, 11], [15, 25], [6, 10], "orange", "fast"),
}

# Entries 31-50 don't have a source tuple element (length 5), add Wikipedia for those
# Actually let me fix: entries 31+ should get Wikipedia source based on scientificName


def make_wikipedia_url(scientific_name):
    """Generate a Spanish Wikipedia URL from a scientific name."""
    if not scientific_name:
        return PLACEHOLDER_SOURCE
    # Clean up spp. type names - use genus only
    name = scientific_name.split(" spp.")[0]
    # Handle hybrid names like "Platanus x acerifolia" -> "Platanus_×_acerifolia"
    name = name.replace(" x ", " × ")
    return f"https://es.wikipedia.org/wiki/{name.replace(' ', '_')}"


def get_default_height_range(uses):
    """Default height range based on uses."""
    if not uses:
        return [3, 10]
    if "timber" in uses:
        return [10, 25]
    if "shade" in uses:
        return [8, 15]
    if "fruit" in uses:
        return [3, 8]
    return [3, 10]


def get_default_crown_range(uses):
    """Default crown range based on uses."""
    if not uses:
        return [2, 5]
    if "shade" in uses:
        return [6, 10]
    if "timber" in uses:
        return [5, 8]
    return [2, 5]


def enrich():
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    stats = {
        "total": len(data),
        "top50_enriched": 0,
        "default_enriched": 0,
        "placeholder_skipped": 0,
    }

    for common_name, entry in data.items():
        # Check if placeholder
        if common_name in PLACEHOLDER_NAMES:
            entry["bloomingMonths"] = None
            entry["heightRange"] = None
            entry["crownRange"] = None
            entry["flowerColor"] = None
            entry["growthRate"] = None
            entry["source"] = PLACEHOLDER_SOURCE
            stats["placeholder_skipped"] += 1
            continue

        scientific_name = entry.get("scientificName", "")
        blooming_season = entry.get("bloomingSeason")
        uses = entry.get("uses", [])

        # Check if in top 50
        if common_name in TOP_50:
            t = TOP_50[common_name]
            entry["bloomingMonths"] = t[0]
            entry["heightRange"] = t[1]
            entry["crownRange"] = t[2]
            entry["flowerColor"] = t[3]
            entry["growthRate"] = t[4]
            if len(t) > 5:
                entry["source"] = t[5]
            else:
                entry["source"] = make_wikipedia_url(scientific_name)
            stats["top50_enriched"] += 1
        else:
            # Default enrichment for remaining species
            if blooming_season and blooming_season in SEASON_TO_MONTHS:
                entry["bloomingMonths"] = SEASON_TO_MONTHS[blooming_season]
            else:
                entry["bloomingMonths"] = None

            entry["heightRange"] = get_default_height_range(uses)
            entry["crownRange"] = get_default_crown_range(uses)
            entry["flowerColor"] = None
            entry["growthRate"] = None
            entry["source"] = make_wikipedia_url(scientific_name)
            stats["default_enriched"] += 1

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("Enrichment complete!")
    print(f"  Total species: {stats['total']}")
    print(f"  Top 50 enriched: {stats['top50_enriched']}")
    print(f"  Default enriched: {stats['default_enriched']}")
    print(f"  Placeholders skipped: {stats['placeholder_skipped']}")
    print(f"  Output: {METADATA_PATH}")


if __name__ == "__main__":
    enrich()
