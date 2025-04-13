import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "./sections/Hero";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Projects from "./sections/Projects";
import Contact from "./sections/Contact";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";

export default function Home() {
  // Initialize intersection observer for animation
  const { observeElements } = useIntersectionObserver({
    rootMargin: '0px',
    threshold: 0.1,
    onIntersect: (entry) => {
      entry.target.classList.add('visible');
    }
  });

  useEffect(() => {
    // Observe all sections for animation
    const sections = document.querySelectorAll('.section');
    if (sections.length) {
      observeElements(sections);
    }
  }, [observeElements]);

  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
