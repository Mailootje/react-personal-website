import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { scrollToElement } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; href: string }[];
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const [location] = useLocation();
  const { user } = useAuth();

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
            {items.map((item) => (
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
            
            {/* Admin link for logged-in users */}
            {user && (
              <Link href="/admin/blog">
                <motion.div
                  className="text-text hover:text-primary transition-colors font-medium py-2 cursor-pointer"
                  onClick={onClose}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  Admin
                </motion.div>
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
