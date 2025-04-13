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
          className="md:hidden bg-white border-t shadow-md"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-6 py-4 flex flex-col space-y-3">
            {items.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium py-3 px-2 text-center uppercase text-sm tracking-wide"
                onClick={(e) => handleClick(e, item.href)}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
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
