import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, FileText, Info, Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
}

export default function EuroTruckSimulator2() {
  const [downloadFiles] = useState<DownloadFile[]>([
    {
      id: "ets2-realistic-weather",
      name: "Realistic Weather Mod",
      description: "Enhances weather effects with more realistic rain, snow, and fog variations that dynamically change based on region and season.",
      fileSize: "24.7 MB",
      version: "v2.1.0",
      uploadDate: "2025-02-15",
      downloadCount: 1245,
      category: "Graphics",
      tags: ["Weather", "Graphics", "Immersion"],
      downloadUrl: "/downloads/files/ets2-realistic-weather"
    },
    {
      id: "ets2-real-european-companies",
      name: "Real European Companies Pack",
      description: "Adds 50+ real European company depots and cargo destinations across the map with authentic logos and delivery points.",
      fileSize: "156 MB",
      version: "v3.4.2",
      uploadDate: "2025-03-01",
      downloadCount: 876,
      category: "Maps",
      tags: ["Companies", "Europe", "Realism"],
      downloadUrl: "/downloads/files/ets2-real-european-companies"
    },
    {
      id: "ets2-custom-truck-sounds",
      name: "Custom Truck Engine Sounds",
      description: "High-quality recordings of real truck engines for all in-game trucks. Includes interior and exterior sound variations.",
      fileSize: "87.3 MB",
      version: "v1.8.5",
      uploadDate: "2025-02-28",
      downloadCount: 2190,
      category: "Sound",
      tags: ["Engine", "Audio", "Immersion"],
      downloadUrl: "/downloads/files/ets2-custom-truck-sounds"
    },
    {
      id: "ets2-advanced-traffic",
      name: "Advanced Traffic System",
      description: "Completely overhauls AI traffic behavior with more realistic driving patterns, density controls, and new vehicle models.",
      fileSize: "112 MB",
      version: "v4.0.1",
      uploadDate: "2025-03-10",
      downloadCount: 1578,
      category: "Gameplay",
      tags: ["Traffic", "AI", "Realism"],
      downloadUrl: "/downloads/files/ets2-advanced-traffic"
    },
    {
      id: "ets2-scandinavia-expansion",
      name: "Scandinavia Enhanced",
      description: "Enhances the Scandinavia DLC with additional landmarks, cities, and roads for a more detailed Nordic experience.",
      fileSize: "245 MB",
      version: "v2.7.0",
      uploadDate: "2025-01-20",
      downloadCount: 932,
      category: "Maps",
      tags: ["Scandinavia", "Geography", "Expansion"],
      downloadUrl: "/downloads/files/ets2-scandinavia-expansion"
    }
  ]);

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
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-8 flex flex-wrap h-auto p-1">
                  <TabsTrigger value="all">All Files</TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="all" className="mt-0">
                  <div className="grid grid-cols-1 gap-6">
                    {downloadFiles.map(file => (
                      <DownloadCard key={file.id} file={file} />
                    ))}
                  </div>
                </TabsContent>
                
                {categories.map(category => (
                  <TabsContent key={category} value={category} className="mt-0">
                    <div className="grid grid-cols-1 gap-6">
                      {downloadFiles
                        .filter(file => file.category === category)
                        .map(file => (
                          <DownloadCard key={file.id} file={file} />
                        ))
                      }
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
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
        <a href={file.downloadUrl}>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}