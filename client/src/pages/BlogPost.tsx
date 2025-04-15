import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Loader2, User } from "lucide-react";
import Container from "@/components/Container";
import { VideoBackground } from "@/components/VideoBackground";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<BlogPost>({
    queryKey: ["/api/blog/posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog post");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Post Not Found</h2>
        <p className="text-gray-700 mb-6">
          {error ? error.message : "The blog post you're looking for doesn't exist."}
        </p>
        <Button onClick={() => navigate("/blog")}>Return to Blog</Button>
      </div>
    );
  }

  // Format date to a readable format
  const formattedDate = post.createdAt 
    ? format(new Date(post.createdAt), 'MMMM dd, yyyy')
    : 'Unknown date';

  return (
    <div className="min-h-screen">
      <VideoBackground opacity={0.3} />
      
      <Container className="py-16">
        <Button 
          variant="ghost" 
          className="mb-8 flex items-center"
          onClick={() => navigate("/blog")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {/* Admin controls */}
        {user?.isAdmin && (
          <div className="mb-8 flex flex-wrap gap-4">
            <Button 
              onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
              variant="outline"
            >
              Edit Post
            </Button>
            
            {!post.published && (
              <div className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm flex items-center">
                Unpublished
              </div>
            )}
          </div>
        )}

        {/* Post Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
          
          <div className="flex items-center space-x-4 text-gray-400">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{post.authorId ? 'Admin' : 'Author'}</span>
            </div>
            <div>•</div>
            <div>{formattedDate}</div>
          </div>
        </div>

        {/* Featured Image */}
        {post.imageUrl && (
          <div className="mb-10">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full max-h-[500px] object-cover rounded-lg"
            />
          </div>
        )}

        {/* Post Content */}
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 md:p-8">
          <div className="prose prose-invert max-w-none">
            {/* Render content - split by paragraphs */}
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Posts
          </Button>
        </div>
      </Container>
    </div>
  );
}