import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { personalInfo } from "@/lib/data";
import { scrollToElement } from "@/lib/utils";
import { motion } from "framer-motion";

export function Hero() {
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const elementId = href.replace("#", "");
    scrollToElement(elementId);
  };

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center pt-16 pb-20 px-6"
    >
      <Container maxWidth="6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            className="order-2 md:order-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-accent font-medium mb-2">Hello, I'm</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {personalInfo.name}
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground mb-6">
              <span className="text-green-500 font-medium">
                Full Stack Developer
              </span>{" "}
              with a passion for creating intuitive and engaging digital
              experiences
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg">
              I specialize in building modern web applications that combine
              elegant design with efficient functionality. Let's work together
              to bring your ideas to life.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="font-medium">
                <a href="#contact" onClick={(e) => handleClick(e, "#contact")}>
                  Get in Touch
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-primary border-primary hover:bg-primary/5 font-medium"
              >
                <a
                  href="#projects"
                  onClick={(e) => handleClick(e, "#projects")}
                >
                  View My Work
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="order-1 md:order-2 flex justify-center md:justify-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <img
                src="https://mailobedo.nl/assets/imgs/man.webp"
                alt="Mailo Bedo"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
