import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { VideoBackground } from "@/components/VideoBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { BlogPost, insertBlogPostSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Extend the schema with client-side validation
const blogFormSchema = insertBlogPostSchema.extend({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  content: z.string()
    .min(10, "Content must be at least 10 characters"),
  excerpt: z.string().optional(),
  imageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  published: z.boolean().default(false),
});

type BlogFormData = z.infer<typeof blogFormSchema>;

export default function BlogForm() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!id;

  // For edit mode, fetch the existing post
  const {
    data: post,
    isLoading: isLoadingPost,
    error: fetchError,
  } = useQuery<BlogPost>({
    queryKey: ["/api/admin/blog/posts", id],
    queryFn: async () => {
      if (!id) throw new Error("No post ID provided");
      
      const response = await fetch(`/api/blog/posts/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog post");
      }
      return response.json();
    },
    enabled: isEditing,
  });

  // Form setup
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
  
  // Update form values when post data is loaded
  useEffect(() => {
    if (post && isEditing) {
      form.reset({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        imageUrl: post.imageUrl || "",
        published: post.published,
      });
    }
  }, [post, isEditing, form]);

  // Auto-generate slug from title
  const [autoSlug, setAutoSlug] = useState(true);
  
  // Update slug when title changes if autoSlug is enabled
  useEffect(() => {
    if (autoSlug && !isEditing) {
      const title = form.watch("title");
      if (title) {
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")  // Remove special characters
          .replace(/\s+/g, "-")       // Replace spaces with hyphens
          .replace(/-+/g, "-")        // Replace multiple hyphens with single hyphen
          .trim();
          
        form.setValue("slug", slug);
      }
    }
  }, [form.watch("title"), autoSlug, isEditing, form]);

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (data: BlogFormData) => {
      if (isEditing) {
        return apiRequest("PUT", `/api/admin/blog/posts/${id}`, data);
      } else {
        return apiRequest("POST", "/api/admin/blog/posts", data);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Post updated" : "Post created",
        description: isEditing 
          ? "Your blog post has been updated successfully." 
          : "Your blog post has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      navigate("/admin/blog");
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Update failed" : "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BlogFormData) => {
    mutation.mutate(data);
  };

  // Display loading state
  if (isEditing && isLoadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Display error state
  if (isEditing && fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Post Not Found</h2>
        <p className="text-gray-700 mb-6">
          {fetchError.message || "The blog post you're trying to edit doesn't exist."}
        </p>
        <Button onClick={() => navigate("/admin/blog")}>Return to Blog Admin</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <VideoBackground opacity={0.3} />
      
      <Container className="py-16">
        <Button 
          variant="ghost" 
          className="mb-8 flex items-center"
          onClick={() => navigate("/admin/blog")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog Admin
        </Button>

        <SectionHeading
          subtitle="Blog Management"
          title={isEditing ? "Edit Blog Post" : "Create New Blog Post"}
          center={false}
          isDark
          className="mb-8"
        />

        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a title for your blog post" 
                            className="bg-background/10 border-border/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slug with auto-generation option */}
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="enter-url-slug" 
                              className="bg-background/10 border-border/50"
                              disabled={!isEditing && autoSlug}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The slug is used in the URL: /blog/your-slug
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!isEditing && (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="auto-slug" 
                          checked={autoSlug} 
                          onCheckedChange={(checked) => {
                            setAutoSlug(checked === true);
                          }}
                        />
                        <label
                          htmlFor="auto-slug"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Auto-generate slug from title
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Image URL */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            className="bg-background/10 border-border/50"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a URL for the featured image (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Excerpt */}
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="A brief summary of your post" 
                            className="bg-background/10 border-border/50 min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A short summary shown in the blog list (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Published status */}
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Publish this post
                          </FormLabel>
                          <FormDescription>
                            Published posts will be visible to all users. Unpublished posts are only visible to admins.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Content */}
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Write your blog post content here..." 
                          className="bg-background/10 border-border/50 min-h-[400px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Support for formatted text and markdown will be added in the future.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview image if URL is provided */}
              {form.watch("imageUrl") && (
                <div className="mt-8 p-4 border border-dashed border-gray-600 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Image Preview</h3>
                  <img 
                    src={form.watch("imageUrl")}
                    alt="Featured image preview"
                    className="max-h-[300px] object-contain rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x400/333/white?text=Image+Not+Found";
                    }}
                  />
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate("/admin/blog")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditing ? "Update Post" : "Create Post"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Container>
    </div>
  );
}