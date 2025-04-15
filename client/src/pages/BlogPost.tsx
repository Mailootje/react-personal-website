import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { VideoBackground } from "@/components/VideoBackground";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/schema";
import Container from "@/components/Container";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function BlogPostPage() {
  const [match, params] = useRoute("/blog/:slug");
  const { user } = useAuth();
  const slug = params?.slug;
  
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: [`/api/blog/posts/${slug}`],
    enabled: Boolean(slug),
    queryFn: async () => {
      return await apiRequest("GET", `/api/blog/posts/${slug}`);
    },
  });
  
  if (!match) return null;

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-16 text-white">
        <div className="bg-black min-h-screen">
          <div className="py-16">
            <Container maxWidth="lg">
              <Link href="/blog" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>

              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-lg text-red-500 mb-4">Failed to load blog post</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              ) : post ? (
                <div className="bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 shadow-lg">
                  {(post.imageUrl || (post.imageData && post.imageType)) && (
                    <div className="aspect-[21/9] w-full overflow-hidden">
                      <img
                        src={post.imageUrl || `data:${post.imageType};base64,${post.imageData}`}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
                    
                    <div className="flex items-center text-muted-foreground mb-6">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
                      
                      {user?.isAdmin && (
                        <Link href={`/admin/blog/edit/${post.id}`} className="ml-4 text-sm text-primary hover:text-primary/80 transition-colors">
                          Edit Post
                        </Link>
                      )}
                    </div>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {post.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-lg text-muted-foreground">Blog post not found</p>
                  <Link href="/blog" className="mt-4 inline-block text-primary hover:text-primary/80 transition-colors">
                    Back to all posts
                  </Link>
                </div>
              )}
            </Container>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}