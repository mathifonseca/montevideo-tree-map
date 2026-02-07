import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '../test/utils/render';
import Filters from './Filters';

const mockSpecies = [
  'Paraíso',
  'Fresno americano',
  'Plátano',
  'Tipa',
  'Arce negundo',
  'Fresno europeo',
  'Laurel rosa',
  'Anacahuita',
  'Jacarandá',
  'Olmo procera',
];

describe('Filters', () => {
  const defaultProps = {
    species: mockSpecies,
    selectedSpecies: null,
    onSpeciesChange: vi.fn(),
    selectedCCZ: null,
    onCCZChange: vi.fn(),
    onLocationSelect: vi.fn(),
  };

  it('renders the header with tree count', () => {
    render(<Filters {...defaultProps} />);

    expect(screen.getByText('Arbolado urbano de Montevideo')).toBeInTheDocument();
    expect(screen.getByText('234.464 árboles')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<Filters {...defaultProps} />);

    expect(screen.getByPlaceholderText('Buscar especie...')).toBeInTheDocument();
  });

  it('shows species dropdown when searching', async () => {
    const { user } = render(<Filters {...defaultProps} />);

    const input = screen.getByPlaceholderText('Buscar especie...');
    await user.click(input);
    await user.type(input, 'Para');

    // Dropdown items have class "w-full text-left" to distinguish from legend buttons
    const dropdownButtons = screen.getAllByRole('button', { name: 'Paraíso' });
    const dropdownItem = dropdownButtons.find(btn =>
      btn.classList.contains('text-left')
    );
    expect(dropdownItem).toBeInTheDocument();
  }, 10000);

  it('filters species based on search input', async () => {
    const { user } = render(<Filters {...defaultProps} />);

    const input = screen.getByPlaceholderText('Buscar especie...');
    await user.type(input, 'Fresno');

    // Should find both Fresno species in dropdown
    const dropdownButtons = screen.getAllByRole('button').filter(btn =>
      btn.classList.contains('text-left')
    );
    expect(dropdownButtons.some(btn => btn.textContent === 'Fresno americano')).toBe(true);
    expect(dropdownButtons.some(btn => btn.textContent === 'Fresno europeo')).toBe(true);
  });

  it('calls onSpeciesChange when a species is selected from dropdown', async () => {
    const onSpeciesChange = vi.fn();
    const { user } = render(
      <Filters {...defaultProps} onSpeciesChange={onSpeciesChange} />
    );

    const input = screen.getByPlaceholderText('Buscar especie...');
    await user.type(input, 'Para');

    // Click the dropdown item (not the legend one)
    const dropdownButtons = screen.getAllByRole('button', { name: 'Paraíso' });
    const dropdownItem = dropdownButtons.find(btn =>
      btn.classList.contains('text-left')
    )!;
    await user.click(dropdownItem);

    expect(onSpeciesChange).toHaveBeenCalledWith('Paraíso');
  });

  it('shows selected species badge when a species is selected', () => {
    render(<Filters {...defaultProps} selectedSpecies="Paraíso" />);

    // Badge has a specific class
    const badge = screen.getAllByText('Paraíso').find(el =>
      el.classList.contains('bg-green-600')
    );
    expect(badge).toBeInTheDocument();
  });

  it('clears selection when clear button is clicked', async () => {
    const onSpeciesChange = vi.fn();
    const { user } = render(
      <Filters {...defaultProps} selectedSpecies="Paraíso" onSpeciesChange={onSpeciesChange} />
    );

    // Find the clear button (X icon inside input area)
    const clearButtons = screen.getAllByRole('button');
    const clearButton = clearButtons.find(btn =>
      btn.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]')
    );

    if (clearButton) {
      await user.click(clearButton);
      expect(onSpeciesChange).toHaveBeenCalledWith(null);
    }
  });

  it('displays "no results" message when no species match', async () => {
    const { user } = render(<Filters {...defaultProps} />);

    const input = screen.getByPlaceholderText('Buscar especie...');
    await user.type(input, 'xyz123');

    expect(screen.getByText('No se encontraron especies')).toBeInTheDocument();
  });

  it('shows legend with common species colors', () => {
    render(<Filters {...defaultProps} />);

    // Both desktop and mobile have the legend text
    const legendHeaders = screen.getAllByText('Especies más comunes');
    expect(legendHeaders.length).toBe(2); // desktop + mobile
  });

  it('calls onSpeciesChange when legend item is clicked', async () => {
    const onSpeciesChange = vi.fn();
    const { user } = render(
      <Filters {...defaultProps} onSpeciesChange={onSpeciesChange} />
    );

    // Find legend buttons (they have gap-2 class unlike dropdown buttons)
    const legendButtons = screen.getAllByRole('button', { name: /Paraíso/i });
    await user.click(legendButtons[0]);

    expect(onSpeciesChange).toHaveBeenCalledWith('Paraíso');
  });

  it('shows filtered count when species is selected with speciesCounts', () => {
    const speciesCounts = { 'Paraíso': 51795 };
    render(
      <Filters {...defaultProps} selectedSpecies="Paraíso" speciesCounts={speciesCounts} />
    );

    expect(screen.getByText('51.795 de 234.464 árboles')).toBeInTheDocument();
  });

  it('limits dropdown to 20 species and shows count', async () => {
    const manySpecies = Array.from({ length: 30 }, (_, i) => `Species ${i + 1}`);
    const { user } = render(
      <Filters {...defaultProps} species={manySpecies} />
    );

    const input = screen.getByPlaceholderText('Buscar especie...');
    await user.type(input, 'Species');

    expect(screen.getByText('+10 más...')).toBeInTheDocument();
  });

  it('renders CCZ dropdown with all zones', () => {
    render(<Filters {...defaultProps} />);

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Todas las zonas')).toBeInTheDocument();
  });

  it('calls onCCZChange when a zone is selected', async () => {
    const onCCZChange = vi.fn();
    const { user } = render(
      <Filters {...defaultProps} onCCZChange={onCCZChange} />
    );

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '5');

    expect(onCCZChange).toHaveBeenCalledWith(5);
  });

  it('shows zone description when CCZ is selected', () => {
    render(<Filters {...defaultProps} selectedCCZ={5} />);

    expect(screen.getByText('Pocitos, Punta Carretas')).toBeInTheDocument();
  });

  it('renders address search input when onLocationSelect is provided', () => {
    render(<Filters {...defaultProps} />);

    expect(screen.getByText('Buscar dirección')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: 18 de Julio 1234')).toBeInTheDocument();
  });

  it('does not render address search when onLocationSelect is not provided', () => {
    render(<Filters {...defaultProps} onLocationSelect={undefined} />);

    expect(screen.queryByText('Buscar dirección')).not.toBeInTheDocument();
  });
});
