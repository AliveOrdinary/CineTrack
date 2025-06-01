'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Play, ShoppingCart, Download } from 'lucide-react';
import {
  TmdbWatchProviderResponse,
  TmdbWatchProvider,
  TmdbWatchProviderResult,
} from '@/lib/tmdb/types';

interface WatchProvidersProps {
  providers: TmdbWatchProviderResponse | null;
  title: string;
  mediaType: 'movie' | 'tv';
}

interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

// Common countries with streaming services
const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
];

const getProviderTypeIcon = (type: string) => {
  switch (type) {
    case 'flatrate':
      return <Play className="h-4 w-4" />;
    case 'rent':
      return <Download className="h-4 w-4" />;
    case 'buy':
      return <ShoppingCart className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
};

const getProviderTypeLabel = (type: string) => {
  switch (type) {
    case 'flatrate':
      return 'Stream';
    case 'rent':
      return 'Rent';
    case 'buy':
      return 'Buy';
    default:
      return 'Watch';
  }
};

const getProviderTypeColor = (type: string) => {
  switch (type) {
    case 'flatrate':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'rent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'buy':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export function WatchProviders({ providers, title, mediaType }: WatchProvidersProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');

  if (!providers?.results || Object.keys(providers.results).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Where to Watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No streaming information available for this {mediaType}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const availableCountries = SUPPORTED_COUNTRIES.filter(country => providers.results[country.code]);

  const currentProviders = providers.results[selectedCountry];

  if (!currentProviders) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Where to Watch
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No streaming information available in your region.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderProviderGroup = (
    providers: TmdbWatchProvider[],
    type: 'flatrate' | 'rent' | 'buy',
    link: string
  ) => {
    if (!providers || providers.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getProviderTypeIcon(type)}
          <h4 className="font-medium">{getProviderTypeLabel(type)}</h4>
          <Badge variant="outline" className={getProviderTypeColor(type)}>
            {providers.length} {providers.length === 1 ? 'option' : 'options'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {providers.map((provider, index) => (
            <a
              key={`${provider.provider_name}-${index}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex flex-col items-center gap-2">
                    {provider.logo_path ? (
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                          alt={provider.provider_name}
                          width={48}
                          height={48}
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {getProviderTypeIcon(type)}
                      </div>
                    )}
                    <div className="text-center">
                      <p
                        className="text-sm font-medium truncate w-full"
                        title={provider.provider_name}
                      >
                        {provider.provider_name}
                      </p>
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          {getProviderTypeLabel(type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Where to Watch
          </CardTitle>

          {availableCountries.length > 1 && (
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    <span className="flex items-center gap-2">
                      <span>{country.flag}</span>
                      <span>{country.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {availableCountries.length === 1 && (
          <p className="text-sm text-muted-foreground">
            Available in {availableCountries[0].flag} {availableCountries[0].name}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Streaming Services */}
        {renderProviderGroup(currentProviders.flatrate || [], 'flatrate', currentProviders.link)}

        {/* Rental Services */}
        {renderProviderGroup(currentProviders.rent || [], 'rent', currentProviders.link)}

        {/* Purchase Services */}
        {renderProviderGroup(currentProviders.buy || [], 'buy', currentProviders.link)}

        {/* JustWatch Attribution and Link */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Streaming data provided by JustWatch</p>
            {currentProviders.link && (
              <Button variant="outline" size="sm" asChild className="text-xs">
                <a
                  href={currentProviders.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View All Options
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
