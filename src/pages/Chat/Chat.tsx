import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

// Components
import TokenUsageComponent from "@/components/Chat/TokenUsage";
import { SendButton } from "@/components/ui/send-button";
import { Paperclip } from "lucide-react";
import ChatMessages, {
  ChatContainerContent,
  ChatContainerRoot,
} from "../../components/Chat/ChatMessages";
import MemoryTree from "../../components/Chat/MemoryTree";
import KnowledgeBaseModal from "../../components/Chat/KnowledgeBaseModal";
import SuperpowersModal from "../../components/Chat/SuperpowersModal";
import Toolbar from "../../components/Chat/Toolbar";
import Header from "../../components/Global/Header";
import GPTCarousel from "../../components/Orb/GPTCarousel";
import Scene from "../../components/Orb/Scene";
import {
  PromptInput,
  PromptInputTextarea,
} from "../../components/ui/prompt-input";
import { FileModal } from "@/components/Files/FileModal";

// External Libraries
import { useAuth } from "@/components/auth/AuthContext";
import { usePersona } from "@/context/PersonaContext";
import { useTheme } from "@/context/ThemeContext";

// Custom Hooks
import { useChatLoader } from "@/hooks/Chat/useChatLoader";
import { useChatState } from "@/hooks/Chat/useChatState";
import { useSupabaseInit } from "@/hooks/Chat/useSupabaseInit";
import { useUIState } from "@/hooks/Chat/useUIState";
import { toast } from "sonner";

export default function Home() {
  const location = useLocation();
  const { threadId } = useParams();
  const orb = location.state?.orb;
  const { user } = useAuth();
  const { getCurrentPersona, currentPersona } = usePersona();
  const { theme, isDark } = useTheme();

  const {
    setOrbColors,
    showCarousel,
    setShowCarousel,
    chatVisible,
    setChatVisible,
    orbActivated,
    setOrbActivated,
    showOrb,
    setShowOrb,
    memoryTreeVisible,
    setMemoryTreeVisible,
    superpowersModalVisible,
    setSuperpowersModalVisible,
    toggleCarousel,
    toggleMemoryTree,
    toggleSuperpowersModal,
    showToolbar,
    showTokenUsage,
    setShowTokenUsage,
    toggleToolbar,
    deepMemory,
    setDeepMemory,
    notionConnected,
    setNotionConnected,
  } = useUIState();

  // ✅ Knowledge Base state
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [knowledgeBaseSources, setKnowledgeBaseSources] = useState<any[]>([]);
  const [knowledgeBaseModalVisible, setKnowledgeBaseModalVisible] = useState(false);
  
  const toggleKnowledgeBaseModal = () => {
    setKnowledgeBaseModalVisible((prev) => !prev);
  };

  // ✅ File Modal state for file search results
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileModalInitialPath, setFileModalInitialPath] = useState<string | null>(null);
  const [fileModalSearchResults, setFileModalSearchResults] = useState<any[]>([]);

  // Listen for file modal open events from ChatMessages
  useEffect(() => {
    const handleOpenFileModal = (event: CustomEvent) => {
      const { matches, initialPath } = event.detail;
      setFileModalSearchResults(matches);
      setFileModalInitialPath(initialPath);
      setFileModalOpen(true);
    };

    window.addEventListener('openFileModal', handleOpenFileModal as EventListener);
    return () => {
      window.removeEventListener('openFileModal', handleOpenFileModal as EventListener);
    };
  }, []);

  const {
    messages,
    setMessages,
    currentThread,
    setCurrentThread,
    healthData,
    retrievedMemories,
    setRetrievedMemories,
    reloadThread,
  } = useChatLoader(threadId);

  // Update knowledge base sources when messages change
  useEffect(() => {
    // Extract knowledge base sources from the latest assistant message
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.knowledgeBaseSources && Array.isArray(latestMessage.knowledgeBaseSources)) {
      setKnowledgeBaseSources(latestMessage.knowledgeBaseSources);
    }
    
    // Check for file search results and open FileModal
    if (latestMessage?.file_search && latestMessage.file_search.matches && latestMessage.file_search.matches.length > 0) {
      const fileSearch = latestMessage.file_search;
      console.log("🔍 File search results detected:", fileSearch);
      // Set search results
      setFileModalSearchResults(fileSearch.matches);
      // Navigate to first match's parent directory, or use first match if it's a directory
      const firstMatch = fileSearch.matches[0];
      if (firstMatch && firstMatch.path) {
        if (firstMatch.type === "directory") {
          setFileModalInitialPath(firstMatch.path);
        } else {
          // Navigate to parent directory
          const pathParts = firstMatch.path.split("/");
          pathParts.pop();
          setFileModalInitialPath(pathParts.join("/") || "/");
        }
        // Open the modal with a small delay to ensure state is set
        setTimeout(() => {
          setFileModalOpen(true);
        }, 100);
      }
    }
  }, [messages]);

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
    useKnowledgeBase, // ✅ ADD THIS - pass to useChatState
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasShownCarouselForUser, setHasShownCarouselForUser] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSuperpowerCommandSelect = (
    command: string,
    superpower: string
  ) => {
    setInput(`Execute ${superpower} command: ${command}`);
  };

  useSupabaseInit();

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrbColors(orb?.colors ?? ["#93c5fd", "#3b82f6"]);
      setChatVisible(true);
      setTimeout(() => setOrbActivated(true), 500);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && !hasShownCarouselForUser && chatVisible) {
      const timer = setTimeout(() => {
        setShowCarousel(true);
        setHasShownCarouselForUser(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, hasShownCarouselForUser, chatVisible, setShowCarousel]);

  useEffect(() => {
    if (!user) {
      setHasShownCarouselForUser(false);
    }
  }, [user]);

  const sendPersonalizedWelcomeMessage = async (persona: any) => {
    console.log(
      "Sending welcome message:",
      `Hi I'm ${persona.name}. What can I help you with today?`
    );
  };

  // ElectronMenu removed - migrating to Tauri
  // Previously had menu handlers here (toggleOrb, savePDF, syncSupabase, etc.)
  // TODO: Implement Tauri menu handlers if needed

  return (
    <div
      className={`relative h-screen w-full flex flex-col transition-colors ${
        isDark ? "bg-[#212121]" : "bg-white"
      }`}
    >
      {/* Header */}
     



      

      {/* Orb */}
      {showOrb && (
        <div
          onClick={() => {
            if (!chatVisible) {
              setOrbColors(orb?.colors ?? ["#93c5fd", "#3b82f6"]);
              setChatVisible(true);
              setTimeout(() => setOrbActivated(true), 500);
            }
          }}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-72 h-72 ${
            chatVisible ? "pointer-events-none" : "cursor-pointer"
          }`}
        >
          <div
            className={`w-full h-full rounded-full overflow-hidden transition-all duration-1000 ${
              orbActivated ? "prismGlow" : ""
            }`}
          >
            <Scene />
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatContainerRoot className="flex-1 min-h-0">
          <ChatContainerContent>
            <ChatMessages
              messages={messages}
              theme={isDark ? "dark" : "light"}
              isTyping={isTyping}
            />
          </ChatContainerContent>
        </ChatContainerRoot>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pb-8 pt-4">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            animate={{ marginBottom: showToolbar ? "0.5rem" : "0" }}
            transition={{ duration: 0.2 }}
            className={`relative rounded-3xl transition-all duration-200 ${
              isDark
                ? `bg-[#2f2f2f] ${
                    isFocused ? "shadow-[0_0_0_2px_rgba(255,255,255,0.1)]" : ""
                  }`
                : `bg-white border border-black/10 ${
                    isFocused
                      ? "shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                      : "shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                  }`
            }`}
          >
            <div className="flex items-end gap-2 p-2">
              {/* Attach Button */}
              <button
                onClick={toggleToolbar}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isDark
                    ? "hover:bg-white/10 text-white/70 hover:text-white rounded-full"
                    : "hover:bg-black/5 text-black/40 hover:text-black/70 rounded-full"
                }`}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Input */}
              <div className="flex-1 min-h-[40px] max-h-[200px] overflow-y-auto">
                <PromptInput
                  value={input}
                  onValueChange={setInput}
                  onSubmit={handleSendClick}
                  className="bg-transparent border-none"
                >
                  <PromptInputTextarea
                    ref={textareaRef}
                    placeholder="Message"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`resize-none bg-transparent border-none focus:ring-0 py-2 px-0 ${
                      isDark
                        ? "text-white placeholder-white/40"
                        : "text-black placeholder-black/40"
                    }`}
                  />
                </PromptInput>
              </div>

              {/* Send Button */}
              <SendButton
                onClick={handleSendClick}
                disabled={!input.trim() || isTyping}
                theme={isDark ? "dark" : "light"}
                size="lg"
                className="flex-shrink-0"
              />
            </div>
          </motion.div>

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
                    theme={isDark ? "dark" : "light"}
                    model={model}
                    setModel={setModel}
                    useMistral={useMistral}
                    setUseMistral={setUseMistral}
                    useVoice={useVoice}
                    setUseVoice={setUseVoice}
                    textareaRef={textareaRef}
                    onToggleMemoryTree={toggleMemoryTree}
                    onToggleTokenUsage={() => setShowTokenUsage(true)}
                    memoryTreeVisible={memoryTreeVisible}
                    onToggleSuperpowersModal={toggleSuperpowersModal}
                    superpowersModalVisible={superpowersModalVisible}
                    onAddDownloadTask={(url: string) =>
                      console.log("Download task:", url)
                    }
                    onMemoryTest={handleMemoryTest}
                    onFileUpload={(files: File[]) =>
                      console.log("Files uploaded:", files)
                    }
                    onSuperpowerCommandSelect={handleSuperpowerCommandSelect}
                    setInput={setInput}
                    onToggleCarousel={toggleCarousel}
                    deepMemory={deepMemory}
                    setDeepMemory={setDeepMemory}
                    notionConnected={notionConnected}
                    setNotionConnected={setNotionConnected}
                    useKnowledgeBase={useKnowledgeBase}
                    setUseKnowledgeBase={setUseKnowledgeBase}
                    onToggleKnowledgeBaseModal={toggleKnowledgeBaseModal}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Text */}
          <div
            className={`text-center text-xs mt-2 ${
              isDark ? "text-white/40" : "text-black/40"
            }`}
          >
            {getCurrentPersona()?.name || "AI"} can make mistakes. Check
            important info.
          </div>
        </div>
      </div>

      {/* Modals */}
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
                  theme={isDark ? "dark" : "light"}
                  onSelect={(persona) => {
                    setShowCarousel(false);
                    sendPersonalizedWelcomeMessage(persona);
                  }}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <MemoryTree
        isVisible={memoryTreeVisible}
        memories={retrievedMemories}
        theme={isDark ? "dark" : "light"}
        onToggle={toggleMemoryTree}
      />

      <KnowledgeBaseModal
        isVisible={knowledgeBaseModalVisible}
        sources={knowledgeBaseSources}
        theme={isDark ? "dark" : "light"}
        onToggle={toggleKnowledgeBaseModal}
      />

      <SuperpowersModal
        isVisible={superpowersModalVisible}
        theme={isDark ? "dark" : "light"}
        onToggle={toggleSuperpowersModal}
        onCommandSelect={handleSuperpowerCommandSelect}
      />

      {showTokenUsage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl shadow-2xl max-w-md w-full p-6 ${
              isDark ? "bg-[#2f2f2f]" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-semibold ${
                  isDark ? "text-white" : "text-black"
                }`}
              >
                Token Usage
              </h2>
              <button
                onClick={() => setShowTokenUsage(false)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark
                    ? "hover:bg-white/10 text-white/70"
                    : "hover:bg-black/5 text-black/40"
                }`}
              >
                ✕
              </button>
            </div>
            <TokenUsageComponent userId={user?.id || ""} theme={isDark ? "dark" : "light"} />
          </motion.div>
        </div>
      )}

      {/* File Modal for file search results */}
      <FileModal
        isOpen={fileModalOpen}
        onClose={() => {
          setFileModalOpen(false);
          setFileModalInitialPath(null);
          setFileModalSearchResults([]);
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
