'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  List,
  User,
  Star,
  Calendar,
  Globe,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type ReportedContentType } from '@/types/reports';

interface ReportedContentDisplayProps {
  contentType: ReportedContentType;
  content: any;
  isLoading?: boolean;
  error?: string;
}

export function ReportedContentDisplay({
  contentType,
  content,
  isLoading = false,
  error,
}: ReportedContentDisplayProps) {
  const getContentIcon = (type: ReportedContentType) => {
    switch (type) {
      case 'review':
        return <MessageSquare className="h-5 w-5" />;
      case 'list':
        return <List className="h-5 w-5" />;
      case 'user':
        return <User className="h-5 w-5" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getContentTitle = (type: ReportedContentType) => {
    switch (type) {
      case 'review':
        return 'Reported Review';
      case 'list':
        return 'Reported List';
      case 'user':
        return 'Reported User Profile';
      case 'comment':
        return 'Reported Comment';
      default:
        return 'Reported Content';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getContentIcon(contentType)}
            {getContentTitle(contentType)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getContentIcon(contentType)}
            {getContentTitle(contentType)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>
              {error || 'Unable to load reported content. It may have been deleted.'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderReviewContent = () => (
    <div className="space-y-4">
      {/* Review Author */}
      {content.user && (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={content.user.avatar_url} />
            <AvatarFallback>
              {content.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{content.user.display_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      )}

      {/* Rating */}
      {content.rating && (
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{content.rating}/5</span>
          {content.tmdb_id && (
            <>
              <span className="text-muted-foreground">•</span>
              <Badge variant="outline" className="text-xs">
                {content.media_type?.toUpperCase()} ID: {content.tmdb_id}
              </Badge>
            </>
          )}
        </div>
      )}

      {/* Review Content */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Review Content:</h4>
        <p className="text-sm leading-relaxed">{content.content}</p>
      </div>
    </div>
  );

  const renderListContent = () => (
    <div className="space-y-4">
      {/* List Author */}
      {content.user && (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={content.user.avatar_url} />
            <AvatarFallback>
              {content.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{content.user.display_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      )}

      {/* List Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-lg">{content.name}</h4>
          {content.is_public ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )}
        </div>

        {content.description && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Description:</h5>
            <p className="text-sm leading-relaxed">{content.description}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUserContent = () => (
    <div className="space-y-4">
      {/* User Profile */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={content.avatar_url} />
          <AvatarFallback className="text-lg">
            {content.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-semibold text-lg">{content.display_name}</h4>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Joined {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* User Bio */}
      {content.bio && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h5 className="font-medium mb-2">Bio:</h5>
          <p className="text-sm leading-relaxed">{content.bio}</p>
        </div>
      )}
    </div>
  );

  const renderCommentContent = () => (
    <div className="space-y-4">
      {/* Comment Author */}
      {content.user && (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={content.user.avatar_url} />
            <AvatarFallback>
              {content.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{content.user.display_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      )}

      {/* Comment Content */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Comment:</h4>
        <p className="text-sm leading-relaxed">{content.content}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (contentType) {
      case 'review':
        return renderReviewContent();
      case 'list':
        return renderListContent();
      case 'user':
        return renderUserContent();
      case 'comment':
        return renderCommentContent();
      default:
        return (
          <div className="text-muted-foreground">
            <p>Unable to display this content type.</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getContentIcon(contentType)}
          {getContentTitle(contentType)}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}