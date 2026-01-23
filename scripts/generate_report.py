#!/usr/bin/env python3
"""
Genera un reporte HTML interactivo del censo de arbolado de Montevideo.
"""

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from pathlib import Path
from datetime import datetime

# Rutas
PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"
DATA_FILE = PROCESSED_DIR / "arboles_montevideo_geo.csv"  # Dataset con coordenadas
OUTPUT_FILE = PROCESSED_DIR / "reporte_arbolado.html"

def load_data():
    """Cargar datos procesados."""
    df = pd.read_csv(DATA_FILE, low_memory=False)
    return df

def create_species_chart(df):
    """Gráfico de barras horizontales con las especies más comunes."""
    top_species = df['Nombre científico'].value_counts().head(20).reset_index()
    top_species.columns = ['Especie', 'Cantidad']

    fig = go.Figure(go.Bar(
        y=top_species['Especie'],
        x=top_species['Cantidad'],
        orientation='h',
        marker_color='#27ae60',
        text=top_species['Cantidad'].apply(lambda x: f'{x:,}'),
        textposition='outside',
        hovertemplate='<b>%{y}</b><br>Cantidad: %{x:,}<extra></extra>'
    ))
    fig.update_layout(
        title='Top 20 Especies Más Comunes',
        yaxis={'categoryorder': 'total ascending'},
        height=600,
        showlegend=False,
        xaxis_title='Cantidad',
        yaxis_title=''
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_ccz_chart(df):
    """Gráfico de barras por CCZ."""
    ccz_counts = df['CCZ'].dropna().value_counts().sort_index().reset_index()
    ccz_counts.columns = ['CCZ', 'Cantidad']
    ccz_counts['CCZ_label'] = ccz_counts['CCZ'].apply(lambda x: f'CCZ {int(x)}')

    fig = go.Figure(go.Bar(
        x=ccz_counts['CCZ_label'],
        y=ccz_counts['Cantidad'],
        marker_color='#3498db',
        text=ccz_counts['Cantidad'].apply(lambda x: f'{x:,}'),
        textposition='outside',
        hovertemplate='<b>%{x}</b><br>Cantidad: %{y:,}<extra></extra>'
    ))
    fig.update_layout(
        title='Distribución de Árboles por Centro Comunal Zonal',
        height=400,
        showlegend=False,
        xaxis_title='',
        yaxis_title='Cantidad'
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_health_chart(df):
    """Gráfico de torta del estado vegetativo."""
    ev_labels = {
        1: 'Muy bueno',
        2: 'Bueno',
        3: 'Regular',
        4: 'Malo',
        5: 'Muy malo',
        6: 'Muerto',
        7: 'Tocón'
    }
    ev_colors = {
        'Muy bueno': '#2ecc71',
        'Bueno': '#27ae60',
        'Regular': '#f39c12',
        'Malo': '#e74c3c',
        'Muy malo': '#c0392b',
        'Muerto': '#7f8c8d',
        'Tocón': '#34495e'
    }

    # Normalizar EV a enteros
    def normalize_ev(val):
        try:
            v = int(float(val))
            return v if v in range(1, 8) else None
        except:
            return None

    ev_normalized = df['EV'].apply(normalize_ev).dropna().astype(int)
    ev_counts = ev_normalized.value_counts().sort_index()

    labels = [ev_labels.get(k, f'Estado {k}') for k in ev_counts.index]
    colors = [ev_colors.get(l, '#95a5a6') for l in labels]

    fig = px.pie(
        values=ev_counts.values,
        names=labels,
        title='Estado Vegetativo de los Árboles',
        color=labels,
        color_discrete_map=ev_colors
    )
    fig.update_traces(textposition='inside', textinfo='percent+label')
    fig.update_layout(height=450)
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_height_histogram(df):
    """Histograma de altura."""
    altura = df['Altura'].dropna()
    altura = altura[(altura > 0) & (altura <= 50)].tolist()

    fig = go.Figure(data=[go.Histogram(
        x=altura,
        nbinsx=50,
        marker_color='#27ae60'
    )])
    fig.update_layout(
        title='Distribución de Altura de los Árboles',
        xaxis_title='Altura (metros)',
        yaxis_title='Cantidad de árboles',
        height=400,
        showlegend=False,
        bargap=0.1
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_crown_histogram(df):
    """Histograma de diámetro de copa."""
    copa = df['Diametro Copa'].dropna()
    copa = copa[(copa > 0) & (copa <= 30)].tolist()

    fig = go.Figure(data=[go.Histogram(
        x=copa,
        nbinsx=30,
        marker_color='#8e44ad'
    )])
    fig.update_layout(
        title='Distribución del Diámetro de Copa',
        xaxis_title='Diámetro de copa (metros)',
        yaxis_title='Cantidad de árboles',
        height=400,
        showlegend=False,
        bargap=0.1
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_species_by_ccz_heatmap(df):
    """Heatmap de especies por CCZ."""
    top_10_species = df['Nombre científico'].value_counts().head(10).index.tolist()
    df_filtered = df[df['Nombre científico'].isin(top_10_species)]

    pivot = pd.crosstab(df_filtered['Nombre científico'], df_filtered['CCZ'])

    fig = px.imshow(
        pivot,
        title='Distribución de las 10 Especies Principales por CCZ',
        labels={'x': 'CCZ', 'y': 'Especie', 'color': 'Cantidad'},
        color_continuous_scale='YlGn',
        aspect='auto'
    )
    fig.update_layout(height=500)
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_interference_chart(df):
    """Gráfico de interferencias."""
    aerial = (df['Int.Aerea'] == 'S').sum()
    underground = (df['Int.Sub'] == 'S').sum()
    none = len(df) - aerial - underground + ((df['Int.Aerea'] == 'S') & (df['Int.Sub'] == 'S')).sum()

    data = {
        'Tipo': ['Aérea', 'Subterránea', 'Sin interferencia'],
        'Cantidad': [aerial, underground, none]
    }

    fig = px.bar(
        data,
        x='Tipo',
        y='Cantidad',
        title='Interferencias con Infraestructura',
        color='Tipo',
        color_discrete_sequence=['#e74c3c', '#9b59b6', '#2ecc71']
    )
    fig.update_layout(height=400, showlegend=False)
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_geo_coverage_chart(df):
    """Gráfico de cobertura de georeferenciación."""
    con_coords = df['lat'].notna().sum()
    sin_coords = df['lat'].isna().sum()

    fig = go.Figure(data=[go.Pie(
        labels=['Con coordenadas', 'Sin coordenadas'],
        values=[con_coords, sin_coords],
        marker_colors=['#27ae60', '#e74c3c'],
        hole=0.4
    )])
    fig.update_layout(
        title=f'Cobertura de Georeferenciación',
        height=350,
        annotations=[dict(text=f'{con_coords/len(df)*100:.0f}%', x=0.5, y=0.5, font_size=24, showarrow=False)]
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_map_preview(df):
    """Mapa de densidad de árboles."""
    # Filtrar solo los que tienen coordenadas y tomar una muestra para rendimiento
    df_geo = df[df['lat'].notna()].copy()

    # Tomar muestra si hay muchos puntos
    if len(df_geo) > 10000:
        df_sample = df_geo.sample(n=10000, random_state=42)
    else:
        df_sample = df_geo

    fig = go.Figure(go.Scattermapbox(
        lat=df_sample['lat'],
        lon=df_sample['lng'],
        mode='markers',
        marker=dict(
            size=4,
            color='#27ae60',
            opacity=0.6
        ),
        text=df_sample['Nombre científico'],
        hovertemplate='<b>%{text}</b><extra></extra>'
    ))

    fig.update_layout(
        mapbox=dict(
            style='carto-positron',
            center=dict(lat=-34.85, lon=-56.18),
            zoom=10.5
        ),
        height=500,
        margin=dict(l=0, r=0, t=40, b=0),
        title='Distribución de Árboles en Montevideo (muestra de 10,000)'
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_top_streets_chart(df):
    """Top calles con más árboles."""
    top_streets = df['Calle'].dropna().value_counts().head(15).reset_index()
    top_streets.columns = ['Calle', 'Cantidad']

    fig = go.Figure(go.Bar(
        y=top_streets['Calle'],
        x=top_streets['Cantidad'],
        orientation='h',
        marker_color='#e67e22',
        text=top_streets['Cantidad'].apply(lambda x: f'{x:,}'),
        textposition='outside',
        hovertemplate='<b>%{y}</b><br>Cantidad: %{x:,}<extra></extra>'
    ))
    fig.update_layout(
        title='Top 15 Calles con Más Árboles',
        yaxis={'categoryorder': 'total ascending'},
        height=500,
        showlegend=False,
        xaxis_title='Cantidad',
        yaxis_title=''
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def create_height_by_species_box(df):
    """Box plot de altura por especie."""
    top_species = df['Nombre científico'].value_counts().head(10).index.tolist()
    df_filtered = df[df['Nombre científico'].isin(top_species)]
    df_filtered = df_filtered[df_filtered['Altura'].notna() & (df_filtered['Altura'] <= 50)]

    fig = px.box(
        df_filtered,
        x='Nombre científico',
        y='Altura',
        title='Altura por Especie (Top 10)',
        color='Nombre científico'
    )
    fig.update_layout(
        height=500,
        showlegend=False,
        xaxis_tickangle=-45
    )
    return fig.to_html(full_html=False, include_plotlyjs=False)

def generate_html_report(df):
    """Genera el reporte HTML completo."""

    # Calcular estadísticas
    total_arboles = len(df)
    total_especies = df['Nombre científico'].nunique()
    total_calles = df['Calle'].dropna().nunique()
    altura_media = df['Altura'].mean()
    copa_media = df['Diametro Copa'].mean() if 'Diametro Copa' in df.columns else 0

    # Georeferenciación
    con_coords = df['lat'].notna().sum()
    pct_geo = (con_coords / total_arboles) * 100

    # Estado de salud
    buenos = ((df['EV'].astype(str) == '1') | (df['EV'].astype(str) == '2')).sum()
    total_con_ev = df['EV'].notna().sum()
    pct_buenos = (buenos / total_con_ev) * 100 if total_con_ev > 0 else 0

    # Generar gráficos
    print("Generando gráficos...")
    species_chart = create_species_chart(df)
    ccz_chart = create_ccz_chart(df)
    health_chart = create_health_chart(df)
    height_hist = create_height_histogram(df)
    crown_hist = create_crown_histogram(df)
    streets_chart = create_top_streets_chart(df)
    height_box = create_height_by_species_box(df)

    html_content = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Censo de Arbolado de Montevideo - Análisis</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #eee;
            min-height: 100vh;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }}
        header {{
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #2d5016 0%, #1e3a0f 100%);
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }}
        h1 {{
            font-size: 2.5rem;
            margin-bottom: 10px;
            color: #90EE90;
        }}
        .subtitle {{
            font-size: 1.2rem;
            color: #aaa;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        .stat-card {{
            background: linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 100%);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            transition: transform 0.3s ease;
        }}
        .stat-card:hover {{
            transform: translateY(-5px);
        }}
        .stat-number {{
            font-size: 2.5rem;
            font-weight: bold;
            color: #4ade80;
            display: block;
        }}
        .stat-label {{
            font-size: 0.9rem;
            color: #888;
            margin-top: 5px;
        }}
        .section {{
            background: #1e1e3a;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }}
        .section h2 {{
            color: #4ade80;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }}
        .chart-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
        }}
        .chart-container {{
            background: #252545;
            border-radius: 10px;
            padding: 20px;
        }}
        .full-width {{
            grid-column: 1 / -1;
        }}
        footer {{
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 0.9rem;
        }}
        .data-source {{
            background: #2a2a4a;
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }}
        .data-source h3 {{
            color: #4ade80;
            margin-bottom: 10px;
        }}
        .data-source a {{
            color: #60a5fa;
        }}
        @media (max-width: 768px) {{
            h1 {{
                font-size: 1.8rem;
            }}
            .chart-grid {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Censo de Arbolado de Montevideo</h1>
            <p class="subtitle">Análisis del censo realizado entre 2005-2008</p>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-number">{total_arboles:,}</span>
                <span class="stat-label">Árboles registrados</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">{con_coords:,}</span>
                <span class="stat-label">Con coordenadas GPS</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">{total_especies}</span>
                <span class="stat-label">Especies diferentes</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">{total_calles:,}</span>
                <span class="stat-label">Calles con árboles</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">{altura_media:.1f}m</span>
                <span class="stat-label">Altura promedio</span>
            </div>
            <div class="stat-card">
                <span class="stat-number">{pct_buenos:.0f}%</span>
                <span class="stat-label">En buen estado</span>
            </div>
        </div>

        <div class="section">
            <h2>Especies</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    {species_chart}
                </div>
                <div class="chart-container">
                    {health_chart}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Distribución Geográfica</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    {ccz_chart}
                </div>
                <div class="chart-container">
                    {streets_chart}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Características Físicas</h2>
            <div class="chart-grid">
                <div class="chart-container">
                    {height_hist}
                </div>
                <div class="chart-container">
                    {crown_hist}
                </div>
                <div class="chart-container full-width">
                    {height_box}
                </div>
            </div>
        </div>

        <div class="data-source">
            <h3>Fuente de datos</h3>
            <p>Datos abiertos del Gobierno de Uruguay - Intendencia de Montevideo</p>
            <p><a href="https://catalogodatos.gub.uy/dataset/censo-de-arbolado-2008" target="_blank">
                https://catalogodatos.gub.uy/dataset/censo-de-arbolado-2008
            </a></p>
            <p style="margin-top: 10px; color: #888;">
                Censo realizado entre 2005-2008 por el Departamento de Áreas Verdes.
                Algunos datos pueden no estar actualizados.
            </p>
        </div>

        <footer>
            <p>Reporte generado el {datetime.now().strftime('%d/%m/%Y a las %H:%M')}</p>
            <p>Proyecto Árboles MVD</p>
        </footer>
    </div>
</body>
</html>'''

    return html_content

def main():
    print("Cargando datos...")
    df = load_data()
    print(f"  {len(df):,} registros cargados")

    print("\nGenerando reporte HTML...")
    html = generate_html_report(df)

    print(f"\nGuardando en {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"\n✓ Reporte generado exitosamente!")
    print(f"  Archivo: {OUTPUT_FILE}")
    print(f"  Tamaño: {OUTPUT_FILE.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    main()
