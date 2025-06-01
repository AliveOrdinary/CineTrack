'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { TmdbWatchProvider } from '@/lib/tmdb/types';

interface WatchProviderBadgeProps {
  providers: TmdbWatchProvider[] | undefined;
  limit?: number;
  size?: 'sm' | 'md';
  showText?: boolean;
}

export function WatchProviderBadge({
  providers,
  limit = 3,
  size = 'sm',
  showText = false,
}: WatchProviderBadgeProps) {
  if (!providers || providers.length === 0) {
    return null;
  }

  const displayProviders = providers.slice(0, limit);
  const hasMore = providers.length > limit;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
  };

  if (showText && displayProviders.length === 1) {
    const provider = displayProviders[0];
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Play className="h-3 w-3" />
        {provider.logo_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
            alt={provider.provider_name}
            width={12}
            height={12}
            className="rounded"
          />
        ) : null}
        <span className="text-xs truncate">{provider.provider_name}</span>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1">
        {displayProviders.map((provider, index) => (
          <div
            key={`${provider.provider_name}-${index}`}
            className={`${sizeClasses[size]} relative rounded border-2 border-background bg-background overflow-hidden`}
            title={provider.provider_name}
          >
            {provider.logo_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                alt={provider.provider_name}
                width={size === 'sm' ? 16 : 24}
                height={size === 'sm' ? 16 : 24}
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="h-2 w-2 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
          +{providers.length - limit}
        </Badge>
      )}
    </div>
  );
}
