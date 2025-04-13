import { Container } from "@/components/ui/container";
import SectionHeading from "@/components/SectionHeading";
import { VideoBackground } from "@/components/VideoBackground";
import { personalInfo, socialLinks } from "@/lib/data";
import { motion } from "framer-motion";

export function About() {
  return (
    <VideoBackground opacity={0.15} className="bg-black">
      <section id="about" className="py-20 px-6">
        <Container maxWidth="5xl">
          <SectionHeading subtitle="About Me" title="My Background" isDark={true} />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://mailobedo.nl/assets/imgs/profile.webp"
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
              <h3 className="text-2xl font-bold mb-4 text-white">Who I Am</h3>
              <p className="mb-4 text-gray-300">
                I'm a passionate Full Stack Developer with 5+ years of experience
                creating engaging digital experiences. With a background in
                Computer Science and a love for clean, efficient code, I've helped
                numerous clients bring their visions to life.
              </p>
              <p className="mb-6 text-gray-300">
                When I'm not coding, you can find me hiking in the mountains,
                experimenting with new recipes, or contributing to open-source
                projects. I believe in continuous learning and staying on top of
                the latest technologies.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <p className="font-medium text-white">Name:</p>
                  <p className="text-gray-300">{personalInfo.name}</p>
                </div>
                <div>
                  <p className="font-medium text-white">Email:</p>
                  <p className="text-gray-300">{personalInfo.email}</p>
                </div>
                <div>
                  <p className="font-medium text-white">From:</p>
                  <p className="text-gray-300">{personalInfo.location}</p>
                </div>
                <div>
                  <p className="font-medium text-white">Experience:</p>
                  <p className="text-gray-300">
                    {personalInfo.experience}
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:bg-primary hover:text-white transition-colors"
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
    </VideoBackground>
  );
}
