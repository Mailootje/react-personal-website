import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="min-h-[90vh] flex items-center py-20 section opacity-0 transform translate-y-5 transition-all duration-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Hi, I'm <span className="text-primary">John Doe</span>
            </h1>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-slate-600 dark:text-slate-300 mb-6">
              Full Stack Developer & UI/UX Designer
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl">
              I build exceptional digital experiences with modern technologies. Passionate about creating solutions that make a difference.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                className="inline-flex items-center"
                onClick={() => scrollToSection("contact")}
              >
                <span>Get in Touch</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="inline-flex items-center"
                onClick={() => scrollToSection("projects")}
              >
                <span>View Projects</span>
              </Button>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 opacity-20 rounded-full blur-3xl"></div>
              {/* Profile image would come from an actual image source in production */}
              <div className="w-full h-auto aspect-square rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg relative z-10">
                <svg
                  className="w-full h-full text-slate-200 dark:text-slate-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
