import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Search, Copy, Check, RefreshCw, MapPin, Globe, Server, Info } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface IpLookupResult {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  continent?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  postalCode?: string;
  isp?: string;
  org?: string;
  asn?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  error?: string;
}

export default function IpLocationLookup() {
  const { toast } = useToast();
  const [ipAddress, setIpAddress] = useState("");
  const [activeTab, setActiveTab] = useState("lookup");
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<IpLookupResult | null>(null);
  const [myIpResult, setMyIpResult] = useState<IpLookupResult | null>(null);
  const [showMyIpDetails, setShowMyIpDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get user's IP on component mount
  useEffect(() => {
    fetchMyIp();
  }, []);

  // Validate IP address format
  const isValidIpAddress = (ip: string): boolean => {
    // IPv4 regex pattern
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    // IPv6 regex pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$/;
    
    if (ipv4Pattern.test(ip)) {
      // Check IPv4 address parts are in range 0-255
      const parts = ip.split('.').map(part => parseInt(part, 10));
      return parts.every(part => part >= 0 && part <= 255);
    }
    
    return ipv6Pattern.test(ip);
  };

  // Check if value is a domain name
  const isDomainName = (value: string): boolean => {
    // Simple domain regex pattern
    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(value);
  };

  // Fetch user's current IP
  const fetchMyIp = async () => {
    try {
      setIsLoading(true);
      
      // Make a request to ipify API to get the user's IP
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      
      if (data.ip) {
        // Now get location info for this IP
        const ipData = await lookupIpInfo(data.ip);
        setMyIpResult(ipData);
      }
    } catch (error) {
      console.error("Error fetching your IP:", error);
      setMyIpResult({
        ip: "Unable to determine",
        error: "Failed to retrieve your IP address information."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Perform IP lookup
  const lookupIp = async () => {
    if (!ipAddress.trim()) {
      toast({
        title: "No IP Address",
        description: "Please enter an IP address or domain to lookup",
        variant: "destructive",
      });
      return;
    }
    
    const input = ipAddress.trim();
    const isIp = isValidIpAddress(input);
    const isDomain = isDomainName(input);
    
    if (!isIp && !isDomain) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid IP address or domain name",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await lookupIpInfo(input);
      setLookupResult(result);
      setActiveTab("results");
    } catch (error) {
      console.error("Error looking up IP:", error);
      setLookupResult({
        ip: input,
        error: "Failed to retrieve information for this IP or domain."
      });
      setActiveTab("results");
    } finally {
      setIsLoading(false);
    }
  };

  // Get detailed information for an IP address
  const lookupIpInfo = async (ip: string): Promise<IpLookupResult> => {
    try {
      // For a real app, you would use your own API endpoint that securely calls an IP geolocation service
      // Here's an example using the ipinfo.io service (would require an API token in production)
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to retrieve IP information");
      }
      
      // Parse location if available
      let latitude = undefined;
      let longitude = undefined;
      
      if (data.loc) {
        const [lat, lon] = data.loc.split(',');
        latitude = parseFloat(lat);
        longitude = parseFloat(lon);
      }
      
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
        countryCode: data.country,
        latitude,
        longitude,
        timezone: data.timezone,
        postalCode: data.postal,
        isp: data.org,
        asn: data.asn,
      };
    } catch (error) {
      console.error("Error in IP lookup:", error);
      return {
        ip,
        error: "Failed to retrieve information for this IP."
      };
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
      
      // Reset copied status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Open location in Google Maps
  const openInGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  // Format a result object into a table-friendly format
  const formatResultForTable = (result: IpLookupResult) => {
    if (!result) return [];
    
    return [
      { key: "IP Address", value: result.ip },
      ...(result.city ? [{ key: "City", value: result.city }] : []),
      ...(result.region ? [{ key: "Region", value: result.region }] : []),
      ...(result.country ? [{ key: "Country", value: result.country }] : []),
      ...(result.latitude && result.longitude ? [{ key: "Coordinates", value: `${result.latitude}, ${result.longitude}` }] : []),
      ...(result.timezone ? [{ key: "Timezone", value: result.timezone }] : []),
      ...(result.postalCode ? [{ key: "Postal Code", value: result.postalCode }] : []),
      ...(result.isp ? [{ key: "ISP / Organization", value: result.isp }] : []),
      ...(result.asn ? [{ key: "ASN", value: result.asn }] : []),
    ];
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">IP Location Lookup</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find geographic information about any IP address or domain
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="max-w-3xl mx-auto mb-8">
                <Tabs 
                  defaultValue="lookup" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  {/* Tabs List */}
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="lookup">
                      IP Lookup
                    </TabsTrigger>
                    <TabsTrigger value="results" disabled={!lookupResult}>
                      Results
                    </TabsTrigger>
                    <TabsTrigger value="myip">
                      My IP
                    </TabsTrigger>
                  </TabsList>

                  {/* IP Lookup Tab */}
                  <TabsContent value="lookup" className="space-y-4">
                    <CardHeader>
                      <CardTitle>Lookup IP Address or Domain</CardTitle>
                      <CardDescription>
                        Enter an IP address or domain name to get location information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={ipAddress}
                            onChange={(e) => setIpAddress(e.target.value)}
                            placeholder="Enter IP address or domain (e.g., 8.8.8.8 or example.com)"
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') lookupIp();
                            }}
                          />
                          <Button 
                            onClick={lookupIp}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4 mr-2" />
                            )}
                            Lookup
                          </Button>
                        </div>
                        
                        <div className="flex justify-center">
                          <Button
                            variant="link"
                            onClick={() => {
                              if (myIpResult && myIpResult.ip && !myIpResult.error) {
                                setIpAddress(myIpResult.ip);
                              }
                            }}
                            className="text-sm"
                          >
                            Use My IP Address
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-md p-4 bg-muted/50">
                        <h3 className="text-sm font-medium mb-3">What You Can Lookup:</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                            <span>Geographic location (city, region, country)</span>
                          </li>
                          <li className="flex items-start">
                            <Globe className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                            <span>Latitude and longitude coordinates</span>
                          </li>
                          <li className="flex items-start">
                            <Server className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                            <span>Internet Service Provider (ISP) information</span>
                          </li>
                          <li className="flex items-start">
                            <Info className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                            <span>Timezone, ASN, and more</span>
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </TabsContent>

                  {/* Results Tab */}
                  <TabsContent value="results" className="space-y-4">
                    <CardHeader>
                      <CardTitle>Lookup Results</CardTitle>
                      <CardDescription>
                        Location information for {lookupResult?.ip}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {lookupResult?.error ? (
                        <Alert variant="destructive">
                          <AlertTitle>Lookup Failed</AlertTitle>
                          <AlertDescription>
                            {lookupResult.error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Information</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="w-[100px]">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formatResultForTable(lookupResult!).map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{item.key}</TableCell>
                                  <TableCell>{item.value}</TableCell>
                                  <TableCell>
                                    {item.key === "Coordinates" && lookupResult?.latitude && lookupResult?.longitude ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openInGoogleMaps(lookupResult.latitude!, lookupResult.longitude!)}
                                        title="Open in Google Maps"
                                      >
                                        <MapPin className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(item.value)}
                                        title="Copy to clipboard"
                                      >
                                        {copied ? (
                                          <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          {lookupResult?.latitude && lookupResult?.longitude && (
                            <div className="pt-2">
                              <Button
                                variant="outline"
                                onClick={() => openInGoogleMaps(lookupResult.latitude!, lookupResult.longitude!)}
                                className="w-full"
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                View Location on Google Maps
                              </Button>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("lookup")}
                        >
                          New Lookup
                        </Button>
                      </div>
                    </CardContent>
                  </TabsContent>

                  {/* My IP Tab */}
                  <TabsContent value="myip" className="space-y-4">
                    <CardHeader>
                      <CardTitle>Your IP Information</CardTitle>
                      <CardDescription>
                        Details about your current IP address
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : myIpResult?.error ? (
                        <Alert variant="destructive">
                          <AlertTitle>Lookup Failed</AlertTitle>
                          <AlertDescription>
                            {myIpResult.error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="text-center py-4">
                            <h3 className="text-xl font-bold mb-2">Your IP Address</h3>
                            <div className="flex items-center justify-center space-x-2">
                              <code className="bg-muted px-4 py-2 rounded-md text-lg font-mono">
                                {myIpResult?.ip}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(myIpResult?.ip || "")}
                                title="Copy to clipboard"
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <Button
                              variant="link"
                              onClick={() => setShowMyIpDetails(!showMyIpDetails)}
                              className="mt-2"
                            >
                              {showMyIpDetails ? "Hide Details" : "Show Details"}
                            </Button>
                          </div>
                          
                          {showMyIpDetails && (
                            <>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Information</TableHead>
                                    <TableHead>Value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {formatResultForTable(myIpResult!).map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{item.key}</TableCell>
                                      <TableCell>{item.value}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>

                              {myIpResult?.latitude && myIpResult?.longitude && (
                                <div className="pt-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => openInGoogleMaps(myIpResult.latitude!, myIpResult.longitude!)}
                                    className="w-full"
                                  >
                                    <MapPin className="h-4 w-4 mr-2" />
                                    View Your Location on Google Maps
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              onClick={fetchMyIp}
                              className="w-full"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh IP Information
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>

            <motion.div
              className="max-w-3xl mx-auto mt-12 bg-muted/50 p-6 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-xl font-bold mb-4">About IP Geolocation</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  IP Geolocation is the process of determining the geographic location of an internet-connected device based on its IP address. While not 100% accurate, it can provide a reasonable approximation of a user's physical location.
                </p>
                
                <Alert>
                  <AlertTitle>Privacy Notice</AlertTitle>
                  <AlertDescription>
                    IP geolocation data is approximate and may not be perfectly accurate. The level of accuracy varies by region and internet service provider. This tool is intended for informational purposes only.
                  </AlertDescription>
                </Alert>
                
                <h3 className="text-lg font-bold mt-4">Common Uses</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Content localization and language selection
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Analyzing website traffic geographic distribution
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Security and fraud prevention systems
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Region-specific content delivery and regulations
                  </li>
                </ul>
              </div>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}