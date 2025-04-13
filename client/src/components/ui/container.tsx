import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "5xl" | "6xl";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  full: "max-w-full",
};

export function Container({ 
  children, 
  maxWidth = "6xl", 
  className, 
  ...props 
}: ContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto px-6",
        maxWidthMap[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
