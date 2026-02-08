import { ReactNode } from 'react';
import { vi } from 'vitest';

// Mutable state for testing
export const mockThemeState = {
  theme: 'dark' as string,
  resolvedTheme: 'dark' as string,
  setTheme: vi.fn((newTheme: string) => {
    mockThemeState.theme = newTheme;
    mockThemeState.resolvedTheme = newTheme;
  }),
};

// Reset function for tests
export function resetThemeMock() {
  mockThemeState.theme = 'dark';
  mockThemeState.resolvedTheme = 'dark';
  mockThemeState.setTheme.mockClear();
}

// Mock useTheme hook
export function useTheme() {
  return {
    theme: mockThemeState.theme,
    setTheme: mockThemeState.setTheme,
    resolvedTheme: mockThemeState.resolvedTheme,
    themes: ['light', 'dark', 'system'],
    systemTheme: 'dark',
  };
}

// Mock ThemeProvider
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
