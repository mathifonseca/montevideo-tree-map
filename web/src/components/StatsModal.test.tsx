import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils/render';
import StatsModal from './StatsModal';

describe('StatsModal', () => {
  const mockSpeciesCounts = {
    'Paraíso': 51795,
    'Fresno americano': 48092,
    'Plátano de sombra': 23235,
    'Tipa': 12354,
    'Arce negundo': 7701,
    'Ejemplar seco': 2261,
    'Especie rara 1': 1,
    'Especie rara 2': 1,
  };

  const mockSpeciesMetadata = {
    'Paraíso': { native: false, origin: 'Asia' },
    'Fresno americano': { native: false, origin: 'América del Norte' },
    'Anacahuita': { native: true, origin: 'Uruguay' },
  };

  const mockTreesData = {
    '1': {
      nombre_cientifico: 'Melia azedarach',
      nombre_comun: 'Paraíso',
      calle: 'Av. 18 de Julio',
      numero: 1234,
      ccz: 1,
      altura: 8,
      cap: 120,
      diametro_copa: 6,
      estado: 2,
      lat: -34.9011,
      lng: -56.1645,
    },
    '2': {
      nombre_cientifico: 'Fraxinus americana',
      nombre_comun: 'Fresno americano',
      calle: 'Bulevar Artigas',
      numero: 500,
      ccz: 4,
      altura: 12,
      cap: 150,
      diametro_copa: 8,
      estado: 1,
      lat: -34.9100,
      lng: -56.1700,
    },
    '3': {
      nombre_cientifico: 'Tipuana tipu',
      nombre_comun: 'Tipa',
      calle: 'Av. 18 de Julio',
      numero: 2000,
      ccz: 1,
      altura: 15,
      cap: 200,
      diametro_copa: 10,
      estado: 3,
      lat: -34.9050,
      lng: -56.1600,
    },
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    speciesCounts: mockSpeciesCounts,
    treesData: mockTreesData,
  };

  it('returns null when not open', () => {
    const { container } = render(<StatsModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays modal title', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Estadísticas')).toBeInTheDocument();
  });

  it('displays total tree count', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('234.464')).toBeInTheDocument();
    expect(screen.getByText('Árboles')).toBeInTheDocument();
  });

  it('displays species count', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('8')).toBeInTheDocument(); // 8 species in mock
    expect(screen.getByText('Especies')).toBeInTheDocument();
  });

  it('displays zone count', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Zonas')).toBeInTheDocument();
  });

  it('displays top species chart', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Especies más comunes')).toBeInTheDocument();
    expect(screen.getByText('Paraíso')).toBeInTheDocument();
    expect(screen.getByText('Fresno americano')).toBeInTheDocument();
    expect(screen.getByText('51.795')).toBeInTheDocument();
  });

  it('displays estado vegetativo section', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Estado vegetativo')).toBeInTheDocument();
    expect(screen.getByText('Muy bueno')).toBeInTheDocument();
    expect(screen.getByText('Bueno')).toBeInTheDocument();
    expect(screen.getByText('Regular')).toBeInTheDocument();
  });

  it('displays trees by CCZ section', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Árboles por zona (CCZ)')).toBeInTheDocument();
    expect(screen.getByText('CCZ 1')).toBeInTheDocument();
    expect(screen.getByText('CCZ 4')).toBeInTheDocument();
  });

  it('displays height distribution section', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Distribución de alturas')).toBeInTheDocument();
    expect(screen.getByText('5-10m')).toBeInTheDocument();
    expect(screen.getByText('10-15m')).toBeInTheDocument();
  });

  it('displays top streets section', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Calles con más árboles')).toBeInTheDocument();
    expect(screen.getByText('Av. 18 de Julio')).toBeInTheDocument();
    expect(screen.getByText('Bulevar Artigas')).toBeInTheDocument();
  });

  it('displays average dimensions', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Altura prom.')).toBeInTheDocument();
    expect(screen.getByText('CAP prom.')).toBeInTheDocument();
    expect(screen.getByText('Copa prom.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(<StatsModal {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('path[d="M6 18L18 6M6 6l12 12"]')
    );
    await user.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });

  it('displays data source attribution', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText(/Censo de Arbolado Urbano 2008/)).toBeInTheDocument();
  });

  describe('Fun Facts section', () => {
    it('displays "Sabías que..." title', () => {
      render(<StatsModal {...defaultProps} />);
      expect(screen.getByText('Sabías que...')).toBeInTheDocument();
    });

    it('displays most common species fact', () => {
      render(<StatsModal {...defaultProps} />);
      expect(screen.getByText(/Paraíso representa el/)).toBeInTheDocument();
    });

    it('displays rare species count', () => {
      render(<StatsModal {...defaultProps} />);
      expect(screen.getByText(/2 especies con un solo ejemplar/)).toBeInTheDocument();
    });

    it('displays dead trees count', () => {
      render(<StatsModal {...defaultProps} />);
      expect(screen.getByText(/2\.261 árboles están marcados como ejemplares secos/)).toBeInTheDocument();
    });

    it('displays native percentage when metadata is provided', () => {
      render(<StatsModal {...defaultProps} speciesMetadata={mockSpeciesMetadata} />);
      expect(screen.getByText(/especies nativas de Uruguay/)).toBeInTheDocument();
    });
  });
});
