import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils/render';
import AboutModal from './AboutModal';

describe('AboutModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  it('returns null when isOpen is false', () => {
    const { container } = render(<AboutModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays modal title', () => {
    render(<AboutModal {...defaultProps} />);
    expect(screen.getByText('Sobre este proyecto')).toBeInTheDocument();
  });

  it('displays tree count', () => {
    render(<AboutModal {...defaultProps} />);
    expect(screen.getByText(/234,464 árboles/)).toBeInTheDocument();
  });

  it('displays inspiration section with Gieß den Kiez link', () => {
    render(<AboutModal {...defaultProps} />);

    expect(screen.getByText('Inspiración')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Gieß den Kiez' });
    expect(link).toHaveAttribute('href', 'https://giessdenkiez.de');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('displays data sources section', () => {
    render(<AboutModal {...defaultProps} />);

    expect(screen.getByText('Fuentes de datos')).toBeInTheDocument();

    const censusLink = screen.getByRole('link', { name: 'Censo de arbolado 2008' });
    expect(censusLink).toHaveAttribute('href', 'https://catalogodatos.gub.uy/dataset/intendencia-montevideo-censo-de-arbolado-2008');

    const geowebLink = screen.getByRole('link', { name: 'GeoWeb Montevideo' });
    expect(geowebLink).toHaveAttribute('href', 'https://geoweb.montevideo.gub.uy/geonetwork/srv/spa/catalog.search');
  });

  it('displays author information', () => {
    render(<AboutModal {...defaultProps} />);

    const authorLink = screen.getByRole('link', { name: 'Mathi Fonseca' });
    expect(authorLink).toHaveAttribute('href', 'https://mathifonseca.me');
    expect(authorLink).toHaveAttribute('target', '_blank');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(<AboutModal {...defaultProps} onClose={onClose} />);

    // Find the "Cerrar" button at the bottom
    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(<AboutModal {...defaultProps} onClose={onClose} />);

    // Find close button (X icon in header)
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn =>
      btn.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]')
    );

    if (xButton) {
      await user.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
