import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils/render';
import { ThemeProvider } from './ThemeProvider';

describe('ThemeProvider', () => {
  it('renders children correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child1">First</div>
        <div data-testid="child2">Second</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
  });

  it('renders nested elements correctly', () => {
    render(
      <ThemeProvider>
        <div data-testid="parent">
          <span data-testid="nested">Nested Content</span>
        </div>
      </ThemeProvider>
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('nested')).toBeInTheDocument();
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
  });
});
