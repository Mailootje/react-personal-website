import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  title: string;
  description: string;
  tags: {
    name: string;
    color: string;
  }[];
  imageType: string;
}

export default function Projects() {
  const projects: Project[] = [
    {
      title: "E-commerce Platform",
      description: "A full-featured e-commerce platform with product management, cart functionality, payment processing, and order tracking.",
      tags: [
        { name: "React", color: "blue" },
        { name: "Node.js", color: "green" },
        { name: "MongoDB", color: "purple" },
      ],
      imageType: "ecommerce",
    },
    {
      title: "Task Management App",
      description: "A collaborative task management application with real-time updates, drag-and-drop functionality, and team collaboration features.",
      tags: [
        { name: "React", color: "blue" },
        { name: "Redux", color: "yellow" },
        { name: "Firebase", color: "red" },
      ],
      imageType: "task",
    },
    {
      title: "AI Content Generator",
      description: "An AI-powered content generation tool for creating blog posts, social media content, and marketing copy based on user inputs.",
      tags: [
        { name: "Next.js", color: "blue" },
        { name: "OpenAI", color: "gray" },
        { name: "Tailwind", color: "indigo" },
      ],
      imageType: "ai",
    },
  ];

  const getBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      green: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      gray: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
      indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
    };
    return colors[color] || colors.blue;
  };

  // This helper function creates an SVG placeholder with different patterns based on project type
  const getProjectImagePlaceholder = (type: string) => {
    const colors = {
      ecommerce: "#3B82F6",
      task: "#10B981",
      ai: "#8B5CF6",
    };
    const color = colors[type as keyof typeof colors] || "#3B82F6";
    
    return (
      <div className="bg-slate-100 dark:bg-slate-700 w-full h-full flex items-center justify-center">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          {type === "ecommerce" && (
            <>
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </>
          )}
          {type === "task" && (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="11" y2="17"></line>
            </>
          )}
          {type === "ai" && (
            <>
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
              <path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-8 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <section id="projects" className="py-20 bg-white dark:bg-slate-800/50 section opacity-0 transform translate-y-5 transition-all duration-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Featured Projects</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
          <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl mx-auto">
            A selection of my recent work showcasing my skills and expertise in various domains.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card key={index} className="rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="relative aspect-video overflow-hidden">
                <div className="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
                  {getProjectImagePlaceholder(project.imageType)}
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className={`text-xs font-medium ${getBadgeColor(tag.color)}`}>
                      {tag.name}
                    </Badge>
                  ))}
                </div>
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{project.description}</p>
                <div className="flex justify-between items-center">
                  <Button variant="link" className="text-primary hover:text-blue-700 dark:hover:text-blue-400 font-medium flex items-center p-0">
                    <span>View Details</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="outline" className="inline-flex items-center px-6 py-3 border-primary text-primary hover:bg-primary hover:text-white transition-colors">
            <span>View All Projects</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
