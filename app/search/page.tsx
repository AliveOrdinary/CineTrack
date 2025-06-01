import { Suspense } from 'react';
import { searchMulti, searchMovies, searchTvShows, searchPeople } from '@/lib/tmdb/client';
import MediaGrid from '@/components/features/content/MediaGrid';
import MediaSectionSkeleton from '@/components/features/content/MediaSectionSkeleton';
import SearchFilters from '@/components/features/search/SearchFilters';
import { TmdbMedia } from '@/lib/tmdb/types';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
  }>;
}

async function SearchResults({ query, type, page }: { query: string; type: string; page: number }) {
  try {
    let results;
    let title;

    switch (type) {
      case 'movie':
        results = await searchMovies(query, page);
        title = 'Movie Results';
        break;
      case 'tv':
        results = await searchTvShows(query, page);
        title = 'TV Show Results';
        break;
      case 'person':
        results = await searchPeople(query, page);
        title = 'People Results';
        break;
      default:
        results = await searchMulti(query, page);
        title = 'All Results';
        break;
    }

    if (!results.results.length) {
      return (
        <div className="text-center py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">No results found</h2>
          <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {results.total_results.toLocaleString()} results found
          </p>
        </div>

        <MediaGrid items={results.results} showMediaType={type === 'all'} />

        {/* Pagination could be added here */}
        {results.total_pages > 1 && (
          <div className="flex justify-center py-6 md:py-8">
            <p className="text-sm text-muted-foreground">
              Page {page} of {results.total_pages}
            </p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Search error:', error);
    return (
      <div className="text-center py-8 md:py-12">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Search Error</h2>
        <p className="text-muted-foreground">
          Sorry, we couldn't complete your search. Please try again later.
        </p>
      </div>
    );
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  const page = parseInt(params.page || '1', 10);

  if (!query) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 md:px-4">
        <div className="text-center py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Search</h1>
          <p className="text-muted-foreground">
            Enter a search term to find movies, TV shows, and people
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 md:px-4">
      <div className="space-y-6 md:space-y-8">
        {/* Search header */}
        <div className="text-center py-4 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Search Results for "{query}"</h1>
        </div>

        {/* Filters */}
        <SearchFilters currentType={type} query={query} />

        {/* Results */}
        <Suspense fallback={<MediaSectionSkeleton />}>
          <SearchResults query={query} type={type} page={page} />
        </Suspense>
      </div>
    </div>
  );
}
