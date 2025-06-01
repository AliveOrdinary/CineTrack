"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Reply, Edit, Trash2, Send } from "lucide-react"
import { 
  getReviewComments, 
  createReviewComment, 
  updateReviewComment, 
  deleteReviewComment,
  type ReviewCommentWithUser 
} from "@/lib/supabase/client"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface ReviewCommentsProps {
  reviewId: string
  initialCommentsCount: number
  className?: string
}

interface CommentFormProps {
  reviewId: string
  parentCommentId?: string
  onCommentAdded: () => void
  onCancel?: () => void
  placeholder?: string
}

function CommentForm({ 
  reviewId, 
  parentCommentId, 
  onCommentAdded, 
  onCancel,
  placeholder = "Write a comment..."
}: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      toast.error("Please write a comment")
      return
    }

    setIsSubmitting(true)
    
    try {
      await createReviewComment({
        review_id: reviewId,
        parent_comment_id: parentCommentId,
        content: content.trim()
      })
      
      setContent("")
      onCommentAdded()
      toast.success("Comment posted!")
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error("Failed to post comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={1000}
        className="resize-none"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {content.length}/1000 characters
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            size="sm" 
            disabled={isSubmitting || !content.trim()}
          >
            <Send className="h-3 w-3 mr-1" />
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  )
}

interface CommentItemProps {
  comment: ReviewCommentWithUser
  onCommentUpdated: () => void
  isReply?: boolean
}

function CommentItem({ comment, onCommentUpdated, isReply = false }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    setIsSubmitting(true)
    
    try {
      await updateReviewComment(comment.id!, editContent.trim())
      setIsEditing(false)
      onCommentUpdated()
      toast.success("Comment updated!")
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error("Failed to update comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return
    }

    try {
      await deleteReviewComment(comment.id!)
      onCommentUpdated()
      toast.success("Comment deleted!")
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error("Failed to delete comment")
    }
  }

  const isOwner = currentUser?.id === comment.user_id

  return (
    <div className={cn("space-y-3", isReply && "ml-8 border-l-2 border-muted pl-4")}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.users?.avatar_url} />
              <AvatarFallback>
                {comment.users?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.users?.display_name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at!), { addSuffix: true })}
                    {comment.is_edited && " (edited)"}
                  </span>
                </div>
                
                {isOwner && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleEdit}
                      disabled={isSubmitting || !editContent.trim()}
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setEditContent(comment.content)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  
                  {!isReply && currentUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsReplying(!isReplying)}
                      className="h-6 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isReplying && (
        <div className="ml-11">
          <CommentForm
            reviewId={comment.review_id}
            parentCommentId={comment.id}
            onCommentAdded={() => {
              setIsReplying(false)
              onCommentUpdated()
            }}
            onCancel={() => setIsReplying(false)}
            placeholder="Write a reply..."
          />
        </div>
      )}
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onCommentUpdated={onCommentUpdated}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ReviewComments({ 
  reviewId, 
  initialCommentsCount, 
  className 
}: ReviewCommentsProps) {
  const [comments, setComments] = useState<ReviewCommentWithUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setIsAuthenticated(!!user)
  }

  const loadComments = async () => {
    setIsLoading(true)
    
    try {
      const commentsData = await getReviewComments(reviewId)
      setComments(commentsData)
      setCommentsCount(commentsData.reduce((total, comment) => 
        total + 1 + (comment.replies?.length || 0), 0
      ))
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error("Failed to load comments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommentUpdate = () => {
    loadComments()
  }

  const handleToggleComments = () => {
    setShowComments(!showComments)
    if (!showComments) {
      setShowCommentForm(false)
    }
  }

  const handleToggleCommentForm = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to comment")
      return
    }
    
    setShowCommentForm(!showCommentForm)
    if (!showComments) {
      setShowComments(true)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleComments}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
        </Button>
        
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCommentForm}
            className="text-muted-foreground hover:text-foreground"
          >
            {showCommentForm ? 'Cancel' : 'Add Comment'}
          </Button>
        )}
      </div>
      
      {showCommentForm && (
        <CommentForm
          reviewId={reviewId}
          onCommentAdded={() => {
            setShowCommentForm(false)
            handleCommentUpdate()
          }}
          onCancel={() => setShowCommentForm(false)}
        />
      )}
      
      {showComments && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onCommentUpdated={handleCommentUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 