import React, { useState, useEffect, useRef, useMemo } from "react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Tool } from "@/components/ui/tool";
import ActionAnimation from "./ActionAnimation";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import { cn } from "@/lib/utils";
import { StickToBottom } from "use-stick-to-bottom";
import { motion, AnimatePresence } from "framer-motion";
import { type ErrorInfo } from "@/services/errorHandling";
import { WebSearchSources } from "./WebSearchResponse";
import { InlineCitationLink } from "./InlineCitationLink";
import { parseSearchSources } from "@/utils/parseSearchResults";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Folder, File, ExternalLink } from "lucide-react";

// File Search Result Component
const FileSearchResult: React.FC<{
  fileSearch: {
    matches: Array<{
      name: string;
      path: string;
      type: "file" | "directory";
      size?: number;
      modified?: number;
    }>;
    query: string;
    location_hint?: string;
    count: number;
  };
  theme: "light" | "dark" | "system";
  onOpenModal: (matches: any[], initialPath: string) => void;
}> = ({ fileSearch, theme, onOpenModal }) => {
  const isDark = theme === "dark";
  
  const handleOpenModal = () => {
    const firstMatch = fileSearch.matches[0];
    if (firstMatch && firstMatch.path) {
      let initialPath: string;
      if (firstMatch.type === "directory") {
        initialPath = firstMatch.path;
      } else {
        const pathParts = firstMatch.path.split("/");
        pathParts.pop();
        initialPath = pathParts.join("/") || "/";
      }
      onOpenModal(fileSearch.matches, initialPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl w-full"
    >
      <div
        className={cn(
          "p-4 rounded-2xl border",
          isDark
            ? "bg-[#2f2f2f] border-white/10"
            : "bg-white border-black/10"
        )}
      >
        <div className="mb-3">
          <h3 className="font-semibold text-base mb-1">
            🔍 Found {fileSearch.count} match{fileSearch.count !== 1 ? 'es' : ''} for "{fileSearch.query}"
          </h3>
          {fileSearch.location_hint && (
            <p className="text-sm opacity-70">
              Location: {fileSearch.location_hint}
            </p>
          )}
        </div>
        
        <div className="space-y-2 mb-3">
          {fileSearch.matches.slice(0, 5).map((match, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg",
                isDark ? "bg-[#1a1a1a]" : "bg-gray-50"
              )}
            >
              {match.type === "directory" ? (
                <Folder className="w-4 h-4 text-blue-500" />
              ) : (
                <File className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm flex-1 truncate">{match.name}</span>
              <span className="text-xs opacity-60 truncate max-w-[200px]">
                {match.path}
              </span>
            </div>
          ))}
          {fileSearch.matches.length > 5 && (
            <p className="text-xs opacity-60">
              ... and {fileSearch.matches.length - 5} more
            </p>
          )}
        </div>

        <Button
          onClick={handleOpenModal}
          className={cn(
            "w-full",
            isDark
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in File Browser
        </Button>
      </div>
    </motion.div>
  );
};

type Message = {
  id: number;
  sender: "user" | "assistant";
  text?: string;
  actionType?: "plex" | "youtube-download" | "youtube-search" | "web-search";
  isError?: boolean;
  tool_result?: {
    status: "success" | "error";
    message: string;
    superpower: string;
    tool: string;
    data?: any;
  };
  errorInfo?: ErrorInfo;
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
  file_search?: {
    matches: Array<{
      name: string;
      path: string;
      type: "file" | "directory";
      size?: number;
      modified?: number;
    }>;
    query: string;
    location_hint?: string;
    count: number;
  };
};

type Props = {
  messages: Message[];
  theme: "light" | "dark" | "system";
  isTyping?: boolean;
  className?: string;
  onRetryMessage?: (messageId: number) => void;
};

const ErrorMessage: React.FC<{
  message: Message;
  theme: "light" | "dark" | "system";
  onRetry?: (messageId: number) => void;
}> = ({ message, theme, onRetry }) => {
  const { errorInfo } = message;
  if (!errorInfo) return null;

  const IconComponent = errorInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "max-w-3xl p-3 rounded-2xl border",
        theme === "dark"
          ? "bg-red-500/10 border-red-500/20 text-red-200"
          : "bg-red-50 border-red-200 text-red-900"
      )}
    >
      <div className="flex items-start gap-2">
        <IconComponent
          className={cn("w-4 h-4 mt-0.5 flex-shrink-0", errorInfo.color)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-sm">{errorInfo.title}</h4>
            {onRetry && (
              <button
                onClick={() => onRetry(message.id)}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  theme === "dark"
                    ? "hover:bg-red-500/20 text-red-300"
                    : "hover:bg-red-100 text-red-600"
                )}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm mt-1 opacity-90">{errorInfo.message}</p>
          {errorInfo.suggestion && (
            <div
              className={cn(
                "text-xs mt-2 p-2 rounded-lg",
                theme === "dark" ? "bg-red-500/10" : "bg-red-100"
              )}
            >
              💡 {errorInfo.suggestion}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Tool result message component using Tool component
const ToolResultMessage: React.FC<{
  message: Message;
  theme: "light" | "dark" | "system";
}> = ({ message, theme }) => {
  const { tool_result } = message;
  if (!tool_result) return null;

  // Map tool names to display types
  const getToolType = (tool: string, superpower: string) => {
    const typeMap: Record<string, string> = {
      "download": "youtube_download",
      "download_video": "youtube_download",
      "download_audio": "youtube_download",
      "scan_plex": "plex_scan",
      "rip_disc": "disc_rip",
      "bulk_rename": "file_operations",
      "file_ops": "file_operations",
      "search": "web_search",
      "calculate": "computation",
      "compute": "computation",
      "solve": "computation",
    };
    return typeMap[tool] || superpower.toLowerCase().replace(/\s+/g, "_");
  };

  // Determine state based on tool result
  const getState = (): "input-streaming" | "input-available" | "output-available" | "output-error" => {
    if (tool_result.status === "error") {
      return "output-error";
    }
    return "output-available";
  };

  // Extract input and output from data
  const input = tool_result.data?.input || {};
  const output = tool_result.status === "success" 
    ? (tool_result.data?.output || { message: tool_result.message })
    : undefined;

  const toolPart = {
    type: getToolType(tool_result.tool, tool_result.superpower),
    state: getState(),
    input: input,
    output: output,
    errorText: tool_result.status === "error" ? tool_result.message : undefined,
  };

  const isDark = theme === "dark";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl w-full"
    >
      <div
        className={cn(
          "rounded-lg border overflow-hidden",
          isDark
            ? "bg-[#1a1a1a] border-white/10 [&_button]:!bg-[#1a1a1a] [&_button:hover]:!bg-[#252525] [&_div]:!bg-[#1a1a1a] [&_.border-border]:!border-white/10 [&_.text-muted-foreground]:!text-gray-400"
            : "bg-white border-gray-200 shadow-sm [&_button]:!bg-white [&_button:hover]:!bg-gray-50 [&_div]:!bg-white [&_.border-border]:!border-gray-200 [&_.text-muted-foreground]:!text-gray-600"
        )}
      >
        <Tool 
          toolPart={toolPart} 
          defaultOpen={true}
          className="border-0"
        />
      </div>
    </motion.div>
  );
};

// Removed streaming effect for instant display

const MessageBubble: React.FC<{
  message: Message;
  theme: "light" | "dark" | "system";
  onCopy: (id: number, text: string) => void;
  copiedMessageId: number | null;
  isLatest: boolean;
}> = ({ message, theme, onCopy, copiedMessageId }) => {
  const [showActions, setShowActions] = useState(false);

  // Parse search sources if present
  const searchData =
    message.text && message.sender === "assistant"
      ? parseSearchSources(message.text)
      : {
          hasSources: false,
          sources: [],
          cleanedMarkdown: message.text || "",
        };

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className="group relative"
    >
      <div
        className={cn(
          "relative text-[15px] leading-7",
          message.sender === "user"
            ? isDark
              ? "bg-[#2f2f2f] text-white rounded-2xl px-4 py-2.5 max-w-[70%] ml-auto"
              : "bg-[#f4f4f4] text-black rounded-2xl px-4 py-2.5 max-w-[70%] ml-auto"
            : "max-w-3xl w-full"
        )}
      >
        {message.sender === "user" ? (
          <div className="whitespace-pre-wrap break-words">{message.text}</div>
        ) : (
          <div className={cn(isDark ? "text-gray-100" : "text-gray-900")}>
            {message.glowStateUsed && (
              <div className={cn(
                "mb-2 text-xs px-2 py-1 rounded-md inline-flex items-center gap-1",
                isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
              )}>
                <span>🌟</span>
                <span>GlowState Used</span>
              </div>
            )}
            <MarkdownRenderer
              citationRenderer={(num: number) => {
                const source = searchData.sources.find((s) => s.index === num);
                return (
                  <InlineCitationLink
                    citationNumber={num}
                    source={source}
                    theme={theme}
                  />
                );
              }}
            >
              {searchData.cleanedMarkdown}
            </MarkdownRenderer>
            {searchData.hasSources && (
              <WebSearchSources sources={searchData.sources} theme={theme} />
            )}
          </div>
        )}
      </div>

      {/* Copy button */}
      {message.text && (
        <AnimatePresence>
          {showActions && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => message.text && onCopy(message.id, message.text)}
              className={cn(
                "absolute -bottom-8 left-0 p-1.5 rounded-lg transition-colors",
                theme === "dark"
                  ? "bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white/70 hover:text-white"
                  : "bg-white hover:bg-gray-100 text-black/50 hover:text-black border border-black/10"
              )}
            >
              {copiedMessageId === message.id ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export type ChatContainerRootProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export type ChatContainerContentProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const ChatContainerRoot: React.FC<ChatContainerRootProps> = ({
  children,
  className,
  ...props
}) => (
  <StickToBottom
    className={cn(
      "flex overflow-y-auto",
      "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent",
      className
    )}
    resize="smooth"
    initial="smooth"
    role="log"
    {...props}
  >
    {children}
  </StickToBottom>
);

export const ChatContainerContent: React.FC<ChatContainerContentProps> = ({
  children,
  className,
  ...props
}) => (
  <StickToBottom.Content
    className={cn("flex w-full flex-col", className)}
    {...props}
  >
    {children}
  </StickToBottom.Content>
);

// Helper function to detect superpower from user input
const detectSuperpowerText = (userInput: string): string | null => {
  const lowerInput = userInput.toLowerCase();
  
  // Plex intents - check most specific first
  if (lowerInput.includes("scan plex") || lowerInput.includes("scanning plex") || 
      lowerInput.includes("refresh plex") || lowerInput.includes("update plex")) {
    return "Scanning Plex";
  }
  if ((lowerInput.includes("plex") && (lowerInput.includes("library") || lowerInput.includes("list") || 
        lowerInput.includes("show") || lowerInput.includes("find")))) {
    return "Searching Plex";
  }
  if ((lowerInput.includes("play") || lowerInput.includes("watch")) && lowerInput.includes("plex")) {
    return "Loading Plex";
  }
  if (lowerInput.includes("plex")) {
    return "Searching Plex";
  }
  
  // YouTube intents - check most specific first
  if (lowerInput.includes("download") && (lowerInput.includes("youtube") || lowerInput.includes("yt"))) {
    return "Downloading from YouTube";
  }
  if (lowerInput.includes("search youtube") || lowerInput.includes("youtube search") ||
      lowerInput.includes("search yt") || lowerInput.includes("yt search")) {
    return "Searching YouTube";
  }
  if (lowerInput.includes("youtube") || lowerInput.includes(" yt ")) {
    return "Searching YouTube";
  }
  
  // Web search
  if (lowerInput.includes("search") && (lowerInput.includes("web") || lowerInput.includes("internet") || 
        lowerInput.includes("google"))) {
    return "Searching the web";
  }
  
  // Rip disc
  if ((lowerInput.includes("rip") || lowerInput.includes("extract")) && 
      (lowerInput.includes("disc") || lowerInput.includes("dvd") || lowerInput.includes("cd"))) {
    return "Ripping disc";
  }
  
  // Wolfram Alpha / computation
  if (lowerInput.includes("calculate") || lowerInput.includes("compute") || 
      lowerInput.includes("solve") || lowerInput.includes("math")) {
    return "Computing";
  }
  
  // File operations
  if (lowerInput.includes("bulk rename") || (lowerInput.includes("rename") && lowerInput.includes("file"))) {
    return "Renaming files";
  }
  if (lowerInput.includes("organize") && (lowerInput.includes("file") || lowerInput.includes("files"))) {
    return "Organizing files";
  }
  
  // Notion
  if (lowerInput.includes("notion") && (lowerInput.includes("search") || lowerInput.includes("find") || 
        lowerInput.includes("query"))) {
    return "Searching Notion";
  }
  
  return null;
};

// ChatGPT-style typing indicator with pulse or shimmer for superpowers
const TypingIndicator: React.FC<{ 
  theme: "light" | "dark" | "system";
  superpowerText?: string | null;
}> = ({
  theme,
  superpowerText,
}) => {
  if (superpowerText) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center"
      >
        <Shimmer
          className={cn(
            "text-sm font-medium",
            theme === "dark" ? "text-white/80" : "text-black/70"
          )}
        >
          {superpowerText}
        </Shimmer>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(
          "w-2 h-2 rounded-full",
          theme === "dark" ? "bg-white/60" : "bg-black/40"
        )}
      />
    </motion.div>
  );
};

const ChatMessages: React.FC<Props> = ({
  messages,
  theme,
  isTyping,
  className,
  onRetryMessage,
}) => {
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Get superpower name - use actual superpower_name from response
  const superpowerText = useMemo(() => {
    if (!isTyping && messages.length === 0) return null;
    
    // Map superpower names to display names
    const superpowerDisplayNames: Record<string, string> = {
      "youtube": "Downloading from YouTube",
      "ripdisc": "Ripping disc",
      "plex": "Scanning Plex",
      "Web Search": "Searching the web",
      "Wolfram Alpha": "Computing",
      "file_ops": "Organizing files",
      "Health Log": "Logging health data",
      "Notion Deep Memory": "Searching Notion",
    };
    
    // First, check if the latest assistant message has a superpower name
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.sender === "assistant" && latestMessage?.superpowerName) {
      return superpowerDisplayNames[latestMessage.superpowerName] || latestMessage.superpowerName;
    }
    
    // If typing, detect from the last user message to show while waiting
    if (isTyping) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === "user" && messages[i].text) {
          const detected = detectSuperpowerText(messages[i].text);
          if (detected) return detected;
        }
      }
    }
    
    return null;
  }, [isTyping, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      const container = scrollRef.current.closest('[role="log"]');
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (copiedMessageId !== null) {
      const timer = setTimeout(() => setCopiedMessageId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  const handleCopyClick = async (id: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(id);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isDark = theme === "dark";

  return (
    <ChatContainerRoot className={cn("flex-1 min-h-0", className)}>
      <ChatContainerContent>
        <div ref={scrollRef} className="max-w-3xl mx-auto w-full px-4 py-6">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={cn(
                "flex py-6",
                msg.sender === "user" ? "justify-end" : "justify-start",
                index > 0 && "border-t",
                isDark ? "border-gray-800/50" : "border-gray-200/50"
              )}
            >
              {msg.isError ? (
                <ErrorMessage
                  message={msg}
                  theme={theme}
                  onRetry={onRetryMessage}
                />
              ) : msg.file_search ? (
                <FileSearchResult
                  fileSearch={msg.file_search}
                  theme={theme}
                  onOpenModal={(matches, initialPath) => {
                    // This will be handled by the parent Chat component
                    // We'll use a custom event or callback
                    window.dispatchEvent(new CustomEvent('openFileModal', {
                      detail: { matches, initialPath }
                    }));
                  }}
                />
              ) : msg.tool_result ? (
                <ToolResultMessage
                  message={msg}
                  theme={theme}
                />
              ) : msg.plexVideo ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-2xl"
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl border",
                      theme === "dark"
                        ? "bg-[#2f2f2f] border-white/10"
                        : "bg-white border-black/10"
                    )}
                  >
                    <HeroVideoDialog
                      className="rounded-lg overflow-hidden"
                      animationStyle="from-center"
                      videoSrc={msg.plexVideo.videoSrc}
                      thumbnailSrc={msg.plexVideo.thumbnailSrc}
                      thumbnailAlt={msg.plexVideo.thumbnailAlt}
                    />
                    <div className="mt-3">
                      <h3 className="font-semibold text-base mb-1">
                        {msg.plexVideo.title}
                      </h3>
                      <p className="text-sm opacity-70">
                        {msg.plexVideo.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : msg.actionType ? (
                <ActionAnimation
                  type={msg.actionType}
                  isActive={true}
                  onComplete={() => {}}
                />
              ) : (
                <MessageBubble
                  message={msg}
                  theme={theme}
                  onCopy={handleCopyClick}
                  copiedMessageId={copiedMessageId}
                  isLatest={
                    index === messages.length - 1 && msg.sender === "assistant"
                  }
                />
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <TypingIndicator theme={theme} superpowerText={superpowerText} />
            </div>
          )}
        </div>
      </ChatContainerContent>
    </ChatContainerRoot>
  );
};

export default ChatMessages;
export type { Message };
