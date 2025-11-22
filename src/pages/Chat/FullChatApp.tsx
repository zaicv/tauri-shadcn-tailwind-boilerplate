"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container";
import {
  Message,
  MessageAction,
  MessageActions,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { Button } from "@/components/ui/button";
import Toolbar from "@/components/Chat/Toolbar";
import GlowOrb from "@/components/GlowOrb/GlowOrb";
import GPTCarousel from "@/components/Orb/GPTCarousel";
import { PulseDotLoader } from "@/components/ui/loader";
import { Markdown } from "@/components/ui/markdown";
// Removed modal Sheet for non-blocking side panel
import MemoryTree from "@/components/Chat/MemoryTree";
import KnowledgeBaseModal from "@/components/Chat/KnowledgeBaseModal";
import ControlCenterDrawer from "@/components/Chat/ControlCenterDrawer";
import { useTheme } from "@/context/ThemeContext";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CopyButton } from "@/components/ui/copy-button";
import { FileModal } from "@/components/Files/FileModal";

// Utils
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase/supabaseClient";
import { getHealthData } from "@/services/helpers";
import Scene from "@/components/Orb/Scene";

// Icons
import {
  ArrowUp,
  Globe,
  Moon,
  Pencil,
  Plus,
  Sparkle,
  ChevronDown,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Square,
} from "lucide-react";
import { stopAIResponse } from "@/services/chat";

// Hooks
import { usePersona } from "@/context/PersonaContext";
import { useChatState } from "@/hooks/Chat/useChatState";
import { useGlowState } from "@/hooks/useGlowState";
import type { Message as MessageType } from "@/lib/types";
import { toast } from "sonner";
import { Disc } from "lucide-react";

// Helper function to parse sources from message text
function parseSources(text: string) {
  const sources: Array<{
    index: number;
    url: string;
    title: string;
    description: string;
    thumbnail?: string;
  }> = [];

  const sourceRegex =
    /<source data-index="(\d+)" data-url="([^"]*)" data-title="([^"]*)" data-description="([^"]*)"(?: data-thumbnail="([^"]*)")?><\/source>/g;

  let match;
  while ((match = sourceRegex.exec(text)) !== null) {
    sources.push({
      index: parseInt(match[1]),
      url: match[2],
      title: match[3],
      description: match[4],
      thumbnail: match[5],
    });
  }

  return sources;
}

// Helper function to clean text (remove source tags)
function cleanMessageText(text: string) {
  return text
    .replace(/<!-- SOURCES_START -->[\s\S]*<!-- SOURCES_END -->/g, "")
    .trim();
}

function FullChatApp() {
  const { getCurrentPersona, currentPersona } = usePersona();
  const { isDark: isDarkMode } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // UI State
  const [showToolbar, setShowToolbar] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [knowledgeBaseSources, setKnowledgeBaseSources] = useState<any[]>([]);
  const [knowledgeBaseModalVisible, setKnowledgeBaseModalVisible] = useState(false);
  const [deepMemory, setDeepMemory] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [memoryTreeVisible, setMemoryTreeVisible] = useState(false);
  const [showInputModelDropdown, setShowInputModelDropdown] = useState(false);
  const [inputOrbProcessing, setInputOrbProcessing] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [reservedRightPx, setReservedRightPx] = useState(0);
  
  // File Modal state for file search results
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileModalInitialPath, setFileModalInitialPath] = useState<string | null>(null);
  const [fileModalSearchResults, setFileModalSearchResults] = useState<any[]>([]);
  const processedFileSearchMessagesRef = useRef<Set<number>>(new Set());

  // Chat State - managed locally without routing
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [currentThread, setCurrentThread] = useState<any>(null);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [retrievedMemories, setRetrievedMemories] = useState<any[]>([]);
  const [lastDiscNotification, setLastDiscNotification] = useState<string | null>(null);
  // Removed local notifications state (handled by ControlCenterDrawer)
  // background tasks state removed; handled externally by ControlCenterDrawer
  // Removed local memoriesExpanded (handled by ControlCenterDrawer)
  
  // Check for disc insertion notifications
  const { state: glowState } = useGlowState(3000);

  // Initialize thread without redirecting
  useEffect(() => {
    (async () => {
      console.log("[FullChatApp] Initializing thread...");
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.error("[FullChatApp] Not authenticated:", userError);
        return;
      }

      const userId = userData.user.id;
      console.log("[FullChatApp] User authenticated:", userId);

      const health = await getHealthData(userId);
      setHealthData(health);

      // Create a new thread for this standalone chat (no redirect!)
      const { data: newThread, error: createError } = await supabase
        .from("chat_threads")
        .insert([
          { user_id: userId, name: "Full Chat", model: "Groq-LLaMA3-70B" },
        ])
        .select()
        .single();

      if (createError) {
        console.error("[FullChatApp] Thread creation error:", createError);
        return;
      }

      console.log("[FullChatApp] Thread created:", newThread.id);
      setCurrentThread(newThread);

      // Load existing messages if any
      const { data: msgs, error: msgError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", newThread.id)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("[FullChatApp] Message load error:", msgError);
      }

      setMessages([
        {
          id: 0,
          sender: "assistant",
          text: "Welcome to Glow Chat. How can I help you today?",
        },
        ...(msgs || []).map((msg: any) => ({
          id: Date.now() + Math.random(),
          sender:
            msg.role === "user"
              ? "user"
              : ("assistant" as "user" | "assistant"),
          text: msg.content,
        })),
      ]);
    })();
  }, []);

  // Listen for ControlCenterDrawer open/close and reserve right space
  useEffect(() => {
    const updateReserve = (open: boolean) => {
      const isSmUp = window.matchMedia("(min-width: 640px)").matches;
      setReservedRightPx(open ? (isSmUp ? 320 : 0) : 0); // sm:w-80 = 20rem = 320px
    };
    const handler = (e: any) => {
      const open = !!e?.detail?.open;
      setControlCenterOpen(open);
      updateReserve(open);
    };
    window.addEventListener("control-center:openchange", handler as any);
    const onResize = () => updateReserve(controlCenterOpen);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("control-center:openchange", handler as any);
      window.removeEventListener("resize", onResize);
    };
  }, [controlCenterOpen]);

  const {
    input: chatInput,
    setInput: setChatInput,
    setModel,
    model,
    isTyping,
    useMistral,
    setUseMistral,
    useVoice,
    setUseVoice,
    handleMemoryTest,
    handleSendClick,
  } = useChatState({
    currentThread,
    setMessages,
    setCurrentThread,
    setRetrievedMemories,
    healthData,
    getCurrentPersona,
    currentPersona,
    deepMemory,
    notionConnected,
    useKnowledgeBase,
  });
  
  // Alias for compatibility
  const input = chatInput;
  const setInput = setChatInput;
  
  // Disc insertion notification
  useEffect(() => {
    if (glowState?.notifications?.disc_inserted && 
        glowState.notifications.timestamp !== lastDiscNotification) {
      setLastDiscNotification(glowState.notifications.timestamp || null);
      toast.info("Disc inserted", {
        description: "Would you like to rip it?",
        icon: <Disc className="w-4 h-4" />,
        duration: 10000,
        action: {
          label: "Rip",
          onClick: async () => {
            setInput("rip the disc");
            setTimeout(() => handleSendClick(), 100);
            await fetch("https://100.83.147.76:8003/glow/notifications/clear", { method: "POST" });
          },
        },
      });
    }
  }, [glowState?.notifications, lastDiscNotification, setInput, handleSendClick]);

  const toggleToolbar = () => setShowToolbar(!showToolbar);

  // Drawer simulation removed; handled by ControlCenterDrawer

  // Map model to send button color classes
  const getSendButtonClasses = () => {
    const m = (model || "").toLowerCase();
    // GPT-4o => black
    if (m.includes("gpt-4o")) {
      return "bg-black hover:bg-gray-800 text-white";
    }
    // For colored models we set bg via inline style; keep text white and nice hover
    return "text-white hover:opacity-90";
  };

  // Inline background color to match Toolbar model colors exactly
  const getSendButtonStyle = (): React.CSSProperties | undefined => {
    const m = (model || "").toLowerCase();
    // Match Toolbar models
    const modelColorMap: Record<string, string> = {
      groq: "rgb(249 115 22)",
      "groq-llama3-70b": "rgb(59 130 246)",
      "gpt-4o": "black", // handled by class, but safe default
      claude: "rgb(255 86 48)",
    };
    // GPT-4o uses black class path
    if (m.includes("gpt-4o")) return undefined;
    const exact = modelColorMap[m];
    if (exact) return { backgroundColor: exact };
    // Default: follow theme
    return isDarkMode
      ? { backgroundColor: "white", color: "#111827" }
      : { backgroundColor: "black", color: "white" };
  };

  // Model selector (same palette as Toolbar)
  const inputModels = [
    { id: "Groq", color: "rgb(249 115 22)" },
    { id: "Groq-LLaMA3-70B", color: "rgb(59 130 246)" },
    { id: "GPT-4o", color: "rgb(168 85 247)" },
    { id: "Claude", color: "rgb(255 86 48)" },
  ];
  const currentInputModel = inputModels.find((m) => m.id === model);

  // Handle file search results and auto-open modal
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || !latestMessage.id) return;
    
    if (latestMessage?.file_search && latestMessage.file_search.matches && latestMessage.file_search.matches.length > 0) {
      const fileSearch = latestMessage.file_search;
      // Only open if modal is not already open and this message hasn't been processed
      if (!fileModalOpen && !processedFileSearchMessagesRef.current.has(latestMessage.id)) {
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
          setFileModalSearchResults(fileSearch.matches);
          setFileModalInitialPath(initialPath);
          processedFileSearchMessagesRef.current.add(latestMessage.id);
          setTimeout(() => setFileModalOpen(true), 100);
        }
      }
    }
  }, [messages.length, fileModalOpen]); // Depend on messages.length and fileModalOpen

  // Debug logging
  console.log("[FullChatApp] Current state:", {
    currentThread: currentThread?.id,
    messagesCount: messages.length,
    input,
    isTyping,
  });

  // Show loading state if thread isn't ready
  if (!currentThread) {
    return (
      <div
        className={cn(
          "flex h-screen items-center justify-center transition-colors duration-200",
          isDarkMode ? "bg-[#212121] text-gray-200" : "bg-white text-gray-800"
        )}
      >
        <div className="text-center">
          <div className="mb-4 text-lg">Initializing chat...</div>
          <div className="text-sm opacity-60">
            {getCurrentPersona()?.name || "AI"} is setting up your conversation
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col overflow-hidden overflow-x-hidden transition-colors duration-200",
        isDarkMode ? "bg-[#212121]" : "bg-white"
      )}
      style={{
        fontFamily:
          '"Söhne", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif',
        paddingRight: reservedRightPx,
      }}
    >
      {/* Theme toggle is now in SettingsModal via sidebar */}

      {/* Control Center Drawer has its own opener; removed local trigger */}

      <ChatContainerRoot
        className={cn(
          "relative flex-1 space-y-0 overflow-y-auto overflow-x-hidden px-4 py-12 transition-colors duration-200 z-10",
          isDarkMode ? "bg-[#212121]" : "bg-white"
        )}
      >
        <ChatContainerContent className="space-y-8 px-4 py-12 overflow-x-hidden">
          {messages.map((message, index) => {
            const isAssistant = message.sender === "assistant";
            const isLastMessage = index === messages.length - 1;
            
            // Handle file_search results - render inline component
            if (message.file_search && message.file_search.matches && message.file_search.matches.length > 0) {
              const fileSearch = message.file_search;
              
              return (
                <div
                  key={message.id}
                  className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-0 md:px-6"
                >
                  <div
                    className={cn(
                      "p-4 rounded-2xl border w-full",
                      isDarkMode
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
                      {fileSearch.matches.slice(0, 5).map((match: any, idx: number) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-lg",
                            isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-50"
                          )}
                        >
                          {match.type === "directory" ? (
                            <span className="text-blue-500">📁</span>
                          ) : (
                            <span className="text-gray-400">📄</span>
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
                      onClick={() => {
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
                          setFileModalSearchResults(fileSearch.matches);
                          setFileModalInitialPath(initialPath);
                          setFileModalOpen(true);
                        }
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Open in File Browser
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <Message
                key={message.id}
                className={cn(
                  "mx-auto flex w-full max-w-3xl flex-col gap-2 px-0 md:px-6",
                  isAssistant ? "items-start" : "items-end"
                )}
              >
                {isAssistant ? (
                  <div className="group flex w-full flex-col gap-0">
                    <div
                      className={cn(
                        "w-full transition-colors duration-200 overflow-x-hidden",
                        isDarkMode ? "text-gray-200" : "text-gray-800"
                      )}
                    >
                      <div
                        className={cn(
                          "prose prose-sm max-w-none overflow-x-hidden",
                          isDarkMode ? "prose-invert" : ""
                        )}
                      >
                        {cleanMessageText(message.text || "")
                          .split(/(\[\^\d+\])/)
                          .map((part, idx) => {
                            const citationMatch = part.match(/\[\^(\d+)\]/);
                            if (citationMatch) {
                              const citationNum = citationMatch[1];
                              const sources = parseSources(message.text || "");
                              const source = sources.find(
                                (s) => s.index === parseInt(citationNum)
                              );

                              if (!source) return null;

                              return (
                                <HoverCard key={idx} openDelay={200}>
                                  <HoverCardTrigger asChild>
                                    <sup
                                      className={cn(
                                        "inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-all hover:opacity-70",
                                        isDarkMode
                                          ? "bg-gray-700/50 text-gray-300"
                                          : "bg-gray-200/70 text-gray-700"
                                      )}
                                      onClick={() =>
                                        window.open(source.url, "_blank")
                                      }
                                    >
                                      {citationNum}
                                    </sup>
                                  </HoverCardTrigger>
                                  <HoverCardContent
                                    className={cn(
                                      "w-80 p-0 rounded-xl shadow-lg overflow-hidden",
                                      isDarkMode
                                        ? "bg-gray-800 border-gray-700"
                                        : "bg-white border-gray-200"
                                    )}
                                  >
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block hover:opacity-90 transition-opacity"
                                    >
                                      {source.thumbnail && (
                                        <div className="w-full h-40 overflow-hidden bg-gray-100">
                                          <img
                                            src={source.thumbnail}
                                            alt={source.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display =
                                                "none";
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div className="p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(
                                              source.url
                                            )}`}
                                            alt="favicon"
                                            className="w-4 h-4 rounded-sm"
                                          />
                                          <span
                                            className={cn(
                                              "text-xs truncate",
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                            )}
                                          >
                                            {new URL(
                                              source.url
                                            ).hostname.replace("www.", "")}
                                          </span>
                                        </div>
                                        <h4
                                          className={cn(
                                            "font-semibold text-sm line-clamp-2 leading-snug",
                                            isDarkMode
                                              ? "text-white"
                                              : "text-gray-900"
                                          )}
                                        >
                                          {source.title}
                                        </h4>
                                        <p
                                          className={cn(
                                            "text-xs line-clamp-2 leading-relaxed",
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-600"
                                          )}
                                        >
                                          {source.description}
                                        </p>
                                      </div>
                                    </a>
                                  </HoverCardContent>
                                </HoverCard>
                              );
                            }
                            return (
                              <Markdown
                                key={idx}
                                className="inline"
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="text-2xl font-semibold mt-6 mb-4 leading-tight">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-xl font-semibold mt-5 mb-3 leading-tight">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-lg font-semibold mt-4 mb-2 leading-snug">
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="mb-4 leading-7 break-words">
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc list-inside mb-4 space-y-2">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal list-inside mb-4 space-y-2">
                                      {children}
                                    </ol>
                                  ),
                                  hr: () => (
                                    <hr
                                      className={cn(
                                        "my-6 border-t",
                                        isDarkMode
                                          ? "border-gray-700/30"
                                          : "border-gray-200/50"
                                      )}
                                    />
                                  ),
                                  img: ({ src, alt }) => (
                                    <img
                                      src={src}
                                      alt={alt}
                                      className="rounded-lg max-w-full h-auto my-4 cursor-pointer hover:shadow-lg transition-shadow"
                                      onClick={() => window.open(src, "_blank")}
                                    />
                                  ),
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        "underline underline-offset-2 hover:opacity-70 transition-opacity break-words",
                                        isDarkMode
                                          ? "text-blue-400"
                                          : "text-blue-600"
                                      )}
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {part}
                              </Markdown>
                            );
                          })}
                      </div>

                      {/* Sources Section */}
                      {parseSources(message.text || "").length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                          <div className="flex flex-wrap gap-2">
                            {parseSources(message.text || "").map((source) => (
                              <HoverCard key={source.index} openDelay={200}>
                                <HoverCardTrigger asChild>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all hover:opacity-70 cursor-pointer",
                                      isDarkMode
                                        ? "bg-gradient-to-r from-gray-700/60 to-transparent text-gray-300"
                                        : "bg-gradient-to-r from-gray-200/80 to-transparent text-gray-700"
                                    )}
                                  >
                                    <img
                                      src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(
                                        source.url
                                      )}`}
                                      alt="favicon"
                                      className="w-3.5 h-3.5 rounded-sm"
                                    />
                                    <span className="font-medium">
                                      {source.index}
                                    </span>
                                    <span className="truncate max-w-[200px]">
                                      {new URL(source.url).hostname.replace(
                                        "www.",
                                        ""
                                      )}
                                    </span>
                                  </a>
                                </HoverCardTrigger>
                                <HoverCardContent
                                  className={cn(
                                    "w-80 p-0 rounded-xl shadow-lg overflow-hidden",
                                    isDarkMode
                                      ? "bg-gray-800 border-gray-700"
                                      : "bg-white border-gray-200"
                                  )}
                                >
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block hover:opacity-90 transition-opacity"
                                  >
                                    {source.thumbnail && (
                                      <div className="w-full h-40 overflow-hidden bg-gray-100">
                                        <img
                                          src={source.thumbnail}
                                          alt={source.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="p-4 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(
                                            source.url
                                          )}`}
                                          alt="favicon"
                                          className="w-4 h-4 rounded-sm"
                                        />
                                        <span
                                          className={cn(
                                            "text-xs truncate",
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          )}
                                        >
                                          {new URL(source.url).hostname.replace(
                                            "www.",
                                            ""
                                          )}
                                        </span>
                                      </div>
                                      <h4
                                        className={cn(
                                          "font-semibold text-sm line-clamp-2 leading-snug",
                                          isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                        )}
                                      >
                                        {source.title}
                                      </h4>
                                      <p
                                        className={cn(
                                          "text-xs line-clamp-2 leading-relaxed",
                                          isDarkMode
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                        )}
                                      >
                                        {source.description}
                                      </p>
                                    </div>
                                  </a>
                                </HoverCardContent>
                              </HoverCard>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <MessageActions
                      className={cn(
                        "-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                        isLastMessage && "opacity-100"
                      )}
                    >
                      <MessageAction tooltip="Copy" delayDuration={100}>
                        <div
                          className={cn(
                            isDarkMode
                              ? "hover:bg-gray-700 text-gray-400 rounded-full"
                              : "hover:bg-gray-100 text-gray-600 rounded-full"
                          )}
                        >
                          <CopyButton
                            content={cleanMessageText(message.text || "")}
                          />
                        </div>
                      </MessageAction>
                      <MessageAction tooltip="Upvote" delayDuration={100}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full transition-colors",
                            isDarkMode
                              ? "hover:bg-gray-700 text-gray-400"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          <ThumbsUp />
                        </Button>
                      </MessageAction>
                      <MessageAction tooltip="Downvote" delayDuration={100}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full transition-colors",
                            isDarkMode
                              ? "hover:bg-gray-700 text-gray-400"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          <ThumbsDown />
                        </Button>
                      </MessageAction>
                    </MessageActions>
                  </div>
                ) : (
                  <div className="group flex flex-col items-end gap-1">
                    <div
                      className={cn(
                        "max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%] transition-colors duration-200",
                        isDarkMode
                          ? "bg-[#2f2f2f] text-gray-100"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      {message.text || ""}
                    </div>
                    <MessageActions
                      className={cn(
                        "flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      )}
                    >
                      <MessageAction tooltip="Edit" delayDuration={100}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full transition-colors",
                            isDarkMode
                              ? "hover:bg-gray-700 text-gray-400"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          <Pencil />
                        </Button>
                      </MessageAction>
                      <MessageAction tooltip="Delete" delayDuration={100}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full transition-colors",
                            isDarkMode
                              ? "hover:bg-gray-700 text-gray-400"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          <Trash />
                        </Button>
                      </MessageAction>
                      <MessageAction tooltip="Copy" delayDuration={100}>
                        <div
                          className={cn(
                            isDarkMode
                              ? "hover:bg-gray-700 text-gray-400 rounded-full"
                              : "hover:bg-gray-100 text-gray-600 rounded-full"
                          )}
                        >
                          <CopyButton content={message.text || ""} />
                        </div>
                      </MessageAction>
                    </MessageActions>
                  </div>
                )}
              </Message>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <Message className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-0 md:px-6 items-start">
              <div className="flex items-center gap-2 px-4 py-3">
                <PulseDotLoader
                  size="lg"
                  className={isDarkMode ? "bg-gray-400" : "bg-gray-600"}
                />
              </div>
            </Message>
          )}
        </ChatContainerContent>
      </ChatContainerRoot>
      <div
        className={cn(
          "inset-x-0 bottom-0 mx-auto w-full max-w-3xl shrink-0 px-3 pb-3 md:px-5 md:pb-5 transition-colors duration-200",
          isDarkMode ? "bg-[#212121]" : "bg-white"
        )}
        style={{ paddingRight: reservedRightPx }}
      >
        <PromptInput
          isLoading={isTyping}
          value={input}
          onValueChange={setInput}
          onSubmit={handleSendClick}
          className={cn(
            "relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-sm transition-colors duration-200",
            isDarkMode
              ? "border-[#2f2f2f] bg-[#2f2f2f]"
              : "border-gray-200 bg-white"
          )}
        >
          <div className="flex flex-col">
            <PromptInputTextarea
              ref={textareaRef}
              placeholder="Ask anything"
              className={cn(
                "min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base bg-transparent transition-colors duration-200",
                isDarkMode ? "text-gray-100" : "text-gray-900"
              )}
            />

            <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
              <div className="flex items-center gap-2">
                <PromptInputAction tooltip="Toggle toolbar">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleToolbar}
                    className={cn(
                      "size-9 rounded-full transition-colors",
                      isDarkMode
                        ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Plus size={18} />
                  </Button>
                </PromptInputAction>

                <PromptInputAction tooltip="Search">
                  <Button
                    variant="outline"
                    onClick={() => setUseMistral(!useMistral)}
                    className={cn(
                      "rounded-full transition-colors",
                      useMistral
                        ? isDarkMode
                          ? "border-blue-500/60 bg-blue-500/20 text-blue-400"
                          : "border-blue-500/60 bg-blue-50 text-blue-600"
                        : isDarkMode
                        ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <Globe size={18} />
                    Search
                  </Button>
                </PromptInputAction>

                {/* Inline Model Selector (next to Search) */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowInputModelDropdown((v) => !v)}
                    className={cn(
                      "size-9 rounded-full transition-colors border-2",
                      isDarkMode
                        ? "border-gray-700 hover:bg-gray-800 text-gray-200"
                        : "border-gray-300 hover:bg-gray-100 text-gray-700"
                    )}
                    style={{
                      borderColor: currentInputModel?.color,
                      boxShadow: currentInputModel?.color
                        ? `0 0 6px ${currentInputModel.color}`
                        : undefined,
                    }}
                    title="Model Selector"
                  >
                    {showInputModelDropdown ? (
                      <ChevronDown size={18} />
                    ) : (
                      <Sparkle size={18} />
                    )}
                  </Button>
                  {showInputModelDropdown && (
                    <div
                      className={cn(
                        "absolute z-50 mt-2 w-48 rounded-lg border shadow-lg bottom-12",
                        isDarkMode
                          ? "bg-black border-gray-800"
                          : "bg-white border-gray-200"
                      )}
                      style={{ left: 0 }}
                    >
                      {inputModels.map((opt) => (
                        <button
                          key={opt.id}
                          className={cn(
                            "w-full px-3 py-2 flex items-center gap-2 text-left text-sm",
                            isDarkMode
                              ? "hover:bg-slate-800 text-gray-200"
                              : "hover:bg-gray-100 text-gray-800",
                            model === opt.id &&
                              (isDarkMode ? "bg-gray-800" : "bg-gray-100")
                          )}
                          onClick={() => {
                            setModel(opt.id);
                            setShowInputModelDropdown(false);
                          }}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span className="truncate">{opt.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <PromptInputAction tooltip="Voice input">
                  {inputOrbProcessing && (
                    <div className="h-4 w-4 mb-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                  )}
                  <GlowOrb
                    setInput={setInput}
                    onToggleCarousel={() => setShowCarousel(!showCarousel)}
                    size="small"
                    className="drop-shadow-lg"
                    onProcessingChange={setInputOrbProcessing}
                  />
                </PromptInputAction>

                <Button
                  size="icon"
                  disabled={!isTyping && (!input.trim() || !currentThread)}
                  onClick={() => {
                    if (isTyping) {
                      stopAIResponse();
                      setIsTyping(false);
                    } else {
                      if (!currentThread) {
                        console.error("[FullChatApp] No thread available yet!");
                        return;
                      }
                      handleSendClick();
                    }
                  }}
                  className={cn(
                    "size-9 rounded-full transition-colors text-white",
                    isTyping 
                      ? "bg-red-500 hover:bg-red-600 border-red-600" 
                      : getSendButtonClasses()
                  )}
                  style={isTyping ? undefined : getSendButtonStyle()}
                >
                  {!isTyping ? (
                    <ArrowUp size={18} />
                  ) : (
                    <Square size={14} className="fill-current" />
                  )}
                </Button>
              </div>
            </PromptInputActions>
          </div>
        </PromptInput>

        {/* Toolbar */}
        <AnimatePresence>
          {showToolbar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <Toolbar
                  theme={isDarkMode ? "dark" : "light"}
                  model={model}
                  setModel={setModel}
                  useMistral={useMistral}
                  setUseMistral={setUseMistral}
                  useVoice={useVoice}
                  setUseVoice={setUseVoice}
                  textareaRef={textareaRef}
                  onToggleMemoryTree={() => setMemoryTreeVisible((v) => !v)}
                  onToggleTokenUsage={() => {}}
                  memoryTreeVisible={memoryTreeVisible}
                  onToggleSuperpowersModal={() => {}}
                  superpowersModalVisible={false}
                  onAddDownloadTask={(url: string) =>
                    console.log("Download task:", url)
                  }
                  onMemoryTest={handleMemoryTest}
                  onFileUpload={(files: File[]) =>
                    console.log("Files uploaded:", files)
                  }
                  onSuperpowerCommandSelect={(
                    command: string,
                    superpower: string
                  ) => {
                    setInput(`Execute ${superpower} command: ${command}`);
                  }}
                  setInput={setInput}
                  onToggleCarousel={() => {}}
                  deepMemory={deepMemory}
                  setDeepMemory={setDeepMemory}
                  notionConnected={notionConnected}
                  setNotionConnected={setNotionConnected}
                  useKnowledgeBase={useKnowledgeBase}
                  setUseKnowledgeBase={setUseKnowledgeBase}
                  onToggleKnowledgeBaseModal={() => setKnowledgeBaseModalVisible((v) => !v)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glow Orb - Bottom Right Corner */}

      {/* Orb */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-72 h-72">
        <div className="w-full h-full rounded-full overflow-hidden prismGlow ">
          <Scene />
        </div>
      </div>

      {/* GPT Carousel Modal */}
      <AnimatePresence>
        {showCarousel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCarousel(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-visible shadow-2xl"
              >
                <GPTCarousel
                  theme={isDarkMode ? "dark" : "light"}
                  onSelect={(persona) => {
                    setShowCarousel(false);
                    console.log("Persona selected:", persona);
                  }}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Global Memory Tree Modal */}
      <MemoryTree
        isVisible={memoryTreeVisible}
        memories={retrievedMemories || []}
        theme={isDarkMode ? "dark" : "light"}
        onToggle={() => setMemoryTreeVisible(false)}
      />

      {/* Knowledge Base Modal */}
      <KnowledgeBaseModal
        isVisible={knowledgeBaseModalVisible}
        sources={knowledgeBaseSources}
        theme={isDarkMode ? "dark" : "light"}
        onToggle={() => setKnowledgeBaseModalVisible(false)}
      />

      {/* Control Center Drawer (external component) */}
      <ControlCenterDrawer />
      
      {/* File Modal for file search results */}
        <FileModal
          isOpen={fileModalOpen}
          onClose={() => {
            setFileModalOpen(false);
            // Clear state when modal is closed to prevent reopening
            setTimeout(() => {
              setFileModalInitialPath(null);
              setFileModalSearchResults([]);
            }, 300); // Small delay to allow modal close animation
          }}
        onSelect={(path) => {
          console.log("Selected path:", path);
          setFileModalOpen(false);
        }}
        mode="directory"
        title="File Search Results"
        initialPath={fileModalInitialPath}
      />
    </div>
  );
}

export { FullChatApp };
