import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import { mockGeolocation, mockGeolocationSuccess, mockGeolocationError } from '../test/mocks/geolocation';
import Home from './page';

// Mock @/components/Map since it uses Mapbox
const mockFlyTo = vi.fn();
vi.mock('@/components/Map', () => ({
  default: (props: any) => {
    if (props.mapRef) props.mapRef.current = { flyTo: mockFlyTo };
    return <div data-testid="map-mock">Map Component</div>;
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
        return <div data-testid="map-mock">Map Component</div>;
      };
    },
  };
});

describe('Home (page integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('renders the report, feedback, and about buttons', async () => {
    render(<Home />);

    expect(screen.getByTitle('Reportar árbol faltante')).toBeInTheDocument();
    expect(screen.getByTitle('Enviar feedback')).toBeInTheDocument();
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

  it('shows spinner while locating', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation(() => {
      // Don't call callback - simulates pending state
    });

    const { user } = render(<Home />);

    const locateButton = screen.getByTitle('Mi ubicación');
    await user.click(locateButton);

    expect(locateButton).toBeDisabled();
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
      const dropdownButtons = screen.getAllByRole('button', { name: 'Paraiso' });
      const dropdownItem = dropdownButtons.find(btn =>
        btn.classList.contains('text-left')
      );
      expect(dropdownItem).toBeTruthy();
    });
  });
});
