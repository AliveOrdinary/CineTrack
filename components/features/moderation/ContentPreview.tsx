'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  List, 
  User, 
  Star, 
  AlertTriangle,
  Globe,
  Lock 
} from 'lucide-react';
import { getReportedContent } from '@/lib/supabase/reports';
import { type ReportedContentType } from '@/types/reports';

interface ContentPreviewProps {
  contentType: ReportedContentType;
  contentId: string;
  className?: string;
}

export function ContentPreview({ contentType, contentId, className = '' }: ContentPreviewProps) {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getReportedContent(contentType, contentId);
        setContent(data);
      } catch (err) {
        setError(true);
        console.error('Error fetching content preview:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [contentType, contentId]);

  if (isLoading) {
    return (
      <div className={`bg-muted/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={`bg-muted/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Content unavailable or deleted</span>
        </div>
      </div>
    );
  }

  const renderPreview = () => {
    switch (contentType) {
      case 'review':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Review</span>
              {content.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{content.rating}/5</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {content.content || 'No content available'}
            </p>
            {content.user && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={content.user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {content.user.display_name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{content.user.display_name}</span>
              </div>
            )}
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">List: {content.name}</span>
              {content.is_public ? (
                <Globe className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            {content.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {content.description}
              </p>
            )}
            {content.user && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={content.user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {content.user.display_name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{content.user.display_name}</span>
              </div>
            )}
          </div>
        );

      case 'user':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">User Profile</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={content.avatar_url} />
                <AvatarFallback className="text-xs">
                  {content.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{content.display_name}</span>
            </div>
            {content.bio && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {content.bio}
              </p>
            )}
          </div>
        );

      case 'comment':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Comment</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {content.content || 'No content available'}
            </p>
            {content.user && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={content.user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {content.user.display_name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{content.user.display_name}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Unknown content type
          </div>
        );
    }
  };

  return (
    <div className={`bg-muted/30 rounded-lg p-3 ${className}`}>
      {renderPreview()}
    </div>
  );
}