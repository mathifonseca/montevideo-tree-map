import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import { mockMapInstance, MapMock } from '../test/mocks/mapbox-gl';
import { mockGeolocation, mockGeolocationSuccess, mockGeolocationError } from '../test/mocks/geolocation';

// The mock is automatically applied via the setup file
import Map from './Map';

describe('Map', () => {
  const defaultProps = {
    onTreeSelect: vi.fn(),
    selectedSpecies: null,
    reportMode: false,
    onReportClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the class constructor spy and instance mocks
    MapMock._constructorSpy.mockClear();
    Object.values(mockMapInstance).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        (fn as ReturnType<typeof vi.fn>).mockClear();
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders map container', () => {
    render(<Map {...defaultProps} />);
    expect(document.querySelector('[class*="w-full h-full"]')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Map {...defaultProps} />);
    expect(screen.getByText('Cargando árboles...')).toBeInTheDocument();
  });

  it('initializes Mapbox with correct configuration', () => {
    render(<Map {...defaultProps} />);

    expect(MapMock._constructorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-56.1645, -34.9011],
        zoom: 12,
      })
    );
  });

  it('registers map event listeners', () => {
    render(<Map {...defaultProps} />);

    expect(mockMapInstance.on).toHaveBeenCalledWith('load', expect.any(Function));
    expect(mockMapInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('applies species filter when selectedSpecies changes', async () => {
    const { rerender } = render(<Map {...defaultProps} />);

    rerender(<Map {...defaultProps} selectedSpecies="Paraiso" />);

    await waitFor(() => {
      expect(mockMapInstance.setFilter).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('clears filter when selectedSpecies is null', async () => {
    const { rerender } = render(<Map {...defaultProps} selectedSpecies="Paraiso" />);

    rerender(<Map {...defaultProps} selectedSpecies={null} />);

    await waitFor(() => {
      expect(mockMapInstance.setFilter).toHaveBeenCalledWith('trees-point', null);
    }, { timeout: 1000 });
  });

  it('changes cursor to crosshair in report mode', async () => {
    const { rerender } = render(<Map {...defaultProps} />);

    rerender(<Map {...defaultProps} reportMode={true} />);

    expect(mockMapInstance._canvasElement.style.cursor).toBe('crosshair');
  });

  it('renders locate me button', () => {
    render(<Map {...defaultProps} />);
    expect(screen.getByTitle('Mi ubicación')).toBeInTheDocument();
  });

  it('handles geolocation success', async () => {
    mockGeolocationSuccess({ latitude: -34.91, longitude: -56.17 });

    const { user } = render(<Map {...defaultProps} />);

    const locateButton = screen.getByTitle('Mi ubicación');
    await user.click(locateButton);

    await waitFor(() => {
      expect(mockMapInstance.flyTo).toHaveBeenCalledWith({
        center: [-56.17, -34.91],
        zoom: 17,
      });
    });
  });

  it('handles geolocation error', async () => {
    mockGeolocationError(1, 'User denied');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const { user } = render(<Map {...defaultProps} />);

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

    const { user } = render(<Map {...defaultProps} />);

    const locateButton = screen.getByTitle('Mi ubicación');
    await user.click(locateButton);

    expect(locateButton).toBeDisabled();
  });

  it('cleans up map on unmount', () => {
    const { unmount } = render(<Map {...defaultProps} />);

    unmount();

    expect(mockMapInstance.remove).toHaveBeenCalled();
  });
});
