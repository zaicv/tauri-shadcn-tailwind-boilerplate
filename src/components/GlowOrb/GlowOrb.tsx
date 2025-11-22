import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Scene from "../Orb/Scene";
import { useDictation } from "@/services/dictation";

type GlowOrbProps = {
  setInput: (value: string) => void;
  onToggleCarousel: () => void;
  size?: "small" | "medium" | "large";
  className?: string;
  tooltip?: string;
  onProcessingChange?: (processing: boolean) => void;
};

const GlowOrb: React.FC<GlowOrbProps> = ({
  setInput,
  onToggleCarousel,
  size = "medium",
  className = "",
  tooltip = "Voice Dictation Orb",
  onProcessingChange,
}) => {
  // Orb dictation state
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const { isDictating, isListening, startDictation, stopDictation } =
    useDictation({ setInput });
  // Track processing to notify parent; keep as ref to avoid unused state re-renders
  const processingRef = useRef(false);

  // Size configurations
  const sizeConfig = {
    small: { container: "w-8 h-8", orb: 32 },
    medium: { container: "w-10 h-10", orb: 40 },
    large: { container: "w-12 h-12", orb: 48 },
  };

  const currentSize = sizeConfig[size];

  // 🌟 Orb handlers
  const handleOrbMouseDown = () => {
    orbHoldTimeout.current = setTimeout(() => {
      setIsOrbHolding(true);
      onToggleCarousel(); // Trigger carousel on hold
    }, 600);
  };

  const handleOrbMouseUp = () => {
    if (orbHoldTimeout.current) {
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;
      if (!isDictating) {
        startDictation();
      } else {
        stopDictation();
        // Show a brief processing spinner after stopping dictation (notify parent only)
        processingRef.current = true;
        onProcessingChange?.(true);
        setTimeout(() => {
          processingRef.current = false;
          onProcessingChange?.(false);
        }, 1800);
      }
    }
    setIsOrbHolding(false);
  };

  const handleOrbMouseLeave = () => {
    if (orbHoldTimeout.current) {
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;
    }
    setIsOrbHolding(false);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseDown={handleOrbMouseDown}
      onMouseUp={handleOrbMouseUp}
      onMouseLeave={handleOrbMouseLeave}
      onTouchStart={handleOrbMouseDown}
      onTouchEnd={handleOrbMouseUp}
      className={`relative ${currentSize.container} cursor-pointer ${className}`}
      title={tooltip}
    >
      <motion.div
        className={`z-0 bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-sm transition-all duration-200 ${
          isOrbHolding ? "scale-110 shadow-lg" : ""
        }`}
        style={{ width: currentSize.orb, height: currentSize.orb }}
      >
        <motion.div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "9999px",
            overflow: "hidden",
          }}
        >
          <Scene />
        </motion.div>
      </motion.div>

      {/* Animated rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-[#bbb]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Listening state ring */}
      {isListening && (
        <motion.div
          className="absolute inset-0 rounded-full border border-red-400"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Hold state ring */}
      {isOrbHolding && (
        <motion.div
          className="absolute inset-0 rounded-full border border-blue-400"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Processing spinner intentionally not rendered here; handled by parent */}
    </motion.div>
  );
};

export default GlowOrb;
