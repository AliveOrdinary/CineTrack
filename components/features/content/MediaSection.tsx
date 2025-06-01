import { TmdbMedia } from '@/lib/tmdb/types';
import MediaGrid from './MediaGrid';

interface MediaSectionProps {
  title: string;
  items: TmdbMedia[];
  showMediaType?: boolean;
  className?: string;
}

export default function MediaSection({
  title,
  items,
  showMediaType = false,
  className = '',
}: MediaSectionProps) {
  return (
    <section className={`space-y-3 md:space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
        {items.length > 0 && (
          <button className="text-sm text-primary hover:underline touch-target">See all</button>
        )}
      </div>

      <MediaGrid
        items={items.slice(0, 12)} // Limit to 12 items for homepage
        showMediaType={showMediaType}
      />
    </section>
  );
}
