import React, { useState, useRef, useEffect } from "react";
import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  Mic,
  Sparkle,
  Brain,
  Square,
  Paperclip,
  X,
  Copy,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import Toolbar from "./Toolbar";
import { VerticalDock } from "./SendDock";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import GPTCarousel from "../Orb/GPTCarousel";
import Scene from "../Orb/Scene";
import { useDictation } from "@/services/dictation";
import ActionAnimation from "./ActionAnimation";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import { cn } from "@/lib/utils";
import { StickToBottom } from "use-stick-to-bottom";

// Types
type Message = {
  id: number;
  sender: "user" | "assistant";
  text?: string;
  actionType?: "plex" | "youtube-download" | "youtube-search" | "web-search";
  plexVideo?: {
    type: "plex_video";
    title: string;
    videoSrc: string;
    thumbnailSrc: string;
    thumbnailAlt: string;
    plexWebUrl: string;
    duration?: string;
    library?: string;
    message: string;
  };
};

// Chat Messages Component Props
type ChatMessagesProps = {
  messages: Message[];
  theme: "light" | "dark" | "system";
  isTyping?: boolean;
  className?: string;
};

// Input Box Component Props
type InputBoxProps = {
  sidebarOffset: number;
  theme: "light" | "dark" | "system";
  input: string;
  setInput: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setModel: (model: string) => void;
  model: string;
  sendMessage: () => void;
  useMistral: boolean;
  setUseMistral: (val: boolean) => void;
  useVoice: boolean;
  setUseVoice: (val: boolean) => void;
  onToggleMemoryTree: () => void;
  memoryTreeVisible: boolean;
  onMemoryTest: () => void;
  className?: string;
};

// Combined Component Props
type UnifiedChatProps = {
  // Chat Messages Props
  messages: Message[];
  isTyping?: boolean;

  // Input Box Props
  sidebarOffset: number;
  input: string;
  setInput: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setModel: (model: string) => void;
  model: string;
  sendMessage: () => void;
  useMistral: boolean;
  setUseMistral: (val: boolean) => void;
  useVoice: boolean;
  setUseVoice: (val: boolean) => void;
  onToggleMemoryTree: () => void;
  memoryTreeVisible: boolean;
  onMemoryTest: () => void;

  // Shared Props
  theme: "light" | "dark" | "system";

  // Layout Props - let parent control layout
  messagesClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
};

// Chat Container Components
function ChatContainerRoot({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <StickToBottom
      className={cn("flex overflow-y-auto h-full bg-[#ffffff]", className)}
      resize="smooth"
      initial="smooth"
      role="log"
      {...props}
    >
      {children}
    </StickToBottom>
  );
}

function ChatContainerContent({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <StickToBottom.Content
      className={cn("flex w-full flex-col", className)}
      {...props}
    >
      {children}
    </StickToBottom.Content>
  );
}

function ChatContainerScrollAnchor({
  className,
  ...props
}: {
  className?: string;
  ref?: React.RefObject<HTMLDivElement>;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-px w-full shrink-0 scroll-mt-4", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

// Models configuration
const models = [
  { id: "Groq", label: "G", color: "rgb(249 115 22)" },
  { id: "Groq-LLaMA3-70B", label: "M", color: "rgb(59 130 246)" },
  { id: "Chat GPT 3.5", label: "3.5", color: "rgb(34 197 94)" },
  { id: "Chat GPT 4.1", label: "4.1", color: "rgba(247, 255, 96, 0.95)" },
  { id: "Claude", label: "C", color: "rgb(255 86 48)" },
];

// Typing Indicator Component
const TypingIndicator: React.FC = () => (
  <div className="flex items-center justify-start 4 py-3 max-w-[75%]">
    <span className="w-3 h-3 bg-white rounded-full animate-pulseIndicator" />
  </div>
);

// Separate Chat Messages Component
const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  theme,
  isTyping,
  className,
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

  // Add this effect to trigger scroll when messages change
  useEffect(() => {
    // This will trigger StickToBottom to scroll
  }, [messages, isTyping]);

  useEffect(() => {
    if (copiedMessageId !== null) {
      const timer = setTimeout(() => setCopiedMessageId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  const handleCopyClick = async (id: number, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedMessageId(id);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <ChatContainerRoot className={cn("w-full", className)}>
      <ChatContainerContent className="w-full max-w-full md:max-w-[800px] mx-auto px-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`group my-2 flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            } relative`}
          >
            {msg.plexVideo ? (
              <div className="w-full max-w-2xl">
                <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  {msg.plexVideo.message}
                </div>
                <HeroVideoDialog
                  videoSrc={msg.plexVideo.videoSrc}
                  thumbnailSrc={msg.plexVideo.thumbnailSrc}
                  thumbnailAlt={msg.plexVideo.thumbnailAlt}
                  animationStyle="from-center"
                  className="w-full"
                />
                <div className="mt-2 text-xs text-gray-500">
                  <a
                    href={msg.plexVideo.plexWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Open in Plex web interface ↗
                  </a>
                </div>
              </div>
            ) : msg.actionType ? (
              <ActionAnimation
                type={msg.actionType}
                isActive={true}
                onComplete={() => {}}
              />
            ) : (
              <div
                className={`whitespace-pre-wrap break-words text-left leading-relaxed text-base ${
                  msg.sender === "user"
                    ? theme === "dark"
                      ? "bg-[#212121] text-white rounded-3xl px-5 py-3 shadow-sm max-w-[75%]"
                      : "bg-gray-200 text-black rounded-3xl px-5 py-3 shadow-sm max-w-[75%]"
                    : theme === "dark"
                    ? "bg-transparent text-white rounded-3xl px-5 py-3 shadow-sm"
                    : "bg-transparent text-black rounded-3xl px-5 py-3"
                }`}
              >
                <MarkdownRenderer>{msg.text}</MarkdownRenderer>
              </div>
            )}

            {!msg.actionType && (
              <button
                onClick={() => handleCopyClick(msg.id, msg.text!)}
                aria-label="Copy message"
                disabled={copiedMessageId === msg.id}
                className="mt-3 inline-flex h-7 w-7 items-center justify-center rounded-md border-0 dark:border-zinc-700 bg-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`h-4 w-4 text-white transition-all duration-200 ${
                    copiedMessageId === msg.id
                      ? "scale-110 opacity-100"
                      : "opacity-80"
                  }`}
                >
                  {copiedMessageId === msg.id ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <rect x="3" y="3" width="13" height="13" rx="2" ry="2" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="group my-2 flex flex-col items-start">
            <TypingIndicator />
          </div>
        )}

        <ChatContainerScrollAnchor />
      </ChatContainerContent>
    </ChatContainerRoot>
  );
};

// Separate Input Box Component
// Replace the InputBox component in your second file with this styled version

const InputBox: React.FC<InputBoxProps> = ({
  sidebarOffset,
  theme,
  input,
  setInput,
  handleKeyDown,
  setModel,
  model,
  sendMessage,
  useMistral,
  setUseMistral,
  useVoice,
  setUseVoice,
  onToggleMemoryTree,
  memoryTreeVisible,
  onMemoryTest,
  className,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showDock, setShowDock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Orb dictation state
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const { isDictating, isListening, startDictation, stopDictation } =
    useDictation({ setInput });

  const currentModel = models.find((m) => m.id === model);
  const navigate = useNavigate();
  const [isNotesHolding, setIsNotesHolding] = useState(false);
  const notesHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const [charUsage, setCharUsage] = useState<{
    used: number;
    limit: number;
  } | null>(null);
  const [showCharPopup, setShowCharPopup] = useState(false);
  const micHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [openNote, setOpenNote] = useState<null | {
    id: string;
    title: string;
    content: string;
  }>(null);

  // Timeout refs
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);
  const sparkleHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);

  // Add new state for tools visibility
  const [showTools, setShowTools] = useState(false);

  // All the handler functions (keeping all existing logic)
  const fetchCharacterUsage = async () => {
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/user", {
        method: "GET",
        headers: {
          "xi-api-key": "sk_...",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      setCharUsage({
        used: data?.character_count || 0,
        limit: data?.character_limit || 0,
      });
      setShowCharPopup(true);
      setTimeout(() => setShowCharPopup(false), 3000);
    } catch (err) {
      console.error("Failed to fetch character usage", err);
    }
  };

  const handleMicHoldStart = () => {
    micHoldTimeout.current = setTimeout(() => {
      fetchCharacterUsage();
    }, 600);
  };

  const handleMicHoldEnd = () => {
    if (micHoldTimeout.current) {
      clearTimeout(micHoldTimeout.current);
      micHoldTimeout.current = null;
    }
  };

  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => {
      setShowDock(true);
    }, 400);
  };

  const handleMouseUp = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    if (!showDock) {
      handleSubmit();
    }
    setShowDock(false);
  };

  const cycleModel = () => {
    const currentIndex = models.findIndex((m) => m.id === model);
    const nextIndex = (currentIndex + 1) % models.length;
    setModel(models[nextIndex].id);
  };

  const handleSparkleMouseDown = () => {
    sparkleHoldTimeout.current = setTimeout(() => {
      setUseMistral((prev) => !prev);
      sparkleHoldTimeout.current = null;
    }, 600);
  };

  const handleSparkleMouseUp = () => {
    if (sparkleHoldTimeout.current) {
      clearTimeout(sparkleHoldTimeout.current);
      sparkleHoldTimeout.current = null;
      clickCount.current++;
      if (clickCount.current === 1) {
        clickTimeout.current = setTimeout(() => {
          cycleModel();
          clickCount.current = 0;
        }, 250);
      } else if (clickCount.current === 2) {
        clearTimeout(clickTimeout.current!);
        setShowToolbar((prev) => !prev);
        clickCount.current = 0;
      }
    }
  };

  const handleNotesMouseDown = () => {
    setIsNotesHolding(true);
    notesHoldTimeout.current = setTimeout(() => {
      navigate("/luma");
    }, 600);
  };

  const handleNotesMouseUp = () => {
    setIsNotesHolding(false);
    if (notesHoldTimeout.current) {
      clearTimeout(notesHoldTimeout.current);
      notesHoldTimeout.current = null;
    }
  };

  const toggleCarousel = () => {
    setShowCarousel((prev) => !prev);
  };

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      setIsLoading(true);
      sendMessage();
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      animate={{ x: sidebarOffset }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full px-6 pt-3 pb-3 mb-3 z-50 mx-auto max-w-[400px]",
        theme === "dark"
          ? "bg-gray-800/50 backdrop-blur-xl border border-gray-700/50"
          : "bg-white/80 backdrop-blur-xl border border-gray-200/50",
        "rounded-2xl sm:rounded-3xl overflow-visible h-auto shadow-2xl",
        className
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative w-full max-w-[800px] mx-auto">
        {/* File attachments */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 sm:pb-3">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${
                  theme === "dark"
                    ? "bg-gray-700/50 text-gray-300"
                    : "bg-gray-200/50 text-gray-700"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="max-w-[100px] sm:max-w-[120px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className={`rounded-full p-0.5 sm:p-1 transition-colors ${
                    theme === "dark"
                      ? "hover:bg-gray-600/50"
                      : "hover:bg-gray-300/50"
                  }`}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tools Row - Only show when showTools is true */}
        <AnimatePresence>
          {showTools && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 sm:gap-3 pb-3 sm:pb-4"
            >
              {/* File upload button */}
              <label
                htmlFor="file-upload"
                className={`w-8 h-8 sm:w-10 sm:h-10 flex cursor-pointer items-center justify-center rounded-full transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                    : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
                }`}
                title="Attach files"
              >
                <input
                  ref={uploadInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </label>

              {/* Voice toggle button */}
              <button
                onMouseDown={handleMicHoldStart}
                onMouseUp={handleMicHoldEnd}
                onTouchStart={handleMicHoldStart}
                onTouchEnd={handleMicHoldEnd}
                onClick={() => setUseVoice((prev) => !prev)}
                className={`w-8 h-8 sm:w-10 sm:h-10 flex select-none items-center justify-center rounded-full transition-all duration-300 ${
                  useVoice
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                    : theme === "dark"
                    ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                    : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
                }`}
                title="Toggle Voice"
              >
                <Mic
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                    useVoice
                      ? "text-white drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]"
                      : theme === "dark"
                      ? "text-gray-300"
                      : "text-gray-600"
                  }`}
                />
              </button>

              {/* Model selector */}
              <div className="select-none" style={{ userSelect: "none" }}>
                <button
                  onMouseDown={handleSparkleMouseDown}
                  onMouseUp={handleSparkleMouseUp}
                  onTouchStart={handleSparkleMouseDown}
                  onTouchEnd={handleSparkleMouseUp}
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-200 border-2 ${
                    theme === "dark"
                      ? "hover:bg-gray-700/50"
                      : "hover:bg-gray-100/50"
                  }`}
                  style={{
                    borderColor: currentModel?.color,
                    boxShadow: `0 0 6px ${currentModel?.color}`,
                  }}
                >
                  {showToolbar ? (
                    <ChevronDown
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}
                    />
                  ) : (
                    <Sparkle
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                        useMistral
                          ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
                          : theme === "dark"
                          ? "text-white"
                          : "text-gray-900"
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Memory Tree Toggle */}
              <button
                onClick={onToggleMemoryTree}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                  memoryTreeVisible
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : theme === "dark"
                    ? "hover:bg-gray-700/50 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100/50 text-gray-500 hover:text-gray-700"
                }`}
                title="Toggle Memory Tree"
              >
                <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Orb Dictation */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => {
                  orbHoldTimeout.current = setTimeout(() => {
                    setIsOrbHolding(true);
                  }, 600);
                }}
                onMouseUp={() => {
                  if (orbHoldTimeout.current) {
                    clearTimeout(orbHoldTimeout.current);
                    orbHoldTimeout.current = null;
                    if (!isDictating) {
                      startDictation();
                    } else {
                      stopDictation();
                    }
                  }
                  setIsOrbHolding(false);
                }}
                onMouseLeave={() => {
                  if (orbHoldTimeout.current) {
                    clearTimeout(orbHoldTimeout.current);
                    orbHoldTimeout.current = null;
                  }
                  setIsOrbHolding(false);
                }}
                className="relative w-8 h-8 sm:w-10 sm:h-10 cursor-pointer"
                title="Voice Dictation"
              >
                <motion.div
                  className={`z-0 bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-sm transition-all duration-200 ${
                    isOrbHolding ? "scale-110 shadow-lg" : ""
                  }`}
                  style={{ width: 32, height: 32 }}
                >
                  <motion.div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "9999px",
                      overflow: "hidden",
                    }}
                  >
                    <Scene />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="absolute inset-0 rounded-full border border-[#bbb]"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {isListening && (
                  <motion.div
                    className="absolute inset-0 rounded-full border border-red-400"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}

                {isOrbHolding && (
                  <motion.div
                    className="absolute inset-0 rounded-full border border-blue-400"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main input row */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Plus button to toggle tools */}
          <button
            onClick={() => setShowTools(!showTools)}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 mb-3 ${
              showTools
                ? "bg-gray-500 text-white"
                : theme === "dark"
                ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
            }`}
            title="Toggle tools"
          >
            <motion.div
              animate={{ rotate: showTools ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className={`flex-1 resize-none px-3 py-3 text-sm outline-none rounded-xl transition-all duration-200 mb-3 ${
              theme === "dark"
                ? "bg-transparent text-white placeholder-gray-400 focus:bg-transparent"
                : "bg-transparent text-gray-900 placeholder-gray-500 focus:bg-transparent"
            }`}
            style={{ minHeight: "36px" }}
          />

          {/* Send button */}
          <motion.button
            onClick={handleSubmit}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 mb-3 ${
              theme === "dark"
                ? "bg-white text-black hover:bg-yellow-300 shadow-lg"
                : "bg-black text-white hover:bg-yellow-300 shadow-lg"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isLoading ? "Stop generation" : "Send message"}
          >
            {isLoading ? (
              <Square className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </motion.button>
        </div>

        {/* Character usage popup */}
        {showCharPopup && charUsage && (
          <div className="absolute bottom-16 right-5 bg-white dark:bg-zinc-800 text-sm px-4 py-2 rounded-xl shadow-xl z-50">
            <p className="text-black dark:text-white">
              🧮 {charUsage.used.toLocaleString()} /{" "}
              {charUsage.limit.toLocaleString()} characters used
            </p>
          </div>
        )}

        {/* GPT Carousel */}
        {showCarousel && (
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
              onClick={() => setShowCarousel(false)}
            />
            <div className="absolute bottom-[170px] w-full z-50">
              <GPTCarousel
                theme={theme}
                onSelect={() => setShowCarousel(false)}
              />
            </div>
          </>
        )}

        {/* Floating Toolbar */}
        <AnimatePresence>
          {showToolbar && (
            <motion.div
              key="toolbar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute -top-[145px] right-2 z-30"
            >
              <Toolbar
                theme={theme}
                model={model}
                setModel={setModel}
                useMistral={useMistral}
                setUseMistral={setUseMistral}
                textareaRef={textareaRef}
                onNoteClick={(note) => setOpenNote(note)}
                onNotesMouseDown={handleNotesMouseDown}
                onNotesMouseUp={handleNotesMouseUp}
                isNotesHolding={isNotesHolding}
                toggleCarousel={toggleCarousel}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vertical Dock */}
        <AnimatePresence>
          {showDock && (
            <div className="absolute bottom-[60px] right-2 z-40">
              <VerticalDock />
            </div>
          )}
        </AnimatePresence>

        {/* Notes Sheet */}
        {openNote && (
          <Sheet open={!!openNote} onOpenChange={() => setOpenNote(null)}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{openNote.title}</SheetTitle>
                <SheetDescription>Note content</SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <p className="whitespace-pre-wrap">{openNote.content}</p>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </motion.div>
  );
};

// Main Combined Component - exports both separately and together
const UnifiedChat: React.FC<UnifiedChatProps> = ({
  messages,
  isTyping,
  sidebarOffset,
  input,
  setInput,
  handleKeyDown,
  setModel,
  model,
  sendMessage,
  useMistral,
  setUseMistral,
  useVoice,
  setUseVoice,
  onToggleMemoryTree,
  memoryTreeVisible,
  onMemoryTest,
  theme,
  messagesClassName,
  inputClassName,
  containerClassName,
}) => {
  return (
    <div className={cn("flex flex-col h-full", containerClassName)}>
      <ChatMessages
        messages={messages}
        theme={theme}
        isTyping={isTyping}
        className={messagesClassName}
      />
      <InputBox
        sidebarOffset={sidebarOffset}
        theme={theme}
        input={input}
        setInput={setInput}
        handleKeyDown={handleKeyDown}
        setModel={setModel}
        model={model}
        sendMessage={sendMessage}
        useMistral={useMistral}
        setUseMistral={setUseMistral}
        useVoice={useVoice}
        setUseVoice={setUseVoice}
        onToggleMemoryTree={onToggleMemoryTree}
        memoryTreeVisible={memoryTreeVisible}
        onMemoryTest={onMemoryTest}
        className={inputClassName}
      />
    </div>
  );
};

// Export individual components for flexibility
export { ChatMessages, InputBox };
export default UnifiedChat;
