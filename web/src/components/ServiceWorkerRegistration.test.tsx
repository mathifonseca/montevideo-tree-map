import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '../test/utils/render';
import ServiceWorkerRegistration from './ServiceWorkerRegistration';

describe('ServiceWorkerRegistration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers service worker on window load in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const register = vi.fn().mockResolvedValue({ scope: '/' });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<ServiceWorkerRegistration />);

    const loadHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'load')?.[1] as EventListener;
    expect(loadHandler).toBeTypeOf('function');

    loadHandler(new Event('load'));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('/sw.js');
      expect(logSpy).toHaveBeenCalledWith('[SW] Registered:', '/');
    });
  });

  it('logs registration errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const registrationError = new Error('registration failed');
    const register = vi.fn().mockRejectedValue(registrationError);

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ServiceWorkerRegistration />);

    const loadHandler = addEventListenerSpy.mock.calls.find(([event]) => event === 'load')?.[1] as EventListener;
    loadHandler(new Event('load'));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith('[SW] Registration failed:', registrationError);
    });
  });

  it('does not attempt registration outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: vi.fn() },
      configurable: true,
    });

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    render(<ServiceWorkerRegistration />);

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('load', expect.any(Function));
  });
});
