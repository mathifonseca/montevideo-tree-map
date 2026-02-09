import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/render';
import ThemeToggle from './ThemeToggle';
import { mockThemeState, resetThemeMock } from '../test/mocks/next-themes';

describe('ThemeToggle', () => {
  beforeEach(() => {
    resetThemeMock();
  });

  it('renders a button with correct aria-label', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('shows sun icon in dark mode', async () => {
    mockThemeState.resolvedTheme = 'dark';
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });

  it('shows moon icon in light mode', async () => {
    mockThemeState.resolvedTheme = 'light';
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });
  });

  it('calls setTheme with "light" when in dark mode and clicked', async () => {
    mockThemeState.resolvedTheme = 'dark';
    const { user } = render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockThemeState.setTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with "dark" when in light mode and clicked', async () => {
    mockThemeState.resolvedTheme = 'light';
    const { user } = render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockThemeState.setTheme).toHaveBeenCalledWith('dark');
  });

  it('has correct styling classes', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('cursor-pointer');
    });
  });

  it('contains an SVG icon', async () => {
    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-5', 'h-5');
    });
  });
});
