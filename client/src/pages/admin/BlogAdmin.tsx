import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, PlusCircle, Eye, Pencil, Trash, CheckCircle2, XCircle } from "lucide-react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { VideoBackground } from "@/components/VideoBackground";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BlogPost } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface BlogResponse {
  posts: BlogPost[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export default function BlogAdmin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const limit = 15;
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
  } = useQuery<BlogResponse>({
    queryKey: ["/api/admin/blog/posts", limit, offset],
    queryFn: async () => {
      const response = await fetch(`/api/admin/blog/posts?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog posts");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/admin/blog/posts/${postId}`);
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The blog post has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setPostToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Blog</h2>
        <p className="text-gray-700 mb-6">{error.message}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const { posts, meta } = data || { posts: [], meta: { total: 0, limit, offset } };
  const totalPages = Math.ceil(meta.total / limit);

  const handleDeletePost = () => {
    if (postToDelete) {
      deleteMutation.mutate(postToDelete.id);
    }
  };

  return (
    <div className="min-h-screen">
      <VideoBackground opacity={0.3} />
      
      <Container className="py-16">
        <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-center">
          <SectionHeading
            subtitle="Manage Content"
            title="Blog Administration"
            center={false}
            isDark
          />
          
          <div className="flex gap-4 mt-6 md:mt-0">
            <Button 
              onClick={() => navigate("/blog")}
              variant="outline"
            >
              View Blog
            </Button>
            <Button
              onClick={() => navigate("/admin/blog/new")}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 md:p-6 overflow-hidden">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-4">No Posts Yet</h3>
              <p className="text-gray-300 mb-6">
                You haven't created any blog posts yet. Get started by creating your first post!
              </p>
              <Button onClick={() => navigate("/admin/blog/new")}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        {post.createdAt 
                          ? format(new Date(post.createdAt), 'MMM dd, yyyy')
                          : 'Unknown date'}
                      </TableCell>
                      <TableCell>
                        {post.published ? (
                          <div className="flex items-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                            <span>Published</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-yellow-500 mr-2" />
                            <span>Draft</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/blog/${post.slug}`)}
                            title="View post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                            title="Edit post"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setPostToDelete(post)}
                            title="Delete post"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                
                <Button variant="outline" disabled className="pointer-events-none">
                  {page} of {totalPages}
                </Button>
                
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete "{postToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost} 
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}