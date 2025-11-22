"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

interface ScrollButtonProps {
  className?: string;
}

export function ScrollButton({ className }: ScrollButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('[role="log"]');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight > 100;
      setIsVisible(isNearBottom);
    };

    const scrollContainer = document.querySelector('[role="log"]');
    scrollContainer?.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToBottom = () => {
    const scrollContainer = document.querySelector('[role="log"]');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToBottom}
      size="icon"
      variant="outline"
      className={cn(
        "rounded-full bg-background/95 backdrop-blur-sm shadow-md hover:shadow-lg transition-all",
        className
      )}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}
