import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ConsciousnessState } from "@/types/consciousness";
import { Play, Pause } from "lucide-react";

interface TimelineControllerProps {
  states: ConsciousnessState[];
  currentIndex: number | null;
  onTimeChange: (index: number | null) => void;
  onPlay: () => void;
}

export default function TimelineController({
  states,
  currentIndex,
  onTimeChange,
  onPlay,
}: TimelineControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Auto-play through timeline
  useEffect(() => {
    if (!isPlaying || states.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === null) return 0;
        if (prev >= states.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500); // 500ms per state

    return () => clearInterval(interval);
  }, [isPlaying, states.length]);

  const setCurrentIndex = (index: number | null) => {
    onTimeChange(index);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setCurrentIndex(index);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentIndex === null || currentIndex >= states.length - 1) {
        setCurrentIndex(0);
      }
      setIsPlaying(true);
    }
  };

  if (states.length === 0) {
    return null;
  }

  const maxIndex = states.length - 1;
  const currentState = currentIndex !== null ? states[currentIndex] : states[0];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="bg-black/80 backdrop-blur-lg border-t border-white/10 p-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Controls */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1">
            <input
              ref={sliderRef}
              type="range"
              min="0"
              max={maxIndex}
              value={currentIndex ?? 0}
              onChange={handleSliderChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white/50"
            />
          </div>

          <div className="text-white text-sm min-w-[100px] text-right">
            {currentIndex !== null ? `${currentIndex + 1} / ${states.length}` : "Live"}
          </div>
        </div>

        {/* Current State Info */}
        {currentState && (
          <div className="flex items-center justify-between text-xs text-white/70">
            <div>
              State:{" "}
              <span
                className={`font-semibold ${
                  currentState.state_type === "chaos"
                    ? "text-purple-400"
                    : currentState.state_type === "glow"
                    ? "text-yellow-400"
                    : "text-gray-400"
                }`}
              >
                {currentState.state_type.toUpperCase()}
              </span>
            </div>
            <div>Intensity: {(currentState.intensity * 100).toFixed(0)}%</div>
            <div>
              {new Date(currentState.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

