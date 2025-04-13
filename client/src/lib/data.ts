import {
  Skill,
  ProfessionalSkill,
  SocialLink,
  Project,
  Experience,
  Education,
  Certification,
  ContactInfo,
  PersonalInfo,
} from "./types";

export const personalInfo: PersonalInfo = {
  name: "John Doe",
  email: "contact@johndoe.com",
  location: "San Francisco, CA",
  experience: "5+ Years",
};

export const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    url: "https://github.com",
    icon: "ri-github-fill",
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com",
    icon: "ri-linkedin-fill",
  },
  {
    name: "Twitter",
    url: "https://twitter.com",
    icon: "ri-twitter-fill",
  },
  {
    name: "Dribbble",
    url: "https://dribbble.com",
    icon: "ri-dribbble-fill",
  },
];

export const navigationItems = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Resume", href: "#resume" },
  { name: "Contact", href: "#contact" },
];

export const skills: Skill[] = [
  { name: "JavaScript/TypeScript", percentage: 95 },
  { name: "React & React Native", percentage: 90 },
  { name: "Node.js & Express", percentage: 85 },
  { name: "HTML5 & CSS3/SCSS", percentage: 92 },
  { name: "GraphQL", percentage: 80 },
];

export const professionalSkills: ProfessionalSkill[] = [
  {
    name: "Team Leadership",
    description: "Experience leading development teams and coordinating projects",
    icon: "ri-team-fill",
    color: "primary",
  },
  {
    name: "UI/UX Design",
    description: "Creating intuitive and aesthetically pleasing user interfaces",
    icon: "ri-layout-2-fill",
    color: "secondary",
  },
  {
    name: "Client Relations",
    description: "Effective communication and understanding client needs",
    icon: "ri-customer-service-2-fill",
    color: "accent",
  },
  {
    name: "DevOps",
    description: "Implementing CI/CD pipelines and infrastructure management",
    icon: "ri-git-branch-fill",
    color: "red",
  },
];

export const projects: Project[] = [
  {
    title: "E-commerce Platform",
    description: "A full-featured e-commerce solution with inventory management, payment processing, and analytics dashboard.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    type: "Web App",
    typeColor: "primary",
    technologies: ["React", "Node.js", "MongoDB", "Stripe"],
    detailsLink: "#",
    githubLink: "https://github.com",
  },
  {
    title: "Task Management App",
    description: "A productivity app for teams with real-time collaboration, file sharing, and automated workflows.",
    image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    type: "Mobile App",
    typeColor: "secondary",
    technologies: ["React Native", "Firebase", "Redux"],
    detailsLink: "#",
    githubLink: "https://github.com",
  },
  {
    title: "AI Content Generator",
    description: "An AI-powered platform that helps users create engaging blog posts, social media content, and marketing copy.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    type: "SaaS",
    typeColor: "accent",
    technologies: ["Next.js", "Python", "GPT-3", "AWS"],
    detailsLink: "#",
    githubLink: "https://github.com",
  },
];

export const experiences: Experience[] = [
  {
    title: "Senior Frontend Developer",
    company: "Tech Innovations Inc.",
    period: "2020 - Present",
    description: "Led the development of multiple client projects, implementing modern JavaScript frameworks and optimizing application performance. Mentored junior developers and established best practices.",
  },
  {
    title: "Full Stack Developer",
    company: "Digital Solutions LLC",
    period: "2018 - 2020",
    description: "Developed and maintained web applications using React, Node.js, and MongoDB. Collaborated with designers to implement responsive UI components and improved API performance.",
  },
  {
    title: "Web Developer",
    company: "Creative Agency Co.",
    period: "2016 - 2018",
    description: "Created responsive websites for clients across various industries. Implemented custom WordPress themes and plugins. Collaborated with the design team to create cohesive user experiences.",
  },
];

export const educations: Education[] = [
  {
    degree: "Master of Computer Science",
    institution: "Stanford University",
    period: "2014 - 2016",
    description: "Specialized in Human-Computer Interaction and Machine Learning. Completed thesis on \"Improving User Experience through AI-driven Interfaces.\" GPA: 3.9/4.0",
  },
  {
    degree: "Bachelor of Science in Computer Science",
    institution: "University of California, Berkeley",
    period: "2010 - 2014",
    description: "Completed with honors. Member of the Computer Science Honor Society. Participated in multiple hackathons and coding competitions.",
  },
];

export const certifications: Certification[] = [
  { name: "AWS Certified Developer" },
  { name: "Google Cloud Professional Developer" },
  { name: "Certified Scrum Master" },
  { name: "MongoDB Certified Developer" },
];

export const contactInfo: ContactInfo = {
  location: "San Francisco, CA 94105, United States",
  email: "contact@johndoe.com",
  phone: "(+1) 123-456-7890",
};
