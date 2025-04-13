import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { ArrowLeft, Search, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="py-20">
          <Container maxWidth="lg">
            <motion.div 
              className="flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-9xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                404
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Page Not Found
              </h1>
              
              <p className="text-muted-foreground max-w-md mb-8">
                Sorry, the page you are looking for might have been moved or doesn't exist.
              </p>
              
              <Card className="w-full max-w-md shadow-lg border-0 bg-background/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      You might want to check these sections instead:
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-start gap-2 h-auto py-4"
                        onClick={() => window.location.href = "/"}
                      >
                        <Home className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">Home</div>
                          <div className="text-xs text-muted-foreground">Portfolio overview</div>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center justify-start gap-2 h-auto py-4"
                        onClick={() => window.location.href = "/photography"}
                      >
                        <Search className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">Photography</div>
                          <div className="text-xs text-muted-foreground">Photo gallery</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = "/"}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
