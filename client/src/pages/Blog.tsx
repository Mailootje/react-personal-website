import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { VideoBackground } from "@/components/VideoBackground";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/schema";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";

export default function Blog() {
  const { data, isLoading, error } = useQuery<{ posts: BlogPost[], meta: { total: number, limit: number, offset: number } }>({
    queryKey: ["/api/blog/posts"],
  });
  
  const posts = data?.posts;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <VideoBackground opacity={0.2} isGlobal>
        <div className="z-10 relative">
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
                            {post.imageUrl && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={post.imageUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-5 flex-1 flex flex-col">
                              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {post.title}
                              </h3>
                              <div className="text-sm text-muted-foreground mb-3">
                                {format(new Date(post.createdAt), 'MMMM d, yyyy')}
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
      </VideoBackground>
    </div>
  );
}