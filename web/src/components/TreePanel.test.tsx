import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
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
  });
});
