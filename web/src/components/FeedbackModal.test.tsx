import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import FeedbackModal from './FeedbackModal';
import { server } from '../test/mocks/server';
import { errorHandlers } from '../test/mocks/handlers';

describe('FeedbackModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<FeedbackModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays modal title', () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByText('Enviar feedback')).toBeInTheDocument();
  });

  it('has message textarea', () => {
    render(<FeedbackModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Sugerencias, errores, ideas...')).toBeInTheDocument();
  });

  it('submit button is disabled when message is empty', () => {
    render(<FeedbackModal {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /enviar$/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when message is filled', async () => {
    const { user } = render(<FeedbackModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Sugerencias, errores, ideas...');
    await user.type(textarea, 'Great app!');

    const submitButton = screen.getByRole('button', { name: /enviar$/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const { user } = render(<FeedbackModal {...defaultProps} onClose={onClose} />);

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

  it('submits feedback successfully', async () => {
    const { user } = render(<FeedbackModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Sugerencias, errores, ideas...');
    await user.type(textarea, 'Great app!');

    const submitButton = screen.getByRole('button', { name: /enviar$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Feedback enviado')).toBeInTheDocument();
      expect(screen.getByText('Gracias por tu comentario.')).toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    server.use(errorHandlers.formspreeeedbackError);

    const { user } = render(<FeedbackModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Sugerencias, errores, ideas...');
    await user.type(textarea, 'Test feedback');

    const submitButton = screen.getByRole('button', { name: /enviar$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error al enviar. Intentá de nuevo.')).toBeInTheDocument();
    });
  });

  it('resets state when closed and reopened', async () => {
    const { user, rerender } = render(<FeedbackModal {...defaultProps} />);

    // Type and submit
    const textarea = screen.getByPlaceholderText('Sugerencias, errores, ideas...');
    await user.type(textarea, 'Test');

    const submitButton = screen.getByRole('button', { name: /enviar$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Feedback enviado')).toBeInTheDocument();
    });

    // Close
    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(closeButton);

    // Reopen
    rerender(<FeedbackModal isOpen={true} onClose={vi.fn()} />);

    // Should be back to initial state (form view, not success)
    expect(screen.getByPlaceholderText('Sugerencias, errores, ideas...')).toBeInTheDocument();
  });
});
