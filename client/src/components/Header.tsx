import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { navigationItems } from "@/lib/data";
import { MobileMenu } from "./MobileMenu";
import { scrollToElement } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "./ThemeProvider";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If it's a standard navigation item (like Photography page)
    if (!href.startsWith('#')) {
      return; // Let the normal link navigation happen
    }
    
    // For hash navigation within the home page
    e.preventDefault();
    
    if (location !== '/') {
      // If we're not on the home page, navigate to home first with the hash
      window.location.href = "/" + href;
    } else {
      // Otherwise just scroll to the element
      const elementId = href.replace("#", "");
      scrollToElement(elementId);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? "bg-background/90 backdrop-blur-sm shadow-sm" 
        : "bg-transparent"
    }`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link 
          to="/"
          className="text-xl font-bold text-primary flex items-center space-x-2"
        >
          <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">JD</span>
          <span>John Doe</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex space-x-8">
            {navigationItems.map((item) => (
              item.href.startsWith('#') ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                  onClick={(e) => handleNavClick(e, item.href)}
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>
          <ThemeToggle />
        </div>
        
        {/* Mobile Nav and Theme Toggle */}
        <div className="md:hidden flex items-center space-x-4">
          <ThemeToggle />
          <button 
            className="text-foreground hover:text-primary transition-colors focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <i className={`${mobileMenuOpen ? "ri-close-line" : "ri-menu-line"} text-2xl`}></i>
          </button>
        </div>
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
