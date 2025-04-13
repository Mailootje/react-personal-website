import { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Gamepad2 } from "lucide-react";

interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
}

export default function Games() {
  const [games] = useState<GameInfo[]>([
    {
      id: "snake",
      title: "Snake Game",
      description: "Classic snake game where you eat food and grow longer without hitting the walls or yourself.",
      icon: "🐍",
      tags: ["Game", "Arcade", "Classic"],
    },
    {
      id: "tetris",
      title: "Tetris",
      description: "The classic block-stacking game. Arrange the falling tetrominos to create complete lines.",
      icon: "🧩",
      tags: ["Game", "Puzzle", "Classic"],
    },
    {
      id: "pacman",
      title: "Pac-Man",
      description: "Our custom implementation of the classic arcade game. Navigate the maze, eat all the dots, and avoid the ghosts!",
      icon: "👾",
      tags: ["Game", "Arcade", "Classic"],
    },
    // You can add more games here in the future
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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Games</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Fun and interactive browser games to test your skills and entertain
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = `/games/${game.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="text-4xl mb-4">{game.icon}</div>
                        <div className="flex gap-2">
                          {game.tags.map((tag) => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary"
                            >
                              <Gamepad2 className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <CardTitle>{game.title}</CardTitle>
                      <CardDescription>{game.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Placeholder for game preview */}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">
                        Play Game
                      </Button>
                    </CardFooter>
                  </Card>
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