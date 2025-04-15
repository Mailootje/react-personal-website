import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface SectionHeadingProps {
  subtitle: string;
  title: string;
  description?: string;
  center?: boolean;
  className?: string;
  isDark?: boolean;
}

export default function SectionHeading({
  subtitle,
  title,
  description,
  center = true,
  className,
  isDark = false,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-16", center && "text-center", className)}>
      <motion.h6 
        className={cn("font-medium mb-2", isDark ? "text-green-400" : "text-accent")}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {subtitle}
      </motion.h6>
      
      <motion.h2 
        className={cn("text-3xl md:text-4xl font-bold mb-4", isDark && "text-white")}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      
      <motion.div 
        className="w-20 h-1 bg-primary rounded-full mx-auto"
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
    </div>
  );
}
