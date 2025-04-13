import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Code, Server, Palette } from "lucide-react";

interface SkillCategory {
  title: string;
  icon: React.ReactNode;
  description: string;
  backgroundColor: string;
  skills: {
    name: string;
    percentage: number;
  }[];
}

export default function Skills() {
  const skillCategories: SkillCategory[] = [
    {
      title: "Frontend Development",
      icon: <Code className="h-8 w-8" />,
      description: "Creating responsive, accessible, and performant user interfaces with modern frameworks and tools.",
      backgroundColor: "bg-blue-50 dark:bg-slate-700",
      skills: [
        { name: "React", percentage: 95 },
        { name: "JavaScript/TypeScript", percentage: 90 },
        { name: "HTML/CSS", percentage: 98 },
        { name: "Tailwind CSS", percentage: 92 },
      ],
    },
    {
      title: "Backend Development",
      icon: <Server className="h-8 w-8" />,
      description: "Building robust server-side applications, APIs, and database solutions for scalable systems.",
      backgroundColor: "bg-indigo-50 dark:bg-slate-700",
      skills: [
        { name: "Node.js", percentage: 88 },
        { name: "Express/NestJS", percentage: 85 },
        { name: "MongoDB/SQL", percentage: 80 },
        { name: "REST/GraphQL", percentage: 90 },
      ],
    },
    {
      title: "Design & Others",
      icon: <Palette className="h-8 w-8" />,
      description: "Creating intuitive user experiences and implementing DevOps practices for efficient workflows.",
      backgroundColor: "bg-violet-50 dark:bg-slate-700",
      skills: [
        { name: "UI/UX Design", percentage: 85 },
        { name: "Figma/Adobe XD", percentage: 80 },
        { name: "Git/GitHub", percentage: 92 },
        { name: "Docker/AWS", percentage: 75 },
      ],
    },
  ];

  return (
    <section id="skills" className="py-20 section opacity-0 transform translate-y-5 transition-all duration-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Skills & Expertise</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
          <p className="text-slate-600 dark:text-slate-300 mt-4 max-w-3xl mx-auto">
            Here are the technologies and skills I've mastered over the years, allowing me to create efficient and effective solutions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {skillCategories.map((category, index) => (
            <Card key={index} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className={`text-primary inline-flex items-center justify-center p-3 ${category.backgroundColor} rounded-lg mb-6`}>
                {category.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{category.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">{category.description}</p>
              <ul className="space-y-3">
                {category.skills.map((skill, skillIndex) => (
                  <li key={skillIndex} className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <span className="text-sm font-medium">{skill.percentage}%</span>
                      </div>
                      <Progress value={skill.percentage} className="h-2.5" />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
