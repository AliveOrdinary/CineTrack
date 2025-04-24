'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Import Shadcn UI components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Genre {
  id: number;
  name: string;
}

interface SearchFiltersProps {
  movieGenres: Genre[];
  tvGenres: Genre[];
}

export default function SearchFilters({ movieGenres, tvGenres }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current filter values from URL
  const currentTypeParam = searchParams.get('type') || 'all';
  const currentGenreIdParam = searchParams.get('genre') || 'all';
  const currentYearParam = searchParams.get('year') || 'all';
  const currentSortParam = searchParams.get('sort') || 'popularity.desc';

  // Set up state for filters
  const [mediaType, setMediaType] = useState(currentTypeParam);
  const [genreId, setGenreId] = useState(currentGenreIdParam);
  const [year, setYear] = useState(currentYearParam);
  const [sortBy, setSortBy] = useState(currentSortParam);

  // Determine which genres to show based on media type
  const genres = mediaType === 'tv' ? tvGenres : 
                mediaType === 'movie' ? movieGenres : 
                [...movieGenres, ...tvGenres].filter((genre, index, self) => 
                  index === self.findIndex(g => g.id === genre.id)
                );

  // Apply filters
  const applyFilters = useCallback(() => {
    // Create a new URLSearchParams instance
    const params = new URLSearchParams();
    
    // Keep existing query parameters 
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });
    
    // Update filter parameters
    if (mediaType !== 'all') {
      params.set('type', mediaType);
    } else {
      params.delete('type');
    }
    
    if (genreId && genreId !== 'all') {
      params.set('genre', genreId);
    } else {
      params.delete('genre');
    }
    
    if (year && year !== 'all') {
      params.set('year', year);
    } else {
      params.delete('year');
    }
    
    if (sortBy !== 'popularity.desc') {
      params.set('sort', sortBy);
    } else {
      params.delete('sort');
    }
    
    // Navigate to search page with filters
    router.push(`/search?${params.toString()}`);
  }, [mediaType, genreId, year, sortBy, searchParams, router]);

  // Generate year options
  const currentCalendarYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 50 }, (_, i) => currentCalendarYear - i);

  // Reset filters
  const resetFilters = () => {
    setMediaType('all');
    setGenreId('all');
    setYear('all');
    setSortBy('popularity.desc');
  };

  // Update state when URL params change
  useEffect(() => {
    setMediaType(currentTypeParam);
    setGenreId(currentGenreIdParam);
    setYear(currentYearParam);
    setSortBy(currentSortParam);
  }, [currentTypeParam, currentGenreIdParam, currentYearParam, currentSortParam]);

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 mb-6">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Media Type Filter */}
        <div className="space-y-1">
          <Label htmlFor="mediaTypeFilter">Media Type</Label>
          <Select value={mediaType} onValueChange={setMediaType}>
            <SelectTrigger id="mediaTypeFilter">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="movie">Movies</SelectItem>
              <SelectItem value="tv">TV Shows</SelectItem>
              <SelectItem value="person">People</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Genre Filter */}
        <div className="space-y-1">
          <Label htmlFor="genreFilter">Genre</Label>
          <Select value={genreId} onValueChange={setGenreId}>
            <SelectTrigger id="genreFilter">
              <SelectValue placeholder="Select Genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()}>
                  {genre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Year Filter */}
        <div className="space-y-1">
          <Label htmlFor="yearFilter">Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="yearFilter">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {yearOptions.map((yearOpt) => (
                <SelectItem key={yearOpt} value={yearOpt.toString()}>
                  {yearOpt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort By Filter */}
        <div className="space-y-1">
          <Label htmlFor="sortFilter">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sortFilter">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity.desc">Popularity (Desc)</SelectItem>
              <SelectItem value="popularity.asc">Popularity (Asc)</SelectItem>
              <SelectItem value="vote_average.desc">Rating (Desc)</SelectItem>
              <SelectItem value="vote_average.asc">Rating (Asc)</SelectItem>
              <SelectItem value="release_date.desc">Release Date (Desc)</SelectItem>
              <SelectItem value="release_date.asc">Release Date (Asc)</SelectItem>
              <SelectItem value="original_title.asc">Title (A-Z)</SelectItem>
              <SelectItem value="original_title.desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Separator className="my-4 bg-gray-800" />

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={applyFilters}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
} 