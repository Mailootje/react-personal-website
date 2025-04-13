import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { navigationItems } from "@/lib/data";
import { MobileMenu } from "./MobileMenu";
import { scrollToElement } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    // If it's a standard navigation item (like Photography page)
    if (!href.startsWith("#")) {
      return; // Let the normal link navigation happen
    }

    // For hash navigation within the home page
    e.preventDefault();

    if (location !== "/") {
      // If we're not on the home page, navigate to home first with the hash
      window.location.href = "/" + href;
    } else {
      // Otherwise just scroll to the element
      const elementId = href.replace("#", "");
      scrollToElement(elementId);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/90 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-primary flex items-center space-x-2"
        >
          <span className="w-8 h-8 rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-primary">
            <img 
              src="/assets/images/profile/profile-photo.webp" 
              alt="Mailo Bedo" 
              className="w-full h-full object-cover"
            />
          </span>
          <span>Mailo Bedo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navigationItems.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.name}
                href={item.href}
                className="text-text hover:text-primary transition-colors font-medium"
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="text-text hover:text-primary transition-colors font-medium"
              >
                {item.name}
              </Link>
            ),
          )}
        </nav>

        {/* Mobile Navigation Toggle */}
        <button
          className="md:hidden text-text hover:text-primary transition-colors focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <i
            className={`${mobileMenuOpen ? "ri-close-line" : "ri-menu-line"} text-2xl`}
          ></i>
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
