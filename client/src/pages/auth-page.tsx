import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Container from "@/components/Container";

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Redirect to home if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container maxWidth="xl">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          {/* Left Column - Auth Form */}
          <div className="flex-1 w-full max-w-md">
            <Card className="shadow-xl border-border/40 bg-card/90 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-accent-foreground">
                  Welcome Back
                </CardTitle>
                <CardDescription>
                  Sign in to access the admin panel
                </CardDescription>
              </CardHeader>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register" disabled>Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Hero Section */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Blog Admin Panel
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Manage your blog content, create new posts, and update your website.
              This area is restricted to authorized administrators only.
            </p>
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/20">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Admin Features
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Create and publish blog posts
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Edit existing content
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Upload images and media
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Manage website settings
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}