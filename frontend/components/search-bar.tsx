'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from 'lucide-react';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  initialQuery = '', 
  placeholder = 'Search for movies, TV shows, people...',
  className = ''
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Create a new URLSearchParams instance
    const params = new URLSearchParams();
    
    // Add the search query
    params.set('query', searchQuery.trim());
    
    // Preserve existing filter parameters if needed
    const existingParams = ['type', 'genre', 'year', 'sort'];
    existingParams.forEach(param => {
      const value = searchParams.get(param);
      if (value) params.set(param, value);
    });
    
    // Navigate to search page with the query
    router.push(`/search?${params.toString()}`);
  }, [searchQuery, router, searchParams]);

  return (
    <form onSubmit={handleSearch} className={`relative w-full flex gap-2 ${className}`}>
      <div className="relative flex-grow">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2"
        />
      </div>
      <Button 
        type="submit" 
        size="sm"
      >
        Search
      </Button>
    </form>
  );
} 