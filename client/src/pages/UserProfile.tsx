import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import Container from "@/components/Container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Mail, Key, LogOut, Upload, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile() {
  const queryClient = useQueryClient();
  const { user, logoutMutation } = useAuth();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState("account");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Set initial form values
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Upload profile picture mutation
  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (data: { image: string }) => {
      try {
        const res = await apiRequest("POST", "/api/profile/picture", data);
        
        // Check if the response is JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await res.json();
        } else {
          throw new Error("Server returned an invalid response format");
        }
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        throw new Error("Failed to upload profile picture. Please try again.");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      // Clear the preview since we'll show the actual profile picture now
      setImagePreview(null);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle profile update
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ email });
  };

  // Handle password update
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Upload profile picture
  const handleUploadProfilePicture = () => {
    if (!imagePreview) return;
    
    uploadProfilePictureMutation.mutate({
      image: imagePreview
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-background">
      <Container maxWidth="lg">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">Your Profile</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="account">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Info Card */}
              <Card className="md:col-span-1 shadow-lg border-border/50 bg-card/90 backdrop-blur-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-xl text-center">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                  {/* Profile Picture with Upload Button */}
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24 border-2 border-primary">
                      {imagePreview ? (
                        <AvatarImage src={imagePreview} alt="Profile preview" />
                      ) : user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.username} />
                      ) : (
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-12 w-12 text-primary" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <button 
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
                      aria-label="Upload profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    
                    <input 
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/gif, image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {/* Preview Actions */}
                  {imagePreview && (
                    <div className="mb-4 space-y-2 w-full">
                      <p className="text-xs text-muted-foreground">Preview mode</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="default" 
                          className="flex-1"
                          onClick={handleUploadProfilePicture}
                          disabled={uploadProfilePictureMutation.isPending}
                        >
                          {uploadProfilePictureMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="flex-1"
                          onClick={() => setImagePreview(null)}
                          disabled={uploadProfilePictureMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold mb-1">{user.username}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{user.email || "No email set"}</p>
                  <div className="text-xs text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    {user.isAdmin ? "Administrator" : "User"}
                  </div>
                  <Separator className="my-4" />
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
              
              {/* Edit Profile Form */}
              <Card className="md:col-span-2 shadow-lg border-border/50 bg-card/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your account information
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleProfileUpdate}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={user.username}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Username cannot be changed
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="created">Account Created</Label>
                      <Input
                        id="created"
                        value={new Date(user.createdAt).toLocaleDateString()}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="ml-auto"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg border-border/50 bg-card/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handlePasswordUpdate}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-destructive text-sm">Passwords do not match</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="ml-auto"
                      disabled={
                        updatePasswordMutation.isPending || 
                        !currentPassword || 
                        !newPassword || 
                        !confirmPassword ||
                        newPassword !== confirmPassword
                      }
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
}