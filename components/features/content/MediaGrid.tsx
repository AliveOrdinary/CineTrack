import { TmdbMedia } from '@/lib/tmdb/types';
import MediaCard from './MediaCard';

interface MediaGridProps {
  items: TmdbMedia[];
  showMediaType?: boolean;
  className?: string;
}

export default function MediaGrid({
  items,
  showMediaType = false,
  className = '',
}: MediaGridProps) {
  if (!items || items.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No content found</div>;
  }

  return (
    <div className={`grid mobile-grid-2 gap-3 md:gap-4 ${className}`}>
      {items.map(item => (
        <MediaCard key={item.id} media={item} showMediaType={showMediaType} />
      ))}
    </div>
  );
}
