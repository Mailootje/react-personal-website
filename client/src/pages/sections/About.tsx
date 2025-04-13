import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Briefcase, GraduationCap, FolderKanban, Sparkles } from "lucide-react";

export default function About() {
  const handleDownloadResume = () => {
    // In a real implementation, this would download an actual resume file
    alert("Resume download functionality would be implemented here");
  };

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-800/50 section opacity-0 transform translate-y-5 transition-all duration-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">About Me</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">My Journey</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              With over 7 years of experience in web development, I've worked on various projects ranging from small business websites to large-scale enterprise applications. My journey started when I built my first website at age 14, and I've been passionate about creating digital experiences ever since.
            </p>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              After graduating with a Computer Science degree, I joined a tech startup where I honed my skills in modern web frameworks and UI/UX design. This experience taught me the importance of creating solutions that are not only functionally robust but also delightful to use.
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              I believe in the power of technology to solve real-world problems and improve lives. My approach combines technical expertise with a deep understanding of user needs and business goals.
            </p>
            
            <div className="mt-8">
              <Button 
                variant="ghost" 
                className="inline-flex items-center text-primary hover:text-blue-700 dark:hover:text-blue-400 font-medium"
                onClick={handleDownloadResume}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Resume
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="text-primary mb-2">
                <Briefcase className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold mb-2">Experience</h4>
              <p className="text-slate-600 dark:text-slate-300">7+ years in web development and software engineering</p>
            </Card>
            
            <Card className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="text-primary mb-2">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold mb-2">Education</h4>
              <p className="text-slate-600 dark:text-slate-300">B.S. in Computer Science, Stanford University</p>
            </Card>
            
            <Card className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="text-primary mb-2">
                <FolderKanban className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold mb-2">Projects</h4>
              <p className="text-slate-600 dark:text-slate-300">50+ completed projects for various clients</p>
            </Card>
            
            <Card className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="text-primary mb-2">
                <Sparkles className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold mb-2">Interests</h4>
              <p className="text-slate-600 dark:text-slate-300">AI, Machine Learning, Design Systems, Photography</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
