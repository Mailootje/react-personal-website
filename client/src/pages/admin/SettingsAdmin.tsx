import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Palette, 
  Save, 
  Cloud, 
  Link as LinkIcon,
  MessageSquare,
  Upload,
  Loader2,
  Check
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

// Define schemas for different settings forms
const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const siteConfigSchema = z.object({
  siteTitle: z.string().min(1, "Site title is required"),
  siteDescription: z.string().min(1, "Site description is required"),
  twitterUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  facebookUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  instagramUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  linkedinUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  githubUrl: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
});

const appSettingsSchema = z.object({
  weatherApiKey: z.string().optional(),
  linkDefaultExpiration: z.enum(["1day", "7days", "30days", "90days", "never"]),
  blogCommentsEnabled: z.boolean(),
  blogDefaultPublished: z.boolean(),
  maxUploadSize: z.enum(["1MB", "5MB", "10MB", "25MB", "50MB"]),
});

const themeSettingsSchema = z.object({
  primaryColor: z.string(),
  fontFamily: z.enum(["system", "inter", "roboto", "poppins", "montserrat"]),
  borderRadius: z.enum(["none", "small", "medium", "large"]),
  darkMode: z.enum(["light", "dark", "system"]),
});

export default function SettingsAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: "",
      email: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Site config form
  const siteConfigForm = useForm<z.infer<typeof siteConfigSchema>>({
    resolver: zodResolver(siteConfigSchema),
    defaultValues: {
      siteTitle: "",
      siteDescription: "",
      twitterUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      githubUrl: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
    },
  });
  
  // App settings form
  const appSettingsForm = useForm<z.infer<typeof appSettingsSchema>>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      weatherApiKey: "",
      linkDefaultExpiration: "7days",
      blogCommentsEnabled: false,
      blogDefaultPublished: false,
      maxUploadSize: "5MB",
    },
  });
  
  // Theme settings form
  const themeSettingsForm = useForm<z.infer<typeof themeSettingsSchema>>({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: {
      primaryColor: "#0ea5e9",
      fontFamily: "system",
      borderRadius: "medium",
      darkMode: "system",
    },
  });
  
  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: async () => {
      return apiRequest("GET", "/api/me");
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return apiRequest("PUT", "/api/admin/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update site config mutation
  const updateSiteConfigMutation = useMutation({
    mutationFn: async (data: z.infer<typeof siteConfigSchema>) => {
      return apiRequest("PUT", "/api/admin/settings/site", data);
    },
    onSuccess: () => {
      toast({
        title: "Site configuration updated",
        description: "Site configuration has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update site configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update app settings mutation
  const updateAppSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appSettingsSchema>) => {
      return apiRequest("PUT", "/api/admin/settings/app", data);
    },
    onSuccess: () => {
      toast({
        title: "App settings updated",
        description: "Application settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update app settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update theme settings mutation
  const updateThemeSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof themeSettingsSchema>) => {
      return apiRequest("PUT", "/api/admin/settings/theme", data);
    },
    onSuccess: () => {
      toast({
        title: "Theme settings updated",
        description: "Theme settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update theme settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update forms with user data when it loads
  // In a real implementation, you would also fetch site settings, app settings, etc.
  // and populate the respective forms
  React.useEffect(() => {
    if (userData) {
      profileForm.reset({
        username: userData.username,
        email: userData.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [userData, profileForm]);
  
  // Form submission handlers
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  const onSiteConfigSubmit = (data: z.infer<typeof siteConfigSchema>) => {
    updateSiteConfigMutation.mutate(data);
  };
  
  const onAppSettingsSubmit = (data: z.infer<typeof appSettingsSchema>) => {
    updateAppSettingsMutation.mutate(data);
  };
  
  const onThemeSettingsSubmit = (data: z.infer<typeof themeSettingsSchema>) => {
    updateThemeSettingsMutation.mutate(data);
  };
  
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20">
        <div className="bg-card/30 backdrop-blur-sm py-12">
          <Container>
            <div className="py-8">
              <div className="flex items-center mb-6">
                <Link href="/admin" className="inline-flex items-center text-primary hover:text-primary/80 mb-6 transition-colors mr-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </div>
              
              <SectionHeading
                subtitle="ADMIN PANEL"
                title="Settings"
              />
              
              <div className="mt-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="site" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Site</span>
                    </TabsTrigger>
                    <TabsTrigger value="app" className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      <span className="hidden sm:inline">Application</span>
                    </TabsTrigger>
                    <TabsTrigger value="theme" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      <span className="hidden sm:inline">Theme</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Profile Settings */}
                  <TabsContent value="profile">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>
                          Manage your account details and password
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={profileForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input placeholder="username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="email@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={profileForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div /> {/* Empty div for grid alignment */}
                              
                              <FormField
                                control={profileForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Leave blank to keep your current password
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex items-center gap-4 pt-4">
                              <Button type="submit" disabled={updateProfileMutation.isPending} className="ml-auto">
                                {updateProfileMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Profile Image</CardTitle>
                        <CardDescription>
                          Update your profile picture
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center gap-6 sm:flex-row">
                          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-border">
                            <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground">
                              <User className="h-12 w-12" />
                            </div>
                            {/* If user has profile image, render it here */}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button variant="outline" className="gap-2">
                              <Upload className="h-4 w-4" />
                              Upload Image
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Recommended size: 256x256px. Max file size: 2MB.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Site Configuration */}
                  <TabsContent value="site">
                    <Card>
                      <CardHeader>
                        <CardTitle>Site Configuration</CardTitle>
                        <CardDescription>
                          Manage your website information and SEO settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...siteConfigForm}>
                          <form onSubmit={siteConfigForm.handleSubmit(onSiteConfigSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={siteConfigForm.control}
                                name="siteTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Site Title</FormLabel>
                                    <FormControl>
                                      <Input placeholder="My Website" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Appears in browser tabs and search results
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="md:col-span-2">
                                <FormField
                                  control={siteConfigForm.control}
                                  name="siteDescription"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Site Description</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="A brief description of your website" 
                                          {...field} 
                                          className="resize-none h-20"
                                        />
                                      </FormControl>
                                      <FormDescription>
                                        Used for SEO and appears in search results
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="text-lg font-medium mb-4">Social Media Links</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={siteConfigForm.control}
                                name="twitterUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Twitter URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://twitter.com/yourusername" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={siteConfigForm.control}
                                name="facebookUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Facebook URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://facebook.com/yourpage" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={siteConfigForm.control}
                                name="instagramUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Instagram URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://instagram.com/yourusername" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={siteConfigForm.control}
                                name="linkedinUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>LinkedIn URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://linkedin.com/in/yourusername" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={siteConfigForm.control}
                                name="githubUrl"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>GitHub URL</FormLabel>
                                    <FormControl>
                                      <Input placeholder="https://github.com/yourusername" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={siteConfigForm.control}
                                name="contactEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="contact@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={siteConfigForm.control}
                                name="contactPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact Phone</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 234 567 890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="md:col-span-2">
                                <FormField
                                  control={siteConfigForm.control}
                                  name="contactAddress"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Contact Address</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="123 Street Name, City, Country" 
                                          {...field} 
                                          className="resize-none h-20"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pt-4">
                              <Button type="submit" disabled={updateSiteConfigMutation.isPending} className="ml-auto">
                                {updateSiteConfigMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Application Settings */}
                  <TabsContent value="app">
                    <Card>
                      <CardHeader>
                        <CardTitle>Application Settings</CardTitle>
                        <CardDescription>
                          Configure application-specific settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...appSettingsForm}>
                          <form onSubmit={appSettingsForm.handleSubmit(onAppSettingsSubmit)} className="space-y-6">
                            <h3 className="text-lg font-medium mb-4">API Keys</h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                              <FormField
                                control={appSettingsForm.control}
                                name="weatherApiKey"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>OpenWeather API Key</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter your OpenWeather API key" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Used for the Weather Dashboard feature
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="text-lg font-medium mb-4">Link Shortener Settings</h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                              <FormField
                                control={appSettingsForm.control}
                                name="linkDefaultExpiration"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Link Expiration</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a default expiration" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="1day">1 Day</SelectItem>
                                        <SelectItem value="7days">7 Days</SelectItem>
                                        <SelectItem value="30days">30 Days</SelectItem>
                                        <SelectItem value="90days">90 Days</SelectItem>
                                        <SelectItem value="never">Never</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Sets the default expiration time for new shortened links
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="text-lg font-medium mb-4">Blog Settings</h3>
                            
                            <div className="space-y-4">
                              <FormField
                                control={appSettingsForm.control}
                                name="blogCommentsEnabled"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">
                                        Enable Comments
                                      </FormLabel>
                                      <FormDescription>
                                        Allow visitors to comment on blog posts
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={appSettingsForm.control}
                                name="blogDefaultPublished"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-base">
                                        Default to Published
                                      </FormLabel>
                                      <FormDescription>
                                        Automatically set new blog posts as published
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <h3 className="text-lg font-medium mb-4">File Upload Settings</h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                              <FormField
                                control={appSettingsForm.control}
                                name="maxUploadSize"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Maximum Upload Size</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select maximum upload size" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="1MB">1 MB</SelectItem>
                                        <SelectItem value="5MB">5 MB</SelectItem>
                                        <SelectItem value="10MB">10 MB</SelectItem>
                                        <SelectItem value="25MB">25 MB</SelectItem>
                                        <SelectItem value="50MB">50 MB</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Sets the maximum file size for uploads
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex items-center gap-4 pt-4">
                              <Button type="submit" disabled={updateAppSettingsMutation.isPending} className="ml-auto">
                                {updateAppSettingsMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Theme Settings */}
                  <TabsContent value="theme">
                    <Card>
                      <CardHeader>
                        <CardTitle>Theme Settings</CardTitle>
                        <CardDescription>
                          Customize the appearance of your website
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...themeSettingsForm}>
                          <form onSubmit={themeSettingsForm.handleSubmit(onThemeSettingsSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={themeSettingsForm.control}
                                name="primaryColor"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Primary Color</FormLabel>
                                    <div className="flex gap-2">
                                      <FormControl>
                                        <Input 
                                          type="color" 
                                          {...field} 
                                          className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                      </FormControl>
                                      <Input 
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="flex-1"
                                      />
                                    </div>
                                    <FormDescription>
                                      The main color used throughout the site
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={themeSettingsForm.control}
                                name="fontFamily"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Font Family</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a font family" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="system">System Default</SelectItem>
                                        <SelectItem value="inter">Inter</SelectItem>
                                        <SelectItem value="roboto">Roboto</SelectItem>
                                        <SelectItem value="poppins">Poppins</SelectItem>
                                        <SelectItem value="montserrat">Montserrat</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Font used for text throughout the site
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={themeSettingsForm.control}
                                name="borderRadius"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Border Radius</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select border radius" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">None (0px)</SelectItem>
                                        <SelectItem value="small">Small (4px)</SelectItem>
                                        <SelectItem value="medium">Medium (8px)</SelectItem>
                                        <SelectItem value="large">Large (12px)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Roundness of corners on elements
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={themeSettingsForm.control}
                                name="darkMode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Color Scheme</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select color scheme" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="system">System Preference</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormDescription>
                                      Default color scheme for the site
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="flex items-center gap-4 pt-4">
                              <Button type="submit" disabled={updateThemeSettingsMutation.isPending} className="ml-auto">
                                {updateThemeSettingsMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                    
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Theme Preview</CardTitle>
                        <CardDescription>
                          See how your theme changes will look
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Buttons</h4>
                            <div className="flex flex-wrap gap-2">
                              <Button>Primary</Button>
                              <Button variant="secondary">Secondary</Button>
                              <Button variant="outline">Outline</Button>
                              <Button variant="ghost">Ghost</Button>
                              <Button variant="destructive">Destructive</Button>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Typography</h4>
                            <div className="space-y-2">
                              <h1 className="text-3xl font-bold">Heading 1</h1>
                              <h2 className="text-2xl font-bold">Heading 2</h2>
                              <h3 className="text-xl font-bold">Heading 3</h3>
                              <p className="text-base">Paragraph text</p>
                              <p className="text-sm text-muted-foreground">Muted text</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Form Elements</h4>
                            <div className="space-y-2">
                              <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="preview-input">Input</Label>
                                <Input id="preview-input" placeholder="Enter text..." />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="preview-switch" />
                                <Label htmlFor="preview-switch">Toggle</Label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">Cards</h4>
                            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                              <h3 className="font-medium">Card Title</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                This is a card with some sample content.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </Container>
        </div>
      </div>
      <Footer />
    </>
  );
}

// Add React import
import React from "react";