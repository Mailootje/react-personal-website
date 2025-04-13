import { Container } from "@/components/ui/container";
import SectionHeading from "@/components/SectionHeading";
import { personalInfo, socialLinks } from "@/lib/data";
import { motion } from "framer-motion";

export function About() {
  return (
    <section id="about" className="section pt-0">
      <Container maxWidth="5xl">
        <div className="text-center">
          <div className="about">
            <div className="about-img-holder">
              <img 
                src="/assets/imgs/man.webp" 
                alt="Mailo Bedo" 
                className="about-img"
              />
            </div>
            <div className="about-caption">
              <h2 className="section-title mb-3">About Me</h2>
              <p>
                Hello everyone, I'm Mailo, a passionate software developer. I specialize in creating online projects and am proficient in programming languages such as C#, JavaScript, PHP, and HTML. I take great pride in building innovative and user-friendly software and always prioritize the client's needs. My dedication to exceeding client expectations has been recognized by many, and I'm grateful for the opportunity to work with outstanding teams that share my passion.
                <br />
                <br />
                My commitment to staying up-to-date with the latest web development trends and technologies sets me apart. Even when not coding, I constantly research and experiment with new techniques and tools. This drive to continuously learn and improve my skills is a testament to my love for this field.
                <br />
                <br />
                I firmly believe that my attention to detail and drive to produce top-notch software make me an asset to any development team. Working with me means you can expect nothing but the best, and I'm always looking for ways to improve and innovate. I'm excited to see what the future holds, and I look forward to creating exceptional projects with new teams. Thank you for taking the time to get to know me!
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
