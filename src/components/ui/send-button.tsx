"use client";

import { ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  theme?: "light" | "dark" | "system";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const SendButton: React.FC<SendButtonProps> = ({
  onClick,
  disabled = false,
  theme = "light",
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        sizeClasses[size],
        disabled
          ? theme === "dark"
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : "bg-black/5 text-black/20 cursor-not-allowed"
          : theme === "dark"
          ? "bg-white text-black hover:bg-white/90 focus:ring-white/20 shadow-lg"
          : "bg-black text-white hover:bg-black/80 focus:ring-black/20 shadow-lg",
        className
      )}
      aria-label="Send message"
    >
      <ArrowUp
        className={cn(iconSizes[size], "transition-transform duration-150")}
      />
    </motion.button>
  );
};
