"use client";

import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SendButton } from "./send-button";

type PromptInputContextType = {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
  textareaRef: React.createRef<HTMLTextAreaElement>(),
});

function usePromptInput() {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
}

type PromptInputProps = {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
};

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  children,
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TooltipProvider>
      <PromptInputContext.Provider
        value={{
          isLoading,
          value: value ?? internalValue,
          setValue: onValueChange ?? handleChange,
          maxHeight,
          onSubmit,
          textareaRef,
        }}
      >
        <motion.div
          animate={{
            scale: isFocused ? 1.005 : 1,
          }}
          transition={{
            duration: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn(
            "border-input bg-background cursor-text rounded-3xl border shadow-sm",
            "transition-all duration-200 transform-gpu will-change-transform",
            className
          )}
          onClick={() => textareaRef.current?.focus()}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <div className="p-2">{children}</div>
        </motion.div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
}

export type PromptInputTextareaProps = {
  disableAutosize?: boolean;
} & React.ComponentProps<typeof Textarea>;

function PromptInputTextarea({
  className,
  onKeyDown,
  disableAutosize = false,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled, textareaRef } =
    usePromptInput();
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;

    // Smooth height transition
    const element = textareaRef.current;
    element.style.transition = "height 0.15s cubic-bezier(0.16, 1, 0.3, 1)";
    element.style.height = "auto";

    const newHeight =
      typeof maxHeight === "number"
        ? Math.min(element.scrollHeight, maxHeight)
        : element.scrollHeight;

    element.style.height = `${newHeight}px`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle IME composition (for Asian languages)
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      className={cn(
        "min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none",
        "focus-visible:ring-0 focus-visible:ring-offset-0",
        "transition-all duration-150",
        "placeholder:text-gray-400 placeholder:transition-opacity",
        "focus:placeholder:opacity-60",
        className
      )}
      rows={1}
      disabled={disabled}
      {...props}
    />
  );
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({ children, className }: PromptInputActionsProps) {
  return (
    <motion.div
      className={cn("flex items-center gap-2", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

type PromptInputActionProps = {
  className?: string;
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
} & React.ComponentProps<typeof Tooltip>;

function PromptInputAction({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Tooltip {...props}>
      <TooltipTrigger
        asChild
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </TooltipTrigger>
      <AnimatePresence>
        {isHovered && (
          <TooltipContent
            side={side}
            className={cn(
              "backdrop-blur-xl bg-gray-900/95 text-white border-gray-700",
              className
            )}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {tooltip}
            </motion.div>
          </TooltipContent>
        )}
      </AnimatePresence>
    </Tooltip>
  );
}

type PromptInputSendProps = {
  theme?: "light" | "dark" | "system";
  size?: "sm" | "md" | "lg";
  className?: string;
};

function PromptInputSend({
  theme = "light",
  size = "md",
  className,
}: PromptInputSendProps) {
  const { value, onSubmit, disabled } = usePromptInput();

  return (
    <SendButton
      onClick={() => onSubmit?.()}
      disabled={disabled || !value.trim()}
      theme={theme}
      size={size}
      className={className}
    />
  );
}

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
  PromptInputSend,
};
