import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Clock, InfoIcon, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderAnalysis {
  name: string;
  value: string;
  description: string;
  category: "security" | "cache" | "content" | "other";
  severity?: "good" | "warning" | "danger" | "info";
}

export default function HeaderChecker() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    url?: string;
  } | null>(null);
  const [headersAnalysis, setHeadersAnalysis] = useState<HeaderAnalysis[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Function to check headers
  const checkHeaders = async () => {
    if (!url) {
      toast({
        title: "URL required",
        description: "Please enter a valid URL to check",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    let validUrl: string;
    try {
      // If the URL doesn't start with http:// or https://, add https://
      const urlToCheck = url.match(/^https?:\/\//) ? url : `https://${url}`;
      new URL(urlToCheck); // This will throw if invalid
      validUrl = urlToCheck;
    } catch (error) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., example.com)",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setHeadersAnalysis([]);

    try {
      const response = await fetch(`/api/header-check?url=${encodeURIComponent(validUrl)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check headers");
      }
      
      const data = await response.json();
      setResult(data);
      
      // Analyze the headers
      const analysis = analyzeHeaders(data.headers);
      setHeadersAnalysis(analysis);
    } catch (error) {
      console.error("Error checking headers:", error);
      toast({
        title: "Error checking headers",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Headers analysis logic
  const analyzeHeaders = (headers: Record<string, string> = {}): HeaderAnalysis[] => {
    const analysis: HeaderAnalysis[] = [];

    // Security Headers
    if (headers["strict-transport-security"]) {
      analysis.push({
        name: "Strict-Transport-Security",
        value: headers["strict-transport-security"],
        description: "Forces browsers to use HTTPS for the specified duration.",
        category: "security",
        severity: "good",
      });
    } else {
      analysis.push({
        name: "Strict-Transport-Security",
        value: "Not present",
        description: "HSTS header missing. This allows potential downgrade attacks.",
        category: "security",
        severity: "warning",
      });
    }

    if (headers["content-security-policy"]) {
      analysis.push({
        name: "Content-Security-Policy",
        value: headers["content-security-policy"],
        description: "Controls resources the browser is allowed to load.",
        category: "security",
        severity: "good",
      });
    } else {
      analysis.push({
        name: "Content-Security-Policy",
        value: "Not present",
        description: "No CSP found. This may allow XSS attacks.",
        category: "security",
        severity: "warning",
      });
    }

    if (headers["x-frame-options"]) {
      analysis.push({
        name: "X-Frame-Options",
        value: headers["x-frame-options"],
        description: "Prevents clickjacking by controlling if a browser renders the page in a <frame> or <iframe>.",
        category: "security",
        severity: "good",
      });
    } else {
      analysis.push({
        name: "X-Frame-Options",
        value: "Not present",
        description: "Missing frame protection. Site may be vulnerable to clickjacking.",
        category: "security",
        severity: "warning",
      });
    }

    if (headers["x-content-type-options"]) {
      analysis.push({
        name: "X-Content-Type-Options",
        value: headers["x-content-type-options"],
        description: "Prevents MIME-sniffing which can cause security vulnerabilities.",
        category: "security",
        severity: "good",
      });
    } else {
      analysis.push({
        name: "X-Content-Type-Options",
        value: "Not present",
        description: "MIME-sniffing protection missing. Can lead to MIME confusion attacks.",
        category: "security",
        severity: "warning",
      });
    }

    if (headers["x-xss-protection"]) {
      analysis.push({
        name: "X-XSS-Protection",
        value: headers["x-xss-protection"],
        description: "Enables browser's XSS filtering. Modern browsers use CSP instead.",
        category: "security",
        severity: "info",
      });
    }

    if (headers["referrer-policy"]) {
      analysis.push({
        name: "Referrer-Policy",
        value: headers["referrer-policy"],
        description: "Controls how much referrer information is included with requests.",
        category: "security",
        severity: "good",
      });
    } else {
      analysis.push({
        name: "Referrer-Policy",
        value: "Not present",
        description: "No referrer policy defined. This may leak sensitive information in the referrer header.",
        category: "security",
        severity: "info",
      });
    }

    if (headers["permissions-policy"] || headers["feature-policy"]) {
      analysis.push({
        name: "Permissions-Policy",
        value: headers["permissions-policy"] || headers["feature-policy"],
        description: "Controls which features and APIs can be used in the browser.",
        category: "security",
        severity: "good",
      });
    }

    // Cache Headers
    if (headers["cache-control"]) {
      analysis.push({
        name: "Cache-Control",
        value: headers["cache-control"],
        description: "Directives for caching mechanisms in requests/responses.",
        category: "cache",
        severity: headers["cache-control"].includes("no-store") ? "good" : "info",
      });
    }

    if (headers["expires"]) {
      analysis.push({
        name: "Expires",
        value: headers["expires"],
        description: "Date/time after which the response is considered stale.",
        category: "cache",
        severity: "info",
      });
    }

    if (headers["last-modified"]) {
      analysis.push({
        name: "Last-Modified",
        value: headers["last-modified"],
        description: "Date/time at which the origin server believes the resource was last modified.",
        category: "cache",
        severity: "info",
      });
    }

    if (headers["etag"]) {
      analysis.push({
        name: "ETag",
        value: headers["etag"],
        description: "Identifier for a specific version of a resource.",
        category: "cache",
        severity: "good",
      });
    }

    // Content Headers
    if (headers["content-type"]) {
      analysis.push({
        name: "Content-Type",
        value: headers["content-type"],
        description: "Media type of the resource.",
        category: "content",
        severity: "info",
      });
    }

    if (headers["content-encoding"]) {
      analysis.push({
        name: "Content-Encoding",
        value: headers["content-encoding"],
        description: "Compression method used on the response.",
        category: "content",
        severity: "good",
      });
    }

    if (headers["content-length"]) {
      analysis.push({
        name: "Content-Length",
        value: headers["content-length"],
        description: "Size of the response body in bytes.",
        category: "content",
        severity: "info",
      });
    }

    // Other important headers
    if (headers["server"]) {
      const isDetailed = headers["server"].toLowerCase().includes("version");
      analysis.push({
        name: "Server",
        value: headers["server"],
        description: "Information about the software used by the origin server.",
        category: "other",
        severity: isDetailed ? "danger" : "info",
      });
    }

    if (headers["x-powered-by"]) {
      analysis.push({
        name: "X-Powered-By",
        value: headers["x-powered-by"],
        description: "Reveals technology stack information that could aid attackers.",
        category: "other",
        severity: "danger",
      });
    }

    // Include all other headers that weren't analyzed
    Object.entries(headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (!analysis.find(a => a.name.toLowerCase() === lowerKey)) {
        analysis.push({
          name: key,
          value: value,
          description: "Additional header",
          category: "other",
          severity: "info",
        });
      }
    });

    return analysis;
  };

  // Filter headers by category
  const filteredHeaders = selectedCategory === "all" 
    ? headersAnalysis 
    : headersAnalysis.filter(header => header.category === selectedCategory);

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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">HTTP Header Checker</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Analyze HTTP response headers to identify security issues, optimization opportunities, and more
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-3xl mx-auto mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Check Website Headers</CardTitle>
                  <CardDescription>
                    Enter a website URL to analyze its HTTP response headers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-2">
                      <div className="sm:col-span-3">
                        <Input
                          type="text"
                          placeholder="Enter URL (e.g., example.com)"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              checkHeaders();
                            }
                          }}
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Button
                          onClick={checkHeaders}
                          disabled={isAnalyzing}
                          className="w-full"
                        >
                          {isAnalyzing ? "Analyzing..." : "Check Headers"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>Enter a domain name with or without the protocol (https:// will be added if missing)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {isAnalyzing && (
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-4xl mx-auto"
              >
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Response Summary</CardTitle>
                    <CardDescription>
                      Status code {result.status} - {result.statusText}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-medium mb-1">Final URL</h3>
                        <p className="text-sm text-muted-foreground break-all">
                          {result.url}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-1">Headers Found</h3>
                        <p className="text-sm text-muted-foreground">
                          {Object.keys(result.headers || {}).length} response headers detected
                        </p>
                      </div>
                    </div>

                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>About Status Code {result.status || 'Unknown'}</AlertTitle>
                      <AlertDescription>
                        {result.status && result.status >= 200 && result.status < 300 && (
                          <>
                            This is a successful response. Status codes in the 2xx range indicate that the request was successfully received, understood, and accepted.
                          </>
                        )}
                        {result.status && result.status >= 300 && result.status < 400 && (
                          <>
                            This is a redirection response. Status codes in the 3xx range indicate that further action needs to be taken by the client to complete the request.
                          </>
                        )}
                        {result.status && result.status >= 400 && result.status < 500 && (
                          <>
                            This is a client error response. Status codes in the 4xx range indicate that the request contains bad syntax or cannot be fulfilled.
                          </>
                        )}
                        {result.status && result.status >= 500 && (
                          <>
                            This is a server error response. Status codes in the 5xx range indicate that the server failed to fulfill a valid request.
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Headers Analysis</CardTitle>
                    <CardDescription>
                      Security, caching, and other important HTTP headers
                    </CardDescription>
                    <div className="pt-2">
                      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                        <TabsList className="grid grid-cols-5">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="security">Security</TabsTrigger>
                          <TabsTrigger value="cache">Cache</TabsTrigger>
                          <TabsTrigger value="content">Content</TabsTrigger>
                          <TabsTrigger value="other">Other</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredHeaders.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        No headers found in this category.
                      </div>
                    ) : (
                      <Accordion type="multiple" className="w-full">
                        {filteredHeaders.map((header, index) => (
                          <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium">{header.name}</span>
                                {header.severity && (
                                  <Badge
                                    className="ml-2"
                                    variant={
                                      header.severity === "good"
                                        ? "default"
                                        : header.severity === "warning"
                                        ? "outline"
                                        : header.severity === "danger"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {header.severity === "good" && "Good"}
                                    {header.severity === "warning" && "Warning"}
                                    {header.severity === "danger" && "Danger"}
                                    {header.severity === "info" && "Info"}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-3 text-sm font-medium">Value:</div>
                                  <div className="col-span-9 text-sm break-all">
                                    <code className="bg-muted px-1 py-0.5 rounded">{header.value}</code>
                                  </div>
                                </div>
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-3 text-sm font-medium">Description:</div>
                                  <div className="col-span-9 text-sm">{header.description}</div>
                                </div>
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-3 text-sm font-medium">Category:</div>
                                  <div className="col-span-9 text-sm">
                                    <Badge variant="secondary">
                                      {header.category === "security" && (
                                        <Shield className="h-3 w-3 mr-1" />
                                      )}
                                      {header.category === "cache" && (
                                        <Clock className="h-3 w-3 mr-1" />
                                      )}
                                      {header.category === "content" && (
                                        <FileText className="h-3 w-3 mr-1" />
                                      )}
                                      {header.category.charAt(0).toUpperCase() + header.category.slice(1)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div>
                <h2 className="text-2xl font-bold mb-4">What are HTTP Headers?</h2>
                <p className="text-muted-foreground mb-4">
                  HTTP headers are key-value pairs transmitted with HTTP requests and responses that provide essential information about the request/response, the client, and the server.
                </p>
                
                <h3 className="text-lg font-bold mt-4">Common Security Headers</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <strong>Content-Security-Policy</strong>: Controls resources the browser is allowed to load
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <strong>Strict-Transport-Security</strong>: Forces browsers to use HTTPS
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <strong>X-Frame-Options</strong>: Prevents clickjacking attacks
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <strong>X-Content-Type-Options</strong>: Prevents MIME type sniffing
                  </li>
                </ul>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4">Why Check Headers?</h2>
                <p className="text-muted-foreground mb-4">
                  Analyzing HTTP headers can help you:
                </p>
                
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Identify security vulnerabilities
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Optimize caching configurations
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Troubleshoot content delivery issues
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Verify server configurations
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Ensure compliance with security best practices
                  </li>
                </ul>
                
                <div className="mt-6">
                  <a 
                    href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    Learn more about HTTP headers
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}