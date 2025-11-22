import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { FluidGlowingOrb } from "./FluidGlowingOrb";
import { usePersona, type PersonaId } from "@/context/PersonaContext";

type Persona = {
  id: string;
  name: string;
  description: string;
  colors: string[];
  model: string;
  personality: string;
  expertise: string[];
  recentTopics: string[];
  avatar: string;
  status: string;
  energy: number;
  security: string;
};

export default function GPTCarousel({
  theme,
  onSelect, // Add this prop back
  onCreateNew,
}: {
  theme: "light" | "dark" | "system";
  onSelect?: (persona: Persona) => void; // Optional callback
  onCreateNew?: () => void; // Add this prop
}) {
  const { personas, currentPersona, switchPersona, loading, error } =
    usePersona();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [revealedModelIndex, setRevealedModelIndex] = useState<number | null>(
    null
  );

  // Convert personas object to array for carousel
  const orbs = Object.values(personas);
  const total = orbs.length;

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-[800px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading personas...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative w-full h-[800px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading personas: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/20 text-white rounded hover:bg-white/30 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (total === 0) {
    return (
      <div className="relative w-full h-[700px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">No personas available</p>
        </div>
      </div>
    );
  }

  const getOffset = (i: number) => {
    let offset = i - selectedIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  };

  const handleSwipe = (swipeX: number) => {
    if (swipeX < -30) {
      setSelectedIndex((prev) => (prev + 1) % total);
      setRevealedModelIndex(null);
    } else if (swipeX > 30) {
      setSelectedIndex((prev) => (prev - 1 + total) % total);
      setRevealedModelIndex(null);
    }
  };

  const handleOrbClick = (orb: any, index: number) => {
    setSelectedIndex(index);

    // Switch to the selected persona globally
    switchPersona(orb.id as PersonaId);

    // Debug logging for selected persona
    console.log("🌟 Persona Selected:", {
      id: orb.id,
      name: orb.name,
      colors: orb.colors,
      model: orb.model,
      personality: orb.personality,
      expertise: orb.expertise,
      description: orb.description,
      avatar: orb.avatar,
      chatTheme: orb.chatTheme,
      orbColor: orb.orbColor,
    });

    // Call the onSelect callback to trigger workspace transition
    if (onSelect) {
      onSelect(orb as Persona);
    }
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-visible">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_e, info) => handleSwipe(info.offset.x)}
        transition={{ type: "spring" }}
        className="relative w-full h-full flex items-center justify-center"
        style={{ overflow: "visible" }}
      >
        {orbs.map((orb, i) => {
          const offset = getOffset(i);
          const isCenter = offset === 0;
          const isSelected = orb.id === currentPersona;
          const scale = isCenter ? 1 : 0.75;
          const x = offset * 220;
          const opacity = isCenter ? 1 : 0.5;
          const zIndex = isCenter ? 30 : 10;
          const isModelVisible = revealedModelIndex === i;

          // Debug logging for colors
          if (isCenter) {
            console.log(`🎨 GPTCarousel - Persona "${orb.name}":`, {
              id: orb.id,
              colors: orb.colors,
              colorsType: typeof orb.colors,
              colorsLength: orb.colors?.length,
            });
          }

          return (
            <motion.button
              key={orb.id}
              type="button"
              className={`absolute flex flex-col items-center pointer-events-auto bg-transparent border-none outline-none focus:outline-none`}
              animate={{ x, scale, opacity }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ zIndex }}
              onClick={() => handleOrbClick(orb, i)}
            >
              <FluidGlowingOrb
                size={isCenter ? 240 : 180}
                colors={orb.colors || []}
                className={`transition duration-300 hover:scale-105 dimensional-fade ${
                  isSelected ? "brightness-110 shadow-lg shadow-white/20" : ""
                }`}
              />
              <motion.div
                className="mt-4 text-center max-w-xs"
                animate={{
                  filter: isCenter ? "blur(0px)" : "blur(8px)",
                  opacity: isCenter ? 1 : 0.3,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div
                  className={`text-lg font-bold ${
                    isSelected ? "text-yellow-500" : "text-white"
                  }`}
                >
                  {orb.name}
                  {isSelected && (
                    <span className="ml-2 text-yellow-500">✓</span>
                  )}
                </div>

                <p
                  className={`text-sm mt-1 cursor-pointer ${
                    theme === "dark" ? "text-neutral-300" : "text-neutral-600"
                  } ${isSelected ? "text-white/90" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevealedModelIndex((prev) => (prev === i ? null : i));
                  }}
                >
                  {orb.description}
                </p>

                {isModelVisible && (
                  <div className="text-xs mt-2 text-purple-700 dark:text-purple-300 dimensional-fade flex flex-col items-center">
                    <div>({orb.model})</div>
                    <div className="mt-1 text-xs opacity-75">
                      <div className="font-semibold">{orb.personality}</div>
                      <div className="mt-1">
                        {orb.expertise.slice(0, 2).join(" • ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to memories or handle differently
                        console.log("Navigate to memories for", orb.name);
                      }}
                      className="mt-2 px-3 py-1 bg-white text-black rounded-md shadow-sm hover:shadow-md transition duration-150 ease-in-out min-w-[80px]"
                    >
                      Memories
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Floating Create Button */}
      <motion.button
        onClick={() => onCreateNew?.()}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 transition-all duration-300">
          <Plus className="w-8 h-8 text-white" />
        </div>
      </motion.button>

      {/* Optional: Display current persona info - with null check */}
      {currentPersona && personas[currentPersona] && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-xs opacity-60">
            Active: {personas[currentPersona].name}
          </div>
        </div>
      )}
    </div>
  );
}
