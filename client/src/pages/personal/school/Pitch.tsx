import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { VideoBackground } from "@/components/VideoBackground";
import {
  RiPresentationFill,
  RiArrowLeftLine,
  RiArrowRightLine,
} from "react-icons/ri";
import {
  FaGraduationCap,
  FaStar,
  FaLightbulb,
  FaPeopleArrows,
  FaRocket,
  FaCode,
  FaChevronLeft,
  FaChevronRight,
  FaMagic,
  FaRandom,
} from "react-icons/fa";

// Define slide content
const slides = [
  {
    id: "title",
    title: "LOB Afrondende Pitch",
    icon: RiPresentationFill,
    badge: "Leerjaar 4",
    subtitle: "Software Developer Opleiding",
  },
  {
    id: "intro",
    title: "Mijn Start & Achtergrond",
    icon: FaGraduationCap,
    content: [
      "Toen ik begon met de opleiding Software Developer, had ik beperkte ervaring met programmeren. Ik had wat basis HTML en CSS kennis, maar de wereld van applicatieontwikkeling was nieuw voor mij.",
      "Ik koos voor deze richting vanwege mijn fascinatie voor technologie en mijn wens om zelf digitale oplossingen te kunnen bouwen. De combinatie van logisch denken en creativiteit trok me aan.",
      "Na het eerste jaar besloot ik jaar 2 opnieuw te doen, omdat ik vond dat ik onvoldoende lesmateriaal had gehad om met vertrouwen door te kunnen gaan. Deze beslissing heeft me uiteindelijk sterker gemaakt als developer.",
    ],
  },
  {
    id: "kwaliteiten",
    title: "Mijn Kwaliteiten",
    icon: FaStar,
    listItems: [
      {
        title: "Probleemoplossend vermogen",
        desc: "Ik benader uitdagingen systematisch en zoek efficiënte oplossingen.",
      },
      {
        title: "Doorzettingsvermogen",
        desc: "Ik blijf gefocust, ook bij complexe vraagstukken, tot ik de juiste oplossing vind.",
      },
      {
        title: "Adaptief leren",
        desc: "Ik pik nieuwe programmeertalen en frameworks snel op en pas ze toe.",
      },
      {
        title: "Oog voor detail",
        desc: "Ik let op kleine details in code die een groot verschil kunnen maken.",
      },
      {
        title: "Zelfreflectie",
        desc: "Ik ben kritisch op mijn eigen werk en zoek actief naar verbetermogelijkheden.",
      },
    ],
  },
  {
    id: "geleerd",
    title: "Wat Ik Heb Geleerd",
    icon: FaLightbulb,
    content: [
      "Tijdens mijn opleiding heb ik niet alleen technische vaardigheden opgedaan, maar ook veel over mezelf geleerd:",
    ],
    listItems: [
      "Ik werk het beste als ik een uitdaging stap voor stap aanpak, in plaats van alles in één keer te willen oplossen.",
      "Fouten maken is een essentieel onderdeel van het leerproces; elk probleem is een kans om te groeien.",
      "Ik presteer beter wanneer ik goed planmatig werk en duidelijke doelen stel.",
      "Samenwerken en code reviews hebben me geleerd om open te staan voor feedback en andere perspectieven.",
      "Het nemen van een stap terug wanneer ik vastloop, geeft vaak nieuwe inzichten.",
    ],
  },
  {
    id: "geholpen",
    title: "Mensen Die Me Hebben Geholpen",
    icon: FaPeopleArrows,
    content: [
      "Mijn ontwikkeling is sterk beïnvloed door verschillende mensen binnen de opleiding:",
    ],
    listItems: [
      {
        title: "Docenten",
        desc: "Die verder gingen dan alleen de lesstof en praktijkvoorbeelden deelden.",
      },
      {
        title: "Mijn SLB'er",
        desc: "Voor persoonlijke begeleiding en het helpen stellen van realistische doelen.",
      },
      {
        title: "Medestudenten",
        desc: "Voor de samenwerking bij projecten en het delen van kennis en ervaringen.",
      },
      {
        title: "Stagebegeleiders",
        desc: "Die me hebben laten zien hoe theorie in de praktijk wordt toegepast.",
      },
    ],
    conclusion:
      "Ik ben dankbaar voor de ondersteuning die ik heb gekregen, vooral tijdens moeilijke momenten en bij het verhelderen van complexe concepten.",
  },
  {
    id: "toekomst",
    title: "Mijn Plannen Voor Volgend Jaar",
    icon: FaRocket,
    content: [
      "Na het afronden van mijn huidige opleiding, zie ik twee mogelijke paden voor mezelf:",
    ],
    options: [
      {
        title: "Doorstromen naar HBO",
        desc: "Ik overweeg om door te studeren in de richting van HBO-ICT met specialisatie Software Engineering om mijn kennis verder te verdiepen en meer theoretische achtergrond te krijgen. Dit zou me voorbereiden op complexere en uitdagendere ontwikkelrollen.",
      },
      {
        title: "Starten in het Werkveld",
        desc: "Ook overweeg ik om direct te beginnen als junior developer bij een bedrijf waar ik kan groeien en leren in een professionele omgeving. Ik ben vooral geïnteresseerd in webontwikkeling en zou me graag specialiseren in full-stack development.",
      },
    ],
    conclusion:
      "Ongeacht welk pad ik kies, blijf ik mezelf ontwikkelen door middel van online cursussen, persoonlijke projecten en het bijhouden van nieuwe technologieën. Mijn uiteindelijke doel is om een veelzijdige developer te worden die complexe problemen kan oplossen met elegante en efficiënte code.",
  },
  {
    id: "skills",
    title: "Technische Vaardigheden",
    icon: FaCode,
    langs: [
      "HTML/CSS",
      "JavaScript",
      "TypeScript",
      "PHP",
      "C#",
      "C",
      "SQL",
      "Python",
      "Java",
      "Kotlin",
    ],
    frontendTools: [
      "HTML5",
      "CSS3",
      "Bootstrap",
      "jQuery",
      "React",
      "Next.js",
    ],
    backendTools: [
      "Node.js",
      "Apache",
      ".Net",
    ],
    databaseTools: [
      "MySQL",
      "MariaDB",
      "Microsoft SQL Server",
      "SQLite",
    ],
    devTools: [
      "Unity",
      "Android",
      "Raspberry Pi",
      "Arduino",
      "Postman",
      "Git",
      "VS Code",
      "JetBrains",
      "Docker",
    ],
    designTools: [
      "Adobe Illustrator",
      "Adobe After Effects",
      "Adobe Photoshop",
      "Adobe XD",
    ],
  },
  {
    id: "bedankt",
    title: "Bedankt voor uw aandacht!",
    content: [
      "Ik kijk uit naar de volgende stappen in mijn carrière en ben dankbaar voor alle kennis en ervaring die ik tijdens mijn opleiding heb opgedaan.",
    ],
    footer: "LOB Afrondende Pitch - Leerjaar 4",
  },
];

export default function SchoolPitch() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedEffect, setSelectedEffect] = useState<number | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  // Define different transition effects
  const transitionEffects = [
    // Slide horizontal
    {
      enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
      }),
      center: {
        x: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.5,
        },
      },
      exit: (direction: number) => ({
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0,
        transition: { duration: 0.3 },
      }),
    },
    // Fade with scale
    {
      enter: () => ({
        opacity: 0,
        scale: 0.9,
      }),
      center: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5 },
      },
      exit: () => ({
        opacity: 0,
        scale: 1.05,
        transition: { duration: 0.3 },
      }),
    },
    // Slide vertical
    {
      enter: (direction: number) => ({
        y: direction > 0 ? "50%" : "-50%",
        opacity: 0,
      }),
      center: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 200, damping: 25 },
      },
      exit: (direction: number) => ({
        y: direction < 0 ? "30%" : "-30%",
        opacity: 0,
        transition: { duration: 0.4 },
      }),
    },
    // Rotate with fade
    {
      enter: (direction: number) => ({
        opacity: 0,
        rotate: direction > 0 ? 5 : -5,
        scale: 0.95,
      }),
      center: {
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      },
      exit: (direction: number) => ({
        opacity: 0,
        rotate: direction < 0 ? 5 : -5,
        scale: 0.95,
        transition: { duration: 0.4 },
      }),
    },
    // Flip effect
    {
      enter: (direction: number) => ({
        opacity: 0,
        rotateY: direction > 0 ? 45 : -45,
        x: direction > 0 ? 100 : -100,
      }),
      center: {
        opacity: 1,
        rotateY: 0,
        x: 0,
        transition: { type: "spring", stiffness: 200, damping: 25 },
      },
      exit: (direction: number) => ({
        opacity: 0,
        rotateY: direction < 0 ? 45 : -45,
        x: direction < 0 ? 100 : -100,
        transition: { duration: 0.4 },
      }),
    },
  ];

  // Get a random transition effect index based on current slide
  const getTransitionEffectIndex = (slideIndex: number) => {
    // Use a deterministic pattern based on the slide index
    return slideIndex % transitionEffects.length;
  };

  // Current slide's transition effect - use selected effect if available, otherwise use the default pattern
  const slideVariants =
    selectedEffect !== null
      ? transitionEffects[selectedEffect]
      : transitionEffects[getTransitionEffectIndex(currentSlide)];

  // Animation for list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  const renderSlideContent = (slide: (typeof slides)[0]) => {
    switch (slide.id) {
      case "title":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="text-center mx-auto max-w-4xl px-4"
            >
              <Badge className="px-4 py-1 text-sm bg-primary/20 text-primary border border-primary/50 mb-8">
                {slide.badge}
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {slide.title}
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
                {slide.subtitle}
              </p>
              {slide.icon && (
                <slide.icon className="text-primary text-6xl mx-auto mb-10" />
              )}
              <div className="text-gray-400 text-lg">
                Gebruik de pijltjestoetsen of knoppen onderaan om te navigeren
              </div>
            </motion.div>
          </div>
        );

      case "intro":
        return (
          <div className="h-full w-full flex flex-col md:flex-row md:items-center py-8 md:py-4">
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
              <div className="flex items-center mb-6 md:mb-8">
                {slide.icon && (
                  <slide.icon className="text-primary text-4xl mr-4" />
                )}
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {slide.title}
                </h2>
              </div>
              {/* Empty div for spacing on mobile, image could go here */}
              <div className="hidden md:block h-32 w-full bg-gradient-to-br from-primary/20 to-transparent rounded-lg border border-primary/30 flex items-center justify-center">
                <FaGraduationCap className="text-primary/70 text-6xl" />
              </div>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="md:w-2/3 space-y-4 text-base lg:text-lg text-gray-300"
            >
              {slide.content?.map((para, idx) => (
                <motion.p key={idx} variants={itemVariants}>
                  {para}
                </motion.p>
              ))}
            </motion.div>
          </div>
        );

      case "kwaliteiten":
        return (
          <div className="h-full w-full flex flex-col md:flex-row md:items-center py-8 md:py-4">
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
              <div className="flex items-center mb-6 md:mb-8">
                {slide.icon && (
                  <slide.icon className="text-primary text-4xl mr-4" />
                )}
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  {slide.title}
                </h2>
              </div>
              {/* Empty div for spacing on mobile, image could go here */}
              <div className="hidden md:block h-32 w-full bg-gradient-to-br from-primary/20 to-transparent rounded-lg border border-primary/30 flex items-center justify-center">
                <FaStar className="text-primary/70 text-6xl" />
              </div>
            </div>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="md:w-2/3 space-y-3 text-base lg:text-lg"
            >
              {slide.listItems?.map((item, idx) => (
                <motion.li
                  key={idx}
                  variants={itemVariants}
                  className="flex items-start"
                >
                  <div className="text-primary text-xl mr-3">•</div>
                  <div>
                    {"title" in item && (
                      <>
                        <span className="font-bold text-white">
                          {item.title}
                        </span>
                        <span className="mx-2 text-gray-500">—</span>
                        <span className="text-gray-300">{item.desc}</span>
                      </>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        );

      case "geleerd":
        return (
          <div className="h-full flex flex-col justify-center py-16">
            <div className="flex items-center mb-10">
              {slide.icon && (
                <slide.icon className="text-primary text-5xl mr-5" />
              )}
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {slide.title}
              </h2>
            </div>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-xl text-gray-300 mb-6"
            >
              {slide.content && slide.content[0]}
            </motion.p>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 text-xl text-gray-300 pl-5"
            >
              {slide.listItems?.map((item, idx) => (
                <motion.li
                  key={idx}
                  variants={itemVariants}
                  className="flex items-start"
                >
                  <div className="text-primary text-2xl mr-4">•</div>
                  <div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        );

      case "geholpen":
        return (
          <div className="h-full flex flex-col justify-center py-16">
            <div className="flex items-center mb-10">
              {slide.icon && (
                <slide.icon className="text-primary text-5xl mr-5" />
              )}
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {slide.title}
              </h2>
            </div>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-xl text-gray-300 mb-6"
            >
              {slide.content && slide.content[0]}
            </motion.p>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 text-xl mb-6"
            >
              {slide.listItems?.map((item, idx) => (
                <motion.li
                  key={idx}
                  variants={itemVariants}
                  className="flex items-start"
                >
                  <div className="text-primary text-2xl mr-4">•</div>
                  <div>
                    {"title" in item ? (
                      <>
                        <span className="font-bold text-white">
                          {item.title}
                        </span>
                        <span className="mx-2 text-gray-500">—</span>
                        <span className="text-gray-300">{item.desc}</span>
                      </>
                    ) : (
                      <span className="text-gray-300">{item}</span>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
              className="text-xl text-gray-300 italic"
            >
              {slide.conclusion}
            </motion.p>
          </div>
        );

      case "toekomst":
        return (
          <div className="h-full flex flex-col justify-center py-16">
            <div className="flex items-center mb-10">
              {slide.icon && (
                <slide.icon className="text-primary text-5xl mr-5" />
              )}
              <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {slide.title}
              </h2>
            </div>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="text-xl text-gray-300 mb-8"
            >
              {slide.content && slide.content[0]}
            </motion.p>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-8 mb-8"
            >
              {slide.options?.map((option, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="p-6 border-l-4 border-primary bg-black/30 rounded-r-lg"
                >
                  <h3 className="text-2xl font-semibold text-primary mb-2">
                    {option.title}
                  </h3>
                  <p className="text-gray-300 text-lg">{option.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.p
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-300"
            >
              {slide.conclusion}
            </motion.p>
          </div>
        );

      case "skills":
        return (
          <div className="h-full w-full overflow-y-auto">
            <div className="flex flex-col justify-start py-8 px-4">
              <div className="flex items-center mb-6 mx-auto">
                {slide.icon && (
                  <slide.icon className="text-primary text-4xl mr-4" />
                )}
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
                  {slide.title}
                </h2>
              </div>

              <div className="space-y-6 max-w-5xl mx-auto w-full">
                {/* Programming Languages */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white px-1 flex items-center">
                    <div className="h-8 w-1 bg-primary/80 rounded-full mr-3"></div>
                    Programmeertalen
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {slide.langs?.map((lang, i) => {
                      // Assign a specific color based on the programming language
                      let gradientColors = "";
                      let icon = null;
                      
                      switch(lang) {
                        case "HTML/CSS": 
                          gradientColors = "from-orange-600/20 to-blue-600/20 border-orange-500/40"; 
                          icon = <div className="text-orange-500/80 mb-2 text-2xl">&#60;/&#62;</div>;
                          break;
                        case "JavaScript": 
                          gradientColors = "from-yellow-500/20 to-yellow-700/20 border-yellow-500/40"; 
                          icon = <div className="text-yellow-500/80 mb-2 text-xl">JS</div>;
                          break;
                        case "TypeScript": 
                          gradientColors = "from-blue-500/20 to-blue-700/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">TS</div>;
                          break;
                        case "PHP": 
                          gradientColors = "from-indigo-500/20 to-indigo-700/20 border-indigo-500/40"; 
                          icon = <div className="text-indigo-500/80 mb-2 text-xl">PHP</div>;
                          break;
                        case "C#": 
                          gradientColors = "from-green-500/20 to-green-700/20 border-green-500/40"; 
                          icon = <div className="text-green-500/80 mb-2 text-xl">C#</div>;
                          break;
                        case "C": 
                          gradientColors = "from-blue-500/20 to-blue-700/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">C</div>;
                          break;
                        case "SQL": 
                          gradientColors = "from-cyan-500/20 to-cyan-700/20 border-cyan-500/40"; 
                          icon = <div className="text-cyan-500/80 mb-2 text-xl">SQL</div>;
                          break;
                        case "Python": 
                          gradientColors = "from-blue-400/20 to-yellow-400/20 border-blue-500/40"; 
                          icon = <div className="text-blue-400/80 mb-2 text-xl">Py</div>;
                          break;
                        case "Java": 
                          gradientColors = "from-red-500/20 to-red-700/20 border-red-500/40"; 
                          icon = <div className="text-red-500/80 mb-2 text-xl">Java</div>;
                          break;
                        case "Kotlin": 
                          gradientColors = "from-purple-500/20 to-purple-700/20 border-purple-500/40"; 
                          icon = <div className="text-purple-500/80 mb-2 text-xl">Kt</div>;
                          break;
                        default: 
                          gradientColors = "from-gray-700/40 to-gray-900/40 border-gray-700"; 
                          break;
                      }
                      
                      return (
                        <motion.div
                          key={lang}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.05 * i }}
                          className={`flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b ${gradientColors} rounded-lg border backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                          whileHover={{ scale: 1.03 }}
                        >
                          {icon}
                          <div className="text-lg font-semibold text-white">
                            {lang}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Frontend Development */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white px-1 flex items-center">
                    <div className="h-8 w-1 bg-blue-500/80 rounded-full mr-3"></div>
                    Frontend Development
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {slide.frontendTools?.map((tool, i) => {
                      // Assign a specific color based on the frontend tool
                      let gradientColors = "";
                      let icon = null;
                      
                      switch(tool) {
                        case "HTML5": 
                          gradientColors = "from-orange-500/20 to-orange-700/20 border-orange-500/40"; 
                          icon = <div className="text-orange-500/80 mb-2 text-xl">HTML5</div>;
                          break;
                        case "CSS3": 
                          gradientColors = "from-blue-500/20 to-blue-700/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">CSS3</div>;
                          break;
                        case "Bootstrap": 
                          gradientColors = "from-purple-500/20 to-purple-700/20 border-purple-500/40"; 
                          icon = <div className="text-purple-500/80 mb-2 text-xl">BS</div>;
                          break;
                        case "jQuery": 
                          gradientColors = "from-blue-400/20 to-blue-600/20 border-blue-500/40"; 
                          icon = <div className="text-blue-400/80 mb-2 text-xl">jQuery</div>;
                          break;
                        case "React": 
                          gradientColors = "from-cyan-500/20 to-cyan-700/20 border-cyan-500/40"; 
                          icon = <div className="text-cyan-500/80 mb-2 text-2xl">⚛️</div>;
                          break;
                        case "Next.js": 
                          gradientColors = "from-gray-500/20 to-gray-700/20 border-gray-500/40"; 
                          icon = <div className="text-gray-400/80 mb-2 text-xl">Next</div>;
                          break;
                        default: 
                          gradientColors = "from-gray-700/40 to-gray-900/40 border-gray-700"; 
                          break;
                      }
                      
                      return (
                        <motion.div
                          key={tool}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.05 * (i + (slide.langs?.length || 0)),
                          }}
                          className={`flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b ${gradientColors} rounded-lg border backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                          whileHover={{ scale: 1.03 }}
                        >
                          {icon}
                          <div className="text-lg font-semibold text-white">
                            {tool}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Backend Development */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white px-1 flex items-center">
                    <div className="h-8 w-1 bg-green-500/80 rounded-full mr-3"></div>
                    Backend Development
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
                    {slide.backendTools?.map((tool, i) => {
                      // Assign a specific color based on the backend tool
                      let gradientColors = "";
                      let icon = null;
                      
                      switch(tool) {
                        case "Node.js": 
                          gradientColors = "from-green-500/20 to-green-700/20 border-green-500/40"; 
                          icon = <div className="text-green-500/80 mb-2 text-xl">Node</div>;
                          break;
                        case "Apache": 
                          gradientColors = "from-red-500/20 to-red-700/20 border-red-500/40"; 
                          icon = <div className="text-red-500/80 mb-2 text-xl">Apache</div>;
                          break;
                        case ".Net": 
                          gradientColors = "from-blue-500/20 to-blue-700/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">.NET</div>;
                          break;
                        default: 
                          gradientColors = "from-gray-700/40 to-gray-900/40 border-gray-700"; 
                          break;
                      }
                      
                      return (
                        <motion.div
                          key={tool}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.05 * (i + (slide.langs?.length || 0) + (slide.frontendTools?.length || 0)),
                          }}
                          className={`flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b ${gradientColors} rounded-lg border backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                          whileHover={{ scale: 1.03 }}
                        >
                          {icon}
                          <div className="text-lg font-semibold text-white">
                            {tool}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Databases */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white px-1 flex items-center">
                    <div className="h-8 w-1 bg-yellow-500/80 rounded-full mr-3"></div>
                    Databases
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {slide.databaseTools?.map((tool, i) => {
                      // Assign a specific color based on the database
                      let gradientColors = "";
                      let icon = null;
                      
                      switch(tool) {
                        case "MySQL": 
                          gradientColors = "from-blue-500/20 to-orange-500/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">MySQL</div>;
                          break;
                        case "MariaDB": 
                          gradientColors = "from-blue-400/20 to-blue-600/20 border-blue-500/40"; 
                          icon = <div className="text-blue-400/80 mb-2 text-xl">MariaDB</div>;
                          break;
                        case "Microsoft SQL Server": 
                          gradientColors = "from-red-500/20 to-red-700/20 border-red-500/40"; 
                          icon = <div className="text-red-500/80 mb-2 text-xl">MSSQL</div>;
                          break;
                        case "SQLite": 
                          gradientColors = "from-blue-400/20 to-indigo-600/20 border-blue-500/40"; 
                          icon = <div className="text-blue-400/80 mb-2 text-xl">SQLite</div>;
                          break;
                        default: 
                          gradientColors = "from-gray-700/40 to-gray-900/40 border-gray-700"; 
                          break;
                      }
                      
                      return (
                        <motion.div
                          key={tool}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.05 * (i + (slide.langs?.length || 0) + 
                              (slide.frontendTools?.length || 0) + (slide.backendTools?.length || 0)),
                          }}
                          className={`flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b ${gradientColors} rounded-lg border backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                          whileHover={{ scale: 1.03 }}
                        >
                          {icon}
                          <div className="text-lg font-semibold text-white">
                            {tool}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Tools & Development Platforms */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white px-1 flex items-center">
                    <div className="h-8 w-1 bg-purple-500/80 rounded-full mr-3"></div>
                    Tools & Development Platforms
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {slide.devTools?.map((tool, i) => {
                      // Assign a specific color based on the dev tool
                      let gradientColors = "";
                      let icon = null;
                      
                      switch(tool) {
                        case "Unity": 
                          gradientColors = "from-gray-500/20 to-gray-700/20 border-gray-500/40"; 
                          icon = <div className="text-gray-300/80 mb-2 text-xl">Unity</div>;
                          break;
                        case "Android": 
                          gradientColors = "from-green-500/20 to-green-700/20 border-green-500/40"; 
                          icon = <div className="text-green-500/80 mb-2 text-xl">Android</div>;
                          break;
                        case "Raspberry Pi": 
                          gradientColors = "from-red-500/20 to-red-700/20 border-red-500/40"; 
                          icon = <div className="text-red-500/80 mb-2 text-xl">Raspberry</div>;
                          break;
                        case "Arduino": 
                          gradientColors = "from-cyan-500/20 to-cyan-700/20 border-cyan-500/40"; 
                          icon = <div className="text-cyan-500/80 mb-2 text-xl">Arduino</div>;
                          break;
                        case "Postman": 
                          gradientColors = "from-orange-500/20 to-orange-700/20 border-orange-500/40"; 
                          icon = <div className="text-orange-500/80 mb-2 text-xl">Postman</div>;
                          break;
                        case "Git": 
                          gradientColors = "from-orange-500/20 to-orange-700/20 border-orange-500/40"; 
                          icon = <div className="text-orange-500/80 mb-2 text-xl">Git</div>;
                          break;
                        case "VS Code": 
                          gradientColors = "from-blue-500/20 to-blue-700/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">VS Code</div>;
                          break;
                        case "JetBrains": 
                          gradientColors = "from-purple-500/20 to-pink-600/20 border-purple-500/40"; 
                          icon = <div className="text-purple-500/80 mb-2 text-xl">JetBrains</div>;
                          break;
                        case "Docker": 
                          gradientColors = "from-blue-400/20 to-blue-600/20 border-blue-500/40"; 
                          icon = <div className="text-blue-400/80 mb-2 text-xl">Docker</div>;
                          break;
                        default: 
                          gradientColors = "from-gray-700/40 to-gray-900/40 border-gray-700"; 
                          break;
                      }
                      
                      return (
                        <motion.div
                          key={tool}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.05 * (i + (slide.langs?.length || 0) + 
                              (slide.frontendTools?.length || 0) + (slide.backendTools?.length || 0) + 
                              (slide.databaseTools?.length || 0)),
                          }}
                          className={`flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b ${gradientColors} rounded-lg border backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                          whileHover={{ scale: 1.03 }}
                        >
                          {icon}
                          <div className="text-lg font-semibold text-white">
                            {tool}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Design */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white px-1 flex items-center">
                    <div className="h-8 w-1 bg-pink-500/80 rounded-full mr-3"></div>
                    Design
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {slide.designTools?.map((tool, i) => {
                      // Assign a specific color based on the design tool
                      let gradientColors = "";
                      let icon = null;
                      
                      switch(tool) {
                        case "Adobe Illustrator": 
                          gradientColors = "from-orange-500/20 to-orange-700/20 border-orange-500/40"; 
                          icon = <div className="text-orange-500/80 mb-2 text-xl">Illustrator</div>;
                          break;
                        case "Adobe After Effects": 
                          gradientColors = "from-indigo-500/20 to-indigo-700/20 border-indigo-500/40"; 
                          icon = <div className="text-indigo-500/80 mb-2 text-xl">After Effects</div>;
                          break;
                        case "Adobe Photoshop": 
                          gradientColors = "from-blue-500/20 to-blue-700/20 border-blue-500/40"; 
                          icon = <div className="text-blue-500/80 mb-2 text-xl">Photoshop</div>;
                          break;
                        case "Adobe XD": 
                          gradientColors = "from-pink-500/20 to-pink-700/20 border-pink-500/40"; 
                          icon = <div className="text-pink-500/80 mb-2 text-xl">XD</div>;
                          break;
                        default: 
                          gradientColors = "from-gray-700/40 to-gray-900/40 border-gray-700"; 
                          break;
                      }
                      
                      return (
                        <motion.div
                          key={tool}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.05 * (i + (slide.langs?.length || 0) + 
                              (slide.frontendTools?.length || 0) + (slide.backendTools?.length || 0) + 
                              (slide.databaseTools?.length || 0) + (slide.devTools?.length || 0)),
                          }}
                          className={`flex flex-col items-center justify-center py-4 px-2 bg-gradient-to-b ${gradientColors} rounded-lg border backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1`}
                          whileHover={{ scale: 1.03 }}
                        >
                          {icon}
                          <div className="text-lg font-semibold text-white">
                            {tool}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "bedankt":
        return (
          <div className="flex flex-col items-center justify-center h-full w-full py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-4xl px-4"
            >
              <h2 className="text-5xl lg:text-6xl font-bold mb-10 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {slide.title}
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-16">
                {slide.content && slide.content[0]}
              </p>
              <div className="inline-block px-8 py-4 rounded-full bg-primary/20 border border-primary/50 text-primary text-xl">
                {slide.footer}
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <VideoBackground opacity={0.15} />

      <main className="flex-grow pt-16 pb-12 flex flex-col relative z-10">
        <Container maxWidth="6xl" className="flex-grow flex flex-col my-2">
          {/* PowerPoint style controls for desktop - top position */}
          <div className="hidden md:flex justify-between items-center mb-2 px-2">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="bg-gray-900/80 border-gray-700 hover:bg-gray-800 text-white"
              >
                <FaChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              <span className="text-sm text-gray-400 font-medium">
                Slide {currentSlide + 1} / {slides.length}
              </span>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentSlide === slides.length - 1}
                className="bg-gray-900/80 border-gray-700 hover:bg-gray-800 text-white"
              >
                Next <FaChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 mx-1 rounded-full cursor-pointer ${
                    idx === currentSlide ? "bg-primary" : "bg-gray-600"
                  }`}
                  onClick={() => {
                    setDirection(idx > currentSlide ? 1 : -1);
                    setCurrentSlide(idx);
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className="flex-grow flex flex-col relative"
            style={{ perspective: "1000px" }}
          >
            {/* Large Mobile Navigation Buttons (Absolute Positioned) */}
            <div className="absolute inset-y-0 left-0 z-20 flex items-center px-1">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                className="h-10 w-10 rounded-full bg-black/70 border-gray-700 hover:bg-gray-800 text-white md:hidden shadow-lg"
              >
                <FaChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute inset-y-0 right-0 z-20 flex items-center px-1">
              <Button
                variant="outline"
                size="lg"
                onClick={handleNext}
                disabled={currentSlide === slides.length - 1}
                className="h-10 w-10 rounded-full bg-black/70 border-gray-700 hover:bg-gray-800 text-white md:hidden shadow-lg"
              >
                <FaChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Slide Content with dynamic transition effects */}
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentSlide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full flex-grow perspective-1000"
              >
                <Card className="w-full h-full bg-gray-900/60 backdrop-blur-sm border-gray-800 overflow-auto">
                  <CardContent className="p-4 md:p-6 h-full flex items-center justify-center">
                    <div className="w-full">
                      {renderSlideContent(slides[currentSlide])}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Transition Effect Controls */}
            <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-xs bg-black/50 border-gray-700 text-gray-400"
              >
                Effect:{" "}
                {selectedEffect !== null
                  ? selectedEffect === 0
                    ? "Slide"
                    : selectedEffect === 1
                      ? "Fade"
                      : selectedEffect === 2
                        ? "Vertical"
                        : selectedEffect === 3
                          ? "Rotate"
                          : "Flip"
                  : getTransitionEffectIndex(currentSlide) === 0
                    ? "Slide"
                    : getTransitionEffectIndex(currentSlide) === 1
                      ? "Fade"
                      : getTransitionEffectIndex(currentSlide) === 2
                        ? "Vertical"
                        : getTransitionEffectIndex(currentSlide) === 3
                          ? "Rotate"
                          : "Flip"}
              </Badge>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 bg-black/50 border-gray-700 hover:bg-gray-800 text-white text-xs"
                  >
                    <FaMagic className="h-3 w-3 mr-1" /> Change
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-gray-900 border-gray-700">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-white mb-3">
                      Select Transition Effect
                    </h4>
                    {transitionEffects.map((_, index) => (
                      <Button
                        key={index}
                        variant={
                          selectedEffect === index ? "default" : "outline"
                        }
                        size="sm"
                        className={`w-full justify-start ${
                          selectedEffect === index
                            ? "bg-primary/90 hover:bg-primary"
                            : "bg-gray-800/80 border-gray-700 hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedEffect(index)}
                      >
                        {index === 0
                          ? "Slide Horizontal"
                          : index === 1
                            ? "Fade with Scale"
                            : index === 2
                              ? "Slide Vertical"
                              : index === 3
                                ? "Rotate & Fade"
                                : "3D Flip"}
                      </Button>
                    ))}
                    <Separator className="my-2 bg-gray-700" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start bg-gray-800/80 border-gray-700 hover:bg-gray-800"
                      onClick={() => setSelectedEffect(null)}
                    >
                      <FaRandom className="h-3 w-3 mr-2" /> Auto (Pattern)
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Mobile navigation indicators (bottom) */}
            <div className="md:hidden flex justify-center items-center mt-4 mb-2 px-4">
              <div className="flex">
                {slides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 mx-1 rounded-full cursor-pointer ${
                      idx === currentSlide ? "bg-primary" : "bg-gray-600"
                    }`}
                    onClick={() => {
                      setDirection(idx > currentSlide ? 1 : -1);
                      setCurrentSlide(idx);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
