import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { VideoBackground } from "@/components/VideoBackground";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface BlogResponse {
  posts: BlogPost[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export default function Blog() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
  } = useQuery<BlogResponse>({
    queryKey: ["/api/blog/posts", limit, offset],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts?limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog posts");
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

  return (
    <div className="min-h-screen">
      <VideoBackground opacity={0.3} />
      
      <Container className="py-16">
        <div className="mb-12 flex flex-col md:flex-row md:justify-between md:items-center">
          <SectionHeading
            subtitle="My Thoughts & Ideas"
            title="Blog"
            center={false}
            isDark
          />
          
          {user?.isAdmin && (
            <Button 
              className="mt-6 md:mt-0"
              onClick={() => navigate("/admin/blog")}
            >
              Manage Blog
            </Button>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">No Posts Yet</h3>
            <p className="text-gray-300">
              There are no blog posts available at the moment. Check back soon for new content!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {posts.map((post) => (
              <BlogPostCard 
                key={post.id} 
                post={post} 
                onClick={() => navigate(`/blog/${post.slug}`)} 
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
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
      </Container>
    </div>
  );
}

interface BlogPostCardProps {
  post: BlogPost;
  onClick: () => void;
}

function BlogPostCard({ post, onClick }: BlogPostCardProps) {
  // Format date to a readable format
  const formattedDate = post.createdAt 
    ? format(new Date(post.createdAt), 'MMMM dd, yyyy')
    : 'Unknown date';
  
  return (
    <div 
      className="bg-black/50 backdrop-blur-sm rounded-lg overflow-hidden cursor-pointer hover:bg-black/60 transition-all"
      onClick={onClick}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {post.imageUrl && (
          <div className="md:col-span-1">
            <div className="w-full h-[200px] md:h-full min-h-[160px] relative">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        
        <div className={post.imageUrl ? "md:col-span-3 p-6" : "md:col-span-4 p-6"}>
          <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
          
          <div className="text-sm text-gray-400 mb-4">
            {formattedDate}
          </div>
          
          <p className="text-gray-300 mb-4">
            {post.excerpt || post.content.substring(0, 150) + '...'}
          </p>
          
          <Button className="mt-2" size="sm">
            Read More
          </Button>
        </div>
      </div>
    </div>
  );
}