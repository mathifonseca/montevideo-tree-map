import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import { mockMapInstance, MapMock, addProtocol, removeProtocol } from '../test/mocks/maplibre-gl';
import { mockThemeState } from '../test/mocks/next-themes';

// The mock is automatically applied via the setup file
import Map from './Map';

const getOnHandler = (event: string, layer?: string) => {
  const call = mockMapInstance.on.mock.calls.find(([eventName, eventLayer]) => {
    if (layer) {
      return eventName === event && eventLayer === layer;
    }
    return eventName === event && typeof eventLayer === 'function';
  });

  if (!call) return undefined;
  return typeof call[1] === 'function' ? call[1] : call[2];
};

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
    mockThemeState.resolvedTheme = 'dark';
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
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [-56.1645, -34.9011],
        zoom: 12,
      })
    );
  });

  it('registers map event listeners', () => {
    render(<Map {...defaultProps} />);

    expect(mockMapInstance.on).toHaveBeenCalledWith('load', expect.any(Function));
    expect(mockMapInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(addProtocol).toHaveBeenCalledWith('pmtiles', expect.any(Function));
  });

  it('logs map error events', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Map {...defaultProps} />);

    const mapErrorHandler = getOnHandler('error') as ((e: unknown) => void) | undefined;
    mapErrorHandler?.({ message: 'mock map error' });

    expect(errorSpy).toHaveBeenCalledWith('Mapbox error:', { message: 'mock map error' });
  });

  it('adds tree source and layer when map load succeeds', async () => {
    render(<Map {...defaultProps} />);

    const loadHandler = getOnHandler('load') as (() => Promise<void>) | undefined;
    expect(loadHandler).toBeDefined();
    await loadHandler?.();

    expect(mockMapInstance.addSource).toHaveBeenCalledWith('trees', {
      type: 'vector',
      url: 'pmtiles:///trees.pmtiles',
    });
    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'trees-point',
        type: 'circle',
      })
    );
  });

  it('handles map load errors by ending loading state', async () => {
    mockMapInstance.addSource.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Map {...defaultProps} />);

    const loadHandler = getOnHandler('load') as (() => Promise<void>) | undefined;
    await loadHandler?.();

    await waitFor(() => {
      expect(screen.queryByText('Cargando árboles...')).not.toBeInTheDocument();
    });
    expect(errorSpy).toHaveBeenCalledWith('Error loading trees:', expect.any(Error));
  });

  it('selects a tree on point click when report mode is off', async () => {
    const onTreeSelect = vi.fn();
    render(<Map {...defaultProps} onTreeSelect={onTreeSelect} />);

    const loadHandler = getOnHandler('load') as (() => Promise<void>) | undefined;
    await loadHandler?.();

    const treeClickHandler = getOnHandler('click', 'trees-point') as ((e: any) => void) | undefined;
    treeClickHandler?.({ features: [{ properties: { i: 42 } }] });

    expect(onTreeSelect).toHaveBeenCalledWith(42);
  });

  it('ignores tree click in report mode and forwards map click coordinates', async () => {
    const onTreeSelect = vi.fn();
    const onReportClick = vi.fn();
    render(<Map {...defaultProps} onTreeSelect={onTreeSelect} onReportClick={onReportClick} reportMode={true} />);

    const loadHandler = getOnHandler('load') as (() => Promise<void>) | undefined;
    await loadHandler?.();

    const treeClickHandler = getOnHandler('click', 'trees-point') as ((e: any) => void) | undefined;
    treeClickHandler?.({ features: [{ properties: { i: 7 } }] });
    expect(onTreeSelect).not.toHaveBeenCalled();

    const mapClickHandler = getOnHandler('click') as ((e: any) => void) | undefined;
    mapClickHandler?.({ lngLat: { lat: -34.9, lng: -56.17 } });
    expect(onReportClick).toHaveBeenCalledWith(-34.9, -56.17);
  });

  it('updates cursor on mouse enter and leave events', async () => {
    render(<Map {...defaultProps} />);

    const loadHandler = getOnHandler('load') as (() => Promise<void>) | undefined;
    await loadHandler?.();

    const enterHandler = getOnHandler('mouseenter', 'trees-point') as (() => void) | undefined;
    const leaveHandler = getOnHandler('mouseleave', 'trees-point') as (() => void) | undefined;

    enterHandler?.();
    expect(mockMapInstance._canvasElement.style.cursor).toBe('pointer');

    leaveHandler?.();
    expect(mockMapInstance._canvasElement.style.cursor).toBe('');
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

  it('applies combined species and ccz filter', async () => {
    const { rerender } = render(<Map {...defaultProps} />);

    rerender(<Map {...defaultProps} selectedSpecies="Paraíso" selectedCCZ={5} />);

    await waitFor(() => {
      expect(mockMapInstance.setFilter).toHaveBeenCalledWith(
        'trees-point',
        ['all', ['==', ['get', 'e'], 'Paraíso'], ['==', ['get', 'c'], 5]]
      );
    });
  });

  it('queues filter until map is idle when style is not loaded', async () => {
    const { rerender } = render(<Map {...defaultProps} />);
    mockMapInstance.isStyleLoaded.mockReturnValue(false);

    rerender(<Map {...defaultProps} selectedSpecies="Paraíso" />);

    expect(mockMapInstance.once).toHaveBeenCalledWith('idle', expect.any(Function));

    const idleHandler = mockMapInstance.once.mock.calls.find(([event]) => event === 'idle')?.[1] as (() => void) | undefined;
    idleHandler?.();
    expect(mockMapInstance.setFilter).toHaveBeenCalledWith('trees-point', ['==', ['get', 'e'], 'Paraíso']);
  });

  it('changes basemap style when theme changes after mount', async () => {
    const { rerender } = render(<Map {...defaultProps} />);

    mockThemeState.resolvedTheme = 'light';
    rerender(<Map {...defaultProps} />);

    expect(mockMapInstance.setStyle).toHaveBeenCalledWith('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json');

    const styleLoadHandler = mockMapInstance.once.mock.calls.find(([event]) => event === 'style.load')?.[1] as (() => void) | undefined;
    styleLoadHandler?.();

    expect(mockMapInstance.setCenter).toHaveBeenCalled();
    expect(mockMapInstance.setZoom).toHaveBeenCalled();
  });

  it('cleans up map on unmount', () => {
    const { unmount } = render(<Map {...defaultProps} />);

    unmount();

    expect(mockMapInstance.remove).toHaveBeenCalled();
    expect(removeProtocol).toHaveBeenCalledWith('pmtiles');
  });
});
