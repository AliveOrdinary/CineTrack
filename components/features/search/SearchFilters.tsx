'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface SearchFiltersProps {
  currentType: string;
  query: string;
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV Shows' },
  { key: 'person', label: 'People' },
];

export default function SearchFilters({ currentType, query }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (type: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('q', query);
    if (type !== 'all') {
      params.set('type', type);
    } else {
      params.delete('type');
    }
    params.delete('page'); // Reset to first page when changing filters

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {filters.map(filter => (
        <Button
          key={filter.key}
          variant={currentType === filter.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange(filter.key)}
          className="min-w-[80px] touch-target"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
