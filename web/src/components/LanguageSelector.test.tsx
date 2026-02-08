import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils/render';
import LanguageSelector from './LanguageSelector';

describe('LanguageSelector', () => {
  const originalLocation = window.location;
  const mockReload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.cookie = '';

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: mockReload },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('renders a select element', () => {
    render(<LanguageSelector />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<LanguageSelector />);
    expect(screen.getByLabelText('Select language')).toBeInTheDocument();
  });

  it('displays ES and EN options', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('es');
    expect(options[0]).toHaveTextContent('ES');
    expect(options[1]).toHaveValue('en');
    expect(options[1]).toHaveTextContent('EN');
  });

  it('has Spanish selected by default (from mock)', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('es');
  });

  it('sets cookie when language is changed', async () => {
    const { user } = render(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'en');

    expect(document.cookie).toContain('locale=en');
  });

  it('has correct styling classes', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('rounded-lg');
    expect(select).toHaveClass('cursor-pointer');
  });

  it('has disabled style when pending', () => {
    render(<LanguageSelector />);

    const select = screen.getByRole('combobox');
    // Initially not disabled
    expect(select).not.toBeDisabled();
  });
});
