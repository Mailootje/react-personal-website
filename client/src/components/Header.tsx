import { useEffect, useState } from "react";
import { Link } from "wouter";
import { navigationItems } from "@/lib/data";
import { MobileMenu } from "./MobileMenu";
import { scrollToElement } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const elementId = href.replace("#", "");
    scrollToElement(elementId);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-white/90 backdrop-blur-sm shadow-sm" : "bg-transparent"
    }`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <a 
          href="#hero" 
          className="text-xl font-bold text-primary flex items-center space-x-2"
          onClick={(e) => handleNavClick(e, "#hero")}
        >
          <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">JD</span>
          <span>John Doe</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navigationItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-text hover:text-primary transition-colors font-medium"
              onClick={(e) => handleNavClick(e, item.href)}
            >
              {item.name}
            </a>
          ))}
        </nav>
        
        {/* Mobile Navigation Toggle */}
        <button 
          className="md:hidden text-text hover:text-primary transition-colors focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <i className={`${mobileMenuOpen ? "ri-close-line" : "ri-menu-line"} text-2xl`}></i>
        </button>
      </div>
      
      {/* Mobile Navigation Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        items={navigationItems}
      />
    </header>
  );
}
