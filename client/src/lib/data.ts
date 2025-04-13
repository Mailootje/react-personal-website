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
  experience: "3+ Years",
};

export const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    url: "https://github.com/mailobedo",
    icon: "ri-github-fill",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/in/mail-obedo/",
    icon: "ri-linkedin-fill",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/mailobedo/",
    icon: "ri-instagram-fill",
  },
  {
    name: "Email",
    url: "mailto:info@mailobedo.nl",
    icon: "ri-mail-fill",
  },
];

export const navigationItems = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Projects", href: "#projects" },
  { name: "Blog", href: "#blog" },
  { name: "Contact", href: "#contact" },
  { name: "Webshop", href: "https://store.mailobedo.nl/" },
  { name: "PhotoFolio", href: "https://mailobedo.nl/photography/" },
  { name: "Password Generator", href: "https://mailobedo.nl/PasswordGenerator/" },
  { name: "IP Lookup", href: "https://mailobedo.nl/apps/ip/" },
];

export const skills: Skill[] = [
  { name: "C#", percentage: 95 },
  { name: "JavaScript", percentage: 90 },
  { name: "PHP", percentage: 85 },
  { name: "HTML", percentage: 95 },
  { name: "CSS", percentage: 85 },
  { name: "WordPress", percentage: 80 },
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
    description: "Creating intuitive and aesthetically pleasing user interfaces",
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
    description: "Constantly updating skills and staying current with new technologies",
    icon: "ri-book-open-fill",
    color: "green",
  },
];

export const projects: Project[] = [
  {
    title: "Zeuser Network",
    description: "There are 3 sites in total. zeuser.net zeuser.tv zeuser.store",
    image: "/assets/imgs/zeuser-surf-club.webp",
    type: "Web App",
    typeColor: "primary",
    technologies: ["HTML", "CSS", "JavaScript", "PHP"],
    detailsLink: "https://zeuser.net/",
    githubLink: "#",
  },
  {
    title: "Nightrex.net",
    description: "This is a FiveM server. This is the website that I created.",
    image: "/assets/imgs/Nightrex.webp",
    type: "Web App",
    typeColor: "secondary",
    technologies: ["HTML", "CSS", "JavaScript", "PHP"],
    detailsLink: "https://nightrex.net/",
    githubLink: "#",
  },
  {
    title: "Password Generator",
    description: "A simple password generator tool that allows users to create strong, secure passwords.",
    image: "/assets/imgs/password-generator.webp",
    type: "Web Tool",
    typeColor: "accent",
    technologies: ["HTML", "CSS", "JavaScript"],
    detailsLink: "https://mailobedo.nl/PasswordGenerator/",
    githubLink: "#",
  },
];

export const experiences: Experience[] = [
  {
    title: "Web Developer",
    company: "Freelance",
    period: "2020 - Present",
    description: "Develop custom websites and web applications for various clients. Specialize in creating responsive, user-friendly interfaces using modern web technologies. Focus on clean code and performance optimization.",
  },
  {
    title: "Front-End Developer",
    company: "Tech Company",
    period: "2018 - 2020",
    description: "Built interactive user interfaces using React and modern JavaScript. Collaborated with designers and back-end developers to implement responsive and accessible web applications.",
  },
  {
    title: "Junior Web Developer",
    company: "Digital Agency",
    period: "2016 - 2018",
    description: "Created responsive websites for clients using HTML, CSS, and JavaScript. Worked with content management systems to deliver maintainable websites with easy content updates.",
  },
];

export const educations: Education[] = [
  {
    degree: "Bachelor's in Computer Science",
    institution: "University of Amsterdam",
    period: "2012 - 2016",
    description: "Focused on software development and web technologies. Participated in various coding competitions and hackathons. Completed coursework in algorithms, data structures, and web development.",
  },
  {
    degree: "Web Development Bootcamp",
    institution: "Coding Academy",
    period: "2016",
    description: "Intensive program covering front-end and back-end technologies. Developed multiple projects using modern frameworks and best practices in web development.",
  },
];

export const certifications: Certification[] = [
  { name: "React Developer Certification" },
  { name: "JavaScript Advanced Concepts" },
  { name: "Python Programming" },
  { name: "TailwindCSS Mastery" },
];

export const contactInfo: ContactInfo = {
  location: "Amsterdam, The Netherlands",
  email: "info@mailobedo.nl",
  phone: "+31 6 12345678",
};
