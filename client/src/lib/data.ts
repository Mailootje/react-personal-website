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
  name: "Mailo Bedo",
  email: "info@mailobedo.nl",
  location: "The Netherlands",
  experience: "5+ Years",
};

export const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    url: "https://github.com/mailootje",
    icon: "ri-github-fill",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/mailobed%C3%B6/",
    icon: "ri-linkedin-fill",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/mailootje/",
    icon: "ri-instagram-fill",
  },
  {
    name: "Email",
    url: "mailto:info@mailobedo.nl",
    icon: "ri-mail-fill",
  },
];

export const navigationItems = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Resume", href: "#resume" },
  { name: "Contact", href: "#contact" },
  { name: "Photography", href: "/photography" },
  { name: "Apps", href: "/apps" },
  { name: "Games", href: "/games" },
  { name: "Downloads", href: "/downloads" },
];

export const skills: Skill[] = [
  { name: "JavaScript", percentage: 95 },
  { name: "Python", percentage: 90 },
  { name: "React", percentage: 90 },
  { name: "TailwindCSS", percentage: 85 },
  { name: "NodeJS", percentage: 85 },
  { name: "Docker", percentage: 75 },
];

export const professionalSkills: ProfessionalSkill[] = [
  {
    name: "Web Development",
    description: "Building responsive, modern websites and web applications",
    icon: "ri-code-s-slash-fill",
    color: "primary",
  },
  {
    name: "UI/UX Design",
    description:
      "Creating intuitive and aesthetically pleasing user interfaces",
    icon: "ri-layout-2-fill",
    color: "secondary",
  },
  {
    name: "Problem Solving",
    description: "Finding efficient solutions to complex technical challenges",
    icon: "ri-lightbulb-fill",
    color: "accent",
  },
  {
    name: "Continuous Learning",
    description:
      "Constantly updating skills and staying current with new technologies",
    icon: "ri-book-open-fill",
    color: "green",
  },
];

export const projects: Project[] = [
  {
    title: "Personal Website",
    description:
      "My personal portfolio website showcasing my skills, projects, and experience. Built with modern web technologies for optimal performance.",
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    type: "Web App",
    typeColor: "primary",
    technologies: ["HTML", "CSS", "JavaScript", "Bootstrap"],
    detailsLink: "https://mailobedo.nl",
    githubLink: "https://github.com/mailobedo/mailobedo-website",
  },
  {
    title: "Weather Dashboard",
    description:
      "A responsive web application that displays current weather and forecasts for any location. Features clean UI and intuitive user experience.",
    image:
      "https://images.unsplash.com/photo-1561484930-998b6a7b22e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    type: "Web App",
    typeColor: "secondary",
    technologies: ["React", "OpenWeather API", "TailwindCSS"],
    detailsLink: "/apps/weather-dashboard",
    githubLink: "https://github.com/mailobedo/weather-app",
  },
  {
    title: "Recipe Finder",
    description:
      "A web application that allows users to search for recipes based on ingredients they have on hand, helping reduce food waste and inspire cooking creativity.",
    image:
      "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    type: "Web App",
    typeColor: "accent",
    technologies: ["JavaScript", "Node.js", "Express", "Recipe API"],
    detailsLink: "#",
    githubLink: "https://github.com/mailobedo/recipe-finder",
  },
];

export const experiences: Experience[] = [
  {
    title: "Owner",
    company: "MBIT For You",
    period: "Sep. 2023 - Present",
    description:
      "Self-employed owner of MBIT For You, focusing on custom software solutions. Operating in The Netherlands with on-location services.",
  },
  {
    title: "Software Developer",
    company: "GIM",
    period: "Sep. 2022 - Feb. 2023",
    description:
      "Internship role at GIM, specializing in software development, specifically C#. Based in Arnhem, Gelderland, Netherlands.",
  },
  {
    title: "Software Developer",
    company: "Gemini Embedded Technology BV",
    period: "Sep. 2021 - Feb. 2022",
    description:
      "Internship at Gemini Embedded Technology BV, focusing on software development projects. Located in Arnhem, Gelderland, Netherlands.",
  },
];

export const educations: Education[] = [
  {
    degree: "Software Developer",
    institution: "ROC A12",
    period: "2020 - Present",
    description:
      "An in-depth program emphasizing both software development and web technologies. The coursework included comprehensive studies in algorithms, data structures, and cutting-edge web development practices, preparing graduates for dynamic roles in the tech industry.",
  },
  {
    degree: "IT Support",
    institution: "ROC A12",
    period: "2018 - 2019",
    description:
      "Intensive program covering front-end and back-end technologies. Developed multiple projects using modern frameworks and best practices in web development.",
  },
];

export const certifications: Certification[] = [
  { name: "React Developer Certification" },
  { name: "JavaScript Advanced Concepts" },
  { name: "Python Programming" },
  { name: "TailwindCSS Mastery" },
];

export const contactInfo: ContactInfo = {
  location: "The Netherlands",
  email: "info@mailobedo.nl",
};
