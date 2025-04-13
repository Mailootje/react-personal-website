import { useState, useEffect } from 'react';

/**
 * A hook that tracks which section is currently in the viewport
 * @param sectionIds An array of section IDs to track
 * @param offset Offset from the top of the viewport to consider a section in view
 * @returns The ID of the active section
 */
export function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Find the section that is currently in viewport
      const currentSection = sectionIds.find((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          return rect.top <= offset && rect.bottom >= offset;
        }
        return false;
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    // Initialize
    handleScroll();

    // Attach scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionIds, offset]);

  return activeSection;
}
