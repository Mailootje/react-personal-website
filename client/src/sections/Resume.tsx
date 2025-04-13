import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/SectionHeading";
import { experiences, educations, certifications } from "@/lib/data";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/utils";

export function Resume() {
  return (
    <section id="resume" className="py-20 px-6 bg-black/70">
      <Container maxWidth="5xl">
        <SectionHeading subtitle="My Resume" title="Experience & Education" isDark={true} />
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                <i className="ri-briefcase-4-fill text-xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white">Work Experience</h3>
            </div>
            
            <motion.div
              variants={staggerContainer(0.2)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {experiences.map((experience, index) => (
                <motion.div 
                  key={experience.title + experience.company}
                  className="relative pl-8 pb-8 border-l-2 border-gray-700 last:border-0"
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
                  <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-primary"></div>
                  <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                    <div className="flex justify-between flex-wrap mb-2">
                      <h4 className="font-bold text-gray-100">{experience.title}</h4>
                      <span className="text-xs py-1 px-2 bg-primary/10 text-primary rounded-full">{experience.period}</span>
                    </div>
                    <h5 className="text-gray-300 mb-4">{experience.company}</h5>
                    <p className="text-sm text-gray-400">
                      {experience.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          
          <div>
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mr-4">
                <i className="ri-graduation-cap-fill text-xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-white">Education</h3>
            </div>
            
            <motion.div
              variants={staggerContainer(0.2)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {educations.map((education) => (
                <motion.div 
                  key={education.degree + education.institution}
                  className="relative pl-8 pb-8 border-l-2 border-gray-700"
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
                  <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
                  <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                    <div className="flex justify-between flex-wrap mb-2">
                      <h4 className="font-bold text-gray-100">{education.degree}</h4>
                      <span className="text-xs py-1 px-2 bg-green-500/10 text-green-500 rounded-full">{education.period}</span>
                    </div>
                    <h5 className="text-gray-300 mb-4">{education.institution}</h5>
                    <p className="text-sm text-gray-400">
                      {education.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 mr-4">
                  <i className="ri-award-fill text-xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-white">Certifications</h3>
              </div>
              
              <motion.div 
                className="relative pl-8 pb-8 border-l-2 border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-purple-500"></div>
                <div className="bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-800">
                  <ul className="space-y-3">
                    {certifications.map((cert) => (
                      <li key={cert.name} className="flex items-center">
                        <i className="ri-check-line text-purple-500 mr-2"></i>
                        <span className="text-sm text-gray-300">{cert.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
            
            <div className="text-center">
              <Button className="font-medium inline-flex items-center">
                <i className="ri-download-2-line mr-2"></i>
                Download Full Resume
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
