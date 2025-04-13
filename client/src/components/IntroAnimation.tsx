import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { personalInfo } from "@/lib/data";

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [animationStage, setAnimationStage] = useState<"initial" | "zooming" | "complete">("initial");
  
  useEffect(() => {
    // Start zoom animation after a short delay
    const timer1 = setTimeout(() => {
      setAnimationStage("zooming");
    }, 1500); // Give a bit more time to read the initial text
    
    // Complete animation after zoom finishes
    const timer2 = setTimeout(() => {
      setAnimationStage("complete");
      onComplete();
    }, 4000); // Total animation duration
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);
  
  return (
    <AnimatePresence>
      {animationStage !== "complete" && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black z-50 overflow-hidden"
          initial={{ opacity: 1 }}
          animate={animationStage === "zooming" ? { opacity: 0 } : { opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        >
          {/* The zooming circle */}
          <motion.div
            className="relative w-[60vmin] h-[60vmin] rounded-full"
            initial={{ scale: 0.1, rotate: -10 }}
            animate={
              animationStage === "zooming" 
                ? { scale: 30, rotate: 0 } 
                : { scale: 0.1, rotate: -10 }
            }
            transition={{ 
              duration: 2.5, 
              ease: [0.16, 1, 0.3, 1], // Custom cubic bezier for smoother animation
              scale: { type: "spring", stiffness: 50, damping: 15 }
            }}
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #9333ea 50%, #ec4899 100%)" 
            }}
          >
            {/* Text that fades out as zoom begins */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 1 }}
              animate={animationStage === "zooming" ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="text-white text-center px-4">
                <h1 className="text-5xl font-bold text-white mb-2">
                  {personalInfo.name.split(' ')[0]}
                </h1>
                <div className="h-1 w-16 bg-white mx-auto mb-4 rounded-full"></div>
                <p className="mt-2 text-xl text-gray-100">
                  Portfolio
                </p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Floating elements to enhance the 3D effect */}
          <motion.div
            className="absolute w-24 h-24 rounded-full bg-indigo-600/20 blur-xl"
            initial={{ x: -100, y: 100 }}
            animate={{ x: -150, y: 150 }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-purple-600/20 blur-xl"
            initial={{ x: 100, y: -100 }}
            animate={{ x: 150, y: -150 }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-pink-600/20 blur-xl"
            initial={{ x: 120, y: 120 }}
            animate={{ x: 180, y: 180 }}
            transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}