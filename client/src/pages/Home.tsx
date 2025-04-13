import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Skills } from "@/sections/Skills";
import { Projects } from "@/sections/Projects";
import { Resume } from "@/sections/Resume";
import { Contact } from "@/sections/Contact";

export default function Home() {
  useEffect(() => {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = "smooth";
    
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
