import { useEffect, useState } from "react";
import { navigationItems } from "@/lib/data";
import { scrollToElement } from "@/lib/utils";

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user previously set dark mode
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(storedDarkMode);
    
    if (storedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const elementId = href.replace("#", "");
      scrollToElement(elementId);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    
    // Toggle hamburger menu animation class
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
      navToggle.classList.toggle('is-active');
    }
  };

  return (
    <nav className="custom-navbar" data-spy="affix" data-offset-top="20">
      <div className="container">
        <a className="logo" href="#"></a>
        <ul className={`nav ${mobileMenuOpen ? 'show' : ''}`}>
          {navigationItems.map((item) => (
            <li key={item.name} className="item">
              <a 
                className="link" 
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.name}
              </a>
            </li>
          ))}
          <li className="item dark-mode-slider">
            <div 
              className="slider" 
              id="dark-mode-slider"
              onClick={toggleDarkMode}
              style={{ backgroundColor: darkMode ? '#333' : '#ddd' }}
            >
              <div 
                className="slider-button" 
                style={{ 
                  transform: darkMode ? 'translateX(20px)' : 'translateX(0)',
                  backgroundColor: darkMode ? '#fff' : '#888'
                }}
              ></div>
            </div>
          </li>
        </ul>
        <a 
          href="javascript:void(0)" 
          id="nav-toggle" 
          className={`hamburger hamburger--elastic ${mobileMenuOpen ? 'is-active' : ''}`}
          onClick={toggleMobileMenu}
        >
          <div className="hamburger-box">
            <div className="hamburger-inner"></div>
          </div>
        </a>
      </div>
    </nav>
  );
}
