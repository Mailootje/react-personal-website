import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Loader2, 
  ExternalLink, 
  Trash2, 
  Search, 
  FilterX,
  Calendar,
  ArrowLeft,
  Pencil,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShortenedLink } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

interface LinksResponse {
  links: ShortenedLink[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface EditLinkFormData {
  originalUrl: string;
}

export default function LinksAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingLink, setEditingLink] = useState<ShortenedLink | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const limit = 10;

  const { data, isLoading, error } = useQuery<LinksResponse>({
    queryKey: ["/api/admin/links", currentPage, searchTerm],
    queryFn: async () => {
      const offset = (currentPage - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }
      
      return apiRequest("GET", `/api/admin/links?${queryParams.toString()}`);
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditLinkFormData>();

  const updateMutation = useMutation({
    mutationFn: async ({ shortCode, data }: { shortCode: string, data: EditLinkFormData }) => {
      return apiRequest("PUT", `/api/admin/links/${shortCode}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      toast({
        title: "Success",
        description: `Link "${variables.shortCode}" has been updated.`,
      });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update link: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (shortCode: string) => {
      // Use apiRequest with parseJson=false to handle 204 No Content responses
      return apiRequest("DELETE", `/api/admin/links/${shortCode}`, undefined, undefined, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] });
      toast({
        title: "Success",
        description: "Shortened link has been deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete link: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleEditClick = (link: ShortenedLink) => {
    setEditingLink(link);
    reset({ originalUrl: link.originalUrl });
    setEditDialogOpen(true);
  };

  const onSubmitEdit = (formData: EditLinkFormData) => {
    if (editingLink) {
      updateMutation.mutate({
        shortCode: editingLink.shortCode,
        data: formData
      });
    }
  };

  const totalPages = data ? Math.ceil(data.meta.total / limit) : 0;
  
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-16 text-white">
        <div className="bg-black min-h-screen">
          <Container>
            <div className="py-8">
              <div className="flex items-center mb-6">
                <Link href="/admin" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors mr-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
                <SectionHeading
                  subtitle="ADMIN PANEL"
                  title="Shortened Links"
                />
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 shadow-md overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="Search links by URL or code..."
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
                    <p className="text-red-500 mb-4">Failed to load links</p>
                    <Button 
                      variant="outline" 
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/links"] })}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : data?.links.length === 0 ? (
                  <div className="text-center p-12">
                    <p className="text-muted-foreground mb-4">No shortened links found</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Short Code</TableHead>
                            <TableHead>Original URL</TableHead>
                            <TableHead className="w-[120px]">Clicks</TableHead>
                            <TableHead className="w-[150px]">Created</TableHead>
                            <TableHead className="w-[150px]">Expires</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[120px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.links.map((link) => {
                            const isExpired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
                            
                            return (
                              <TableRow key={link.shortCode}>
                                <TableCell className="font-mono">{link.shortCode}</TableCell>
                                <TableCell className="max-w-xs truncate font-medium">
                                  <div className="truncate" title={link.originalUrl}>
                                    {link.originalUrl}
                                  </div>
                                </TableCell>
                                <TableCell>{link.clicks}</TableCell>
                                <TableCell>
                                  {format(new Date(link.createdAt), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  {link.expiresAt 
                                    ? format(new Date(link.expiresAt), 'MMM d, yyyy') 
                                    : 'Never'}
                                </TableCell>
                                <TableCell>
                                  {isExpired ? (
                                    <Badge variant="destructive">Expired</Badge>
                                  ) : (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <a 
                                      href={`/s/${link.shortCode}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <Button variant="ghost" size="icon" title="Open Link">
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </a>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      title="Edit Link"
                                      onClick={() => handleEditClick(link)}
                                    >
                                      <Pencil className="h-4 w-4 text-blue-500" />
                                    </Button>
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
                                            This will permanently delete the shortened link "{link.shortCode}".
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            className="bg-red-500 hover:bg-red-600"
                                            onClick={() => deleteMutation.mutate(link.shortCode)}
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
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center p-4 border-t border-border/50">
                        <div className="text-sm text-muted-foreground">
                          Showing {data?.links.length} of {data?.meta.total} links
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
      </div>
      <Footer />
      
      {/* Edit Link Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shortened Link</DialogTitle>
            <DialogDescription>
              Update the destination URL for short code: {editingLink?.shortCode}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="originalUrl">Destination URL</Label>
                <Input
                  id="originalUrl"
                  {...register("originalUrl", { 
                    required: "Destination URL is required",
                    pattern: {
                      value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                      message: "Please enter a valid URL"
                    }
                  })}
                  className={errors.originalUrl ? "border-red-500" : ""}
                  placeholder="https://example.com"
                />
                {errors.originalUrl && (
                  <p className="text-red-500 text-sm">{errors.originalUrl.message}</p>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}