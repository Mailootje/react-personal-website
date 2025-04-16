import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { VideoBackground } from "@/components/VideoBackground";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/schema";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Extended BlogPost type to include comment count
interface BlogPostWithComments extends BlogPost {
  commentsCount?: number;
  author?: {
    id: number;
    username: string;
  };
}

export default function Blog() {
  const { data, isLoading, error } = useQuery<{ posts: BlogPostWithComments[], meta: { total: number, limit: number, offset: number } }>({
    queryKey: ["/api/blog/posts"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/blog/posts");
    },
  });
  
  const posts = data?.posts;
  console.log("Blog data:", data);
  console.log("Posts:", posts);
  console.log("isLoading:", isLoading);

  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-16 text-white">
        <div className="bg-black min-h-screen">
          <div className="py-16">
            <Container>
              <SectionHeading
                subtitle="STAY UPDATED"
                title="Blog"
                center
              />

              <div className="mt-12">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-20">
                    <p className="text-lg text-red-500 mb-4">Failed to load blog posts</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                ) : posts && posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                          <div className="bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-200 h-full flex flex-col">
                            {(post.imageUrl || (post.imageData && post.imageType)) && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={post.imageUrl || `data:${post.imageType};base64,${post.imageData}`}
                                  alt={post.title}
                                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col">
                              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h3>
                              <div className="flex justify-between text-sm text-muted-foreground mb-3">
                                <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
                                {post.commentsCount !== undefined ? (
                                  <span className="flex items-center ml-2">
                                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                    {post.commentsCount}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-muted-foreground flex-1">
                                {post.content.substring(0, 120)}
                                {post.content.length > 120 ? '...' : ''}
                              </p>
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <span className="text-primary text-sm font-medium flex items-center">
                                  Read More
                                  <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                            </div>
                          </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-lg text-muted-foreground">No blog posts found</p>
                    <p className="mt-2 text-muted-foreground">Check back later for new content</p>
                  </div>
                )}
              </div>
            </Container>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}