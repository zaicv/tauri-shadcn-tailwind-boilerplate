import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  X,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";

interface KnowledgeBaseSource {
  title: string;
  category?: string;
  type?: string;
  similarity?: number;
}

interface KnowledgeBaseModalProps {
  isVisible: boolean;
  sources: KnowledgeBaseSource[];
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function KnowledgeBaseModal({
  isVisible,
  sources,
  theme,
  onToggle,
}: KnowledgeBaseModalProps) {
  const navigate = useNavigate();
  const [expandedSources, setExpandedSources] = useState<Set<string>>(
    new Set()
  );

  const toggleSource = (sourceTitle: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sourceTitle)) {
        newSet.delete(sourceTitle);
      } else {
        newSet.add(sourceTitle);
      }
      return newSet;
    });
  };

  const handleNavigateToKnowledgeBase = () => {
    navigate("/knowledge-base");
    onToggle(); // Close the modal when navigating
  };

  const getSimilarityColor = (similarity?: number) => {
    if (!similarity) return "text-gray-400";
    if (similarity >= 0.8) return "text-[#389638ff]"; // forest-green
    if (similarity >= 0.6) return "text-[#e1e65cff]"; // pear
    if (similarity >= 0.4) return "text-[#bbbf43ff]"; // citron
    return "text-gray-400";
  };

  const isDark = theme === "dark";

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

          {/* Knowledge Base Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 100 }}
            transition={{ duration: 0.3, type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%)"
                : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.98) 100%)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white dark:text-white">
                    Knowledge Base
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {sources.length}{" "}
                    {sources.length === 1 ? "source" : "sources"} used
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Navigate to Knowledge Base Button */}
                <button
                  onClick={handleNavigateToKnowledgeBase}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 border border-transparent hover:border-blue-500/30"
                  title="Go to Knowledge Base page"
                >
                  <ExternalLink className="w-4 h-4" />
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
            <div className="flex-1 overflow-y-auto p-6">
              {sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BookOpen className="w-16 h-16 text-gray-600 dark:text-gray-700 mb-4 opacity-50" />
                  <p className="text-gray-400 dark:text-gray-500 mb-2">
                    No knowledge base sources
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-600">
                    Knowledge base entries will appear here when used in responses
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sources.map((source, index) => {
                    const isExpanded = expandedSources.has(source.title);
                    return (
                      <motion.div
                        key={`${source.title}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl border border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 p-4 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-sm text-white dark:text-white line-clamp-2">
                                {source.title}
                              </h3>
                              {source.similarity !== undefined && (
                                <span
                                  className={`text-xs font-medium flex-shrink-0 ${getSimilarityColor(
                                    source.similarity
                                  )}`}
                                >
                                  {(source.similarity * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {source.category && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <Sparkles className="w-3 h-3" />
                                  {source.category}
                                </span>
                              )}
                              {source.type && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                  {source.type}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

