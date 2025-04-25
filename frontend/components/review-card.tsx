import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Star, ThumbsUp, MessageSquare, AlertTriangle, Loader2, Send, Flag } from 'lucide-react';
import { Database } from '@cinetrack/shared';
import useUser from '@/hooks/useUser';
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ReportDialog } from "@/components/report-dialog";

export type CommentRow = Database['public']['Tables']['review_interactions']['Row'];
export interface CommentWithUserProfile extends CommentRow {
  users: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export interface ReviewWithUserProfile extends ReviewRow {
  users: {
    display_name: string;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
  id: string;
  user_id: string;
  created_at: string;
  tmdb_id: number;
  media_type: string;
  content: string;
  rating: number | null;
}

interface ReviewCardProps {
  review: ReviewWithUserProfile;
  isLiked: boolean;
  onEdit: (review: ReviewRow) => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({ review, isLiked, onEdit, onDelete }: ReviewCardProps) {
  const { user, userData } = useUser();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [showFullContent, setShowFullContent] = useState(false);
  const [isSpoilerVisible, setIsSpoilerVisible] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(review.likes_count ?? 0);
  const [optimisticCommentCount, setOptimisticCommentCount] = useState(review.comments_count ?? 0);

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: comments, isLoading: isLoadingComments, error: commentsError } = useQuery<CommentWithUserProfile[]>({
    queryKey: ['reviewComments', review.id],
    queryFn: async () => {
      if (!review.id) return [];
      const { data, error } = await supabase
        .from('review_interactions')
        .select(`
          *,
          users ( display_name, avatar_url )
        `)
        .eq('review_id', review.id)
        .eq('interaction_type', 'comment')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
      return (data || []) as CommentWithUserProfile[];
    },
    enabled: !!review.id && showCommentInput,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
      setOptimisticLiked(isLiked);
      setOptimisticLikeCount(review.likes_count ?? 0);
      setOptimisticCommentCount(review.comments_count ?? 0);
  }, [isLiked, review.likes_count, review.comments_count]);

  const profile = review.users;
  const userId = review.user_id;
  const date = new Date(review.created_at || Date.now());
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isAuthor = user?.id === review.user_id;

  const { mutate: toggleLike, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to like reviews.");
      if (!review.id) throw new Error("Review ID is missing.");
      
      const { data, error } = await supabase.rpc('toggle_review_like', { 
        review_id_input: review.id 
      });
      
      if (error) throw error;
      return data?.[0] as { new_likes_count: number; liked_by_user: boolean };
    },
    onMutate: async () => {
      const previousLiked = optimisticLiked;
      const previousCount = optimisticLikeCount;
      setOptimisticLiked(!previousLiked);
      setOptimisticLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);
      return { previousLiked, previousCount };
    },
    onError: (error: Error, variables: void, context: { previousLiked: boolean, previousCount: number } | undefined) => {
      if (context) {
        setOptimisticLiked(context.previousLiked);
        setOptimisticLikeCount(context.previousCount);
      }
      console.error("Error liking review:", error);
      toast({
        variant: "destructive",
        title: "Like Failed",
        description: error.message || "Could not update like status.",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', review.tmdb_id, review.media_type] });
      queryClient.invalidateQueries({ queryKey: ['reviewLikes', user?.id] });
    },
  });

  const handleLikeClick = () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to like reviews." });
      return;
    }
    toggleLike();
  };

  const { mutate: addComment, isPending: isCommenting } = useMutation({
    mutationFn: async (commentContent: string) => {
      if (!user) throw new Error("You must be logged in to comment.");
      if (!review.id) throw new Error("Review ID is missing.");
      if (!commentContent.trim()) throw new Error("Comment cannot be empty.");

      const { data, error } = await supabase.rpc('add_review_comment', {
        review_id_input: review.id,
        user_id_input: user.id,
        comment_content_input: commentContent.trim(),
      });

      if (error) throw error;
      return data;
    },
    onMutate: async (commentContent: string) => {
      const previousCommentCount = optimisticCommentCount;
      setOptimisticCommentCount(previousCommentCount + 1);
      const previousCommentText = commentText;
      setCommentText("");
      setShowCommentInput(false);
      return { previousCommentCount, previousCommentText };
    },
    onError: (error: Error, variables: string, context: { previousCommentCount: number, previousCommentText: string } | undefined) => {
      if (context) {
        setOptimisticCommentCount(context.previousCommentCount);
        setCommentText(context.previousCommentText);
        setShowCommentInput(true);
      }
      console.error("Error adding comment:", error);
      toast({
        variant: "destructive",
        title: "Comment Failed",
        description: error.message || "Could not post comment.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', review.tmdb_id, review.media_type] });
      queryClient.invalidateQueries({ queryKey: ['reviewComments', review.id] });
      toast({ title: "Comment Posted!" });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to comment." });
      return;
    }
    if (!commentText.trim()) {
       toast({ variant: "destructive", title: "Empty Comment", description: "Cannot post an empty comment." });
       return;
    }
    addComment(commentText);
  };

  const MAX_LENGTH = 300;
  const isLongReview = review.content.length > MAX_LENGTH;
  const displayContent = isLongReview && !showFullContent
    ? `${review.content.substring(0, MAX_LENGTH)}...`
    : review.content;

  const handleToggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  const handleToggleSpoiler = () => {
    setIsSpoilerVisible(!isSpoilerVisible);
  };

  const profileLink = userId ? `/profile/${userId}` : '#';
  const canLinkToProfile = !!userId;

  const handleReportClick = () => {
      if (!user) {
          toast({ title: "Login Required", description: "Please log in to report content." });
          return;
      }
      setIsReportDialogOpen(true);
  };

  return (
    <>
    <Card className="bg-gray-850 border border-gray-700 shadow-md overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-start gap-4 p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-3 flex-1 min-w-0">
            {canLinkToProfile ? (
              <Link href={profileLink} passHref legacyBehavior>
                <a aria-label={`${profile?.display_name || "User"}'s profile`}>
                  <Avatar className="h-10 w-10 border border-gray-600 hover:opacity-80 transition-opacity">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "User"} />
                    <AvatarFallback>{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </a>
              </Link>
            ) : (
          <Avatar className="h-10 w-10 border border-gray-600">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "User"} />
            <AvatarFallback>{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
            )}
          <div className="flex-1 min-w-0">
              {canLinkToProfile ? (
                <Link href={profileLink} passHref legacyBehavior>
                  <a className="hover:underline">
                    <CardTitle className="text-sm font-medium truncate">{profile?.display_name || "Anonymous User"}</CardTitle>
                  </a>
                </Link>
              ) : (
            <CardTitle className="text-sm font-medium truncate">{profile?.display_name || "Anonymous User"}</CardTitle>
              )}
            <p className="text-xs text-gray-400">Reviewed on {formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {review.rating && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-600/20 text-yellow-300 border-yellow-600">
              <Star className="h-3 w-3" />
              <span>{review.rating}/10</span>
            </Badge>
          )}
            {(isAuthor || user) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                  <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Review Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  {isAuthor && (
                     <>
                <DropdownMenuItem onClick={() => onEdit(review)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => onDelete(review.id)} className="text-red-500 focus:text-red-400 focus:bg-red-900/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
                     </>
                  )}
                  {user && !isAuthor && (
                     <>
                       {isAuthor && <DropdownMenuSeparator />}
                       <DropdownMenuItem onClick={handleReportClick} className="text-yellow-600 focus:text-yellow-500 focus:bg-yellow-900/10">
                         <Flag className="mr-2 h-4 w-4" />
                         <span>Report Review</span>
                       </DropdownMenuItem>
                     </>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {review.is_spoiler && !isSpoilerVisible ? (
          <div
            className="bg-gray-700 p-4 rounded-md border border-gray-600 flex flex-col items-center text-center cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={handleToggleSpoiler}
          >
            <AlertTriangle className="h-6 w-6 text-yellow-400 mb-2" />
            <p className="font-medium">Spoiler Warning</p>
            <p className="text-sm text-gray-300">This review contains spoilers. Click to reveal.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{displayContent}</p>
            {isLongReview && (
              <Button variant="link" onClick={handleToggleContent} className="p-0 h-auto text-blue-400 hover:text-blue-300 mt-2 text-sm">
                {showFullContent ? 'Show Less' : 'Show More'}
              </Button>
            )}
            {review.is_spoiler && isSpoilerVisible && (
               <Button variant="link" onClick={handleToggleSpoiler} className="p-0 h-auto text-yellow-400 hover:text-yellow-300 ml-2 mt-2 text-sm">
                 (Hide Spoiler)
               </Button>
            )}
          </>
        )}
      </CardContent>
        <CardFooter className="flex flex-wrap justify-between items-center p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex items-center space-x-4">
         <Button 
           variant="ghost" 
           size="sm" 
              onClick={handleLikeClick}
              disabled={isLiking || !user}
           className={cn(
                "flex items-center gap-1 text-gray-400 hover:text-white disabled:text-gray-500 disabled:cursor-not-allowed",
                optimisticLiked && "text-blue-500 hover:text-blue-400"
           )}
              aria-pressed={optimisticLiked}
              aria-label={optimisticLiked ? "Unlike review" : "Like review"}
         >
           {isLiking ? (
             <Loader2 className="h-4 w-4 animate-spin" /> 
           ) : (
                <ThumbsUp className="h-4 w-4" />
           )}
              <span>{optimisticLikeCount}</span>
         </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="flex items-center gap-1 text-gray-400 hover:text-white"
              aria-expanded={showCommentInput}
              aria-controls={`comment-section-${review.id}`}
              aria-label={showCommentInput ? "Hide comments" : "Show comments"}
            >
           <MessageSquare className="h-4 w-4" /> 
              <span>{optimisticCommentCount}</span>
           <span className="sr-only">Comments</span>
         </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReportClick}
              disabled={!user}
              className="text-gray-400 hover:text-red-500 disabled:text-gray-600"
              aria-label="Report this review"
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-gray-500 mt-2 sm:mt-0">
            {formattedDate}
          </span>
      </CardFooter>

        {showCommentInput && (
          <div className="p-4 border-t border-gray-700 bg-gray-900">
            <form onSubmit={handleAddComment} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border border-gray-600 mt-1 flex-shrink-0">
                <AvatarImage src={userData?.avatar_url || undefined} alt={userData?.display_name || "User"} />
                <AvatarFallback>{userData?.display_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Add a comment as ${userData?.display_name || 'yourself'}...`}
                className="flex-1 min-h-[40px] max-h-[150px] text-sm bg-gray-800 border-gray-600 focus:border-blue-500 focus:ring-blue-500 resize-y"
                rows={1}
                disabled={isCommenting}
                required
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10 flex-shrink-0"
                disabled={isCommenting || !commentText.trim()}
                aria-label="Post comment"
              >
                {isCommenting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              {isLoadingComments && (
                <div className="flex items-center justify-center p-4 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading comments...</div>
              )}
              {commentsError && (
                <div className="text-red-500 text-sm text-center p-4 bg-red-900/30 rounded border border-red-700">Error loading comments: {commentsError.message}</div>
              )}
              {!isLoadingComments && !commentsError && comments && comments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">Be the first to comment!</p>
              )}
              {!isLoadingComments && !commentsError && comments && comments.length > 0 && (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-md">
                    <Avatar className="h-8 w-8 border border-gray-600 flex-shrink-0"> 
                      <AvatarImage src={comment.users?.avatar_url || undefined} alt={comment.users?.display_name || "User"} />
                      <AvatarFallback>{comment.users?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="font-medium text-gray-200">{comment.users?.display_name || "Anonymous"}</span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(comment.created_at!), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
    </Card>
      <ReportDialog 
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        reviewId={review.id}
        reportedContentType="review"
        reviewContent={review.content}
      />
    </>
  );
} 