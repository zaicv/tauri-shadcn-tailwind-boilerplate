import GPTCarousel from "@/components/Orb/GPTCarousel";
import Scene from "@/components/Orb/Scene";
import WavyBackground from "@/components/ui/blue-meshy-background";
import { usePersona } from "@/context/PersonaContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Circle,
  Eye,
  Heart,
  Target,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

const GlowDashboard = () => {
  const { getCurrentPersona } = usePersona();
  const [orbPulse, setOrbPulse] = useState(1);
  const [glowLevel, setGlowLevel] = useState(0.7);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get current persona and colors
  const currentPersona = getCurrentPersona();
  const personaColors = useMemo(() => {
    const defaultColors = ["#8b5cf6", "#6366f1"];
    if (currentPersona?.colors && currentPersona.colors.length > 0) {
      return currentPersona.colors;
    }
    return defaultColors;
  }, [currentPersona]);

  const primaryColor = personaColors[0];
  const secondaryColor = personaColors[1] || personaColors[0];

  // Convert hex to rgba for background gradients
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setOrbPulse((prev) => (prev === 1 ? 1.05 : 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Orb click-and-hold handlers
  const handleOrbMouseDown = () => {
    orbHoldTimeout.current = setTimeout(() => {
      setIsOrbHolding(true);
      setShowCarousel(true);
    }, 600);
  };

  const handleOrbMouseUp = () => {
    if (orbHoldTimeout.current) {
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (orbHoldTimeout.current) {
        clearTimeout(orbHoldTimeout.current);
      }
    };
  }, []);

  const skills = [
    {
      id: 1,
      name: "Grounding Breath",
      icon: Wind,
      uses: 24,
      success: 0.92,
      category: "body",
    },
    {
      id: 2,
      name: "Self-Compassion Pause",
      icon: Heart,
      uses: 18,
      success: 0.88,
      category: "emotional",
    },
    {
      id: 3,
      name: "Opposite Action",
      icon: Target,
      uses: 12,
      success: 0.75,
      category: "behavioral",
    },
    {
      id: 4,
      name: "Present Moment Anchor",
      icon: Eye,
      uses: 31,
      success: 0.94,
      category: "awareness",
    },
  ];

  const beliefs = [
    { id: 1, text: "I am not enough", status: "softening", intensity: 0.3 },
    {
      id: 2,
      text: "I must control everything",
      status: "healing",
      intensity: 0.5,
    },
    { id: 3, text: "I am worthy of rest", status: "growing", intensity: 0.85 },
  ];

  const glowPhases = [
    { name: "Breath", complete: true },
    { name: "Awareness", complete: true },
    { name: "Reframe", complete: true },
    { name: "Affirm", complete: false },
    { name: "Gratitude", complete: false },
    { name: "Integration", complete: false },
  ];

  return (
    <WavyBackground className="fixed inset-0 z-0">
      <div
        className="min-h-screen text-white p-8 relative z-10"
        style={{
          background: `linear-gradient(to bottom right, 
            rgba(15, 23, 42, 0.95) 0%, 
            ${hexToRgba(primaryColor, 0.15)} 50%, 
            rgba(15, 23, 42, 0.95) 100%)`,
        }}
      >
        {/* Animated background gradient orbs - Dynamic colors */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse transition-all duration-1000"
          style={{ backgroundColor: hexToRgba(primaryColor, 0.2) }}
        />
        <div
          className="absolute top-1/2 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse transition-all duration-1000"
          style={{
            animationDelay: "1000ms",
            backgroundColor: hexToRgba(secondaryColor, 0.2),
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse transition-all duration-1000"
          style={{
            animationDelay: "500ms",
            backgroundColor: hexToRgba(primaryColor, 0.15),
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-2xl font-light mb-2">Welcome back, Isaiah</h1>
          <p className="text-slate-400 text-sm">
            Let's see how you're feeling today
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Panel - Consciousness Map */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5" style={{ color: primaryColor }} />
                <h2 className="text-lg font-light">Inner Landscape</h2>
              </div>

              <div className="space-y-3">
                {beliefs.map((belief) => (
                  <div
                    key={belief.id}
                    onClick={() => setActiveNode(belief.id)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      activeNode === belief.id
                        ? "border"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    style={
                      activeNode === belief.id
                        ? {
                            backgroundColor: hexToRgba(primaryColor, 0.2),
                            borderColor: hexToRgba(primaryColor, 0.3),
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          belief.status === "softening"
                            ? "bg-blue-500/20 text-blue-300"
                            : belief.status === "healing"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {belief.status}
                      </span>
                      <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${belief.intensity * 100}%`,
                            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{belief.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp
                  className="w-5 h-5"
                  style={{ color: secondaryColor }}
                />
                <h2 className="text-lg font-light">Growth</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Glow Level</span>
                    <span className="text-2xl font-light">
                      {Math.round(glowLevel * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${glowLevel * 100}%`,
                        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-slate-400 mb-1">This week</p>
                  <p className="text-sm" style={{ color: secondaryColor }}>
                    You softened 3 belief loops
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center - The Orb */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[500px]">
            <div className="relative">
              {/* Outer glow rings */}
              <div className="absolute inset-0 animate-pulse pointer-events-none">
                <div
                  className="absolute inset-0 rounded-full blur-3xl"
                  style={{
                    transform: `scale(${orbPulse * 1.5})`,
                    transition: "transform 2s ease-in-out",
                    background: `radial-gradient(circle, ${hexToRgba(
                      primaryColor,
                      0.3
                    )} 0%, ${hexToRgba(secondaryColor, 0.2)} 100%)`,
                  }}
                />
              </div>

              {/* Main Orb with Scene */}
              <motion.div
                className="relative w-64 h-64 cursor-pointer group"
                animate={{ scale: orbPulse }}
                transition={{ duration: 2, ease: "easeInOut" }}
                whileHover={{ scale: orbPulse * 1.05 }}
                whileTap={{ scale: orbPulse * 0.95 }}
                onMouseDown={handleOrbMouseDown}
                onMouseUp={handleOrbMouseUp}
                onMouseLeave={handleOrbMouseLeave}
                onTouchStart={handleOrbMouseDown}
                onTouchEnd={handleOrbMouseUp}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Scene />
                </div>

                {/* Hover state */}
                <div
                  className="absolute inset-0 rounded-full border-2 transition-all pointer-events-none"
                  style={{
                    borderColor: `${hexToRgba(primaryColor, 0.3)}`,
                    boxShadow: `0 0 20px ${hexToRgba(primaryColor, 0.2)}`,
                  }}
                />

                {/* Hold state ring */}
                {isOrbHolding && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 pointer-events-none"
                    style={{
                      borderColor: `${hexToRgba(primaryColor, 0.8)}`,
                      boxShadow: `0 0 30px ${hexToRgba(primaryColor, 0.5)}`,
                    }}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            </div>

            <p className="mt-8 text-lg font-light text-slate-300">
              How can I help you today?
            </p>
            <button
              className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-all backdrop-blur-sm border"
              style={{
                borderColor: `${hexToRgba(primaryColor, 0.3)}`,
                boxShadow: `0 0 10px ${hexToRgba(primaryColor, 0.1)}`,
              }}
            >
              Start conversation
            </button>
          </div>

          {/* Right Panel - Skills Toolbox */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" style={{ color: primaryColor }} />
                <h2 className="text-lg font-light">Skills</h2>
              </div>

              <div className="space-y-3">
                {skills.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        selectedSkill === skill.id
                          ? "border"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      style={
                        selectedSkill === skill.id
                          ? {
                              backgroundColor: hexToRgba(primaryColor, 0.2),
                              borderColor: hexToRgba(primaryColor, 0.3),
                            }
                          : {}
                      }
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Icon
                            className="w-5 h-5"
                            style={{ color: primaryColor }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">{skill.name}</h3>
                          <p className="text-xs text-slate-400">
                            {skill.uses} uses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${skill.success * 100}%`,
                              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {Math.round(skill.success * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Glow Process Tracker */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <Circle className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="text-lg font-light">Today's Glow Process</h2>
          </div>

          <div className="flex items-center gap-2">
            {glowPhases.map((phase, idx) => (
              <React.Fragment key={idx}>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className={`w-full h-2 rounded-full transition-all ${
                      phase.complete ? "" : "bg-white/10"
                    }`}
                    style={
                      phase.complete
                        ? {
                            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                          }
                        : {}
                    }
                  />
                  <span
                    className={`text-xs ${
                      phase.complete ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {phase.name}
                  </span>
                </div>
                {idx < glowPhases.length - 1 && (
                  <div className="w-8 h-0.5 bg-white/10 -mt-5" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* GPT Carousel Modal */}
      <AnimatePresence>
        {showCarousel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCarousel(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-visible shadow-2xl"
              >
                <GPTCarousel
                  theme="dark"
                  onSelect={(persona) => {
                    setShowCarousel(false);
                    console.log("Persona selected:", persona);
                  }}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      </div>
    </WavyBackground>
  );
};

export default GlowDashboard;
