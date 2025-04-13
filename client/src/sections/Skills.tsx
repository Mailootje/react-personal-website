import { Container } from "@/components/ui/container";
import SectionHeading from "@/components/SectionHeading";
import { skills, professionalSkills } from "@/lib/data";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/utils";

export function Skills() {
  return (
    <section id="skills" className="py-20 px-6 bg-black/70 backdrop-blur-sm">
      <Container maxWidth="5xl">
        <SectionHeading subtitle="My Skills" title="Technical Expertise" isDark={true} />
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6 text-white">Technical Skills</h3>
            
            <motion.div
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {skills.map((skill, index) => (
                <motion.div 
                  key={skill.name} 
                  className="mb-6"
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
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-200">{skill.name}</span>
                    <span className="text-gray-300">{skill.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div 
                      className="bg-primary h-full rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.percentage}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + (index * 0.1) }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-6 text-white">Professional Skills</h3>
            
            <motion.div 
              className="grid grid-cols-2 gap-6"
              variants={staggerContainer(0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {professionalSkills.map((skill) => (
                <motion.div 
                  key={skill.name}
                  className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800 text-center"
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
                  <div className={`w-16 h-16 bg-${skill.color}/10 text-${skill.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <i className={`${skill.icon} text-2xl`}></i>
                  </div>
                  <h4 className="font-bold mb-2 text-gray-200">{skill.name}</h4>
                  <p className="text-sm text-gray-400">{skill.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
