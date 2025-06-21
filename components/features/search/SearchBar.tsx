'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchMulti } from '@/lib/tmdb/client';
import { TmdbMedia } from '@/lib/tmdb/types';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({
  placeholder = 'Search movies, TV shows, and people...',
  className = '',
  showSuggestions = true,
  autoFocus = false,
  initialValue = '',
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<TmdbMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = 'search-suggestions';
  const comboboxId = 'search-combobox';

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.trim().length > 2 && showSuggestions) {
      setIsLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await searchMulti(query, 1);
          setSuggestions(results.results.slice(0, 5)); // Show top 5 suggestions
          setShowDropdown(true);
          setSelectedIndex(-1); // Reset selection
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setIsLoading(false);
      setSelectedIndex(-1);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, showSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If a suggestion is selected, navigate to it
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSuggestionClick(suggestions[selectedIndex]);
      return;
    }

    // Otherwise, go to search results
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: TmdbMedia) => {
    const mediaType = suggestion.media_type || (suggestion.title ? 'movie' : 'tv');
    router.push(`/${mediaType}/${suggestion.id}`);
    setQuery('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSuggestionTitle = (item: TmdbMedia) => {
    return item.title || item.name || 'Unknown';
  };

  const getSuggestionYear = (item: TmdbMedia) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  const getSuggestionType = (item: TmdbMedia) => {
    if (item.media_type === 'person') return 'Person';
    if (item.media_type === 'tv') return 'TV Show';
    return 'Movie';
  };

  return (
    <div
      ref={searchRef}
      className={`relative ${className}`}
      role="combobox"
      aria-expanded={showDropdown}
      aria-haspopup="listbox"
    >
      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor={comboboxId} className="sr-only">
          Search for movies, TV shows, and people
        </label>
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id={comboboxId}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          autoComplete="off"
          autoFocus={autoFocus}
          aria-autocomplete="list"
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined}
          aria-describedby="search-instructions"
          role="searchbox"
        />
        <div id="search-instructions" className="sr-only">
          Use arrow keys to navigate suggestions, Enter to select, Escape to close
        </div>
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </Button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-live="polite">
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Searching...</span>
          </div>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
          aria-label="Search suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={selectedIndex === index}
              className={`w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 border-b border-border last:border-b-0 cursor-pointer focus:outline-none focus:bg-accent focus:text-accent-foreground ${
                selectedIndex === index ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex-1">
                <div className="font-medium">{getSuggestionTitle(suggestion)}</div>
                <div className="text-sm text-muted-foreground">
                  {getSuggestionType(suggestion)}
                  {getSuggestionYear(suggestion) && ` • ${getSuggestionYear(suggestion)}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Live region for search results count */}
      {showDropdown && (
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {suggestions.length > 0
            ? `${suggestions.length} search suggestions available`
            : 'No search suggestions found'}
        </div>
      )}
    </div>
  );
}
