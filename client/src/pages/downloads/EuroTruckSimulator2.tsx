import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Download, FileText, Info, Clock, Tag, Loader2, AlertCircle, CheckCircle2, List, X } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DownloadFile {
  id: string;
  name: string;
  description: string;
  fileSize: string;
  version: string;
  uploadDate: string;
  downloadCount: number;
  category: string;
  tags: string[];
  downloadUrl: string;
  originalUrl?: string;
}

interface DownloadsResponse {
  versions: string[];
  currentVersion: string;
  files: DownloadFile[];
}

export default function EuroTruckSimulator2() {
  const [location, setLocation] = useLocation();
  const [downloadData, setDownloadData] = useState<DownloadsResponse | null>(null);
  const [downloadFiles, setDownloadFiles] = useState<DownloadFile[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoadOrder, setShowLoadOrder] = useState(false);
  
  // Get version from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const version = params.get('version');
    if (version) {
      setSelectedVersion(version);
    }
  }, []);
  
  // Fetch downloads based on selected version
  useEffect(() => {
    const fetchDownloads = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/downloads/ets2?version=${selectedVersion}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch downloads: ${response.status}`);
        }
        
        const data = await response.json();
        setDownloadData(data);
        setDownloadFiles(data.files || []);
        
        // Update URL with the selected version
        const params = new URLSearchParams(window.location.search);
        params.set('version', data.currentVersion);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
        
      } catch (err) {
        console.error('Error fetching downloads:', err);
        setError('Failed to load downloads. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load downloads from the server.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDownloads();
  }, [selectedVersion]);

  const categories = Array.from(new Set(downloadFiles.map(file => file.category)));
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="6xl">
            <div className="mb-8">
              <Link to="/downloads" 
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Downloads
              </Link>
            </div>
            
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                <div className="bg-primary/10 text-primary rounded-2xl w-20 h-20 flex items-center justify-center text-4xl flex-shrink-0">
                  🚚
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">Euro Truck Simulator 2 Downloads</h1>
                  <p className="text-muted-foreground max-w-3xl">
                    A collection of high-quality mods and enhancements for Euro Truck Simulator 2.
                    All files are regularly tested and updated for compatibility.
                  </p>
                </div>
              </div>
              
              <Separator className="my-8" />
              
              {/* Version Selector */}
              {downloadData?.versions && downloadData.versions.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold mr-3">Game Version:</h3>
                      <Select
                        value={selectedVersion}
                        onValueChange={(value) => setSelectedVersion(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {downloadData.versions.map((version) => (
                            <SelectItem key={version} value={version}>
                              <div className="flex items-center">
                                {version}
                                {version === selectedVersion && (
                                  <CheckCircle2 className="ml-2 h-4 w-4 text-primary" />
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Showing {downloadFiles.length} mods compatible with Euro Truck Simulator 2 {selectedVersion}
                    </p>
                  </div>
                </div>
              )}
              
              {isLoading ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="w-full">
                        <CardHeader>
                          <Skeleton className="h-6 w-1/3 mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {[1, 2, 3, 4].map(j => (
                              <Skeleton key={j} className="h-4 w-full" />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3].map(j => (
                              <Skeleton key={j} className="h-6 w-16" />
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-10 w-28" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Failed to Load Downloads</h3>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              ) : downloadFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Downloads Available</h3>
                  <p className="text-muted-foreground">No mods or files are currently available for download.</p>
                </div>
              ) : (
                <Tabs defaultValue="all" className="w-full">
                  <div className="flex flex-wrap justify-between items-center mb-8">
                    <TabsList className="flex flex-wrap h-auto p-1">
                      <TabsTrigger value="all">All Files</TabsTrigger>
                      {categories.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                      ))}
                    </TabsList>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="lg:hidden mt-4 sm:mt-0" 
                      onClick={() => setShowLoadOrder(!showLoadOrder)}
                    >
                      {showLoadOrder ? (
                        <> <X className="h-4 w-4 mr-2" /> Hide Load Order </>
                      ) : (
                        <> <List className="h-4 w-4 mr-2" /> Show Load Order </>
                      )}
                    </Button>
                  </div>
                  
                  <TabsContent value="all" className="mt-0">
                    <div className="grid grid-cols-1 gap-6">
                      <div className={`${!showLoadOrder ? 'hidden lg:block' : ''}`}>
                        <Card className="shadow-sm mb-6">
                          <CardHeader>
                            <CardTitle className="text-xl">Recommended Load Order</CardTitle>
                            <CardDescription>For optimal compatibility with ProMods and other map mods</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="rounded-md bg-muted p-5 font-mono text-base">
                              <p className="font-semibold mb-3 text-lg">↑ Top of mod manager</p>
                              <ul className="space-y-1.5 text-muted-foreground">
                                <li>• ProMods Background Map (Pick one):</li>
                                <li className="ml-4">- ProMods High Quality Background Map 1.9</li>
                                <li className="ml-4">- ProMods High Quality Afroeurasia Background Map 2.5</li>
                                <li>• ProMods New Map Icons ETS2</li>
                                <li>• (Other mods)</li>
                                <li>• ProMods Ferries Add-on</li>
                                <li>• ProMods Cabin Accessories Pack 1.53</li>
                                <li>• ProMods Trailer & Company Pack 1.53 Trailers Def Replacement</li>
                                <li>• ProMods Trailer & Company Pack 1.53 Trailers Def Main</li>
                                <li>• ProMods Trailer & Company Pack 1.53 Trailers</li>
                                <li>• ProMods Trailer & Company Pack 1.53 Companies Def</li>
                                <li>• ProMods Trailer & Company Pack 1.53 Companies</li>
                                <li>• ProMods Middle-East Add-On 2.73 Def & Map</li>
                                <li>• ProMods Middle-East Add-On 2.73 Assets</li>
                                <li>• ProMods Europe 2.71 RusMap 2.51 Road Connection</li>
                                <li>• ProMods Europe 2.73a DLC Support Pack</li>
                                <li>• ProMods Europe 2.73a Def</li>
                                <li>• ProMods Europe 2.73a Map</li>
                                <li>• ProMods Europe 2.73a Models 1-3</li>
                                <li>• ProMods Europe 2.73a Media</li>
                                <li>• ProMods Europe 2.73a Assets</li>
                                <li>• RusMap 2.51 Def</li>
                                <li>• RusMap 2.51 Map</li>
                                <li>• RusMap 2.51 Models</li>
                                <li>• ProMods The Great Steppe 1.2.2 Def + Map</li>
                                <li>• ProMods The Great Steppe 1.2.2 Asset</li>
                              </ul>
                              <p className="font-semibold mt-3 text-lg">↓ Bottom of mod manager</p>
                            </div>
                            <div className="mt-5 text-base text-muted-foreground">
                              <p className="flex items-center mb-3">
                                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                                <span className="font-medium">This is not a guarantee for bug-free gameplay!</span>
                              </p>
                              <p>If you encounter problems, please check on a clean profile with only ProMods enabled. Some maps may not be compatible with the latest game version.</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <div className="grid grid-cols-1 gap-6">
                          {downloadFiles.map(file => (
                            <DownloadCard key={file.id} file={file} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {categories.map(category => (
                    <TabsContent key={category} value={category} className="mt-0">
                      <div className="grid grid-cols-1 gap-6">
                        <div className={`${!showLoadOrder ? 'hidden lg:block' : ''}`}>
                          <Card className="shadow-sm mb-6">
                            <CardHeader>
                              <CardTitle className="text-xl">Recommended Load Order</CardTitle>
                              <CardDescription>For optimal compatibility with ProMods and other map mods</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="rounded-md bg-muted p-5 font-mono text-base">
                                <p className="font-semibold mb-3 text-lg">↑ Top of mod manager</p>
                                <ul className="space-y-1.5 text-muted-foreground">
                                  <li>• ProMods Background Map (Pick one):</li>
                                  <li className="ml-4">- ProMods High Quality Background Map 1.9</li>
                                  <li className="ml-4">- ProMods High Quality Afroeurasia Background Map 2.5</li>
                                  <li>• ProMods New Map Icons ETS2</li>
                                  <li>• (Other mods)</li>
                                  <li>• ProMods Ferries Add-on</li>
                                  <li>• ProMods Cabin Accessories Pack 1.53</li>
                                  <li>• ProMods Trailer & Company Pack 1.53 Trailers Def Replacement</li>
                                  <li>• ProMods Trailer & Company Pack 1.53 Trailers Def Main</li>
                                  <li>• ProMods Trailer & Company Pack 1.53 Trailers</li>
                                  <li>• ProMods Trailer & Company Pack 1.53 Companies Def</li>
                                  <li>• ProMods Trailer & Company Pack 1.53 Companies</li>
                                  <li>• ProMods Middle-East Add-On 2.73 Def & Map</li>
                                  <li>• ProMods Middle-East Add-On 2.73 Assets</li>
                                  <li>• ProMods Europe 2.71 RusMap 2.51 Road Connection</li>
                                  <li>• ProMods Europe 2.73a DLC Support Pack</li>
                                  <li>• ProMods Europe 2.73a Def</li>
                                  <li>• ProMods Europe 2.73a Map</li>
                                  <li>• ProMods Europe 2.73a Models 1-3</li>
                                  <li>• ProMods Europe 2.73a Media</li>
                                  <li>• ProMods Europe 2.73a Assets</li>
                                  <li>• RusMap 2.51 Def</li>
                                  <li>• RusMap 2.51 Map</li>
                                  <li>• RusMap 2.51 Models</li>
                                  <li>• ProMods The Great Steppe 1.2.2 Def + Map</li>
                                  <li>• ProMods The Great Steppe 1.2.2 Asset</li>
                                </ul>
                                <p className="font-semibold mt-3 text-lg">↓ Bottom of mod manager</p>
                              </div>
                              <div className="mt-5 text-base text-muted-foreground">
                                <p className="flex items-center mb-3">
                                  <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                                  <span className="font-medium">This is not a guarantee for bug-free gameplay!</span>
                                </p>
                                <p>If you encounter problems, please check on a clean profile with only ProMods enabled. Some maps may not be compatible with the latest game version.</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <div>
                          <div className="grid grid-cols-1 gap-6">
                            {downloadFiles
                              .filter(file => file.category === category)
                              .map(file => (
                                <DownloadCard key={file.id} file={file} />
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DownloadCard({ file }: { file: DownloadFile }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl">{file.name}</CardTitle>
        <CardDescription>{file.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Size:</span>
            <span>{file.fileSize}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Version:</span>
            <span>{file.version}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Uploaded:</span>
            <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Downloads:</span>
            <span>{file.downloadCount.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {file.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <Badge>{file.category}</Badge>
        <a href={file.originalUrl || file.downloadUrl} target="_blank" rel="noopener noreferrer">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}