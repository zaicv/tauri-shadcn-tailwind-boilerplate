import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bolt,
  Mic,
  MicOff,
  Sparkle,
  Brain,
  Paperclip,
  ChevronDown,
  Zap,
  BarChart3,
  Cylinder,
  Database,
  BookOpen, // NEW: Icon for Knowledge Base
} from "lucide-react";
import GlowOrb from "../GlowOrb/GlowOrb";
import {
  initializeAudioContext,
  authorizeAudioPlayback,
} from "../../services/voice";
import { notify } from "@/lib/notifications";

// Define models with proper structure like in InputBox.tsx
const models = [
  { id: "Groq", label: "G", color: "rgb(249 115 22)" },
  { id: "Groq-LLaMA3-70B", label: "M", color: "rgb(59 130 246)" },
  { id: "GPT-4o", label: "4o", color: "rgb(168 85 247)" },
  { id: "Claude", label: "C", color: "rgb(255 86 48)" },
];

type MiniToolbarProps = {
  theme: "light" | "dark" | "system";
  model: string;
  setModel: (model: string) => void;
  useMistral: boolean;
  setUseMistral: (val: boolean) => void;
  useVoice: boolean;
  setUseVoice: (val: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onToggleMemoryTree: () => void;
  memoryTreeVisible: boolean;
  onToggleSuperpowersModal: () => void;
  superpowersModalVisible: boolean;
  onAddDownloadTask: (url: string) => void;
  onMemoryTest: () => void;
  onFileUpload: (files: File[]) => void;
  onSuperpowerCommandSelect?: (command: string, superpower: string) => void;
  // New props for orb functionality
  setInput: (value: string) => void;
  onToggleCarousel: () => void;
  onToggleTokenUsage?: () => void;
  deepMemory: boolean;
  setDeepMemory: (val: boolean) => void;
  notionConnected: boolean;
  setNotionConnected: (val: boolean) => void;
  useKnowledgeBase: boolean;
  setUseKnowledgeBase: (val: boolean) => void;
  onToggleKnowledgeBaseModal?: () => void;
};

// Knowledge Base Button Component with long press support
const KnowledgeBaseButton: React.FC<{
  useKnowledgeBase: boolean;
  setUseKnowledgeBase: (val: boolean) => void;
  isDark: boolean;
  onToggleModal?: () => void;
}> = ({ useKnowledgeBase, setUseKnowledgeBase, isDark, onToggleModal }) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasLongPressed = useRef(false);

  const handleMouseDown = () => {
    hasLongPressed.current = false;
    longPressTimer.current = setTimeout(() => {
      hasLongPressed.current = true;
      if (onToggleModal) {
        onToggleModal();
      }
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!hasLongPressed.current) {
      // Only toggle if it wasn't a long press
      setTimeout(() => {
        if (!hasLongPressed.current) {
          setUseKnowledgeBase(!useKnowledgeBase);
        }
      }, 0);
    }
    hasLongPressed.current = false;
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
        useKnowledgeBase
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          : isDark
          ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
          : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
      }`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      title={
        useKnowledgeBase
          ? "Knowledge Base: ON (Click to toggle, Hold to view sources)"
          : "Knowledge Base: OFF (Click to toggle, Hold to view sources)"
      }
    >
      <BookOpen className="w-5 h-5" />
    </button>
  );
};

const MiniToolbar: React.FC<MiniToolbarProps> = ({
  theme,
  model,
  setModel,
  useMistral,
  setUseMistral,
  useVoice,
  setUseVoice,
  textareaRef,
  onToggleMemoryTree,
  memoryTreeVisible,
  onToggleSuperpowersModal,
  superpowersModalVisible,
  onAddDownloadTask,
  onMemoryTest,
  onFileUpload,
  onSuperpowerCommandSelect,
  setInput,
  onToggleCarousel,
  onToggleTokenUsage,
  deepMemory,
  setDeepMemory,
  notionConnected,
  setNotionConnected,
  useKnowledgeBase, // NEW
  setUseKnowledgeBase, // NEW
  onToggleKnowledgeBaseModal, // NEW
}) => {
  const isDark = theme === "dark";
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const sparkleHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);
  const micHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Get current model with proper structure
  const currentModel = models.find((m) => m.id === model);

  // 🔁 Cycle through models
  const cycleModel = () => {
    const currentIndex = models.findIndex((m) => m.id === model);
    const nextIndex = (currentIndex + 1) % models.length;
    setModel(models[nextIndex].id);
    notify.info("Model changed", models[nextIndex].id);
  };

  // 🧠 Sparkle press handlers
  const handleSparkleMouseDown = () => {
    sparkleHoldTimeout.current = setTimeout(() => {
      setUseMistral((prev) => !prev); // Long hold → toggle mistral
      sparkleHoldTimeout.current = null;
    }, 600); // 600ms hold triggers mistral toggle
  };

  const handleSparkleMouseUp = () => {
    if (sparkleHoldTimeout.current) {
      clearTimeout(sparkleHoldTimeout.current);
      sparkleHoldTimeout.current = null;

      // Count short click for distinguishing single/double
      clickCount.current++;
      if (clickCount.current === 1) {
        clickTimeout.current = setTimeout(() => {
          // Single click (no second click) → cycle model
          cycleModel();
          clickCount.current = 0;
        }, 250);
      } else if (clickCount.current === 2) {
        clearTimeout(clickTimeout.current!);
        setShowModelDropdown((prev) => !prev); // Double click → toggle dropdown
        clickCount.current = 0;
      }
    }
  };

  // 🎤 Mic hold handlers
  const handleMicHoldStart = () => {
    micHoldTimeout.current = setTimeout(() => {
      // Long hold action if needed
      micHoldTimeout.current = null;
    }, 600);
  };

  const handleMicHoldEnd = () => {
    if (micHoldTimeout.current) {
      clearTimeout(micHoldTimeout.current);
      micHoldTimeout.current = null;
      // Short click → toggle voice
      setUseVoice((prev) => !prev);
    }
  };

  // 📎 File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFileUpload(files);
  };

  const handleVoiceToggle = async () => {
    const newVoiceState = !useVoice;
    setUseVoice(newVoiceState);

    if (newVoiceState) {
      // Initialize audio context and authorize playback when voice is enabled
      initializeAudioContext();
      await authorizeAudioPlayback();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`w-fit max-w-[95vw] mx-auto px-2 sm:px-4 py-2.5 mb-6 rounded-full z-40
        flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-lg
        border ${isDark ? "border-zinc-600" : "border-zinc-200"}
        ${
          isDark
            ? "bg-[#68694b]/95 backdrop-blur-2xl"
            : "bg-[#ededef]/95 backdrop-blur-2xl"
        }
        shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all select-none overflow-x-auto`}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* 📎 Attach Files Button */}
      <label
        htmlFor="file-upload"
        className={`w-10 h-10 flex-shrink-0 flex cursor-pointer items-center justify-center rounded-full transition-all duration-300 select-none ${
          isDark
            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
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
        <Paperclip className="w-5 h-5" />
      </label>

      {/* 🎤 Voice Toggle Button */}
      <button
        onMouseDown={handleMicHoldStart}
        onMouseUp={handleMicHoldEnd}
        onTouchStart={handleMicHoldStart}
        onTouchEnd={handleMicHoldEnd}
        onClick={handleVoiceToggle}
        className={`w-10 h-10 flex-shrink-0 flex select-none items-center justify-center rounded-full transition-all duration-300 ${
          useVoice
            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
            : isDark
            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        title="Toggle Voice"
      >
        <Mic
          className={`w-5 h-5 transition-all duration-300 ${
            useVoice
              ? "text-white drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]"
              : "text-current"
          }`}
        />
      </button>

      {/* ✨ Sparkle Button (Model Selector) */}
      <div className="relative flex-shrink-0">
        <button
          onMouseDown={handleSparkleMouseDown}
          onMouseUp={handleSparkleMouseUp}
          onTouchStart={handleSparkleMouseDown}
          onTouchEnd={handleSparkleMouseUp}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 border-2 hover:bg-secondary-foreground/10 select-none`}
          style={{
            borderColor: currentModel?.color,
            boxShadow: `0 0 6px ${currentModel?.color}`,
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          title="Model Selector"
        >
          {showModelDropdown ? (
            <ChevronDown className="w-5 h-5 text-white" />
          ) : (
            <Sparkle
              className={`w-5 h-5 transition-all duration-300 ${
                useMistral
                  ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
                  : "text-white"
              }`}
            />
          )}
        </button>

        {/* Model Dropdown */}
        {showModelDropdown &&
          createPortal(
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-40 left-14 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[99999] min-w-[200px] select-none"
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                position: "fixed",
              }}
            >
              {models.map((modelOption) => (
                <button
                  key={modelOption.id}
                  onClick={() => {
                    setModel(modelOption.id);
                    setShowModelDropdown(false);
                    notify.info("Model changed", modelOption.id);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 select-none ${
                    model === modelOption.id
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }`}
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: modelOption.color }}
                  />
                  <span className="text-sm">{modelOption.id}</span>
                </button>
              ))}
            </motion.div>,
            document.body
          )}
      </div>

      {/* 🌟 Glow Orb - Voice Dictation */}
      <div className="flex-shrink-0">
        <GlowOrb
          setInput={setInput}
          onToggleCarousel={onToggleCarousel}
          size="medium"
          tooltip="Voice Dictation Orb"
        />
      </div>

      {/* 📊 Token Usage Button */}
      {onToggleTokenUsage && (
        <button
          onClick={onToggleTokenUsage}
          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
            isDark
              ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
              : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
          }`}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
          title="View Token Usage"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      )}

      {/* ⚡ Superpowers Button */}
      <button
        onClick={onToggleSuperpowersModal}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
          superpowersModalVisible
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            : isDark
            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        title="Toggle Superpowers"
      >
        <Zap className="w-5 h-5" />
      </button>

      {/* 🧠 Brain Button (Memory Tree) */}
      <button
        onClick={onToggleMemoryTree}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
          memoryTreeVisible
            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
            : isDark
            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        title="Toggle Memory Tree"
      >
        <Brain className="w-5 h-5" />
      </button>

      {/* 📚 Knowledge Base Button - NEW */}
      <KnowledgeBaseButton
        useKnowledgeBase={useKnowledgeBase}
        setUseKnowledgeBase={setUseKnowledgeBase}
        isDark={isDark}
        onToggleModal={onToggleKnowledgeBaseModal}
      />

      {/* 🗄️ Deep Memory Button */}
      <button
        onClick={() => {
          const newValue = !deepMemory;
          setDeepMemory(newValue);
          notify.info("Deep Memory", newValue ? "ON" : "OFF");
        }}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
          deepMemory
            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
            : isDark
            ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            : "bg-gray-200/50 text-gray-600 hover:bg-gray-300/50"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        title={deepMemory ? "Deep Memory: ON" : "Deep Memory: OFF"}
      >
        <Cylinder className="w-5 h-5" />
      </button>

      {/* 🗄️ Notion Connection Button */}
      <button
        onClick={() => {
          const newValue = !notionConnected;
          setNotionConnected(newValue);
          notify.info("Notion", newValue ? "Connected" : "Disconnected");
        }}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200 select-none ${
          notionConnected
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        title={notionConnected ? "Notion: CONNECTED" : "Notion: DISCONNECTED"}
      >
        <Database className="w-5 h-5" />
      </button>

      {/* ⚡ Mistral Toggle Button */}
      <motion.button
        onClick={() => setUseMistral(!useMistral)}
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.05 }}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border transition-all duration-300 group select-none ${
          useMistral
            ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_0_2px_rgba(250,204,21,0.4)]"
            : isDark
            ? "border-zinc-600 hover:border-zinc-400"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        title="Toggle Mistral"
      >
        <Bolt
          size={16}
          className={`transition-colors duration-300 ${
            useMistral
              ? "text-yellow-400"
              : "text-zinc-400 group-hover:text-zinc-600"
          }`}
        />
      </motion.button>
    </motion.div>
  );
};

export default MiniToolbar;
