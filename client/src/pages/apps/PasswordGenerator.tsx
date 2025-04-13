import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Copy, RefreshCw, Check, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function PasswordGenerator() {
  const { toast } = useToast();
  const [passwordLength, setPasswordLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "very-strong">("medium");
  const [copied, setCopied] = useState(false);

  // Generate password on initial load or when options change
  useEffect(() => {
    generatePassword();
  }, [passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  // Calculate password strength
  useEffect(() => {
    calculatePasswordStrength();
  }, [password]);

  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_-+=<>?/[]{}|";

    let chars = "";
    if (includeLowercase) chars += lowercase;
    if (includeUppercase) chars += uppercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    // Fallback if no character set is selected
    if (chars === "") chars = lowercase;

    let generatedPassword = "";
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      generatedPassword += chars[randomIndex];
    }

    setPassword(generatedPassword);
    setCopied(false);
  };

  const calculatePasswordStrength = () => {
    // A very simple algorithm for demonstration purposes
    // In a real app, you might want a more sophisticated algorithm
    let score = 0;

    // Length factor
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;

    // Character variety factor
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength based on score
    if (score >= 6) setPasswordStrength("very-strong");
    else if (score >= 4) setPasswordStrength("strong");
    else if (score >= 2) setPasswordStrength("medium");
    else setPasswordStrength("weak");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="lg">
            <div className="mb-8">
              <div 
                onClick={() => window.location.href = "/apps"}
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Apps
              </div>
            </div>
            
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Password Generator</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Create secure, random passwords to keep your accounts safe
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Generate a Password</CardTitle>
                  <CardDescription>
                    Customize your password settings below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Password Display */}
                  <div className="relative">
                    <Input
                      value={password}
                      readOnly
                      className="pr-24 font-mono text-lg h-16"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={generatePassword}
                        title="Generate new password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyToClipboard}
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex justify-between">
                      <span>Password Strength</span>
                      <span className={`
                        ${passwordStrength === "weak" && "text-red-500"}
                        ${passwordStrength === "medium" && "text-yellow-500"}
                        ${passwordStrength === "strong" && "text-green-500"}
                        ${passwordStrength === "very-strong" && "text-emerald-500"}
                      `}>
                        {passwordStrength.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength === "weak"
                            ? "w-1/4 bg-red-500"
                            : passwordStrength === "medium"
                            ? "w-2/4 bg-yellow-500"
                            : passwordStrength === "strong"
                            ? "w-3/4 bg-green-500"
                            : "w-full bg-emerald-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Password Length */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex justify-between">
                      <span>Password Length</span>
                      <span>{passwordLength} characters</span>
                    </div>
                    <Slider
                      value={[passwordLength]}
                      min={6}
                      max={30}
                      step={1}
                      onValueChange={(value) => setPasswordLength(value[0])}
                    />
                  </div>

                  {/* Character Options */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Character Types</h3>
                    <div className="flex justify-between items-center">
                      <span>Include Uppercase Letters (A-Z)</span>
                      <Switch
                        checked={includeUppercase}
                        onCheckedChange={setIncludeUppercase}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Include Lowercase Letters (a-z)</span>
                      <Switch
                        checked={includeLowercase}
                        onCheckedChange={setIncludeLowercase}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Include Numbers (0-9)</span>
                      <Switch
                        checked={includeNumbers}
                        onCheckedChange={setIncludeNumbers}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Include Symbols (!@#$%^&*)</span>
                      <Switch
                        checked={includeSymbols}
                        onCheckedChange={setIncludeSymbols}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={generatePassword}
                    size="lg"
                  >
                    Generate New Password
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              className="max-w-2xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">Password Security Tips</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Use a unique password for each account
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Longer passwords (12+ characters) are more secure
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Include a mix of letters, numbers, and symbols
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Consider using a password manager to store your passwords securely
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Enable two-factor authentication when available
                </li>
              </ul>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}