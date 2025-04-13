export interface Skill {
  name: string;
  percentage: number;
}

export interface ProfessionalSkill {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface Project {
  title: string;
  description: string;
  image: string;
  type: string;
  typeColor: string;
  technologies: string[];
  detailsLink: string;
  githubLink: string;
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  description: string;
}

export interface Certification {
  name: string;
}

export interface ContactInfo {
  location: string;
  email: string;
  phone: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  location: string;
  experience: string;
}
