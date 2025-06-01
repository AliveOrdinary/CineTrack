'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Rating({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
  className,
}: RatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => {
        const isFilled = rating <= displayRating;
        const isHalf = rating === Math.ceil(displayRating) && displayRating % 1 !== 0;

        return (
          <button
            key={rating}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'transition-colors',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-300',
                !readonly && 'hover:text-yellow-400'
              )}
            />
          </button>
        );
      })}
      {value > 0 && <span className="ml-2 text-sm text-muted-foreground">{value}/10</span>}
    </div>
  );
}
