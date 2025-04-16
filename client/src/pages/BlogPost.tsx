import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { VideoBackground } from "@/components/VideoBackground";
import { Loader2, Calendar, ArrowLeft, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { BlogPost } from "@shared/schema";
import Container from "@/components/Container";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BlogComments } from "@/components/BlogComments";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Extended BlogPost type to include comment count and author
interface BlogPostWithComments extends BlogPost {
  commentsCount?: number;
  author?: {
    id: number;
    username: string;
  };
}

export default function BlogPostPage() {
  const [match, params] = useRoute("/blog/:slug");
  const { user } = useAuth();
  const slug = params?.slug;
  
  const { data: post, isLoading, error } = useQuery<BlogPostWithComments>({
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
                <div className="bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 shadow-lg">
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
                    
                    <div className="flex items-center text-white/80 mb-6">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(new Date(post.createdAt), 'MMMM d, yyyy')}</span>
                      
                      {user?.isAdmin && (
                        <Link href={`/admin/blog/edit/${post.id}`} className="ml-4 text-sm text-primary hover:text-primary/80 transition-colors">
                          Edit Post
                        </Link>
                      )}
                    </div>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none markdown-content text-white">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-white" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3 text-white" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-5 mb-2 text-white" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4 text-white" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/70 pl-4 italic my-4 text-white/90" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-white" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 text-white" {...props} />,
                          li: ({node, ...props}) => <li className="mb-1 text-white" {...props} />,
                          a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-white" {...props} />
                        }}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Comments Section */}
                    <div className="mt-10 border-t border-border/40 pt-8">
                      <BlogComments postId={post.id} />
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