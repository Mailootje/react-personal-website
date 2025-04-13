import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tag } from "lucide-react";

interface AppInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
}

export default function Apps() {
  const [apps] = useState<AppInfo[]>([
    {
      id: "password-generator",
      title: "Password Generator",
      description: "Create secure and customizable passwords for your accounts",
      icon: "🔐",
      tags: ["Security", "Utility"]
    },
    // Add more apps as needed
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-grow">
        <section className="py-20 px-6">
          <Container maxWidth="6xl">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Web Apps</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A collection of useful web applications to help with everyday tasks
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {apps.map((app) => (
                <motion.div
                  key={app.id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link href={`/apps/${app.id}`}>
                    <a>
                      <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="text-4xl mb-4">{app.icon}</div>
                            <div className="flex gap-2">
                              {app.tags.map((tag) => (
                                <span 
                                  key={tag} 
                                  className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary"
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <CardTitle>{app.title}</CardTitle>
                          <CardDescription>{app.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Placeholder for app preview */}
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full">
                            Launch App
                          </Button>
                        </CardFooter>
                      </Card>
                    </a>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}