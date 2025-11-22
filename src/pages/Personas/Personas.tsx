import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Palette, User } from "lucide-react";
import GPTCarousel from "@/components/Orb/GPTCarousel";
import { usePersona } from "@/context/PersonaContext";
import { useTheme } from "@/context/ThemeContext";

export default function Personas() {
  const navigate = useNavigate();
  const { getCurrentPersona } = usePersona();
  const { theme, isDark } = useTheme();
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");

  useEffect(() => {
    // Update accent colors based on selected persona
    const currentPersona = selectedPersona || getCurrentPersona();
    if (currentPersona?.colors) {
      setAccentColor(currentPersona.colors[0]);
      setSecondaryColor(currentPersona.colors[1] || currentPersona.colors[0]);
    } else if (currentPersona?.color) {
      setAccentColor(currentPersona.color);
      setSecondaryColor(currentPersona.color);
    }
  }, [selectedPersona, getCurrentPersona]);

  const handlePersonaSelect = (persona: any) => {
    // Just select the persona, don't navigate
    setSelectedPersona(persona);
  };

  const handleStartChat = () => {
    const personaToUse = selectedPersona || getCurrentPersona();
    if (personaToUse) {
      navigate("/chat", {
        state: {
          orb: {
            colors: personaToUse.colors,
            name: personaToUse.name,
          },
        },
      });
    }
  };

  const currentPersonaData = selectedPersona || getCurrentPersona();

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
      }`}
    >
      {/* Animated background gradient orbs - Dynamic colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse transition-all duration-1000"
          style={{ backgroundColor: `${accentColor}20` }}
        />
        <div
          className="absolute top-1/2 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 transition-all duration-1000"
          style={{ backgroundColor: `${secondaryColor}20` }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-500 transition-all duration-1000"
          style={{ backgroundColor: `${accentColor}15` }}
        />
      </div>

      {/* Glassmorphism header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 backdrop-blur-xl ${
          theme === "dark" ? "bg-transparent" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-2xl backdrop-blur-sm transition-all duration-500"
                style={{
                  background:
                    theme === "dark"
                      ? `linear-gradient(135deg, ${accentColor}30, ${secondaryColor}30)`
                      : `linear-gradient(135deg, ${accentColor}20, ${secondaryColor}20)`,
                }}
              >
                <Sparkles
                  className="w-6 h-6 transition-colors duration-500"
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Personas
                </h1>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-white/60" : "text-gray-600"
                  }`}
                >
                  Choose your AI companion
                </p>
              </div>
            </div>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                theme === "dark"
                  ? "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  : "bg-black/5 hover:bg-black/10 text-gray-900 border border-black/10"
              } backdrop-blur-sm`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-8 py-12">
        {/* Hero section with GPTCarousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div
            className={`rounded-3xl overflow-hidden backdrop-blur-2xl ${
              theme === "dark"
                ? "bg-black/30 border border-white/10 shadow-2xl"
                : "bg-white/30 border border-black/10 shadow-2xl"
            }`}
          >
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />

            <GPTCarousel
              theme={theme}
              onSelect={handlePersonaSelect}
              onCreateNew={() => navigate("/personas/create")}
            />
          </div>
        </motion.div>

        {/* Persona Details Section */}
        <AnimatePresence mode="wait">
          {currentPersonaData && (
            <motion.div
              key={currentPersonaData.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-3xl overflow-hidden backdrop-blur-2xl ${
                theme === "dark"
                  ? "bg-black/30 border border-white/10 shadow-2xl"
                  : "bg-white/30 border border-black/10 shadow-2xl"
              }`}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`p-2 rounded-xl ${
                          theme === "dark" ? "bg-white/10" : "bg-black/5"
                        }`}
                      >
                        <User
                          className={`w-5 h-5 ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}
                        />
                      </div>
                      <h2
                        className={`text-3xl font-bold ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {currentPersonaData.name}
                      </h2>
                    </div>
                    <p
                      className={`text-lg ${
                        theme === "dark" ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      {currentPersonaData.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Personality */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-2xl p-4 backdrop-blur-sm border transition-all duration-300 ${
                      theme === "dark" ? "bg-white/5" : "bg-black/5"
                    }`}
                    style={{
                      borderColor: `${accentColor}30`,
                      boxShadow: `0 4px 20px ${accentColor}15`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4" style={{ color: accentColor }} />
                      <span
                        className={`text-sm font-semibold ${
                          theme === "dark" ? "text-white/80" : "text-gray-700"
                        }`}
                      >
                        Personality
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white/60" : "text-gray-600"
                      }`}
                    >
                      {currentPersonaData.style_guide?.personality?.join(
                        ", "
                      ) ||
                        currentPersonaData.personality ||
                        "Adaptive"}
                    </p>
                  </motion.div>

                  {/* Model */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-2xl p-4 backdrop-blur-sm border transition-all duration-300 ${
                      theme === "dark" ? "bg-white/5" : "bg-black/5"
                    }`}
                    style={{
                      borderColor: `${secondaryColor}30`,
                      boxShadow: `0 4px 20px ${secondaryColor}15`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Palette
                        className="w-4 h-4"
                        style={{ color: secondaryColor }}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          theme === "dark" ? "text-white/80" : "text-gray-700"
                        }`}
                      >
                        Model
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white/60" : "text-gray-600"
                      }`}
                    >
                      {currentPersonaData.model_name ||
                        currentPersonaData.model}
                    </p>
                  </motion.div>

                  {/* Expertise */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-2xl p-4 backdrop-blur-sm border transition-all duration-300 ${
                      theme === "dark" ? "bg-white/5" : "bg-black/5"
                    }`}
                    style={{
                      borderColor: `${accentColor}30`,
                      boxShadow: `0 4px 20px ${accentColor}15`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles
                        className="w-4 h-4"
                        style={{ color: accentColor }}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          theme === "dark" ? "text-white/80" : "text-gray-700"
                        }`}
                      >
                        Expertise
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-white/60" : "text-gray-600"
                      }`}
                    >
                      {currentPersonaData.style_guide?.expertise
                        ?.slice(0, 2)
                        .join(", ") ||
                        currentPersonaData.expertise?.slice(0, 2).join(", ") ||
                        "General AI"}
                    </p>
                  </motion.div>
                </div>

                {/* Chat Style Preview */}
                {currentPersonaData.chat_style && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 rounded-2xl p-4 backdrop-blur-sm border"
                    style={{
                      backgroundColor: `${accentColor}05`,
                      borderColor: `${accentColor}20`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4" style={{ color: accentColor }} />
                      <span className="text-sm font-semibold text-white/80">
                        Response Settings
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40">Tone</span>
                        <span className="text-white/80 font-medium capitalize">
                          {currentPersonaData.chat_style.tone || "Balanced"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40">Temperature</span>
                        <span className="text-white/80 font-medium">
                          {currentPersonaData.chat_style.temperature || 0.7}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40">Length</span>
                        <span className="text-white/80 font-medium capitalize">
                          {currentPersonaData.chat_style.length || "Medium"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-white/40">Verbosity</span>
                        <span className="text-white/80 font-medium capitalize">
                          {currentPersonaData.chat_style.verbosity || "Medium"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CTA Button */}
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 20px 60px -10px ${accentColor}80`,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartChat}
                  className="mt-6 w-full py-4 rounded-2xl font-semibold text-lg text-white transition-all duration-300 backdrop-blur-sm relative overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${secondaryColor})`,
                    boxShadow: `0 10px 40px -10px ${accentColor}60`,
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative">
                    Start Chatting with {currentPersonaData.name}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p
            className={`text-sm ${
              theme === "dark" ? "text-white/40" : "text-gray-500"
            }`}
          >
            Select a persona from the carousel above to begin your conversation
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
