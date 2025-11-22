import { motion } from "framer-motion";
import { Brain, Sparkles, Zap } from "lucide-react";
import type { ConsciousnessState } from "@/types/consciousness";

interface StateIndicatorProps {
  currentState: ConsciousnessState | null;
  intensity: number;
  mode?: "fullscreen" | "overlay";
}

export default function StateIndicator({
  currentState,
  intensity,
  mode = "fullscreen",
}: StateIndicatorProps) {
  if (!currentState) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`absolute top-4 left-4 ${
          mode === "overlay" ? "bg-black/60" : "bg-black/40"
        } backdrop-blur-lg rounded-xl p-4 border border-white/10`}
      >
        <div className="text-white/50 text-sm">No state data</div>
      </motion.div>
    );
  }

  const stateConfig = {
    chaos: {
      color: "#8b0000",
      bgColor: "rgba(139, 0, 0, 0.2)",
      icon: Brain,
      label: "Chaos",
    },
    glow: {
      color: "#ffd700",
      bgColor: "rgba(255, 215, 0, 0.2)",
      icon: Sparkles,
      label: "The Glow",
    },
    neutral: {
      color: "#808080",
      bgColor: "rgba(128, 128, 128, 0.2)",
      icon: Zap,
      label: "Neutral",
    },
  };

  const config = stateConfig[currentState.state_type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-4 left-4 ${
        mode === "overlay" ? "bg-black/60" : "bg-black/40"
      } backdrop-blur-lg rounded-xl p-4 border border-white/10 min-w-[200px]`}
    >
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="w-5 h-5" style={{ color: config.color }} />
        </div>

        <div className="flex-1">
          <div
            className="text-sm font-semibold mb-1"
            style={{ color: config.color }}
          >
            {config.label}
          </div>
          <div className="text-xs text-white/70">
            Intensity: {(intensity * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Intensity Bar */}
      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${intensity * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
        />
      </div>

      {/* Sentiment Score */}
      {currentState.sentiment_score !== undefined && (
        <div className="mt-2 text-xs text-white/60">
          Sentiment: {(currentState.sentiment_score * 100).toFixed(0)}%
        </div>
      )}
    </motion.div>
  );
}

