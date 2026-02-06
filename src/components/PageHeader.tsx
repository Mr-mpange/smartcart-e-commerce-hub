import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  children?: ReactNode;
  overlay?: "dark" | "primary" | "gradient";
}

export const PageHeader = ({ 
  title, 
  subtitle, 
  backgroundImage, 
  children,
  overlay = "dark" 
}: PageHeaderProps) => {
  const overlayClasses = {
    dark: "bg-black/60",
    primary: "bg-primary/80",
    gradient: "bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      </div>
      
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-lg text-white/90 mb-6">
            {subtitle}
          </p>
          {children && (
            <div className="flex flex-wrap gap-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
