import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Edit, Trash, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface Author {
  id: number;
  username: string;
  profileImageData: string | null;
  profileImageType: string | null;
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  blogPostId: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

interface BlogCommentsProps {
  postId: number;
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  
  // Fetch comments
  const { data: comments, isLoading, error } = useQuery<Comment[]>({
    queryKey: [`/api/blog/posts/${postId}/comments`],
    queryFn: async () => {
      return await apiRequest('GET', `/api/blog/posts/${postId}/comments`);
    },
    enabled: Boolean(postId),
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest('POST', `/api/blog/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${postId}/comments`] });
      // Also update the post to refresh the comment count
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      // Update the individual blog post view
      const slug = window.location.pathname.split('/blog/')[1];
      if (slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}`] });
      }
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add comment',
        description: error.message || 'An error occurred while adding your comment.',
        variant: 'destructive'
      });
    }
  });
  
  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number, content: string }) => {
      return await apiRequest('PUT', `/api/blog/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditText('');
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${postId}/comments`] });
      // No need to update the comment count since we're just editing content
      // But good to refresh the posts lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update comment',
        description: error.message || 'An error occurred while updating your comment.',
        variant: 'destructive'
      });
    }
  });
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest('DELETE', `/api/blog/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${postId}/comments`] });
      // Also update the post to refresh the comment count
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      // Update the individual blog post view
      const slug = window.location.pathname.split('/blog/')[1];
      if (slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${slug}`] });
      }
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete comment',
        description: error.message || 'An error occurred while deleting your comment.',
        variant: 'destructive'
      });
    }
  });
  
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
  };
  
  const handleUpdateComment = (commentId: number) => {
    if (!editText.trim()) return;
    updateCommentMutation.mutate({ commentId, content: editText });
  };
  
  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };
  
  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditText('');
  };
  
  if (error) {
    return (
      <div className="mt-8 text-center text-red-500">
        <p>Failed to load comments. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <MessageSquare className="w-6 h-6 mr-2" />
        Comments {comments && `(${comments.length})`}
      </h2>
      
      {/* Add comment form - only for logged in users */}
      {user ? (
        <div className="mb-8">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="mb-3 bg-black/30 text-white"
          />
          <Button 
            onClick={handleAddComment}
            disabled={!commentText.trim() || addCommentMutation.isPending}
            className="flex items-center"
          >
            {addCommentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post Comment
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="mb-8 p-4 border border-border rounded-md bg-black/30 text-white">
          <p>You need to be logged in to post comments.</p>
        </div>
      )}
      
      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4 bg-black/30 border-border">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {comment.author.profileImageData ? (
                    <AvatarImage 
                      src={comment.author.profileImageData} 
                      alt={comment.author.username} 
                    />
                  ) : null}
                  <AvatarFallback>{comment.author.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{comment.author.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                        {comment.createdAt !== comment.updatedAt && ' (edited)'}
                      </p>
                    </div>
                    
                    {/* Edit/Delete buttons - only for comment author or admin */}
                    {user && (user.id === comment.userId || user.isAdmin) && (
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditing(comment)}
                          className="h-7 w-7"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          disabled={deleteCommentMutation.isPending}
                        >
                          {deleteCommentMutation.isPending && deleteCommentMutation.variables === comment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Edit mode or display mode */}
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="mb-2 bg-black/50 text-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={!editText.trim() || updateCommentMutation.isPending}
                          size="sm"
                          className="flex items-center"
                        >
                          {updateCommentMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-1" />
                          )}
                          Save
                        </Button>
                        <Button
                          onClick={cancelEditing}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-white whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}