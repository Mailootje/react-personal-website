import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { scrollToElement } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { mainNavigationItems, additionalNavigationItems } from "@/lib/data";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If it's a regular page link, not a hash/anchor
    if (!href.startsWith('#')) {
      onClose();
      return; // Let normal navigation happen
    }
    
    // For anchor links
    e.preventDefault();
    
    if (location !== '/') {
      // If we're not on the home page, navigate to home first with the hash
      window.location.href = "/" + href;
    } else {
      // Otherwise just scroll to the element
      const elementId = href.replace("#", "");
      scrollToElement(elementId);
    }
    
    onClose();
  };

  const toggleMoreSection = () => {
    setIsMoreExpanded(!isMoreExpanded);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="md:hidden bg-black border-t border-gray-800"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
            {/* Main navigation items */}
            {mainNavigationItems.map((item) => (
              item.href.startsWith('#') ? (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-text hover:text-primary transition-colors font-medium py-2"
                  onClick={(e) => handleClick(e, item.href)}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.name}
                </motion.a>
              ) : (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer"
                    onClick={onClose}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.name}
                  </motion.div>
                </Link>
              )
            ))}
            
            {/* More section with dropdown */}
            <motion.div
              className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer"
              onClick={toggleMoreSection}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <span>More</span>
                <i className={`ri-arrow-down-s-line transition-transform ${isMoreExpanded ? 'rotate-180' : ''}`}></i>
              </div>
            </motion.div>
            
            {/* Additional navigation items (collapsible) */}
            <AnimatePresence>
              {isMoreExpanded && (
                <motion.div
                  className="flex flex-col pl-4 space-y-3"
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: "auto", opacity: 1, marginTop: 4 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {additionalNavigationItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <motion.div
                        className="text-text hover:text-primary transition-colors font-medium py-1 cursor-pointer text-sm"
                        onClick={onClose}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-primary">➤</span> {item.name}
                      </motion.div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* User profile link for logged-in users */}
            {user && (
              <Link href="/profile">
                <motion.div
                  className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer flex items-center gap-2"
                  onClick={onClose}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-primary">
                    {user.profileImageData ? (
                      <img 
                        src={user.profileImageData} 
                        alt={user.username}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="bg-primary/20 w-full h-full flex items-center justify-center text-xs text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  Profile
                </motion.div>
              </Link>
            )}
            
            {/* Admin links for admin users only */}
            {user && user.isAdmin && (
              <>
                <Link href="/admin">
                  <motion.div
                    className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer"
                    onClick={onClose}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Admin Dashboard
                  </motion.div>
                </Link>
                <Link href="/admin/blog">
                  <motion.div
                    className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer pl-4 text-sm"
                    onClick={onClose}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ⟢ Blog Manager
                  </motion.div>
                </Link>
                <Link href="/admin/links">
                  <motion.div
                    className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer pl-4 text-sm"
                    onClick={onClose}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ⟢ Shortened Links
                  </motion.div>
                </Link>
                <Link href="/admin/counters">
                  <motion.div
                    className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer pl-4 text-sm"
                    onClick={onClose}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    ⟢ Conversion Counters
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
