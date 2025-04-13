import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import SectionHeading from "@/components/SectionHeading";
import { Link } from "wouter";
import { staggerContainer, fadeInUpVariants } from "@/lib/utils";

interface GameInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
}

export default function Games() {
  const games: GameInfo[] = [
    {
      id: "snake",
      title: "Snake Game",
      description: "Classic snake game where you eat food and grow longer without hitting the walls or yourself.",
      icon: "ri-gamepad-fill",
      tags: ["Game", "Arcade", "Classic"],
    },
    // You can add more games here in the future
  ];

  return (
    <section className="py-16 bg-gray-50">
      <Container>
        <SectionHeading 
          subtitle="Fun & Entertainment" 
          title="Games"
          center
        />
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
          variants={staggerContainer()}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {games.map((game) => (
            <motion.div
              key={game.id}
              variants={fadeInUpVariants()}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <Link href={`/games/${game.id}`}>
                <a className="block p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-2xl">
                      <i className={game.icon}></i>
                    </div>
                    <div className="flex gap-2">
                      {game.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                  <p className="text-gray-600 text-sm">{game.description}</p>
                  
                  <div className="mt-4 flex justify-end">
                    <span className="text-primary font-medium text-sm flex items-center gap-1">
                      Play Now
                      <i className="ri-arrow-right-line"></i>
                    </span>
                  </div>
                </a>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}