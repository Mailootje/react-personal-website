import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function scrollToElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    // Add a slight delay to ensure DOM is ready
    setTimeout(() => {
      // Calculate position with offset for fixed header
      const headerHeight = 80; // Approximate header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
      
      // Scroll to the element with offset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }, 100);
  }
}

export function fadeInUpVariants(delay: number = 0) {
  return {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay
      }
    }
  };
}

export function staggerContainer(staggerChildren: number = 0.1, delayChildren: number = 0) {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren
      }
    }
  };
}
