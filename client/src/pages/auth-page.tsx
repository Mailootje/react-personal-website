import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Container from "@/components/Container";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    if (password !== confirmPassword) {
      return;
    }
    registerMutation.mutate({ 
      username: registerUsername, 
      password, 
      email 
    });
  };

  // Determine if register button should be disabled
  const isRegisterDisabled = 
    registerMutation.isPending || 
    !registerUsername.trim() || 
    !password.trim() || 
    password !== confirmPassword;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Container maxWidth="xl">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-center">
          {/* Auth Form - fixed width */}
          <div className="w-full max-w-[420px]">
            <div className="bg-[#121212] border border-gray-800 rounded-md overflow-hidden shadow-xl">
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a] rounded-none p-0 h-12">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-none h-full data-[state=active]:bg-[#121212] data-[state=active]:shadow-none text-sm"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="rounded-none h-full data-[state=active]:bg-[#121212] data-[state=active]:shadow-none text-sm"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login" className="m-0 pt-4">
                  <div className="px-6 pb-4">
                    <h2 className="text-xl font-bold text-white text-center">Welcome Back</h2>
                    <p className="text-gray-400 text-sm text-center mb-6">Sign in to access your account</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="bg-[#1a1a1a] border-gray-800 h-10"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="bg-[#1a1a1a] border-gray-800 h-10"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white h-10 mt-4" 
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
                    </form>
                  </div>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="m-0 pt-4">
                  <div className="px-6 pb-4">
                    <h2 className="text-xl font-bold text-white text-center">Create Account</h2>
                    <p className="text-gray-400 text-sm text-center mb-6">Register to create a new account</p>
                    
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label htmlFor="register-username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choose a username"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          className="bg-[#1a1a1a] border-gray-800 h-10"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email (optional)</label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-[#1a1a1a] border-gray-800 h-10"
                        />
                      </div>
                      <div>
                        <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-[#1a1a1a] border-gray-800 h-10"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-[#1a1a1a] border-gray-800 h-10"
                          required
                        />
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white h-10 mt-4" 
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
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Hero Section */}
          <div className="flex-1 text-center lg:text-left max-w-md">
            <h1 className="text-3xl font-bold text-blue-500 mb-2">
              {activeTab === "login" ? "Welcome Back" : "Join Our Community"}
            </h1>
            <p className="text-gray-300 mb-6">
              {activeTab === "login" 
                ? "Sign in to access personalized features and content." 
                : "Create an account to join our community and access exclusive features."}
            </p>
            <div className="bg-[#1a1a1a]/50 p-5 rounded-lg border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-3">
                {activeTab === "login" ? "Account Benefits" : "Why Register?"}
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> Access personalized content
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> Save your preferences
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> Join discussion forums
                </li>
                <li className="flex items-center">
                  <span className="mr-2 text-green-500">✓</span> Get updates on new features
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}