import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout, { generateMetadata } from './layout';

describe('RootLayout', () => {
  it('returns translated metadata and app icons', async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe('Arbolado urbano de Montevideo');
    expect(metadata.description).toBe('Mapa interactivo de los 234.464 árboles en veredas de Montevideo');
    expect(metadata.manifest).toBe('/manifest.json');
    expect(metadata.icons?.apple).toBe('/icons/apple-touch-icon.png');
  });

  it('renders providers and children with locale on html tag', async () => {
    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <div id="child">Contenido</div>,
      })
    );

    expect(markup).toContain('<html lang="es"');
    expect(markup).toContain('--font-geist-sans --font-geist-mono antialiased');
    expect(markup).toContain('<div id="child">Contenido</div>');
  });
});
