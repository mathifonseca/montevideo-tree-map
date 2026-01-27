import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import TreePanel from './TreePanel';
import { mockTreesData } from '../test/mocks/handlers';

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
    expect(container.firstChild).toBeNull();
  });

  it('displays tree common name and scientific name', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Paraiso')).toBeInTheDocument();
      expect(screen.getByText('Melia azedarach')).toBeInTheDocument();
    });
  });

  it('displays tree location information', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Av\. 18 de Julio/)).toBeInTheDocument();
      expect(screen.getByText(/CCZ 1/)).toBeInTheDocument();
    });
  });

  it('displays tree characteristics', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      // Height
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Altura (m)')).toBeInTheDocument();
      // CAP
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('CAP (cm)')).toBeInTheDocument();
      // Crown diameter
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Copa (m)')).toBeInTheDocument();
    });
  });

  it('displays vegetative state with color', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Estado vegetativo')).toBeInTheDocument();
      expect(screen.getByText('Bueno')).toBeInTheDocument();
    });
  });

  it('displays coordinates', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Coordenadas')).toBeInTheDocument();
      expect(screen.getByText('-34.901100, -56.164500')).toBeInTheDocument();
    });
  });

  it('displays tree ID', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getByText('ID: 1')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(
      <TreePanel {...defaultProps} treeId={1} onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('Paraiso')).toBeInTheDocument();
    });

    // Find close button in header
    const closeButton = screen.getAllByRole('button')[0];
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows dead tree indicator for "Ejemplar seco"', async () => {
    render(<TreePanel {...defaultProps} treeId={3} />);

    await waitFor(() => {
      // Multiple elements contain "Ejemplar seco" (header, scientific name, indicator)
      const matches = screen.getAllByText('Ejemplar seco');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('fetches and displays Wikipedia description', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/Melia azedarach es un arbol/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays loading state while fetching species info', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    // Should show loading initially
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    // Then should show content
    await waitFor(() => {
      expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows Wikipedia link when available', async () => {
    render(<TreePanel {...defaultProps} treeId={1} />);

    await waitFor(() => {
      const link = screen.getByText('Leer más en Wikipedia');
      expect(link).toHaveAttribute('href', 'https://es.wikipedia.org/wiki/Melia_azedarach');
      expect(link).toHaveAttribute('target', '_blank');
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
      expect(screen.getByText('Árbol')).toBeInTheDocument();
    });
  });
});
