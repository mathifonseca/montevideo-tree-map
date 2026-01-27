import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import ReportModal from './ReportModal';
import { server } from '../test/mocks/server';
import { errorHandlers } from '../test/mocks/handlers';

const mockSpecies = ['Paraiso', 'Fresno americano', 'Platano', 'Tipa'];

describe('ReportModal', () => {
  const defaultProps = {
    coords: { lat: -34.9011, lng: -56.1645 },
    onClose: vi.fn(),
    species: mockSpecies,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when coords is null', () => {
    const { container } = render(
      <ReportModal {...defaultProps} coords={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays modal title', () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByText('Reportar árbol')).toBeInTheDocument();
  });

  it('displays coordinates', () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByText('-34.901100, -56.164500')).toBeInTheDocument();
  });

  it('has species search input', () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Buscar o escribir especie...')).toBeInTheDocument();
  });

  it('has notes textarea', () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Ej: En el Parque Rodó, cerca de la fuente...')).toBeInTheDocument();
  });

  it('shows species dropdown when typing', async () => {
    const { user } = render(<ReportModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Buscar o escribir especie...');
    await user.type(input, 'Para');

    expect(screen.getByRole('button', { name: 'Paraiso' })).toBeInTheDocument();
  });

  it('selects species from dropdown', async () => {
    const { user } = render(<ReportModal {...defaultProps} />);

    const input = screen.getByPlaceholderText('Buscar o escribir especie...');
    await user.type(input, 'Para');
    await user.click(screen.getByRole('button', { name: 'Paraiso' }));

    expect(input).toHaveValue('Paraiso');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(<ReportModal {...defaultProps} onClose={onClose} />);

    // Find close button (X icon)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn =>
      btn.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]')
    );

    if (closeButton) {
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('submits report successfully', async () => {
    const { user } = render(<ReportModal {...defaultProps} />);

    // Fill in the form
    const speciesInput = screen.getByPlaceholderText('Buscar o escribir especie...');
    await user.type(speciesInput, 'Tilo');

    const notesInput = screen.getByPlaceholderText('Ej: En el Parque Rodó, cerca de la fuente...');
    await user.type(notesInput, 'Cerca de la entrada principal');

    // Submit
    const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
    await user.click(submitButton);

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText('Reporte enviado')).toBeInTheDocument();
      expect(screen.getByText('Gracias por contribuir al mapa.')).toBeInTheDocument();
    });
  });

  it('shows sending state while submitting', async () => {
    // Use a delayed response to catch the sending state
    server.use(
      (await import('msw')).http.post('https://formspree.io/f/mbdodqbo', async () => {
        await new Promise((r) => setTimeout(r, 500));
        return (await import('msw')).HttpResponse.json({ ok: true });
      })
    );

    const { user } = render(<ReportModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
    await user.click(submitButton);

    // Should show "Enviando..." while request is pending
    expect(screen.getByText('Enviando...')).toBeInTheDocument();
  });

  it('shows error message on submission failure', async () => {
    server.use(errorHandlers.formspreeReportError);

    const { user } = render(<ReportModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error al enviar. Intentá de nuevo.')).toBeInTheDocument();
    });
  });

  it('closes modal after successful submission', async () => {
    const onClose = vi.fn();
    const { user } = render(<ReportModal {...defaultProps} onClose={onClose} />);

    // Submit
    const submitButton = screen.getByRole('button', { name: /enviar reporte/i });
    await user.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Reporte enviado')).toBeInTheDocument();
    });

    // Click close button in success state
    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('resets form when coords change', async () => {
    const { user, rerender } = render(<ReportModal {...defaultProps} />);

    // Type something
    const speciesInput = screen.getByPlaceholderText('Buscar o escribir especie...');
    await user.type(speciesInput, 'Tilo');

    // Change coords
    rerender(
      <ReportModal
        {...defaultProps}
        coords={{ lat: -34.95, lng: -56.20 }}
      />
    );

    // Input should be cleared
    expect(speciesInput).toHaveValue('');
  });
});
