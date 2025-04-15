import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { BlogPost, insertBlogPostSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Extend the insert schema with extra validations
const blogFormSchema = insertBlogPostSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  published: z.boolean().default(false),
});

type BlogFormData = z.infer<typeof blogFormSchema>;

export default function BlogForm() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = Boolean(params.id);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Setup form with default values
  const form = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      imageUrl: "",
      published: false,
    },
  });

  // Fetch post data if in edit mode
  const { data: post, isLoading: isLoadingPost } = useQuery<BlogPost>({
    queryKey: [`/api/admin/blog/posts/${params.id}`],
    enabled: isEditMode,
    queryFn: async () => {
      return await apiRequest("GET", `/api/admin/blog/posts/${params.id}`);
    },
  });

  // Update form values when post data is loaded
  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        imageUrl: post.imageUrl,
        published: post.published,
      });

      if (post.imageUrl) {
        setPreviewUrl(post.imageUrl);
      }
    }
  }, [post, form]);

  // Create mutation for new posts
  const createMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      return apiRequest<BlogPost>("POST", "/api/admin/blog/posts", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({
        title: "Success",
        description: "Blog post created successfully",
      });
      navigate(`/admin/blog/edit/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation for existing posts
  const updateMutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      return apiRequest<BlogPost>("PUT", `/api/admin/blog/posts/${params.id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/blog/posts/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/blog/posts/${data.slug}`] });
      toast({
        title: "Success",
        description: "Blog post updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form submission handler
  const onSubmit = (data: BlogFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Auto-generate slug from title
  const generateSlug = () => {
    const title = form.getValues("title");
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
      
      form.setValue("slug", slug, { shouldValidate: true });
    }
  };

  // Handle image URL change and update preview
  const handleImageUrlChange = (url: string) => {
    form.setValue("imageUrl", url, { shouldValidate: true });
    setPreviewUrl(url || null);
  };

  return (
    <div className="pt-20 pb-16 min-h-screen">
      <Container>
        <div className="py-8">
          <div className="mb-6">
            <Link href="/admin/blog">
              <a className="inline-flex items-center text-primary hover:text-primary/80 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog List
              </a>
            </Link>
            <SectionHeading
              subtitle="ADMIN PANEL"
              title={isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
            />
          </div>

          {isEditMode && isLoadingPost ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter post title"
                                {...field}
                                onBlur={() => {
                                  field.onBlur();
                                  // Only auto-generate slug if it's empty or in create mode
                                  if (!form.getValues("slug") || !isEditMode) {
                                    generateSlug();
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <FormField
                          control={form.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Slug</FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input placeholder="enter-post-slug" {...field} />
                                </FormControl>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={generateSlug}
                                  className="whitespace-nowrap"
                                >
                                  Generate
                                </Button>
                              </div>
                              <FormDescription>
                                Used in the URL: /blog/{form.watch("slug") || "example-slug"}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter post content..."
                                className="h-64 font-mono"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Supports line breaks for paragraphs
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Excerpt (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief summary of the post..."
                                className="h-20"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormDescription>
                              Short description shown in blog listings
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/image.jpg"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => handleImageUrlChange(e.target.value)}
                              />
                            </FormControl>
                            <FormDescription>
                              Direct link to featured image (JPG, PNG, WebP)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Published
                              </FormLabel>
                              <FormDescription>
                                When enabled, post will be visible to all visitors
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate("/admin/blog")}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isPending} 
                          className="gap-2"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Post
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>

              <div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md p-6 sticky top-24">
                  <h3 className="text-lg font-medium mb-4">Post Preview</h3>
                  
                  <div className="space-y-4">
                    {previewUrl && (
                      <div className="aspect-video bg-muted rounded-md overflow-hidden border border-border/70">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setPreviewUrl(null)}
                        />
                      </div>
                    )}
                    
                    <div className="border border-border/70 rounded-md p-4 bg-background/50">
                      <h4 className="font-medium text-lg mb-2 truncate">
                        {form.watch("title") || "Post Title"}
                      </h4>
                      <div className="text-sm text-muted-foreground mb-3">
                        {new Date().toLocaleDateString()}
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {form.watch("excerpt") || form.watch("content") || "Post content preview..."}
                      </p>
                    </div>
                    
                    {post && (
                      <div className="pt-2">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Button variant="outline" className="w-full gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Live Post
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}