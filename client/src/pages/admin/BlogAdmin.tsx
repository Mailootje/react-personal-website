import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Loader2, 
  Check, 
  X,
  Eye,
  FilterX,
  Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlogPost } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface BlogResponse {
  posts: BlogPost[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export default function BlogAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useQuery<BlogResponse>({
    queryKey: ["/api/admin/blog/posts", currentPage, searchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      
      return apiRequest("GET", `/api/admin/blog/posts?${queryParams.toString()}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", { url: `/api/admin/blog/posts/${id}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({
        title: "Success",
        description: "Blog post has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const totalPages = data ? Math.ceil(data.meta.total / limit) : 0;

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <Container>
        <div className="py-8">
          <div className="flex justify-between items-center mb-6">
            <SectionHeading
              subtitle="ADMIN PANEL"
              title="Blog Posts"
            />
            <Link href="/admin/blog/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Post
              </Button>
            </Link>
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
                <Button type="submit" variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                {searchTerm && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSearchTerm("")}
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <p className="text-red-500 mb-4">Failed to load blog posts</p>
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] })}
                >
                  Try Again
                </Button>
              </div>
            ) : data?.posts.length === 0 ? (
              <div className="text-center p-12">
                <p className="text-muted-foreground mb-4">No blog posts found</p>
                <Link href="/admin/blog/new">
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Your First Post
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="w-[150px]">Created</TableHead>
                        <TableHead className="w-[100px]">Published</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.posts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-mono">{post.id}</TableCell>
                          <TableCell className="font-medium">{post.title}</TableCell>
                          <TableCell className="font-mono text-sm">{post.slug}</TableCell>
                          <TableCell>
                            {format(new Date(post.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {post.published ? (
                              <span className="inline-flex items-center text-green-500">
                                <Check className="h-4 w-4 mr-1" />
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-red-500">
                                <X className="h-4 w-4 mr-1" />
                                No
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Link href={`/blog/${post.slug}`}>
                                <Button variant="ghost" size="icon" title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/blog/edit/${post.id}`}>
                                <Button variant="ghost" size="icon" title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Delete">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the blog post "{post.title}".
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-red-500 hover:bg-red-600"
                                      onClick={() => deleteMutation.mutate(post.id)}
                                    >
                                      {deleteMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                      Showing {data?.posts.length} of {data?.meta.total} posts
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}