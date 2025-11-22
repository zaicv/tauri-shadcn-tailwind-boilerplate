import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  Zap,
  Lightbulb,
  MemoryStick,
  List,
  Network,
  X,
  ExternalLink,
} from "lucide-react";

interface Memory {
  id: string;
  name: string;
  content: string;
  similarity: number;
  importance?: number;
  created_at?: string;
}

interface MemoryTreeProps {
  isVisible: boolean;
  memories: Memory[];
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function MemoryTree({
  isVisible,
  memories,
  theme,
  onToggle,
}: MemoryTreeProps) {
  const navigate = useNavigate();
  const [expandedMemories, setExpandedMemories] = useState<Set<string>>(
    new Set()
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");

  const toggleMemory = (memoryId: string) => {
    setExpandedMemories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memoryId)) {
        newSet.delete(memoryId);
      } else {
        newSet.add(memoryId);
      }
      return newSet;
    });
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "tree" : "list"));
  };

  const handleNavigateToMemories = () => {
    navigate("/memories");
    onToggle(); // Close the memory tree when navigating
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-[#389638ff]"; // forest-green
    if (similarity >= 0.6) return "text-[#e1e65cff]"; // pear
    if (similarity >= 0.4) return "text-[#bbbf43ff]"; // citron
    return "text-gray-400";
  };

  const getImportanceIcon = (importance?: number) => {
    if (!importance) return <MemoryStick className="w-4 h-4 text-gray-400" />;
    if (importance >= 8) return <Zap className="w-4 h-4 text-[#e1e65cff]" />; // pear
    if (importance >= 6)
      return <Lightbulb className="w-4 h-4 text-[#bbbf43ff]" />; // citron
    if (importance >= 4)
      return <Sparkles className="w-4 h-4 text-[#a2a552ff]" />; // moss-green
    return <MemoryStick className="w-4 h-4 text-gray-400" />;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with glassmorphism blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-md z-40"
            onClick={onToggle}
          />

          {/* Memory Tree Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 100 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed right-6 top-32 w-96 max-h-[75vh] overflow-hidden rounded-2xl z-50"
            style={{
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(225, 230, 92, 0.15) 0%, rgba(56, 150, 56, 0.15) 100%)",
                    border: "1px solid rgba(225, 230, 92, 0.2)",
                  }}
                >
                  <Brain className="w-5 h-5 text-[#e1e65cff]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">
                    Memory Tree
                  </h3>
                  <p className="text-sm text-gray-400">
                    {memories.length} relevant memories
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Navigate to Memories Button */}
                <button
                  onClick={handleNavigateToMemories}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 border border-transparent hover:border-blue-500/30"
                  title="Go to Memories page"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* View Mode Toggle */}
                <button
                  onClick={toggleViewMode}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    viewMode === "tree"
                      ? "bg-[#e1e65cff]/20 text-[#e1e65cff] border border-[#e1e65cff]/30"
                      : "hover:bg-white/10 text-gray-400 hover:text-white border border-transparent"
                  }`}
                  title={`Switch to ${
                    viewMode === "list" ? "Tree" : "List"
                  } view`}
                >
                  {viewMode === "list" ? (
                    <Network className="w-4 h-4" />
                  ) : (
                    <List className="w-4 h-4" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={onToggle}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-transparent hover:border-red-500/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              {viewMode === "list" ? (
                // List View
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 space-y-3 max-h-[55vh] overflow-y-auto"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
                  }}
                >
                  {memories.length === 0 ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400 mb-2">
                        No memories retrieved yet
                      </p>
                      <p className="text-sm text-gray-500">
                        Start chatting to see relevant memories
                      </p>
                    </div>
                  ) : (
                    memories.map((memory, index) => (
                      <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="group cursor-pointer"
                      >
                        {/* Memory Header */}
                        <div
                          className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200 hover:bg-white/5"
                          style={{
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                          onClick={() => toggleMemory(memory.id)}
                        >
                          {/* Similarity Indicator */}
                          <div className="flex-shrink-0">
                            <div className="w-4 h-4 rounded-full bg-gray-800 border border-gray-600">
                              <motion.div
                                className={`w-full h-full rounded-full ${
                                  memory.similarity >= 0.8
                                    ? "bg-[#389638ff]"
                                    : memory.similarity >= 0.6
                                    ? "bg-[#e1e65cff]"
                                    : memory.similarity >= 0.4
                                    ? "bg-[#bbbf43ff]"
                                    : "bg-gray-500"
                                }`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  delay: index * 0.1 + 0.2,
                                  duration: 0.3,
                                }}
                              />
                            </div>
                          </div>

                          {/* Memory Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getImportanceIcon(memory.importance)}
                              <span className="font-medium truncate text-white">
                                {memory.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400 truncate">
                                {memory.content.substring(0, 50)}...
                              </span>
                              <span
                                className={`text-xs font-mono px-2 py-1 rounded-md bg-black/30 ${getSimilarityColor(
                                  memory.similarity
                                )}`}
                              >
                                {Math.round(memory.similarity * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Expand/Collapse Icon */}
                          <motion.div
                            animate={{
                              rotate: expandedMemories.has(memory.id) ? 180 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 p-1 rounded text-gray-400"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </motion.div>
                        </div>

                        {/* Expanded Memory Content */}
                        <AnimatePresence>
                          {expandedMemories.has(memory.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div
                                className="p-4 mt-2 rounded-xl"
                                style={{
                                  background: "rgba(0, 0, 0, 0.3)",
                                  border: "1px solid rgba(255, 255, 255, 0.05)",
                                }}
                              >
                                <div className="text-sm leading-relaxed text-gray-300">
                                  {memory.content}
                                </div>
                                {memory.created_at && (
                                  <div className="text-xs mt-3 text-gray-500">
                                    Created:{" "}
                                    {new Date(
                                      memory.created_at
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                // Tree View
                <motion.div
                  key="tree"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="relative w-full h-[55vh] overflow-hidden"
                >
                  <div className="absolute inset-0 p-4">
                    {/* Interactive Tree Canvas */}
                    <div className="relative w-full h-full">
                      {/* Central Node */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          background:
                            "linear-gradient(135deg, #e1e65cff 0%, #389638ff 100%)",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                          boxShadow: "0 8px 32px rgba(225, 230, 92, 0.3)",
                        }}
                      >
                        <Brain className="w-8 h-8 text-black" />
                      </motion.div>

                      {/* Memory Nodes */}
                      {memories.map((memory, index) => {
                        const angle = (index * 360) / memories.length;
                        const radius = 120;
                        const x = Math.cos((angle * Math.PI) / 180) * radius;
                        const y = Math.sin((angle * Math.PI) / 180) * radius;

                        return (
                          <motion.div
                            key={memory.id}
                            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              x: x,
                              y: y,
                            }}
                            transition={{
                              delay: 0.2 + index * 0.1,
                              duration: 0.6,
                              type: "spring",
                              stiffness: 100,
                            }}
                            className="absolute left-1/2 top-1/2"
                          >
                            {/* Connection Line */}
                            <svg
                              className="absolute left-1/2 top-1/2 w-full h-full pointer-events-none"
                              style={{
                                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                              }}
                            >
                              <line
                                x1="0"
                                y1="0"
                                x2={radius}
                                y2="0"
                                stroke="rgba(255, 255, 255, 0.2)"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                opacity="0.6"
                              />
                            </svg>

                            {/* Memory Node */}
                            <div
                              className="relative w-20 h-20 rounded-xl cursor-pointer transition-all duration-300 hover:scale-110"
                              style={{
                                background: "rgba(0, 0, 0, 0.7)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                              }}
                              onClick={() => toggleMemory(memory.id)}
                            >
                              {/* Similarity Indicator */}
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black">
                                <div
                                  className={`w-full h-full rounded-full ${
                                    memory.similarity >= 0.8
                                      ? "bg-[#389638ff]"
                                      : memory.similarity >= 0.6
                                      ? "bg-[#e1e65cff]"
                                      : memory.similarity >= 0.4
                                      ? "bg-[#bbbf43ff]"
                                      : "bg-gray-500"
                                  }`}
                                />
                              </div>

                              {/* Memory Content */}
                              <div className="p-2 text-center">
                                <div className="flex justify-center mb-1">
                                  {getImportanceIcon(memory.importance)}
                                </div>
                                <div className="text-xs font-medium truncate text-white">
                                  {memory.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {Math.round(memory.similarity * 100)}%
                                </div>
                              </div>
                            </div>

                            {/* Expanded Memory Popup */}
                            <AnimatePresence>
                              {expandedMemories.has(memory.id) && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute z-10 w-48 p-3 rounded-lg"
                                  style={{
                                    background: "rgba(0, 0, 0, 0.9)",
                                    backdropFilter: "blur(20px)",
                                    border:
                                      "1px solid rgba(255, 255, 255, 0.1)",
                                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                                    left: x > 0 ? "100%" : "auto",
                                    right: x < 0 ? "100%" : "auto",
                                    top: y > 0 ? "100%" : "auto",
                                    bottom: y < 0 ? "100%" : "auto",
                                  }}
                                >
                                  <div className="text-xs leading-relaxed text-gray-300">
                                    {memory.content}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div
              className="p-4 text-center border-t border-white/10"
              style={{
                background: "rgba(0, 0, 0, 0.3)",
              }}
            >
              <div className="text-xs text-gray-500">
                {viewMode === "list" ? "List View" : "Tree View"} •{" "}
                {memories.length} memories retrieved
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
