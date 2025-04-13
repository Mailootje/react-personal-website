// Skill Types
export interface Skill {
  name: string;
  percentage: number;
}

export interface SkillCategory {
  title: string;
  icon: React.ReactNode;
  description: string;
  backgroundColor: string;
  skills: Skill[];
}

// Project Types
export interface ProjectTag {
  name: string;
  color: string;
}

export interface Project {
  title: string;
  description: string;
  tags: ProjectTag[];
  imageUrl?: string;
  imageType?: string;
  demoUrl?: string;
  repoUrl?: string;
}

// Contact Form Types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}
