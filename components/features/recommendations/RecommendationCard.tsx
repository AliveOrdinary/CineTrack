'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Check, 
  X, 
  Eye, 
  Star, 
  Clock, 
  MessageCircle,
  Trash2,
  Loader2,
  Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ContentRecommendationWithUsers,
  UpdateRecommendationStatusInput,
  getTagConfig,
  getStatusConfig,
  formatRecommendationDate,
  canUpdateRecommendation,
  canDeleteRecommendation,
} from '@/types/recommendations';
import {
  updateRecommendationStatus,
  deleteRecommendation,
} from '@/lib/supabase/recommendations';

interface RecommendationCardProps {
  recommendation: ContentRecommendationWithUsers;
  currentUserId: string;
  contentTitle?: string;
  onStatusUpdate?: () => void;
  onDelete?: () => void;
  showContentInfo?: boolean;
}

export function RecommendationCard({ 
  recommendation, 
  currentUserId, 
  contentTitle,
  onStatusUpdate,
  onDelete,
  showContentInfo = false
}: RecommendationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [pendingStatus, setPendingStatus] = useState<'accepted' | 'declined' | 'watched' | null>(null);

  const isRecipient = recommendation.recipient.id === currentUserId;
  const isSender = recommendation.sender.id === currentUserId;
  const canUpdate = canUpdateRecommendation(recommendation, currentUserId);
  const canDelete = canDeleteRecommendation(recommendation, currentUserId);
  const statusConfig = getStatusConfig(recommendation.status);

  const handleStatusUpdate = async (status: 'accepted' | 'declined' | 'watched', message?: string) => {
    setIsUpdating(true);
    try {
      const updateData: UpdateRecommendationStatusInput = {
        status,
        response_message: message?.trim() || undefined,
      };

      await updateRecommendationStatus(recommendation.id, updateData);
      
      const statusText = status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'marked as watched';
      toast.success(`Recommendation ${statusText}!`);
      
      onStatusUpdate?.();
      setShowResponseDialog(false);
      setResponseMessage('');
      setPendingStatus(null);
    } catch (error: any) {
      console.error('Error updating recommendation status:', error);
      toast.error(error.message || 'Failed to update recommendation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickStatus = (status: 'accepted' | 'declined' | 'watched') => {
    if (status === 'declined') {
      // For declining, show dialog to allow optional message
      setPendingStatus(status);
      setShowResponseDialog(true);
    } else {
      // For accepting or marking as watched, update immediately
      handleStatusUpdate(status);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteRecommendation(recommendation.id);
      toast.success('Recommendation deleted');
      onDelete?.();
    } catch (error: any) {
      console.error('Error deleting recommendation:', error);
      toast.error(error.message || 'Failed to delete recommendation');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={`transition-all ${recommendation.is_urgent ? 'ring-2 ring-orange-200 dark:ring-orange-800' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={isRecipient ? recommendation.sender.avatar_url : recommendation.recipient.avatar_url} />
                <AvatarFallback>
                  {isRecipient 
                    ? recommendation.sender.display_name.charAt(0).toUpperCase()
                    : recommendation.recipient.display_name.charAt(0).toUpperCase()
                  }
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {isRecipient ? (
                    <>Recommendation from {recommendation.sender.display_name}</>
                  ) : (
                    <>Recommended to {recommendation.recipient.display_name}</>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatRecommendationDate(recommendation.created_at)}
                  {recommendation.is_urgent && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={statusConfig.color}>
                <span className="mr-1">{statusConfig.emoji}</span>
                {statusConfig.label}
              </Badge>
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content Info */}
          {showContentInfo && contentTitle && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{contentTitle}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {recommendation.media_type}
              </p>
            </div>
          )}

          {/* Recommendation Message */}
          {recommendation.message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Message</span>
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                "{recommendation.message}"
              </p>
            </div>
          )}

          {/* Personal Rating */}
          {recommendation.personal_rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">
                {recommendation.personal_rating}/10 from {recommendation.sender.display_name}
              </span>
            </div>
          )}

          {/* Tags */}
          {recommendation.tags && recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recommendation.tags.map((tag) => {
                const tagConfig = getTagConfig(tag);
                return (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <span className="mr-1">{tagConfig.emoji}</span>
                    {tagConfig.label}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Response Message */}
          {recommendation.response_message && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Response</span>
              </div>
              <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                "{recommendation.response_message}"
              </p>
              {recommendation.response_date && (
                <p className="text-xs text-muted-foreground">
                  {formatRecommendationDate(recommendation.response_date)}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {canUpdate && recommendation.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                onClick={() => handleQuickStatus('accepted')}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Accept
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickStatus('declined')}
                disabled={isUpdating}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
              
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleQuickStatus('watched')}
                disabled={isUpdating}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Already Watched
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'declined' ? 'Decline Recommendation' : 'Respond to Recommendation'}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === 'declined' 
                ? 'Let them know why this isn\'t for you (optional)'
                : 'Add an optional message with your response'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={
                pendingStatus === 'declined' 
                  ? "Not really my type of content..." 
                  : "Thanks for the recommendation!"
              }
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">
              {responseMessage.length}/300 characters
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleStatusUpdate(pendingStatus!, responseMessage)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : pendingStatus === 'declined' ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {pendingStatus === 'declined' ? 'Decline' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}