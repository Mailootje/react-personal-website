import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Mail, Lock } from "lucide-react";
import Container from "@/components/Container";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");

  // Reset form fields when switching tabs
  useEffect(() => {
    if (activeTab === "login") {
      setRegisterUsername("");
      setRegisterPassword("");
      setEmail("");
      setConfirmPassword("");
    } else {
      setLoginUsername("");
      setLoginPassword("");
    }
  }, [activeTab]);

  // Redirect to home if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ 
      username: loginUsername, 
      password: loginPassword 
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== confirmPassword) {
      // Toast error is handled by validation
      return;
    }
    registerMutation.mutate({ 
      username: registerUsername, 
      password: registerPassword, 
      email 
    });
  };

  // Determine if register button should be disabled
  const isRegisterDisabled = 
    registerMutation.isPending || 
    !registerUsername.trim() || 
    !registerPassword.trim() || 
    registerPassword !== confirmPassword;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container maxWidth="xl">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          {/* Left Column - Auth Form */}
          <div className="flex-1 w-full max-w-md">
            <Card className="shadow-xl border-border/40 bg-card/90 backdrop-blur-sm">
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-accent-foreground">
                      Welcome Back
                    </CardTitle>
                    <CardDescription>
                      Sign in to access your account
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="login-username">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-username"
                            type="text"
                            className="pl-10"
                            placeholder="Username"
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            className="pl-10"
                            placeholder="Password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pb-6">
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

                <TabsContent value="register">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-accent-foreground">
                      Create Account
                    </CardTitle>
                    <CardDescription>
                      Register to create a new account
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-username"
                            type="text"
                            className="pl-10"
                            placeholder="Choose a username"
                            value={registerUsername}
                            onChange={(e) => setRegisterUsername(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email (optional)</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-email"
                            type="email"
                            className="pl-10"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-password"
                            type="password"
                            className="pl-10"
                            placeholder="Create a password"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="register-confirm-password"
                            type="password"
                            className="pl-10"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                        {confirmPassword && registerPassword !== confirmPassword && (
                          <p className="text-destructive text-sm">Passwords do not match</p>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pb-6">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isRegisterDisabled}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
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
              {activeTab === "login" ? "Welcome Back" : "Join Our Community"}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {activeTab === "login" 
                ? "Sign in to access personalized features and content." 
                : "Create an account to join our community and access exclusive features."}
            </p>
            <div className="bg-card/30 backdrop-blur-sm p-6 rounded-lg border border-border/20">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {activeTab === "login" ? "Account Benefits" : "Why Register?"}
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Access personalized content
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Save your preferences
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Join discussion forums
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Get updates on new features
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}