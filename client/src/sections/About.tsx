import { Container } from "@/components/ui/container";
import SectionHeading from "@/components/SectionHeading";
import { personalInfo, socialLinks } from "@/lib/data";
import { motion } from "framer-motion";

export function About() {
  return (
    <section id="about" className="py-20 px-6 bg-gray-50">
      <Container maxWidth="5xl">
        <SectionHeading subtitle="About Me" title="My Background" />
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=798&q=80" 
                alt="John working at his desk"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">Who I Am</h3>
            <p className="mb-4 text-muted-foreground">
              I'm a passionate Full Stack Developer with 5+ years of experience creating engaging digital experiences. With a background in Computer Science and a love for clean, efficient code, I've helped numerous clients bring their visions to life.
            </p>
            <p className="mb-6 text-muted-foreground">
              When I'm not coding, you can find me hiking in the mountains, experimenting with new recipes, or contributing to open-source projects. I believe in continuous learning and staying on top of the latest technologies.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="font-medium">Name:</p>
                <p className="text-muted-foreground">{personalInfo.name}</p>
              </div>
              <div>
                <p className="font-medium">Email:</p>
                <p className="text-muted-foreground">{personalInfo.email}</p>
              </div>
              <div>
                <p className="font-medium">From:</p>
                <p className="text-muted-foreground">{personalInfo.location}</p>
              </div>
              <div>
                <p className="font-medium">Experience:</p>
                <p className="text-muted-foreground">{personalInfo.experience}</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              {socialLinks.map((link) => (
                <a 
                  key={link.name}
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                  aria-label={link.name}
                >
                  <i className={`${link.icon} text-lg`}></i>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
