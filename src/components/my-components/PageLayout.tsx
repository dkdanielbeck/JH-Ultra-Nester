import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  title: ReactNode;
  description: ReactNode;
  inputContent?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PageLayout({
  title,
  description,
  inputContent,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div className={cn("flex flex-col max-h-[calc(100vh-100px)]", className)}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="mb-4">{description}</p>
        {inputContent}
      </div>
      {children}
    </div>
  );
}
