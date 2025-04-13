import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Skills } from "@/sections/Skills";
import { Projects } from "@/sections/Projects";
import { Resume } from "@/sections/Resume";
import { Contact } from "@/sections/Contact";
import { scrollToElement } from "@/lib/utils";

export default function Home() {
  console.log("Home: Rendering Home component");
  
  useEffect(() => {
    console.log("Home: Home component mounted");
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Check for hash in URL and scroll to that section
    const handleHashInUrl = () => {
      const hash = window.location.hash;
      console.log("Home: Checking hash:", hash);
      if (hash) {
        // Remove the # symbol and scroll to the element with that ID
        const elementId = hash.replace("#", "");
        // Use a short timeout to ensure the page is fully loaded
        setTimeout(() => {
          scrollToElement(elementId);
        }, 500);
      }
    };
    
    // Call once when component mounts
    handleHashInUrl();
    
    // Listen for hash changes
    window.addEventListener("hashchange", handleHashInUrl);
    
    // Implement section reveal animation on scroll
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in");
        }
      });
    };
    
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      observer.observe(section);
    });
    
    return () => {
      // Clean up
      window.removeEventListener("hashchange", handleHashInUrl);
      sections.forEach((section) => {
        observer.unobserve(section);
      });
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="font-sans bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Resume />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
