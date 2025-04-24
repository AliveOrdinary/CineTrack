import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Star, ThumbsUp, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react';
import { Database } from '@cinetrack/shared';
import useUser from '@/hooks/useUser';
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export interface ReviewWithUserProfile extends ReviewRow {
  users: {
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface ReviewCardProps {
  review: ReviewWithUserProfile;
  isLiked: boolean;
  onEdit: (review: ReviewRow) => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({ review, isLiked, onEdit, onDelete }: ReviewCardProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [showFullContent, setShowFullContent] = useState(false);
  const [isSpoilerVisible, setIsSpoilerVisible] = useState(false);

  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(review.likes_count ?? 0);

  useEffect(() => {
      setOptimisticLiked(isLiked);
      setOptimisticLikeCount(review.likes_count ?? 0);
  }, [isLiked, review.likes_count]);

  const profile = review.users;
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
    onError: (error, variables, context) => {
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

  return (
    <Card className="bg-gray-850 border border-gray-700 shadow-md overflow-hidden">
      <CardHeader className="flex flex-row justify-between items-start gap-4 p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 border border-gray-600">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || "User"} />
            <AvatarFallback>{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">{profile?.display_name || "Anonymous User"}</CardTitle>
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
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(review)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(review.id)} className="text-red-500 focus:text-red-400 focus:bg-red-900/50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
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
      <CardFooter className="p-3 bg-gray-900 border-t border-gray-700 flex items-center gap-4">
         <Button 
           variant="ghost" 
           size="sm" 
           className={cn(
             "flex items-center gap-1.5 text-gray-400 hover:text-gray-200",
             optimisticLiked && "text-blue-400 hover:text-blue-300"
           )}
           onClick={handleLikeClick}
           disabled={isLiking}
         >
           {isLiking ? (
             <Loader2 className="h-4 w-4 animate-spin" /> 
           ) : (
             <ThumbsUp className={cn("h-4 w-4", optimisticLiked && "fill-current")} />
           )}
           <span>{optimisticLikeCount ?? 0}</span>
           <span className="sr-only">Likes</span>
         </Button>
         <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200">
           <MessageSquare className="h-4 w-4" /> 
           <span>{review.comments_count ?? 0}</span>
           <span className="sr-only">Comments</span>
         </Button>
      </CardFooter>
    </Card>
  );
} 