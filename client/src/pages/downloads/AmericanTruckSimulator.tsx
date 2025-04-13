import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Download, ArrowLeft, FileType2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { VideoBackground } from "@/components/VideoBackground";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface FileData {
  name: string;
  url: string;
  size: number;
}

export default function AmericanTruckSimulator() {
  const [, setLocation] = useLocation();
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        // Use a direct URL instead of proxy for American Truck Simulator files
        const response = await fetch("https://mailobedo.nl/files/American_Truck_Simulator/v1.54.x/mods/list.json");
        const data = await response.json();
        
        if (data && data.American_Truck_Simulator) {
          setFiles(data.American_Truck_Simulator);
        } else {
          // Fallback to static data if the API fails
          const fallbackData = [
            {
              name: "promods-ats-assets-v133.scs",
              url: "https://mailobedo.nl/files/American_Truck_Simulator/v1.54.x/mods/promods-ats-assets-v133.scs",
              size: 253369419
            },
            {
              name: "promods-ats-def-v140.scs",
              url: "https://mailobedo.nl/files/American_Truck_Simulator/v1.54.x/mods/promods-ats-def-v140.scs",
              size: 91172
            },
            {
              name: "promods-ats-map-v133.scs",
              url: "https://mailobedo.nl/files/American_Truck_Simulator/v1.54.x/mods/promods-ats-map-v133.scs",
              size: 67433466
            },
            {
              name: "promods-ats-models-v133.scs",
              url: "https://mailobedo.nl/files/American_Truck_Simulator/v1.54.x/mods/promods-ats-models-v133.scs",
              size: 331540900
            }
          ];
          setFiles(fallbackData);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Failed to load files. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // Format file size to human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Extract file extension from filename
  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <VideoBackground opacity={0.15} className="bg-black">
          <section className="py-16 px-6">
            <Container maxWidth="6xl">
              <div className="mb-8">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/downloads")}
                  className="mb-4 text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Downloads
                </Button>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">American Truck Simulator Mods</h1>
                  <p className="text-gray-300 max-w-3xl mb-8">
                    Download custom mods for American Truck Simulator to enhance your gameplay experience with new maps, vehicles, and assets.
                  </p>
                </motion.div>
              </div>

              <Card className="bg-black/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Installation Instructions</CardTitle>
                  <CardDescription className="text-gray-300">
                    Follow these steps to properly install the mods
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-300">
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Download all the required mod files</li>
                    <li>Place the files in your American Truck Simulator mods folder (typically located at <code className="bg-gray-800 px-1 rounded">Documents/American Truck Simulator/mod</code>)</li>
                    <li>Make sure to load them in the correct order as shown below, from bottom to top</li>
                    <li>Enable the mods in the game's mod manager before starting a new game or profile</li>
                  </ol>

                  <div className="mt-6 p-4 bg-gray-800/70 rounded-md">
                    <h3 className="text-lg font-medium mb-2 text-white">Recommended Load Order:</h3>
                    <ul className="pl-5 space-y-1 list-disc">
                      <li>1. promods-ats-def-v140.scs</li>
                      <li>2. promods-ats-map-v133.scs</li>
                      <li>3. promods-ats-assets-v133.scs</li>
                      <li>4. promods-ats-models-v133.scs</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4 text-white">Available Files</h2>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-300">Loading files...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-400">{error}</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <Table>
                      <TableHeader className="bg-gray-900">
                        <TableRow>
                          <TableHead className="text-white">File Name</TableHead>
                          <TableHead className="text-white">Type</TableHead>
                          <TableHead className="text-white text-right">Size</TableHead>
                          <TableHead className="text-white text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {files.map((file, index) => (
                          <TableRow key={index} className="border-gray-800 hover:bg-gray-800/60">
                            <TableCell className="font-medium text-gray-300">{file.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-gray-300 border-gray-700">
                                <FileType2 className="h-3 w-3 mr-1" />
                                {getFileExtension(file.name).toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-gray-300">{formatFileSize(file.size)}</TableCell>
                            <TableCell className="text-right">
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex"
                              >
                                <Button size="sm" variant="outline" className="text-primary hover:text-primary-foreground hover:bg-primary">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              <div className="mt-12 bg-black/50 p-6 rounded-lg border border-gray-800 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Additional Information</h2>
                <p className="text-gray-300 mb-4">
                  This collection includes ProMods for American Truck Simulator, which expands the game map with new areas and enhances existing ones with improved detail and realism.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-800/60 rounded-md">
                    <h3 className="font-semibold text-white mb-2">Compatibility</h3>
                    <p className="text-gray-300 text-sm">Works with American Truck Simulator v1.54.x. May not be compatible with older or newer game versions.</p>
                  </div>
                  <div className="p-4 bg-gray-800/60 rounded-md">
                    <h3 className="font-semibold text-white mb-2">DLC Requirements</h3>
                    <p className="text-gray-300 text-sm">Some mods may require official DLCs to function properly. Check the ProMods documentation for specific requirements.</p>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        </VideoBackground>
      </main>
      <Footer />
    </div>
  );
}