import { motion, AnimatePresence } from "framer-motion";
import { scrollToElement } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; href: string }[];
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const elementId = href.replace("#", "");
    scrollToElement(elementId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="md:hidden bg-white border-t"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
            {items.map((item) => (
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
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
