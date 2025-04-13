import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";
import { projects } from "@/lib/data";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/utils";

export function Projects() {
  return (
    <section id="projects" className="py-20 px-6 bg-black/70 backdrop-blur-sm">
      <Container maxWidth="6xl">
        <SectionHeading subtitle="My Work" title="Recent Projects" isDark={true} />
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {projects.map((project) => (
            <motion.div 
              key={project.title}
              className="bg-gray-900 rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] border border-gray-800"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: "easeOut"
                  }
                }
              }}
            >
              <div className="h-60 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg text-white">{project.title}</h3>
                  <span className={`text-xs py-1 px-2 bg-${project.typeColor}/20 text-${project.typeColor} rounded-full`}>
                    {project.type}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="text-xs py-1 px-2 bg-gray-800 text-gray-300 rounded-full">{tech}</span>
                  ))}
                </div>
                <div className="flex justify-between">
                  <a href={project.detailsLink} className="text-sm font-medium text-green-400 hover:text-green-300 hover:underline flex items-center">
                    <span>View Details</span>
                    <i className="ri-arrow-right-line ml-1"></i>
                  </a>
                  <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <i className="ri-github-fill text-lg"></i>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="text-center mt-12">
          <Button 
            variant="outline"
            size="lg"
            className="inline-flex items-center border-green-400 text-green-400 hover:bg-green-400/10 font-medium"
            asChild
          >
            <a href="#">
              View All Projects
              <i className="ri-arrow-right-line ml-2"></i>
            </a>
          </Button>
        </div>
      </Container>
    </section>
  );
}
