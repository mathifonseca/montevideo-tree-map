import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import { mockMapInstance, MapMock } from '../test/mocks/mapbox-gl';

// The mock is automatically applied via the setup file
import Map from './Map';

describe('Map', () => {
  const defaultProps = {
    onTreeSelect: vi.fn(),
    selectedSpecies: null,
    selectedCCZ: null,
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

    rerender(<Map {...defaultProps} selectedSpecies="Paraíso" />);

    await waitFor(() => {
      expect(mockMapInstance.setFilter).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('clears filter when selectedSpecies is null', async () => {
    const { rerender } = render(<Map {...defaultProps} selectedSpecies="Paraíso" />);

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

  it('cleans up map on unmount', () => {
    const { unmount } = render(<Map {...defaultProps} />);

    unmount();

    expect(mockMapInstance.remove).toHaveBeenCalled();
  });
});
