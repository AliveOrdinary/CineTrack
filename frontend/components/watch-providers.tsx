import Image from 'next/image';
import { getImageUrl } from '@/services/tmdb';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkIcon } from 'lucide-react';

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

interface WatchProvidersData {
  link?: string; // Link to JustWatch or similar
  flatrate?: Provider[]; // Streaming
  rent?: Provider[];
  buy?: Provider[];
}

interface WatchProvidersProps {
  providers: WatchProvidersData | null | undefined;
}

function ProviderList({ title, items }: { title: string, items: Provider[] | undefined }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 last:mb-0">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((provider) => (
          <Avatar key={provider.provider_id} className="h-9 w-9 rounded-md border border-gray-700/50" title={provider.provider_name}>
            <AvatarImage src={provider.logo_path ? getImageUrl(provider.logo_path, 'w92') : undefined} alt={provider.provider_name} className="object-cover" />
            <AvatarFallback className="bg-gray-800 rounded-md text-gray-500">
              <LinkIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  );
}


export default function WatchProviders({ providers }: WatchProvidersProps) {
  const hasProviders = providers && (providers.flatrate?.length || providers.rent?.length || providers.buy?.length);

  return (
    <Card className="bg-gray-900 border-gray-800 mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xl">Where to Watch</CardTitle>
        {providers?.link && (
          <Button asChild variant="link" size="sm" className="p-0 h-auto">
             <a href={providers.link} target="_blank" rel="noopener noreferrer">
               See all options
             </a>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
         {!hasProviders ? (
             <p className="text-sm text-gray-500">Watch provider information not available for your region.</p>
         ) : (
            <div className="space-y-3">
               <ProviderList title="Stream" items={providers.flatrate} />
               {providers.flatrate?.length && (providers.rent?.length || providers.buy?.length) && <Separator className="my-2 bg-gray-700" />}
               <ProviderList title="Rent" items={providers.rent} />
               {providers.rent?.length && providers.buy?.length && <Separator className="my-2 bg-gray-700" />}
               <ProviderList title="Buy" items={providers.buy} />
            </div>
         )}
         <p className="text-xs text-gray-600 mt-4 text-right">Provider data via JustWatch</p>
      </CardContent>
    </Card>
  );
} 