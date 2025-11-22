import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  ExternalLink,
  X,
  Play,
  Home,
  Music,
  Cloud,
  Server,
  Smartphone,
  Lightbulb,
  Shield,
  Camera,
} from "lucide-react";

interface Superpower {
  id: string;
  name: string;
  key: string;
  intents: Record<string, string>;
  description?: string;
}

interface SuperpowersModalProps {
  isVisible: boolean;
  theme: "light" | "dark";
  onToggle: () => void;
  onCommandSelect?: (command: string, superpower: string) => void;
}

const getSuperpowerIcon = (key: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    plex: Play,
    home: Home,
    music: Music,
    weather: Cloud,
    server: Server,
    phone: Smartphone,
    lights: Lightbulb,
    security: Shield,
    camera: Camera,
  };

  return iconMap[key.toLowerCase()] || Zap;
};

const getSuperpowerColor = (key: string) => {
  const colorMap: Record<string, string> = {
    plex: "#E5A00D",
    home: "#10B981",
    music: "#8B5CF6",
    weather: "#06B6D4",
    server: "#EF4444",
    phone: "#F59E0B",
    lights: "#FCD34D",
    security: "#DC2626",
    camera: "#7C3AED",
  };

  return colorMap[key.toLowerCase()] || "#6366F1";
};

export default function SuperpowersModal({
  isVisible,
  theme,
  onToggle,
  onCommandSelect,
}: SuperpowersModalProps) {
  const navigate = useNavigate();
  const [superpowers, setSuperpowers] = useState<Superpower[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSuperpower, setExpandedSuperpower] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (isVisible) {
      fetchSuperpowers();
    }
  }, [isVisible]);

  const fetchSuperpowers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://100.83.147.76:8003/api/superpowers"
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSuperpowers(data.superpowers || []);
    } catch (error) {
      console.error("Failed to fetch superpowers:", error);
      setSuperpowers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToSuperpowers = () => {
    navigate("/superpowers");
    onToggle();
  };

  const handleSuperpowerClick = (superpowerId: string) => {
    if (expandedSuperpower === superpowerId) {
      setExpandedSuperpower(null);
    } else {
      setExpandedSuperpower(superpowerId);
    }
  };

  const handleCommandClick = (command: string, superpowerKey: string) => {
    if (onCommandSelect) {
      onCommandSelect(command, superpowerKey);
    }
    onToggle(); // Close modal after command selection
  };

  const formatCommandText = (command: string) => {
    return command
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-white/20 backdrop-blur-md z-40"
            onClick={onToggle}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -100 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed left-6 top-32 w-96 max-h-[75vh] overflow-hidden rounded-2xl z-50"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow:
                "0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-black/10">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <Zap className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Superpowers
                  </h3>
                  <p className="text-sm text-gray-600">
                    {superpowers.length} available commands
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Navigate to Superpowers Button */}
                <button
                  onClick={handleNavigateToSuperpowers}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:bg-blue-500/20 text-gray-600 hover:text-blue-600 border border-transparent hover:border-blue-500/30"
                  title="Go to Superpowers page"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={onToggle}
                  className="p-2.5 rounded-xl transition-all duration-200 hover:bg-red-500/20 text-gray-600 hover:text-red-500 border border-transparent hover:border-red-500/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div
              className="p-5 space-y-4 max-h-[55vh] overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
              }}
            >
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading superpowers...</p>
                </div>
              ) : superpowers.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No superpowers available</p>
                  <p className="text-sm text-gray-500">
                    Check your connection and try again
                  </p>
                </div>
              ) : (
                superpowers.map((superpower, index) => {
                  const Icon = getSuperpowerIcon(superpower.key);
                  const color = getSuperpowerColor(superpower.key);
                  const isExpanded = expandedSuperpower === superpower.key;
                  const commands = Object.keys(superpower.intents || {});

                  return (
                    <motion.div
                      key={superpower.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="group"
                    >
                      {/* Superpower Header */}
                      <div
                        className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/50"
                        style={{
                          background: "rgba(255, 255, 255, 0.3)",
                          border: "1px solid rgba(255, 255, 255, 0.3)",
                        }}
                        onClick={() => handleSuperpowerClick(superpower.key)}
                      >
                        {/* Icon */}
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: color + "20",
                            border: `1px solid ${color}40`,
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {superpower.name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {commands.length} commands available
                          </p>
                        </div>

                        {/* Expand Icon */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-500"
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

                      {/* Commands Grid */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-2 grid grid-cols-1 gap-2">
                              {commands.map((command, cmdIndex) => (
                                <motion.button
                                  key={command}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    delay: cmdIndex * 0.05,
                                    duration: 0.2,
                                  }}
                                  onClick={() =>
                                    handleCommandClick(command, superpower.key)
                                  }
                                  className="group/cmd px-4 py-2.5 rounded-full text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                  style={{
                                    background: "rgba(255, 255, 255, 0.6)",
                                    backdropFilter: "blur(10px)",
                                    border:
                                      "1px solid rgba(255, 255, 255, 0.4)",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-2 h-2 rounded-full transition-all duration-200 group-hover/cmd:scale-125"
                                      style={{ backgroundColor: color }}
                                    />
                                    <span className="text-sm font-medium text-gray-800 group-hover/cmd:text-gray-900">
                                      {formatCommandText(command)}
                                    </span>
                                  </div>
                                  {superpower.intents[command] && (
                                    <p className="text-xs text-gray-600 mt-1 ml-5 leading-relaxed">
                                      {superpower.intents[command]}
                                    </p>
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="p-4 text-center border-t border-black/10"
              style={{
                background: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <div className="text-xs text-gray-600">
                Quick commands • {superpowers.length} superpowers loaded
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
