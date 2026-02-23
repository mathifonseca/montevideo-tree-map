import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import { mockGeolocation, mockGeolocationSuccess, mockGeolocationError } from '../test/mocks/geolocation';
import Home from './page';

// Mock @/components/Map since it uses Mapbox
const mockFlyTo = vi.fn();
vi.mock('@/components/Map', () => ({
  default: (props: any) => {
    if (props.mapRef) props.mapRef.current = { flyTo: mockFlyTo };
    return (
      <div data-testid="map-mock">
        Map Component
        <button onClick={() => props.onTreeSelect?.(1)}>Select tree 1</button>
        <button onClick={() => props.onTreeSelect?.(null)}>Clear tree</button>
        <button onClick={() => props.onReportClick?.(-34.9, -56.16)}>Report click</button>
      </div>
    );
  },
}));

// Override next/dynamic to render the mocked Map component
vi.mock('next/dynamic', () => {
  return {
    default: (importFn: any) => {
      // Return a wrapper that will use the mocked Map
      return function DynamicMock(props: any) {
        // Set mapRef if present
        if (props.mapRef) props.mapRef.current = { flyTo: mockFlyTo };
        return (
          <div data-testid="map-mock">
            Map Component
            <button onClick={() => props.onTreeSelect?.(1)}>Select tree 1</button>
            <button onClick={() => props.onTreeSelect?.(null)}>Clear tree</button>
            <button onClick={() => props.onReportClick?.(-34.9, -56.16)}>Report click</button>
          </div>
        );
      };
    },
  };
});

describe('Home (page integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('renders the main layout', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Arbolado urbano de Montevideo')).toBeInTheDocument();
    });
  });

  it('loads species from /species.json and passes them to Filters', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar especie...')).toBeInTheDocument();
    });
  });

  it('renders the report, feedback, stats, and about buttons', async () => {
    render(<Home />);

    expect(screen.getByTitle('Reportar árbol faltante')).toBeInTheDocument();
    expect(screen.getByTitle('Enviar feedback')).toBeInTheDocument();
    expect(screen.getByTitle('Estadísticas')).toBeInTheDocument();
    expect(screen.getByTitle('Sobre este proyecto')).toBeInTheDocument();
  });

  it('toggles report mode when report button is clicked', async () => {
    const { user } = render(<Home />);

    const reportButton = screen.getByTitle('Reportar árbol faltante');
    await user.click(reportButton);

    expect(screen.getByText('Click en el mapa para reportar')).toBeInTheDocument();
    expect(screen.getByTitle('Click en el mapa para reportar')).toBeInTheDocument();
  });

  it('exits report mode on second click', async () => {
    const { user } = render(<Home />);

    const reportButton = screen.getByTitle('Reportar árbol faltante');

    await user.click(reportButton);
    expect(screen.getByText('Click en el mapa para reportar')).toBeInTheDocument();

    const activeReportButton = screen.getByTitle('Click en el mapa para reportar');
    await user.click(activeReportButton);

    expect(screen.queryByText('Click en el mapa para reportar')).not.toBeInTheDocument();
  });

  it('opens feedback modal when feedback button is clicked', async () => {
    const { user } = render(<Home />);

    const feedbackButton = screen.getByTitle('Enviar feedback');
    await user.click(feedbackButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Sugerencias, errores, ideas...')).toBeInTheDocument();
    });
  });

  it('opens about modal when about button is clicked', async () => {
    const { user } = render(<Home />);

    const aboutButton = screen.getByTitle('Sobre este proyecto');
    await user.click(aboutButton);

    await waitFor(() => {
      // Check for modal-specific content (unique to About modal)
      expect(screen.getByText('Inspiración')).toBeInTheDocument();
      expect(screen.getByText('Fuentes de datos')).toBeInTheDocument();
    });
  });

  it('renders locate me button', () => {
    render(<Home />);
    expect(screen.getByTitle('Mi ubicación')).toBeInTheDocument();
  });

  it('handles geolocation error', async () => {
    mockGeolocationError(1, 'User denied');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { user } = render(<Home />);

    const locateButton = screen.getByTitle('Mi ubicación');
    await user.click(locateButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No se pudo obtener tu ubicación');
    });

    alertSpy.mockRestore();
  });

  it('centers map when url includes a tree id', async () => {
    window.history.replaceState({}, '', '/?arbol=2');

    render(<Home />);

    await waitFor(() => {
      expect(mockFlyTo).toHaveBeenCalledWith({
        center: [-56.17, -34.905],
        zoom: 17,
      });
    });
  });

  it('shows spinner while locating', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Don't call callback - simulates pending state
    });

    const { user } = render(<Home />);

    const locateButton = screen.getByTitle('Mi ubicación');
    await user.click(locateButton);

    expect(locateButton).toBeDisabled();
  });

  it('flies to current position on geolocation success', async () => {
    mockGeolocationSuccess({ latitude: -34.91, longitude: -56.18 });
    const { user } = render(<Home />);

    await user.click(screen.getByTitle('Mi ubicación'));

    await waitFor(() => {
      expect(mockFlyTo).toHaveBeenCalledWith({
        center: [-56.18, -34.91],
        zoom: 17,
      });
    });
  });

  it('moves the map when selecting an address result from filters', async () => {
    const originalFetch = global.fetch;
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('api.mapbox.com/geocoding')) {
        return Promise.resolve({
          json: async () => ({
            features: [
              {
                place_name: 'Av. 18 de Julio 1234, Montevideo',
                center: [-56.15, -34.89],
              },
            ],
          }),
        } as Response);
      }

      return originalFetch(input, init);
    });

    const { user } = render(<Home />);

    const addressInput = await screen.findByPlaceholderText('Ej: 18 de Julio 1234');
    await user.type(addressInput, '18 de Julio 1234');

    const result = await screen.findByRole('button', { name: 'Av. 18 de Julio 1234, Montevideo' });
    await user.click(result);

    expect(mockFlyTo).toHaveBeenCalledWith({
      center: [-56.15, -34.89],
      zoom: 17,
    });

    fetchSpy.mockRestore();
  });

  it('species filter works end-to-end after data loads', async () => {
    const { user } = render(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar especie...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Buscar especie...');
    await user.type(input, 'Para');

    // Find the dropdown item specifically (text-left class)
    await waitFor(() => {
      const dropdownButtons = screen.getAllByRole('button', { name: 'Paraíso' });
      const dropdownItem = dropdownButtons.find(btn =>
        btn.classList.contains('text-left')
      );
      expect(dropdownItem).toBeTruthy();
    });
  });

  it('updates query string when selecting and clearing a tree', async () => {
    const { user } = render(<Home />);

    await user.click(screen.getByRole('button', { name: 'Select tree 1' }));
    await waitFor(() => {
      expect(window.location.search).toContain('arbol=1');
    });

    await user.click(screen.getByRole('button', { name: 'Clear tree' }));
    await waitFor(() => {
      expect(window.location.search).not.toContain('arbol=');
    });
  });

  it('closes selected tree panel using panel close button', async () => {
    const { user } = render(<Home />);

    await user.click(screen.getByRole('button', { name: 'Select tree 1' }));
    await screen.findAllByText('Paraíso');

    const closeButtons = screen.getAllByRole('button').filter((btn) =>
      btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    );
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('ID: 1')).not.toBeInTheDocument();
    });
  });

  it('opens report modal from map click and exits report mode', async () => {
    const { user } = render(<Home />);

    await user.click(screen.getByTitle('Reportar árbol faltante'));
    expect(screen.getByText('Click en el mapa para reportar')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Report click' }));

    await waitFor(() => {
      expect(screen.getByText('-34.900000, -56.160000')).toBeInTheDocument();
    });
    expect(screen.queryByText('Click en el mapa para reportar')).not.toBeInTheDocument();
  });

  it('closes report modal through its close action', async () => {
    const { user } = render(<Home />);

    await user.click(screen.getByTitle('Reportar árbol faltante'));
    await user.click(screen.getByRole('button', { name: 'Report click' }));
    await screen.findByText('-34.900000, -56.160000');

    const reportCloseButton = screen.getAllByRole('button').find((btn) =>
      btn.className.includes('transition-colors') && btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    );
    await user.click(reportCloseButton!);

    await waitFor(() => {
      expect(screen.queryByText('-34.900000, -56.160000')).not.toBeInTheDocument();
    });
  });

  it('closes feedback, about, and stats modals', async () => {
    const { user } = render(<Home />);

    await user.click(screen.getByTitle('Enviar feedback'));
    await screen.findByPlaceholderText('Sugerencias, errores, ideas...');
    await user.click(screen.getAllByRole('button').find((btn) => btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]'))!);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Sugerencias, errores, ideas...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Sobre este proyecto'));
    await screen.findByText('Inspiración');
    await user.click(screen.getAllByRole('button', { name: 'Cerrar' }).at(-1)!);
    await waitFor(() => {
      expect(screen.queryByText('Inspiración')).not.toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Estadísticas'));
    await screen.findByRole('heading', { name: 'Estadísticas' });
    await user.click(screen.getAllByRole('button').find((btn) => btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]'))!);
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Estadísticas' })).not.toBeInTheDocument();
    });
  });

  it('opens stats modal when stats button is clicked', async () => {
    const { user } = render(<Home />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar especie...')).toBeInTheDocument();
    });

    const statsButton = screen.getByTitle('Estadísticas');
    await user.click(statsButton);

    await waitFor(() => {
      // Check for modal-specific content
      expect(screen.getByRole('heading', { name: 'Estadísticas' })).toBeInTheDocument();
    });
  });

  it('renders address search input', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ej: 18 de Julio 1234')).toBeInTheDocument();
    });
  });

  it('renders CCZ filter dropdown', async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Filtrar por zona')).toBeInTheDocument();
      expect(screen.getByText('Todas las zonas')).toBeInTheDocument();
    });
  });
});
