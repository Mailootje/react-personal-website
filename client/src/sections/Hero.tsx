import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { personalInfo } from "@/lib/data";
import { scrollToElement } from "@/lib/utils";
import { motion } from "framer-motion";

export function Hero() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const elementId = href.replace("#", "");
    scrollToElement(elementId);
  };

  return (
    <section id="hero" className="min-h-screen flex items-center pt-16 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white">
      <Container maxWidth="6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="order-2 md:order-1"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="text-blue-600 font-medium mb-2">Hi there, I'm</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{personalInfo.name}</h1>
            <h2 className="text-xl md:text-2xl text-slate-700 mb-6">
              <span className="font-medium text-blue-500">Web Developer</span> passionate about creating clean, user-friendly websites and applications
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg">
              Based in {personalInfo.location}, I build responsive websites and web applications with modern technologies. My focus is on creating intuitive user experiences with clean, efficient code.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                asChild
                size="lg"
                className="font-medium bg-blue-600 hover:bg-blue-700"
              >
                <a 
                  href="#contact"
                  onClick={(e) => handleClick(e, "#contact")}
                >
                  Contact Me
                </a>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline" 
                className="text-blue-600 border-blue-600 hover:bg-blue-50 font-medium"
              >
                <a 
                  href="#projects"
                  onClick={(e) => handleClick(e, "#projects")}
                >
                  View Projects
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
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-blue-100 to-blue-50 p-1">
              <img 
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1400&q=80" 
                alt="Mail Obedo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
