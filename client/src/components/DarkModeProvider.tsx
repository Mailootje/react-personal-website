import { useEffect } from "react";

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force dark mode by adding the 'dark' class to the HTML element
    document.documentElement.classList.add("dark");
    
    // Set background color via inline style to ensure it's pure black
    document.body.style.backgroundColor = "#000000";
    
    return () => {
      // Cleanup function (though this component should never unmount)
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "";
    };
  }, []);

  return <>{children}</>;
}