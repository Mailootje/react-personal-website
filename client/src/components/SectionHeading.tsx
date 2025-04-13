import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SectionHeadingProps {
  subtitle: string;
  title: string;
  center?: boolean;
  className?: string;
}

export default function SectionHeading({
  subtitle,
  title,
  center = true,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-16", center && "text-center", className)}>
      <motion.h6 
        className="text-accent font-medium mb-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {subtitle}
      </motion.h6>
      
      <motion.h2 
        className="text-3xl md:text-4xl font-bold mb-4"
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
