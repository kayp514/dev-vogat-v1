"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LogoProps {
  src?: string;
  fallback?: string;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  src = "/logo.svg",
  fallback = "V",
  title = "Vogat",
  className,
  size = "md",
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar
        className={cn(
          "rounded-md bg-primary text-primary-foreground",
          sizeClasses[size]
        )}
      >
        <AvatarImage src={src} alt={title} />
        <AvatarFallback className="font-semibold text-primary-foreground bg-primary">
          {fallback}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
