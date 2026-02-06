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
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    speciesCounts: mockSpeciesCounts,
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
    expect(screen.getByText('5')).toBeInTheDocument(); // 5 species in mock
    expect(screen.getByText('Especies')).toBeInTheDocument();
  });

  it('displays zone count', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Zonas (CCZ)')).toBeInTheDocument();
  });

  it('displays top species chart', () => {
    render(<StatsModal {...defaultProps} />);
    expect(screen.getByText('Especies más comunes')).toBeInTheDocument();
    expect(screen.getByText('Paraíso')).toBeInTheDocument();
    expect(screen.getByText('Fresno americano')).toBeInTheDocument();
    expect(screen.getByText('51.795')).toBeInTheDocument();
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
});
