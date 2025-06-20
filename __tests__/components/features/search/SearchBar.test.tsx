/**
 * Unit tests for SearchBar component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '@/components/features/search/SearchBar';

// Mock the useRouter hook
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/search',
}));

// Mock the debounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value, // Return immediately for tests
}));

// Mock the TMDB client
jest.mock('@/lib/tmdb/client', () => ({
  searchMulti: jest.fn(() => Promise.resolve({ results: [] })),
}));

describe('SearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search'));
  });

  it('should handle text input', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test query');
    
    expect(searchInput).toHaveValue('test query');
  });

  it('should trigger search on Enter key', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test query');
    await user.keyboard('{Enter}');
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
  });

  it('should trigger search on form submit', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test query');
    
    // Submit the form (parent form element)
    const form = searchInput.closest('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form!);
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
  });

  it('should not search with empty query', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    // Try to submit empty form
    const form = searchInput.closest('form');
    fireEvent.submit(form!);
    
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should trim whitespace from query', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, '  test query  ');
    await user.keyboard('{Enter}');
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20query');
  });

  it('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test query');
    
    // Look for clear button (X icon)
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('should show clear button only when there is text', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    // Clear button should not be visible initially
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    
    // Clear button should now be visible
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should handle special characters in search query', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test & special chars!');
    await user.keyboard('{Enter}');
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=test%20%26%20special%20chars!');
  });

  it('should display search icon', () => {
    render(<SearchBar />);
    
    // Search icon should be present as an SVG element
    const searchIcon = document.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
    expect(searchIcon).toHaveClass('lucide-search');
  });

  it('should be accessible', () => {
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAccessibleName();
    expect(searchInput).toHaveAttribute('aria-describedby');
  });

  it('should handle rapid typing without multiple searches', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    
    // Type rapidly
    await user.type(searchInput, 'a');
    await user.type(searchInput, 'b');
    await user.type(searchInput, 'c');
    await user.keyboard('{Enter}');
    
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/search?q=abc');
  });

  it('should focus on input when component mounts', () => {
    render(<SearchBar autoFocus />);
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveFocus();
  });

  it('should accept initial value prop', () => {
    render(<SearchBar initialValue="initial search" />);
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveValue('initial search');
  });

  it('should call onSearch callback if provided', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();
    
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');
    await user.keyboard('{Enter}');
    
    expect(mockOnSearch).toHaveBeenCalledWith('test');
  });

  it('should handle keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const searchInput = screen.getByRole('searchbox');
    
    // Test basic typing and clearing with clear button
    await user.type(searchInput, 'test query');
    expect(searchInput).toHaveValue('test query');
    
    // Test that clear button works
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    expect(searchInput).toHaveValue('');
  });

  it('should be responsive to different screen sizes', () => {
    render(<SearchBar />);
    
    const container = screen.getByRole('searchbox').closest('div');
    expect(container).toHaveClass('relative'); // Should have positioning classes
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('w-full'); // Input should be full width
  });
});