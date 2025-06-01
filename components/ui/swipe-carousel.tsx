'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SwipeCarouselProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  showArrows?: boolean;
  autoScroll?: boolean;
  scrollInterval?: number;
}

export function SwipeCarousel({
  children,
  className = '',
  itemClassName = '',
  showArrows = true,
  autoScroll = false,
  scrollInterval = 5000,
}: SwipeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  useEffect(() => {
    if (autoScroll && !isScrolling) {
      const interval = setInterval(() => {
        scrollRight();
      }, scrollInterval);
      return () => clearInterval(interval);
    }
  }, [autoScroll, scrollInterval, isScrolling]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      // If we're at the end, scroll back to the beginning
      if (scrollLeft >= scrollWidth - clientWidth - 1) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleTouchStart = () => {
    setIsScrolling(true);
  };

  const handleTouchEnd = () => {
    setTimeout(() => setIsScrolling(false), 100);
  };

  return (
    <div className={cn('relative group', className)}>
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md hidden md:flex"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-md hidden md:flex"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth-mobile pb-2"
        onScroll={checkScrollability}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className={cn('flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44', itemClassName)}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Scroll Indicators for Mobile */}
      <div className="flex justify-center mt-2 md:hidden">
        <div className="flex gap-1">
          {Array.from({ length: Math.ceil(children.length / 3) }).map((_, index) => (
            <div key={index} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hide scrollbar utility
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = scrollbarHideStyles;
  document.head.appendChild(style);
}
