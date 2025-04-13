import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/sections/Hero";
import { About } from "@/sections/About";
import { Skills } from "@/sections/Skills";
import { Projects } from "@/sections/Projects";
import { Blog } from "@/sections/Blog";
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

    // Implement text animation for js-animate-element classes
    const animateElements = document.querySelectorAll('.js-animate-element');
    animateElements.forEach((el, index) => {
      const element = el as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      setTimeout(() => {
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 100 * index);
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
    <div className="font-sans bg-background text-foreground scrollbar" data-spy="scroll" data-target=".navbar" data-offset="40" id="home">
      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <Blog />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
