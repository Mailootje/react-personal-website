import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { mainNavigationItems, additionalNavigationItems } from "@/lib/data";
import { MobileMenu } from "./MobileMenu";
import { scrollToElement } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

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

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
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
            {user?.profileImageData ? (
              <img 
                src={user.profileImageData} 
                alt={user.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src="/assets/images/profile/profile-photo.webp" 
                alt="Mailo Bedo" 
                className="w-full h-full object-cover"
              />
            )}
          </span>
          <span>Mailo Bedo</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {/* Main Navigation Items */}
          {mainNavigationItems.map((item) => (
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
            )
          ))}
          
          {/* More Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="flex items-center text-text hover:text-primary transition-colors font-medium"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              More
              <i className={`ri-arrow-down-s-line ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}></i>
            </button>
            
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-black border border-gray-800 ring-1 ring-black ring-opacity-5 z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  role="menu"
                  aria-orientation="vertical"
                >
                  {additionalNavigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="block px-4 py-2 text-sm text-text hover:text-primary hover:bg-gray-900 transition-colors">
                        {item.name}
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* User profile link for logged-in users */}
          {user && (
            <Link
              href="/profile"
              className="text-text hover:text-primary transition-colors font-medium"
            >
              Profile
            </Link>
          )}
          
          {/* Admin link for admin users only */}
          {user && user.isAdmin && (
            <Link
              href="/admin"
              className="text-text hover:text-primary transition-colors font-medium"
            >
              Admin Dashboard
            </Link>
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
      />
    </header>
  );
}
