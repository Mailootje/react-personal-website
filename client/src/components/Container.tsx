import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

export default function Container({
  children,
  maxWidth = "xl",
  className = "",
}: ContainerProps) {
  const maxWidthClass = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("mx-auto px-4", maxWidthClass[maxWidth], className)}>
      {children}
    </div>
  );
}