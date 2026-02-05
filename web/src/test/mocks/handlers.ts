import { http, HttpResponse } from 'msw';

// Sample tree data for tests
export const mockTreesData: Record<string, any> = {
  '1': {
    nombre_cientifico: 'Melia azedarach',
    nombre_comun: 'Paraíso',
    calle: 'Av. 18 de Julio',
    numero: 1234,
    ccz: 1,
    altura: 8,
    cap: 120,
    diametro_copa: 6,
    estado: 2,
    lat: -34.9011,
    lng: -56.1645,
  },
  '2': {
    nombre_cientifico: 'Fraxinus americana',
    nombre_comun: 'Fresno americano',
    calle: 'Bulevar Artigas',
    numero: 500,
    ccz: 2,
    altura: 12,
    cap: 180,
    diametro_copa: 10,
    estado: 1,
    lat: -34.905,
    lng: -56.17,
  },
  '3': {
    nombre_cientifico: 'Ejemplar seco',
    nombre_comun: 'Ejemplar seco',
    calle: 'Calle Test',
    numero: 100,
    ccz: 3,
    altura: 5,
    cap: 50,
    diametro_copa: 3,
    estado: 5,
    lat: -34.91,
    lng: -56.18,
  },
};

export const mockSpecies = [
  'Paraíso',
  'Fresno americano',
  'Plátano de sombra',
  'Tipa',
  'Arce negundo',
  'Fresno europeo',
  'Laurel rosa',
  'Anacahuita',
  'Jacarandá',
  'Olmo europeo',
];

export const mockTreesGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { i: 1, e: 'Paraíso' },
      geometry: { type: 'Point', coordinates: [-56.1645, -34.9011] },
    },
    {
      type: 'Feature',
      properties: { i: 2, e: 'Fresno americano' },
      geometry: { type: 'Point', coordinates: [-56.17, -34.905] },
    },
  ],
};

export const mockWikipediaResponse = {
  title: 'Melia azedarach',
  extract: 'Melia azedarach es un arbol de la familia Meliaceae, nativo del sudeste asiatico.',
  content_urls: {
    desktop: { page: 'https://es.wikipedia.org/wiki/Melia_azedarach' },
  },
};

export const mockCommonsResponse = {
  query: {
    pages: {
      '123': {
        title: 'File:Melia azedarach 1.jpg',
        imageinfo: [{ thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Melia_1.jpg' }],
      },
      '124': {
        title: 'File:Melia azedarach 2.jpg',
        imageinfo: [{ thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Melia_2.jpg' }],
      },
    },
  },
};

export const handlers = [
  // Local JSON files
  http.get('/trees.json', () => {
    return HttpResponse.json(mockTreesGeoJSON);
  }),

  http.get('/trees-data.json', () => {
    return HttpResponse.json(mockTreesData);
  }),

  http.get('/species.json', () => {
    return HttpResponse.json(mockSpecies);
  }),

  // Wikipedia API
  http.get('https://es.wikipedia.org/api/rest_v1/page/summary/:title', ({ params }) => {
    const { title } = params;
    if (title === 'Ejemplar%20seco' || title === 'Dudas') {
      return HttpResponse.json({ type: 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found' }, { status: 404 });
    }
    return HttpResponse.json({
      ...mockWikipediaResponse,
      title: decodeURIComponent(title as string),
    });
  }),

  // Wikimedia Commons API
  http.get('https://commons.wikimedia.org/w/api.php', () => {
    return HttpResponse.json(mockCommonsResponse);
  }),

  // Formspree endpoints
  http.post('https://formspree.io/f/mbdodqbo', async () => {
    return HttpResponse.json({ ok: true });
  }),

  http.post('https://formspree.io/f/xnjdjwav', async () => {
    return HttpResponse.json({ ok: true });
  }),
];

// Error handlers for testing error states
export const errorHandlers = {
  formspreeReportError: http.post('https://formspree.io/f/mbdodqbo', () => {
    return HttpResponse.json({ error: 'Server error' }, { status: 500 });
  }),

  formspreeeedbackError: http.post('https://formspree.io/f/xnjdjwav', () => {
    return HttpResponse.json({ error: 'Server error' }, { status: 500 });
  }),

  wikipediaError: http.get('https://es.wikipedia.org/api/rest_v1/page/summary/:title', () => {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),
};
