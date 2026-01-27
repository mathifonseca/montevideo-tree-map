import { vi } from 'vitest';

export const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

export function setupGeolocationMock() {
  Object.defineProperty(navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });
}

export function mockGeolocationSuccess(coords = { latitude: -34.9011, longitude: -56.1645 }) {
  mockGeolocation.getCurrentPosition.mockImplementation((success) => {
    success({
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });
  });
}

export function mockGeolocationError(code = 1, message = 'User denied geolocation') {
  mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
    error({
      code,
      message,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });
  });
}
