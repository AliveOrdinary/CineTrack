'use client';

import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YoutubeEmbedProps {
  videoKey: string;
  title: string;
  className?: string;
}

export function YoutubeEmbed({ videoKey, title, className = '' }: YoutubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoKey}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${videoKey}/maxresdefault.jpg`;
  
  // Use youtube-nocookie.com for better privacy
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  const handlePlayClick = () => {
    setShowEmbed(true);
  };

  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  const handleIframeError = () => {
    setHasError(true);
  };

  if (hasError || (!showEmbed && !isLoaded)) {
    return (
      <div className={`aspect-video relative bg-black rounded-lg overflow-hidden ${className}`}>
        {/* Thumbnail with play button */}
        <div className="relative w-full h-full group cursor-pointer" onClick={handlePlayClick}>
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
          
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
          
          {/* YouTube logo */}
          <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-white text-xs font-medium">
            YouTube
          </div>
        </div>
        
        {/* Fallback link if thumbnail fails */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Unable to load video player</p>
              <Button asChild variant="outline">
                <a 
                  href={youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Watch on YouTube
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`aspect-video relative bg-black rounded-lg overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      
      <iframe
        src={embedUrl}
        title={title}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}