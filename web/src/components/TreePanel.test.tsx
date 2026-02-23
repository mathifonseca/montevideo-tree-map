import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../test/utils/render';
import * as onlineStatusHook from '@/hooks/useOnlineStatus';
import TreePanel from './TreePanel';
import { mockTreesData, mockSpeciesMetadata } from '../test/mocks/handlers';

describe('TreePanel', () => {
  const defaultProps = {
    treeId: null,
    onClose: vi.fn(),
    treesData: mockTreesData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no tree is selected', () => {
    const { container } = render(<TreePanel {...defaultProps} />);
    // When no tree selected, AnimatePresence renders nothing
    expect(container.querySelector('.bg-gray-900')).toBeNull();
  });

  it('displays tree common name and scientific name', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      // Component renders both mobile and desktop panels with same content
      const commonNames = screen.getAllByText('Paraíso');
      const scientificNames = screen.getAllByText('Melia azedarach');
      expect(commonNames.length).toBeGreaterThanOrEqual(1);
      expect(scientificNames.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays tree location information', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText(/Av\. 18 de Julio/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/CCZ 1/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays tree characteristics', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      // Height
      expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Altura (m)').length).toBeGreaterThanOrEqual(1);
      // CAP
      expect(screen.getAllByText('120').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('CAP (cm)').length).toBeGreaterThanOrEqual(1);
      // Crown diameter
      expect(screen.getAllByText('6').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Copa (m)').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays vegetative state with color', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('Estado vegetativo').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Bueno').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays coordinates', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('Coordenadas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('-34.901100, -56.164500').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays tree ID', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('ID: 1').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(
      <TreePanel {...defaultProps} treeId={1} onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Paraíso').length).toBeGreaterThanOrEqual(1);
    });

    // Find close button (has X icon path) - get the first one
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn =>
      btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    );
    await user.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows dead tree indicator for "Ejemplar seco"', async () => {
    render(<TreePanel {...defaultProps} treeId={3} />);

    await waitFor(() => {
      // Multiple elements contain "Ejemplar seco" (header, scientific name, indicator)
      // Now also duplicated in mobile and desktop panels
      const matches = screen.getAllByText('Ejemplar seco');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('fetches and displays Wikipedia description', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText(/Melia azedarach es un arbol/).length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('displays loading state while fetching species info', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    // Should show loading initially (in both panels)
    expect(screen.getAllByText('Cargando...').length).toBeGreaterThanOrEqual(1);

    // Then should show content
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows Wikipedia link when available', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      const links = screen.getAllByText('Leer más en Wikipedia');
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute('href', 'https://es.wikipedia.org/wiki/Melia_azedarach');
      expect(links[0]).toHaveAttribute('target', '_blank');
    }, { timeout: 3000 });
  });

  it('displays "Árbol" as fallback when no common name', async () => {
    const treesDataNoName = {
      '99': {
        ...mockTreesData['1'],
        nombre_comun: null,
      },
    };

    render(<TreePanel {...defaultProps} treeId={99} treesData={treesDataNoName} />);

    await waitFor(() => {
      expect(screen.getAllByText('Árbol').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders share button', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('Paraíso').length).toBeGreaterThanOrEqual(1);
    });

    // Find share button by its title (multiple in mobile/desktop)
    const shareButtons = screen.getAllByTitle('Compartir');
    expect(shareButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows checkmark after share button is clicked', async () => {
    // Mock clipboard
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('Paraíso').length).toBeGreaterThanOrEqual(1);
    });

    const shareButtons = screen.getAllByTitle('Compartir');
    await user.click(shareButtons[0]);

    // After clicking, it should show a checkmark (success state)
    await waitFor(() => {
      // The checkmark SVG path
      const checkmark = shareButtons[0].querySelector('path[d="M5 13l4 4L19 7"]');
      expect(checkmark).toBeInTheDocument();
    });

    // Restore
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  it('uses Web Share API when available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
    });

    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByTitle('Compartir').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByTitle('Compartir')[0]);

    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('?arbol=1'),
      })
    );
  });

  it('opens carousel and supports next/prev navigation', async () => {
    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByAltText('Melia azedarach').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByAltText('Melia azedarach')[0]);

    await waitFor(() => {
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    const navButtons = screen.getAllByRole('button').filter((btn) => {
      const path = btn.querySelector('path');
      return path?.getAttribute('d') === 'M9 5l7 7-7 7' || path?.getAttribute('d') === 'M15 19l-7-7 7-7';
    });

    const nextButton = navButtons.find((btn) => btn.querySelector('path')?.getAttribute('d') === 'M9 5l7 7-7 7');
    const prevButton = navButtons.find((btn) => btn.querySelector('path')?.getAttribute('d') === 'M15 19l-7-7 7-7');
    expect(nextButton).toBeDefined();
    expect(prevButton).toBeDefined();

    await user.click(nextButton!);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    await user.click(prevButton!);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('supports keyboard navigation and escape to close carousel', async () => {
    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByAltText('Melia azedarach').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByAltText('Melia azedarach')[0]);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
    });
  });

  it('supports swipe gestures in carousel', async () => {
    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByAltText('Melia azedarach').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByAltText('Melia azedarach')[0]);
    const carouselImage = screen.getByAltText('Melia azedarach - 1');

    fireEvent.touchStart(carouselImage.parentElement!, {
      touches: [{ clientX: 220 }],
    });
    fireEvent.touchEnd(carouselImage.parentElement!, {
      changedTouches: [{ clientX: 80 }],
    });

    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Swipe right should go back to previous image
    const secondImage = screen.getByAltText('Melia azedarach - 2');
    fireEvent.touchStart(secondImage.parentElement!, {
      touches: [{ clientX: 80 }],
    });
    fireEvent.touchEnd(secondImage.parentElement!, {
      changedTouches: [{ clientX: 220 }],
    });

    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('updates image index via dots and keeps modal open on image container click', async () => {
    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByAltText('Melia azedarach').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByAltText('Melia azedarach')[0]);

    const dots = screen.getAllByRole('button').filter((btn) => btn.className.includes('w-2 h-2 rounded-full'));
    expect(dots.length).toBe(2);
    await user.click(dots[1]);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    // Click the container to hit stopPropagation handler
    fireEvent.click(screen.getByAltText('Melia azedarach - 2').parentElement!);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('closes carousel via close button and overlay click', async () => {
    const { user } = render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByAltText('Melia azedarach').length).toBeGreaterThanOrEqual(1);
    });

    await user.click(screen.getAllByAltText('Melia azedarach')[0]);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    const closeButton = screen.getAllByRole('button').find((btn) =>
      btn.className.includes('top-4 right-4') && btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    );
    await user.click(closeButton!);

    await waitFor(() => {
      expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
    });

    await user.click(screen.getAllByAltText('Melia azedarach')[0]);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    const overlay = Array.from(document.querySelectorAll('div')).find((el) =>
      el.className.includes('bg-black/90') && el.className.includes('z-50')
    ) as HTMLElement;
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
    });
  });

  it('shows offline image placeholder when offline', async () => {
    vi.spyOn(onlineStatusHook, 'useOnlineStatus').mockReturnValue(false);

    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getAllByText('Fotos no disponibles offline').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Species metadata', () => {
    it('displays "Introducida" badge for non-native species', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Introducida').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays "Nativa" badge for native species', async () => {
      const nativeTreeData = {
        '4': {
          ...mockTreesData['1'],
          nombre_comun: 'Anacahuita',
          nombre_cientifico: 'Blepharocalyx salicifolius',
        },
      };

      render(
        <TreePanel
          {...defaultProps}
          treeId={4}
          treesData={nativeTreeData}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Nativa').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows "Sobre esta especie" collapsible section', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Sobre esta especie').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('collapses and expands species metadata section', async () => {
      const { user } = render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Origen').length).toBeGreaterThanOrEqual(1);
      });

      await user.click(screen.getAllByText('Sobre esta especie')[0]);

      await waitFor(() => {
        expect(screen.queryByText('Origen')).not.toBeInTheDocument();
      });

      await user.click(screen.getAllByText('Sobre esta especie')[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Origen').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows species origin, foliage, and uses (expanded by default)', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Sobre esta especie').length).toBeGreaterThanOrEqual(1);
        // Content should be visible by default (starts expanded)
        expect(screen.getAllByText('Origen').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Asia (India, China)').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Follaje').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Caduco').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Usos').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('does not show metadata section for "Ejemplar seco"', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={3}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Ejemplar seco').length).toBeGreaterThanOrEqual(2);
      });

      // Should not show the "Sobre esta especie" section for dead trees
      expect(screen.queryByText('Sobre esta especie')).not.toBeInTheDocument();
    });

    it('displays blooming months grid', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Meses de floración').length).toBeGreaterThanOrEqual(1);
      });

      // Should show the 12-month grid
      const grids = document.querySelectorAll('[data-testid="blooming-months-grid"]');
      expect(grids.length).toBeGreaterThanOrEqual(1);
    });

    it('displays flower color', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Color de flor').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Violeta').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays growth rate', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Crecimiento').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Rápido').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('displays height comparison bar', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        const comparisons = document.querySelectorAll('[data-testid="height-comparison"]');
        expect(comparisons.length).toBeGreaterThanOrEqual(1);
      });

      // Should show the typical height text
      expect(screen.getAllByText(/Altura típica: 8-15m/).length).toBeGreaterThanOrEqual(1);
    });

    it('displays data source link', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        const links = screen.getAllByText('Fuente de datos');
        expect(links.length).toBeGreaterThanOrEqual(1);
        expect(links[0].closest('a')).toHaveAttribute('href', 'https://municipioc.montevideo.gub.uy/paraíso');
      });
    });

    it('shows "in bloom now" badge when current month is in bloomingMonths', async () => {
      // Mock current month to October (month 10, which is in Paraíso's bloomingMonths)
      const realDate = global.Date;
      const mockDate = class extends realDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(2024, 9, 15); // October 15 (month index 9 = October)
          } else {
            super(...(args as [any]));
          }
        }
        static now() { return new mockDate().getTime(); }
      };
      global.Date = mockDate as any;

      render(
        <TreePanel
          {...defaultProps}
          treeId={1}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('En flor ahora').length).toBeGreaterThanOrEqual(1);
      });

      global.Date = realDate;
    });

    it('fetches Wikipedia description for hybrid species (strips "x" notation)', async () => {
      const hybridTreeData = {
        '5': {
          ...mockTreesData['1'],
          nombre_comun: 'Plátano de sombra',
          nombre_cientifico: 'Platanus x acerifolia',
        },
      };

      render(<TreePanel {...defaultProps} treeId={5} treesData={hybridTreeData} />);

      // Should successfully fetch Wikipedia (the "x" is stripped so "Platanus acerifolia" is used)
      // The mock returns the same extract for all valid scientific names
      await waitFor(() => {
        expect(screen.getAllByText(/Melia azedarach es un arbol/).length).toBeGreaterThanOrEqual(1);
      }, { timeout: 3000 });
    });

    it('does not show blooming months for species without bloomingMonths', async () => {
      render(
        <TreePanel
          {...defaultProps}
          treeId={3}
          speciesMetadata={mockSpeciesMetadata}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Ejemplar seco').length).toBeGreaterThanOrEqual(2);
      });

      expect(screen.queryByText('Meses de floración')).not.toBeInTheDocument();
    });
  });
});
