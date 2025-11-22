// src/components/Orb/Jarvis.tsx
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import Scene from "@/components/Orb/Scene";

export default function Jarvis() {
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleOrbMouseDown = () => {
    setIsOrbHolding(true);
    orbHoldTimeout.current = setTimeout(() => {
      // Long hold detected – could trigger something like a carousel here
      console.log("Long hold detected");
      orbHoldTimeout.current = null;
    }, 600); // 600ms threshold for hold
  };

  const handleOrbMouseUp = () => {
    setIsOrbHolding(false);
    if (orbHoldTimeout.current) {
      // Short click detected
      console.log("Short click detected");
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 ml-[1200px] mt-[800px]">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseDown={handleOrbMouseDown}
        onMouseUp={handleOrbMouseUp}
        onMouseLeave={handleOrbMouseUp}
      >
        <motion.div
          className={`ml-0 z-0 cursor-pointer bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-sm transition-all duration-200 ${
            isOrbHolding ? "scale-110 shadow-lg" : ""
          }`}
          style={{ width: 220, height: 220 }}
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

        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#bbb]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute inset-0 rounded-full border border-[#bbb]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {isOrbHolding && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
      </motion.div>
    </div>
  );
}