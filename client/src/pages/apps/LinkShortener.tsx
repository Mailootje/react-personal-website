import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LinkShortener() {
  // States
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Copy to clipboard function
  const copyToClipboard = () => {
    if (!shortUrl) return;
    
    navigator.clipboard.writeText(shortUrl)
      .then(() => {
        setCopied(true);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share your shortened link",
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually",
          variant: "destructive",
        });
      });
  };

  // Validate URL function
  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  // Generate short link - for demo purposes we'll use a mock function
  // In a real application this would call an API
  const shortenUrl = () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    setIsLoading(true);
    setError("");

    // Mock API call with timeout to simulate network request
    setTimeout(() => {
      // For demo, create a short code based on timestamp and random string
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 6);
      const shortCode = `${timestamp.substring(timestamp.length - 3)}${randomStr}`;
      
      // In a real app, this would come from your backend
      setShortUrl(`http://short.link/${shortCode}`);
      setIsLoading(false);
      
      toast({
        title: "URL shortened successfully",
        description: "Your shortened link is ready to share",
      });
    }, 1500);
  };

  // Clear form function
  const clearForm = () => {
    setUrl("");
    setShortUrl("");
    setError("");
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (error) setError("");
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Link Shortener
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Transform long, complex URLs into short, shareable links
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader>
                  <CardTitle>Shorten Your URL</CardTitle>
                  <CardDescription>
                    Enter a long URL to create a shortened, easy-to-share link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* URL Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={url}
                        onChange={handleInputChange}
                        placeholder="https://example.com/your-very-long-url-that-needs-shortening"
                        className={`pr-10 h-12 ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        onKeyDown={(e) => e.key === 'Enter' && shortenUrl()}
                      />
                      {url && (
                        <button
                          onClick={clearForm}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Clear input"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {error && (
                      <div className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={shortenUrl}
                    disabled={isLoading || !url}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isLoading ? "Shortening..." : "Shorten URL"}
                  </Button>

                  {/* Result Section */}
                  {shortUrl && (
                    <div className="mt-6 bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-2">Your shortened URL:</div>
                      <div className="flex gap-2">
                        <Input
                          value={shortUrl}
                          readOnly
                          className="font-mono text-sm flex-grow"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={copyToClipboard}
                          title="Copy to clipboard"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(shortUrl, '_blank')}
                          title="Open link in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              className="max-w-2xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">Why Use Link Shortening?</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Makes links easier to share on social media
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Improves the appearance of links in emails or messages
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Helps track clicks and engagement (with full implementation)
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Converts long, complex URLs into memorable links
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Perfect for print materials where typing long URLs is impractical
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