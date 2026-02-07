import { vi } from 'vitest';

export const mockMapInstance = {
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  getLayer: vi.fn(() => true),
  getSource: vi.fn(() => true),
  setFilter: vi.fn(),
  isStyleLoaded: vi.fn(() => true),
  _canvasElement: { style: { cursor: '' } },
  getCanvas: vi.fn(function(this: any) { return mockMapInstance._canvasElement; }),
  flyTo: vi.fn(),
  getCenter: vi.fn(() => ({ lng: -56.1645, lat: -34.9011 })),
  getZoom: vi.fn(() => 12),
};

// Use a proper class so `new mapboxgl.Map(...)` works
export class MapMock {
  constructor(...args: any[]) {
    MapMock._constructorSpy(...args);
    Object.assign(this, mockMapInstance);
  }
  static _constructorSpy = vi.fn();
}

// Named export for addProtocol
export const addProtocol = vi.fn();
export const removeProtocol = vi.fn();

const maplibregl = {
  Map: MapMock as any,
  addProtocol,
  removeProtocol,
  NavigationControl: vi.fn(),
  ScaleControl: vi.fn(),
  Marker: class {
    setLngLat() { return this; }
    addTo() { return this; }
    remove() {}
  },
  Popup: class {
    setLngLat() { return this; }
    setHTML() { return this; }
    addTo() { return this; }
    remove() {}
  },
};

export default maplibregl;
