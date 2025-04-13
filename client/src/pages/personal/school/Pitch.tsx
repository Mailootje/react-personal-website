import { useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoBackground } from "@/components/VideoBackground";
import { RiPresentationFill } from "react-icons/ri";
import { FaGraduationCap, FaStar, FaLightbulb, FaPeopleArrows, FaRocket } from "react-icons/fa";

export default function SchoolPitch() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animation variants for sections
  const fadeInUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerChildrenVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <VideoBackground opacity={0.2} />
      
      <main className="flex-grow py-20 relative z-10">
        <Container maxWidth="lg">
          {/* Title Section */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex justify-center mb-4">
              <Badge className="px-4 py-1 text-sm bg-primary/20 text-primary border border-primary/50">
                Leerjaar 3
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              LOB Afrondende Pitch
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Een reflectie op mijn ontwikkeling als Software Developer en de volgende stappen in mijn carrière
            </p>
          </motion.div>

          {/* Presentation Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Section 1: Intro */}
            <motion.div
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              className="col-span-1"
            >
              <Card className="h-full bg-gray-900/80 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <FaGraduationCap className="text-primary text-3xl mr-4" />
                    <h2 className="text-2xl font-bold">Mijn Start &amp; Achtergrond</h2>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p>
                      Toen ik begon met de opleiding Software Developer, had ik beperkte ervaring met programmeren. 
                      Ik had wat basis HTML en CSS kennis, maar de wereld van applicatieontwikkeling was nieuw voor mij.
                    </p>
                    <p>
                      Ik koos voor deze richting vanwege mijn fascinatie voor technologie en mijn wens om zelf digitale oplossingen te kunnen bouwen.
                      De combinatie van logisch denken en creativiteit trok me aan.
                    </p>
                    <p>
                      Na het eerste jaar besloot ik jaar 2 opnieuw te doen, omdat ik vond dat ik onvoldoende lesmateriaal had gehad om met 
                      vertrouwen door te kunnen gaan. Deze beslissing heeft me uiteindelijk sterker gemaakt als developer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 2: Kwaliteiten */}
            <motion.div
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="col-span-1"
            >
              <Card className="h-full bg-gray-900/80 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <FaStar className="text-primary text-3xl mr-4" />
                    <h2 className="text-2xl font-bold">Mijn Kwaliteiten</h2>
                  </div>
                  <motion.ul 
                    className="space-y-3 text-gray-300"
                    variants={staggerChildrenVariant}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.li variants={fadeInUpVariant} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <span className="font-medium">Probleemoplossend vermogen</span> - Ik benader uitdagingen systematisch en zoek efficiënte oplossingen.
                      </div>
                    </motion.li>
                    <motion.li variants={fadeInUpVariant} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <span className="font-medium">Doorzettingsvermogen</span> - Ik blijf gefocust, ook bij complexe vraagstukken, tot ik de juiste oplossing vind.
                      </div>
                    </motion.li>
                    <motion.li variants={fadeInUpVariant} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <span className="font-medium">Adaptief leren</span> - Ik pik nieuwe programmeertalen en frameworks snel op en pas ze toe.
                      </div>
                    </motion.li>
                    <motion.li variants={fadeInUpVariant} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <span className="font-medium">Oog voor detail</span> - Ik let op kleine details in code die een groot verschil kunnen maken.
                      </div>
                    </motion.li>
                    <motion.li variants={fadeInUpVariant} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <div>
                        <span className="font-medium">Zelfreflectie</span> - Ik ben kritisch op mijn eigen werk en zoek actief naar verbetermogelijkheden.
                      </div>
                    </motion.li>
                  </motion.ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 3: Wat ik heb geleerd */}
            <motion.div
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 }}
              className="col-span-1"
            >
              <Card className="h-full bg-gray-900/80 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <FaLightbulb className="text-primary text-3xl mr-4" />
                    <h2 className="text-2xl font-bold">Wat Ik Heb Geleerd</h2>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p>
                      Tijdens mijn opleiding heb ik niet alleen technische vaardigheden opgedaan, maar ook veel over mezelf geleerd:
                    </p>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>
                        Ik werk het beste als ik een uitdaging stap voor stap aanpak, in plaats van alles in één keer te willen oplossen.
                      </li>
                      <li>
                        Fouten maken is een essentieel onderdeel van het leerproces; elk probleem is een kans om te groeien.
                      </li>
                      <li>
                        Ik presteer beter wanneer ik goed planmatig werk en duidelijke doelen stel.
                      </li>
                      <li>
                        Samenwerken en code reviews hebben me geleerd om open te staan voor feedback en andere perspectieven.
                      </li>
                      <li>
                        Het nemen van een stap terug wanneer ik vastloop, geeft vaak nieuwe inzichten.
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section 4: Wie heeft me geholpen */}
            <motion.div
              variants={fadeInUpVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="col-span-1"
            >
              <Card className="h-full bg-gray-900/80 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <FaPeopleArrows className="text-primary text-3xl mr-4" />
                    <h2 className="text-2xl font-bold">Mensen Die Me Hebben Geholpen</h2>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p>
                      Mijn ontwikkeling is sterk beïnvloed door verschillende mensen binnen de opleiding:
                    </p>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>
                        <span className="font-medium">Docenten</span> - Die verder gingen dan alleen de lesstof en praktijkvoorbeelden deelden.
                      </li>
                      <li>
                        <span className="font-medium">Mijn SLB'er</span> - Voor persoonlijke begeleiding en het helpen stellen van realistische doelen.
                      </li>
                      <li>
                        <span className="font-medium">Medestudenten</span> - Voor de samenwerking bij projecten en het delen van kennis en ervaringen.
                      </li>
                      <li>
                        <span className="font-medium">Stagebegeleiders</span> - Die me hebben laten zien hoe theorie in de praktijk wordt toegepast.
                      </li>
                    </ul>
                    <p>
                      Ik ben dankbaar voor de ondersteuning die ik heb gekregen, vooral tijdens moeilijke momenten en bij het verhelderen van complexe concepten.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Section 5: Toekomstplannen (Full Width) */}
          <motion.div
            variants={fadeInUpVariant}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.8 }}
            className="col-span-1 lg:col-span-2 mb-12"
          >
            <Card className="bg-gray-900/80 border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <FaRocket className="text-primary text-4xl mr-4" />
                  <h2 className="text-3xl font-bold">Mijn Plannen Voor Volgend Jaar</h2>
                </div>
                <div className="space-y-4 text-gray-300">
                  <p className="text-lg">
                    Na het afronden van mijn huidige opleiding, zie ik twee mogelijke paden voor mezelf:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="p-5 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-colors">
                      <h3 className="text-xl font-semibold mb-3 text-primary">Doorstromen naar HBO</h3>
                      <p>
                        Ik overweeg om door te studeren in de richting van HBO-ICT met specialisatie Software Engineering om mijn kennis verder te verdiepen 
                        en meer theoretische achtergrond te krijgen. Dit zou me voorbereiden op complexere en uitdagendere ontwikkelrollen.
                      </p>
                    </div>
                    
                    <div className="p-5 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-colors">
                      <h3 className="text-xl font-semibold mb-3 text-primary">Starten in het Werkveld</h3>
                      <p>
                        Ook overweeg ik om direct te beginnen als junior developer bij een bedrijf waar ik kan groeien en leren in een 
                        professionele omgeving. Ik ben vooral geïnteresseerd in webontwikkeling en zou me graag specialiseren in full-stack development.
                      </p>
                    </div>
                  </div>
                  
                  <p className="mt-6">
                    Ongeacht welk pad ik kies, blijf ik mezelf ontwikkelen door middel van online cursussen, persoonlijke projecten en 
                    het bijhouden van nieuwe technologieën. Mijn uiteindelijke doel is om een veelzijdige developer te worden die complexe 
                    problemen kan oplossen met elegante en efficiënte code.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Technische Vaardigheden (Skill Showcase) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mb-12"
          >
            <Card className="bg-gray-900/80 border-gray-800">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <RiPresentationFill className="text-primary text-3xl mr-3" />
                  Technische Vaardigheden
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Programming Languages */}
                  {['HTML/CSS', 'JavaScript', 'TypeScript', 'PHP', 'C#', 'SQL', 'Python', 'Java'].map((skill, i) => (
                    <motion.div 
                      key={skill}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * i }}
                      className="flex flex-col items-center justify-center p-4 bg-black/30 rounded-lg border border-gray-800 hover:border-primary/50 transition-all"
                    >
                      <div className="text-xl font-semibold mb-1 text-center">{skill}</div>
                      <div className="text-xs text-gray-400">Programmeertaal</div>
                    </motion.div>
                  ))}
                  
                  {/* Frameworks & Tools */}
                  {['React', 'Node.js', 'Laravel', 'ASP.NET', 'Git', 'VS Code', 'Docker'].map((skill, i) => (
                    <motion.div 
                      key={skill}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * (i + 8) }}
                      className="flex flex-col items-center justify-center p-4 bg-black/30 rounded-lg border border-gray-800 hover:border-primary/50 transition-all"
                    >
                      <div className="text-xl font-semibold mb-1 text-center">{skill}</div>
                      <div className="text-xs text-gray-400">Framework/Tool</div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Afsluiting */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bedankt voor uw aandacht!
            </h2>
            <p className="text-gray-400 mb-8">
              Ik kijk uit naar de volgende stappen in mijn carrière en ben dankbaar voor alle kennis en ervaring die ik tijdens mijn opleiding heb opgedaan.
            </p>
            <div className="inline-block px-6 py-3 rounded-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-colors">
              LOB Afrondende Pitch - Leerjaar 3
            </div>
          </motion.div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}