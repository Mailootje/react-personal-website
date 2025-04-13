import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const AnimatedExperience = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFooter, setShowFooter] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start", "end"]
  });

  // Track when animation completes to show footer
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      if (value >= 0.95) {
        setShowFooter(true);
      }
    });
    
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Apply different transformations based on scroll progress
  const blackOverlayOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const profileScale = useTransform(scrollYProgress, [0.1, 0.2], [1, 1.5]);
  const profileOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.3, 0.4], [0, 1, 1, 0]);
  
  const eyeZoomScale = useTransform(scrollYProgress, [0.3, 0.4], [0, 1]);
  const eyeOpacity = useTransform(scrollYProgress, [0.3, 0.4, 0.5, 0.6], [0, 1, 1, 0]);
  
  const lightSpeedScale = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);
  const lightSpeedOpacity = useTransform(scrollYProgress, [0.5, 0.6, 0.7, 0.8], [0, 1, 1, 0]);
  
  const circleScale = useTransform(scrollYProgress, [0.7, 0.8], [0, 1]);
  const circleOpacity = useTransform(scrollYProgress, [0.7, 0.8, 0.9, 1], [0, 1, 1, 0]);
  
  const finalContentOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1]);

  return (
    <>
      <Header />
      <div 
        ref={containerRef} 
        className="h-[500vh] relative overflow-hidden"
      >
        {/* Initial Black Screen with Text */}
        <motion.div 
          className="fixed inset-0 bg-black flex items-center justify-center"
          style={{ opacity: blackOverlayOpacity }}
        >
          <div className="text-white text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Scroll to Experience</h1>
            <p className="text-xl">A journey through animations</p>
          </div>
        </motion.div>
        
        {/* Orange Profile Silhouette */}
        <motion.div 
          className="fixed inset-0 bg-amber-500 flex items-center justify-center"
          style={{ 
            opacity: profileOpacity,
            scale: profileScale
          }}
        >
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="text-white absolute top-1/4 left-1/4 z-10">
              <h2 className="text-5xl md:text-7xl font-bold mb-2">
                A new era of
              </h2>
              <h2 className="text-5xl md:text-7xl font-bold mb-6">
                personal websites
              </h2>
              <p className="text-xl md:text-2xl max-w-md">
                The world's most advanced interactive portfolio to showcase your skills and projects
              </p>
              <button className="mt-8 bg-white text-amber-500 px-6 py-3 rounded-md font-medium">
                EXPLORE NOW
              </button>
            </div>
            <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-[70vh] w-full rounded-3xl">
              {/* Silhouette shape created with gradient and shadow */}
              <div className="h-full w-full bg-amber-400 opacity-50 rounded-3xl"></div>
            </div>
          </div>
        </motion.div>
        
        {/* Eye Close-up */}
        <motion.div 
          className="fixed inset-0 bg-amber-500 flex items-center justify-center"
          style={{ 
            opacity: eyeOpacity,
            scale: eyeZoomScale
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-[60vh] h-[60vh] rounded-full bg-gradient-to-r from-amber-700 to-amber-400 flex items-center justify-center">
              <div className="w-[30vh] h-[30vh] rounded-full bg-amber-900 flex items-center justify-center">
                <div className="w-[15vh] h-[15vh] rounded-full bg-black flex items-center justify-center">
                  <div className="w-[5vh] h-[5vh] rounded-full bg-white opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Light Speed Effect */}
        <motion.div 
          className="fixed inset-0 bg-black flex items-center justify-center"
          style={{ 
            opacity: lightSpeedOpacity
          }}
        >
          <div className="relative w-full h-full overflow-hidden">
            {/* Light beams */}
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute top-1/2 left-1/2"
                style={{ 
                  width: '4px',
                  height: `${Math.random() * 70 + 30}vh`,
                  background: `${getRandomColor()}`,
                  transformOrigin: 'center top',
                  rotate: `${i * 6}deg`,
                  scale: lightSpeedScale
                }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Circle Effect */}
        <motion.div 
          className="fixed inset-0 bg-black flex items-center justify-center"
          style={{ 
            opacity: circleOpacity
          }}
        >
          <motion.div 
            className="relative w-[80vh] h-[80vh] flex items-center justify-center"
            style={{
              scale: circleScale
            }}
          >
            <div className="absolute inset-0 rounded-full border-[15px] border-cyan-400 opacity-70"></div>
            <div className="absolute inset-[30px] rounded-full border-[15px] border-purple-400 opacity-70"></div>
            <div className="absolute inset-[60px] rounded-full border-[15px] border-yellow-400 opacity-70"></div>
            <div className="absolute inset-[90px] rounded-full border-[15px] border-green-400 opacity-70"></div>
            <div className="absolute inset-[120px] rounded-full border-[15px] border-pink-400 opacity-70"></div>
            <div className="absolute inset-[150px] rounded-full bg-black"></div>
          </motion.div>
        </motion.div>
        
        {/* Final Content */}
        <motion.div 
          className="fixed inset-0 bg-white flex items-center justify-center"
          style={{ 
            opacity: finalContentOpacity
          }}
        >
          <div className="text-center max-w-4xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-gray-900">
              The most complete picture of<br/> 
              your portfolio you've ever had
            </h2>
            
            <div className="bg-gray-900 rounded-3xl p-6 md:p-10 w-full max-w-3xl mx-auto shadow-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-white">
                  <h3 className="font-medium">Skills Showcase</h3>
                  <div className="h-2 w-full bg-gray-700 rounded-full mt-2">
                    <div className="h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full w-[85%]"></div>
                  </div>
                </div>
                
                <div className="bg-amber-500 rounded-xl p-4 text-white">
                  <h3 className="font-medium">Experience</h3>
                  <div className="text-3xl font-bold">8+</div>
                  <div className="text-sm">years of professional work</div>
                </div>
                
                <div className="bg-gray-800 rounded-xl p-4 text-white col-span-2">
                  <h3 className="font-medium">Featured Projects</h3>
                  <div className="flex gap-2 mt-2">
                    <div className="h-3 w-3 rounded-full bg-cyan-400"></div>
                    <div className="h-3 w-3 rounded-full bg-purple-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    <div className="h-3 w-3 rounded-full bg-pink-400"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex justify-center gap-4">
              <button className="bg-pink-500 text-white px-6 py-3 rounded-full">
                Home
              </button>
              <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full">
                Services
              </button>
              <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full">
                Action Plan
              </button>
              <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full">
                Portfolio
              </button>
              <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full">
                Contact
              </button>
            </div>
            
            <p className="mt-10 text-gray-500 text-lg">
              Combining impressive visuals, interactive elements<br/>
              and personalized website experience.
            </p>
          </div>
        </motion.div>
      </div>
      
      {showFooter && <Footer />}
    </>
  );
};

// Helper function to get random colors for light beams
function getRandomColor() {
  const colors = [
    'rgb(34, 211, 238)', // cyan-400
    'rgb(192, 132, 252)', // purple-400
    'rgb(250, 204, 21)', // yellow-400
    'rgb(74, 222, 128)', // green-400
    'rgb(244, 114, 182)', // pink-400
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default AnimatedExperience;