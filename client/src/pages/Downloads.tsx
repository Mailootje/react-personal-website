import { useState } from "react";
import { Link } from "wouter";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { VideoBackground } from "@/components/VideoBackground";
import { Download } from "lucide-react";

interface DownloadItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
}

export default function Downloads() {
  const [downloadItems] = useState<DownloadItem[]>([
    {
      id: "euro-truck-simulator-2",
      title: "Euro Truck Simulator 2",
      description: "Custom mods, maps, and vehicle enhancements for Euro Truck Simulator 2",
      icon: "🚚",
      tags: ["Game Mods", "Vehicles"]
    }
    // More download categories can be added here
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <VideoBackground opacity={0.15} className="bg-black">
          <section className="py-20 px-6">
            <Container maxWidth="6xl">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Downloads</h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Free downloads, mods, and resources for various games and applications
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {downloadItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="group bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
                  whileHover={{ y: -5 }}
                >
                  <div className="p-6 flex-grow">
                    <div className="bg-primary/10 text-primary rounded-full w-12 h-12 flex items-center justify-center text-2xl mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-card-foreground">{item.title}</h3>
                    <p className="text-muted-foreground mb-4">{item.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="bg-secondary/30 text-secondary-foreground text-xs rounded-full px-2.5 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <Link href={`/downloads/${item.id}`}>
                      <Button 
                        className="w-full" 
                        variant="default"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        View Downloads
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Container>
        </section>
        </VideoBackground>
      </main>
      <Footer />
    </div>
  );
}