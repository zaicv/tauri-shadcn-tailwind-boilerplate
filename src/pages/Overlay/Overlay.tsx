import Toolbar from "@/components/Chat/Toolbar";
import Scene from "@/components/Orb/Scene";
import { Button } from "@/components/ui/button";
import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container";
import { CopyButton } from "@/components/ui/copy-button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { PulseDotLoader } from "@/components/ui/loader";
import { Markdown } from "@/components/ui/markdown";
import { Message, MessageAction, MessageActions } from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { usePersona } from "@/context/PersonaContext";
import { useChatState } from "@/hooks/Chat/useChatState";
import type { Message as MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { stopAIResponse } from "@/services/chat";
import { getHealthData } from "@/services/helpers";
import { supabase } from "@/supabase/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronDown, Globe, Pencil, Plus, Sparkle, Square, ThumbsDown, ThumbsUp, Trash, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

function cleanMessageText(text: string) {
  return text
    .replace(/<!-- SOURCES_START -->[\s\S]*<!-- SOURCES_END -->/g, "")
    .trim();
}

export default function Overlay() {
  const [visible, setVisible] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const { getCurrentPersona, currentPersona } = usePersona();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [currentThread, setCurrentThread] = useState<any>(null);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [retrievedMemories, setRetrievedMemories] = useState<any[]>([]);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [deepMemory, setDeepMemory] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [showInputModelDropdown, setShowInputModelDropdown] = useState(false);

  // Initialize thread when authenticated (like FullChatApp)
  useEffect(() => {
    let initialized = false;

    const initializeThread = async (userId: string) => {
      if (initialized) return;
      initialized = true;

      try {
        console.log("[Overlay] Initializing thread for user:", userId);
        
        const health = await getHealthData(userId);
        setHealthData(health);
        console.log("[Overlay] Health data loaded:", health?.length || 0, "records");

        // Create a new thread for this overlay chat (like FullChatApp)
        const { data: newThread, error: createError } = await supabase
          .from("chat_threads")
          .insert([
            { user_id: userId, name: "Overlay Chat", model: "Groq-LLaMA3-70B" },
          ])
          .select()
          .single();

        if (createError) {
          console.error("[Overlay] Thread creation error:", createError);
          initialized = false;
          return;
        }

        console.log("[Overlay] Thread created:", newThread.id);
        setCurrentThread(newThread);

        // Load existing messages if any
        const { data: msgs, error: msgError } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("thread_id", newThread.id)
          .order("created_at", { ascending: true });

        if (msgError) {
          console.error("[Overlay] Message load error:", msgError);
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
        
        console.log("[Overlay] Initialization complete");
      } catch (error) {
        console.error("[Overlay] Initialization error:", error);
        initialized = false;
      }
    };

    // Check current auth state
    supabase.auth.getUser().then(({ data: userData, error: userError }) => {
      if (!userError && userData?.user) {
        initializeThread(userData.user.id);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Overlay] Auth state changed:", event, session?.user?.id);
      if (session?.user && !initialized) {
        initializeThread(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const {
    input,
    setInput,
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

  // Debug: Monitor thread and input state
  useEffect(() => {
    console.log("[Overlay] State update:", {
      hasThread: !!currentThread,
      threadId: currentThread?.id,
      inputLength: input.trim().length,
      inputValue: input.trim().substring(0, 20),
      canSend: !!input.trim(), // Can send if there's input (thread will be created lazily)
    });
  }, [currentThread, input]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      const unsubShow = (window as any).electronAPI.onOverlayEvent?.("show", () => {
        setVisible(true);
        setShowChat(true);
      });
      const unsubHide = (window as any).electronAPI.onOverlayEvent?.("hide", () => {
        setVisible(false);
        setShowChat(false);
      });
      setVisible(true);
      setShowChat(true);
      return () => {
        unsubShow?.();
        unsubHide?.();
      };
    } else {
      setVisible(true);
      setShowChat(true);
    }
  }, []);

  useEffect(() => {
    // Force transparent backgrounds on html, body, and root
    document.documentElement.style.backgroundColor = "transparent";
    document.documentElement.style.background = "none";
    document.body.style.backgroundColor = "transparent";
    document.body.style.background = "none";
    const root = document.getElementById("root");
    if (root) {
      root.style.backgroundColor = "transparent";
      root.style.background = "none";
    }
    
    // Also add a class to body to help with CSS specificity
    document.body.classList.add("overlay-active");
    
    return () => {
      document.body.classList.remove("overlay-active");
    };
  }, []);

  // Ensure thread exists before sending (create lazily if needed)
  const ensureThread = async (): Promise<boolean> => {
    if (currentThread) return true;

    try {
      console.log("[Overlay] Creating thread lazily...");
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.error("[Overlay] Cannot create thread: not authenticated");
        return false;
      }

      const userId = userData.user.id;
      const health = await getHealthData(userId);
      setHealthData(health);

      const { data: newThread, error: createError } = await supabase
        .from("chat_threads")
        .insert([
          { user_id: userId, name: "Overlay Chat", model: "Groq-LLaMA3-70B" },
        ])
        .select()
        .single();

      if (createError) {
        console.error("[Overlay] Thread creation error:", createError);
        return false;
      }

      console.log("[Overlay] Thread created lazily:", newThread.id);
      setCurrentThread(newThread);
      return true;
    } catch (error) {
      console.error("[Overlay] Error ensuring thread:", error);
      return false;
    }
  };

  const handleClose = () => {
    setVisible(false);
    setShowChat(false);
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      (window as any).electronAPI.hideOverlay?.();
    }
  };

  const toggleToolbar = () => setShowToolbar(!showToolbar);

  const getSendButtonClasses = () => {
    const m = (model || "").toLowerCase();
    if (m.includes("gpt-4o")) return "bg-black hover:bg-gray-800 text-white";
    return "text-white hover:opacity-90";
  };

  const getSendButtonStyle = (): React.CSSProperties | undefined => {
    const m = (model || "").toLowerCase();
    const modelColorMap: Record<string, string> = {
      groq: "rgb(249 115 22)",
      "groq-llama3-70b": "rgb(59 130 246)",
      "gpt-4o": "black",
      claude: "rgb(255 86 48)",
    };
    if (m.includes("gpt-4o")) return undefined;
    const exact = modelColorMap[m];
    if (exact) return { backgroundColor: exact };
    return { backgroundColor: "rgb(59 130 246)" };
  };

  const inputModels = [
    { id: "Groq", color: "rgb(249 115 22)" },
    { id: "Groq-LLaMA3-70B", color: "rgb(59 130 246)" },
    { id: "GPT-4o", color: "rgb(168 85 247)" },
    { id: "Claude", color: "rgb(255 86 48)" },
  ];
  const currentInputModel = inputModels.find((m) => m.id === model);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {showChat && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-8 right-8 w-[480px] max-h-[calc(100vh-4rem)] z-[10001] pointer-events-auto flex flex-col bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2.5 h-2.5 bg-green-500 rounded-full"
              />
              <span className="text-sm font-medium text-gray-900">
                {getCurrentPersona()?.name || "Phoebe"}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ChatContainerRoot className="flex-1 overflow-hidden bg-white min-h-0">
            <ChatContainerContent className="space-y-4 px-4 py-4 overflow-y-auto bg-white max-h-[400px]">
              {messages.map((message, index) => {
                const isAssistant = message.sender === "assistant";
                const isLastMessage = index === messages.length - 1;
                
                return (
                  <Message
                    key={message.id}
                    className={cn(
                      "flex w-full flex-col gap-2",
                      isAssistant ? "items-start" : "items-end"
                    )}
                  >
                    {isAssistant ? (
                      <div className="group flex w-full flex-col gap-0">
                        <div className="w-full transition-colors duration-200 overflow-x-hidden text-gray-800">
                          <div className="prose prose-sm max-w-none overflow-x-hidden">
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
                                          className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium cursor-pointer transition-all hover:opacity-70 bg-gray-200/70 text-gray-700"
                                          onClick={() => window.open(source.url, "_blank")}
                                        >
                                          {citationNum}
                                        </sup>
                                      </HoverCardTrigger>
                                      <HoverCardContent className="w-80 p-0 rounded-xl shadow-lg overflow-hidden bg-white border-gray-200">
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
                                                  e.currentTarget.style.display = "none";
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
                                              <span className="text-xs truncate text-gray-500">
                                                {new URL(source.url).hostname.replace("www.", "")}
                                              </span>
                                            </div>
                                            <h4 className="font-semibold text-sm line-clamp-2 leading-snug text-gray-900">
                                              {source.title}
                                            </h4>
                                            <p className="text-xs line-clamp-2 leading-relaxed text-gray-600">
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
                                        <h1 className="text-2xl font-semibold mt-6 mb-4 leading-tight">{children}</h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-xl font-semibold mt-5 mb-3 leading-tight">{children}</h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-lg font-semibold mt-4 mb-2 leading-snug">{children}</h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="mb-4 leading-7 break-words">{children}</p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
                                      ),
                                      a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline underline-offset-2 hover:opacity-70 transition-opacity break-words text-blue-600"
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
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all hover:opacity-70 cursor-pointer bg-gradient-to-r from-gray-200/80 to-transparent text-gray-700"
                                      >
                                        <img
                                          src={`https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(
                                            source.url
                                          )}`}
                                          alt="favicon"
                                          className="w-3.5 h-3.5 rounded-sm"
                                        />
                                        <span className="font-medium">{source.index}</span>
                                        <span className="truncate max-w-[200px]">
                                          {new URL(source.url).hostname.replace("www.", "")}
                                        </span>
                                      </a>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80 p-0 rounded-xl shadow-lg overflow-hidden bg-white border-gray-200">
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
                                                e.currentTarget.style.display = "none";
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
                                            <span className="text-xs truncate text-gray-500">
                                              {new URL(source.url).hostname.replace("www.", "")}
                                            </span>
                                          </div>
                                          <h4 className="font-semibold text-sm line-clamp-2 leading-snug text-gray-900">
                                            {source.title}
                                          </h4>
                                          <p className="text-xs line-clamp-2 leading-relaxed text-gray-600">
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
                            <div className="hover:bg-gray-100 text-gray-600 rounded-full">
                              <CopyButton content={cleanMessageText(message.text || "")} />
                            </div>
                          </MessageAction>
                          <MessageAction tooltip="Upvote" delayDuration={100}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full transition-colors hover:bg-gray-100 text-gray-600"
                            >
                              <ThumbsUp />
                            </Button>
                          </MessageAction>
                          <MessageAction tooltip="Downvote" delayDuration={100}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full transition-colors hover:bg-gray-100 text-gray-600"
                            >
                              <ThumbsDown />
                            </Button>
                          </MessageAction>
                        </MessageActions>
                      </div>
                    ) : (
                      <div className="group flex flex-col items-end gap-1">
                        <div className="max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%] transition-colors duration-200 bg-gray-100 text-gray-900">
                          {message.text || ""}
                        </div>
                        <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <MessageAction tooltip="Edit" delayDuration={100}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full transition-colors hover:bg-gray-100 text-gray-600"
                            >
                              <Pencil />
                            </Button>
                          </MessageAction>
                          <MessageAction tooltip="Delete" delayDuration={100}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full transition-colors hover:bg-gray-100 text-gray-600"
                            >
                              <Trash />
                            </Button>
                          </MessageAction>
                          <MessageAction tooltip="Copy" delayDuration={100}>
                            <div className="hover:bg-gray-100 text-gray-600 rounded-full">
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
                <Message className="flex w-full flex-col gap-2 items-start">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <PulseDotLoader size="lg" className="bg-gray-600" />
                  </div>
                </Message>
              )}
            </ChatContainerContent>
          </ChatContainerRoot>

          {/* Input Box */}
          <div className="w-full shrink-0 p-4 bg-white border-t border-gray-200">
            <PromptInput
              isLoading={isTyping}
              value={input}
              onValueChange={setInput}
              onSubmit={handleSendClick}
              className="relative z-10 w-full rounded-2xl border border-gray-200 bg-white p-0 pt-1 shadow-sm"
            >
              <div className="flex flex-col">
                <PromptInputTextarea
                  ref={textareaRef}
                  placeholder="Ask anything"
                  className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] bg-transparent text-gray-900 placeholder-gray-500"
                />

                <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 px-3 pb-3">
                  <div className="flex items-center gap-2">
                    <PromptInputAction tooltip="Toggle toolbar">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleToolbar}
                        className="size-8 rounded-full transition-colors border-gray-200 hover:bg-gray-50"
                      >
                        <Plus size={16} />
                      </Button>
                    </PromptInputAction>

                    <PromptInputAction tooltip="Search">
                      <Button
                        variant="outline"
                        onClick={() => setUseMistral(!useMistral)}
                        className={cn(
                          "h-8 rounded-full transition-colors border-gray-200 text-xs px-3",
                          useMistral
                            ? "border-blue-500/60 bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <Globe size={14} className="mr-1" />
                        Search
                      </Button>
                    </PromptInputAction>

                    {/* Model Selector */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowInputModelDropdown((v) => !v)}
                        className="size-8 rounded-full transition-colors border-2 border-gray-300 hover:bg-gray-100 text-gray-700"
                        style={{
                          borderColor: currentInputModel?.color,
                          boxShadow: currentInputModel?.color
                            ? `0 0 6px ${currentInputModel.color}`
                            : undefined,
                        }}
                        title="Model Selector"
                      >
                        {showInputModelDropdown ? (
                          <ChevronDown size={16} />
                        ) : (
                          <Sparkle size={16} />
                        )}
                      </Button>
                      {showInputModelDropdown && (
                        <div className="absolute z-50 mt-2 w-48 rounded-lg border border-gray-200 shadow-lg bg-white bottom-10" style={{ left: 0 }}>
                          {inputModels.map((opt) => (
                            <button
                              key={opt.id}
                              className={cn(
                                "w-full px-3 py-2 flex items-center gap-2 text-left text-sm hover:bg-gray-100 text-gray-800",
                                model === opt.id && "bg-gray-100"
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
                    <Button
                      size="icon"
                      disabled={!input.trim()}
                      onClick={async () => {
                        if (isTyping) {
                          stopAIResponse();
                        } else {
                          // Ensure thread exists before sending
                          const threadReady = await ensureThread();
                          if (!threadReady) {
                            console.error("[Overlay] Failed to create thread");
                            return;
                          }
                          handleSendClick();
                        }
                      }}
                      className={cn(
                        "size-8 rounded-full transition-colors text-white",
                        isTyping
                          ? "bg-red-500 hover:bg-red-600"
                          : getSendButtonClasses()
                      )}
                      style={isTyping ? undefined : getSendButtonStyle()}
                    >
                      {!isTyping ? (
                        <ArrowUp size={16} />
                      ) : (
                        <Square size={12} className="fill-current" />
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
                  className="overflow-hidden mt-2"
                >
                  <Toolbar
                    theme="light"
                    model={model}
                    setModel={setModel}
                    useMistral={useMistral}
                    setUseMistral={setUseMistral}
                    useVoice={useVoice}
                    setUseVoice={setUseVoice}
                    textareaRef={textareaRef}
                    onToggleMemoryTree={() => {}}
                    onToggleTokenUsage={() => {}}
                    memoryTreeVisible={false}
                    onToggleSuperpowersModal={() => {}}
                    superpowersModalVisible={false}
                    onAddDownloadTask={(url: string) => console.log("Download task:", url)}
                    onMemoryTest={handleMemoryTest}
                    onFileUpload={(files: File[]) => console.log("Files uploaded:", files)}
                    onSuperpowerCommandSelect={(command: string, superpower: string) => {
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
                    onToggleKnowledgeBaseModal={() => {}}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Orb - Inside Modal, Below Input */}
          <div className="w-full shrink-0 p-4 bg-white border-t border-gray-200 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                y: [0, -4, 0],
              }}
              transition={{ 
                scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="w-[140px] h-[140px] relative"
            >
              <div className="w-full h-full bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-lg overflow-hidden">
                <Scene />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400/40 pointer-events-none"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}