import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './mocks/server';
import { setupGeolocationMock } from './mocks/geolocation';

// Mock maplibre-gl
vi.mock('maplibre-gl', () => import('./mocks/maplibre-gl'));

// Mock framer-motion to render components without animation
vi.mock('framer-motion', () => import('./mocks/framer-motion'));

// Mock next-intl
vi.mock('next-intl', () => import('./mocks/next-intl'));
vi.mock('next-intl/server', () => import('./mocks/next-intl'));

// Mock next-themes
vi.mock('next-themes', () => import('./mocks/next-themes'));

// Mock next/dynamic to render components directly
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: React.ComponentType<any> }>) => {
    const Component = vi.fn().mockImplementation((props) => {
      return null; // Map component will be tested separately
    });
    return Component;
  },
}));

// Setup geolocation mock
setupGeolocationMock();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Start MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
