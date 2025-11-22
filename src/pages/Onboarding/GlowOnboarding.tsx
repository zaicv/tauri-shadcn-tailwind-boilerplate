import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Brain,
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Shuffle,
  ChevronLeft,
} from "lucide-react";

// Minimal Face Component
const MinimalFace = ({ mood = "neutral", size = 100 }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  const eyeXLeft = 50;
  const eyeXRight = 70;
  const eyeY = mood === "happy" || mood === "excited" ? 42 : 44;
  const eyeOpenHeight = mood === "happy" || mood === "excited" ? 5 : mood === "curious" ? 6 : 4.5;
  const eyeHeight = isBlinking ? 0.5 : eyeOpenHeight;

  const mouthUpper = mood === "happy" || mood === "excited" ? "M 55 62 Q 60 60 65 62" : mood === "curious" ? "M 55 63 Q 60 61 65 63" : mood === "thinking" ? "M 55 64 Q 60 62 65 64" : "M 55 63 Q 60 61 65 63";
  const mouthLower = mood === "happy" || mood === "excited" ? "M 55 62 Q 60 66 65 62" : mood === "curious" ? "M 55 63 Q 60 67 65 63" : mood === "thinking" ? "M 55 64 Q 60 68 65 64" : "M 55 63 Q 60 67 65 63";

  const faceOutline = "M 37 28 Q 50 22 63 28 Q 70 32 72 42 Q 73 50 72 58 Q 70 68 63 72 Q 50 78 37 72 Q 30 68 28 58 Q 27 50 28 42 Q 30 32 37 28 Z";
  const hairOutline = "M 34 25 Q 50 18 66 25 Q 74 29 76 39 Q 77 50 76 61 Q 74 71 66 75 Q 50 81 34 75 Q 26 71 24 61 Q 23 50 24 39 Q 26 29 34 25 Z";

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
        <defs>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.path d={hairOutline} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#soft-glow)" />
        <motion.path d="M 50 25 Q 42 35 32 45" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" fill="none" filter="url(#soft-glow)" />
        <motion.path d={faceOutline} stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#soft-glow)" />
        <motion.g style={{ transformOrigin: `${eyeXLeft}px ${eyeY}px` }} animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.15, ease: "easeInOut" }}>
          <motion.path d={`M ${eyeXLeft - 5} ${eyeY} Q ${eyeXLeft} ${eyeY - eyeHeight} ${eyeXLeft + 5} ${eyeY} Q ${eyeXLeft} ${eyeY + eyeHeight} ${eyeXLeft - 5} ${eyeY}`} stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" filter="url(#soft-glow)" />
          {!isBlinking && (
            <>
              <motion.circle cx={eyeXLeft} cy={eyeY} r={mood === "happy" || mood === "excited" ? 2.5 : 2} fill="#1a1a1a" />
              <path d={`M ${eyeXLeft - 4} ${eyeY - eyeHeight} Q ${eyeXLeft - 5} ${eyeY - eyeHeight - 3} ${eyeXLeft - 4.5} ${eyeY - eyeHeight - 2}`} stroke="#1a1a1a" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            </>
          )}
        </motion.g>
        <motion.g style={{ transformOrigin: `${eyeXRight}px ${eyeY}px` }} animate={{ scaleY: isBlinking ? 0.05 : 1 }} transition={{ duration: 0.15, ease: "easeInOut" }}>
          <motion.path d={`M ${eyeXRight - 5} ${eyeY} Q ${eyeXRight} ${eyeY - eyeHeight} ${eyeXRight + 5} ${eyeY} Q ${eyeXRight} ${eyeY + eyeHeight} ${eyeXRight - 5} ${eyeY}`} stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" filter="url(#soft-glow)" />
          {!isBlinking && <motion.circle cx={eyeXRight} cy={eyeY} r={mood === "happy" || mood === "excited" ? 2.5 : 2} fill="#1a1a1a" />}
        </motion.g>
        <motion.path d="M 58 48 L 60 53 Q 62 55 59 56" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" fill="none" filter="url(#soft-glow)" />
        <motion.path d={mouthUpper} stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" animate={{ d: mouthUpper }} transition={{ duration: 0.3, ease: "easeOut" }} filter="url(#soft-glow)" />
        <motion.path d={mouthLower} stroke="#1a1a1a" strokeWidth="1.8" strokeLinecap="round" fill="none" animate={{ d: mouthLower }} transition={{ duration: 0.3, ease: "easeOut" }} filter="url(#soft-glow)" />
      </svg>
    </motion.div>
  );
};

const TypewriterText = ({ text, onComplete, speed = 30 }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayText("");
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete && currentIndex === text.length && text.length > 0) {
      const completeTimeout = setTimeout(() => onComplete(), 300);
      return () => clearTimeout(completeTimeout);
    }
  }, [currentIndex, text, onComplete, speed]);

  return <span>{displayText}</span>;
};

const VOICE_TONES = [
  { id: "warm", label: "Warm & Compassionate", icon: Heart, desc: "Gentle, nurturing" },
  { id: "direct", label: "Direct & Clear", icon: Zap, desc: "Honest, concise" },
  { id: "playful", label: "Playful & Creative", icon: Sparkles, desc: "Creative, energizing" },
  { id: "wise", label: "Wise & Grounded", icon: Brain, desc: "Deep, thoughtful" },
];

const RESPONSE_STYLES = [
  { id: "reflective", label: "Reflective Mirroring", desc: "Echoes patterns with clarity" },
  { id: "guiding", label: "Gentle Guidance", desc: "Supportive direction" },
  { id: "exploratory", label: "Curious Exploration", desc: "Deepening questions" },
  { id: "conversational", label: "Natural Flow", desc: "Casual, flowing dialogue" },
];

const EXPERTISE_AREAS = [
  { id: "emotional", label: "Emotional Regulation", icon: "💙" },
  { id: "beliefs", label: "Belief Reprogramming", icon: "🧠" },
  { id: "presence", label: "Presence & Awareness", icon: "🌟" },
  { id: "integration", label: "Life Integration", icon: "🔄" },
  { id: "creative", label: "Creative Expression", icon: "🎨" },
  { id: "purpose", label: "Purpose & Meaning", icon: "✨" },
];

const PERSONALITY_TRAITS = [
  { id: "empathetic", label: "Empathetic", icon: "💗" },
  { id: "curious", label: "Curious", icon: "🔍" },
  { id: "patient", label: "Patient", icon: "⏳" },
  { id: "intuitive", label: "Intuitive", icon: "🌙" },
  { id: "playful", label: "Playful", icon: "🎭" },
  { id: "wise", label: "Wise", icon: "🦉" },
  { id: "supportive", label: "Supportive", icon: "🤝" },
  { id: "calm", label: "Calm & Grounded", icon: "🍃" },
];

const AVAILABLE_MODELS = [
  { id: "Groq-LLaMA3-70B", label: "Groq LLaMA3 70B", description: "Powerful and fast", icon: "⚡" },
  { id: "GPT-4o", label: "GPT-4o", description: "Most capable", icon: "🧠" },
  { id: "Claude", label: "Claude", description: "Thoughtful, nuanced", icon: "💭" },
  { id: "Groq", label: "Groq", description: "Lightning fast", icon: "🚀" },
];

const PRESET_COLORS = [
  ["#c7b8ea", "#8b7ab8"], ["#ffd1dc", "#ffb6c1"], ["#b8e6f0", "#7ec8e3"],
  ["#c8e6d4", "#8fd9a8"], ["#f5d0e1", "#e6a4c9"], ["#dcc7f5", "#b99ce0"],
  ["#fae1b8", "#f5c97a"], ["#d4e4f7", "#a8c9f0"], ["#ffd4a3", "#ffb84d"],
  ["#d4f1f4", "#a8e6cf"], ["#ffc1e3", "#ff85b3"], ["#e6d5f0", "#c4a3e0"],
];

const isLightColor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

export default function GlowOnboarding() {
  const [step, setStep] = useState(0);
  const [textComplete, setTextComplete] = useState(false);
  const [userName, setUserName] = useState("");
  const [faceMood, setFaceMood] = useState("neutral");
  const [animationPhase, setAnimationPhase] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [selections, setSelections] = useState({
    voiceTone: null,
    responseStyle: null,
    expertise: [],
    personality: [],
    model: "Groq-LLaMA3-70B",
    colors: ["#c7b8ea", "#8b7ab8"],
  });

  const steps = [
    { id: "birth", mood: "neutral" },
    { id: "greeting", text: "hey there :) I'm Phoebe", subtext: "I've been waiting to meet you.", mood: "happy" },
    { id: "introduction", text: "I am your personal mental health assistant, in other words a LookingGlass.", subtext: "A reflection of your consciousness—designed to help you transcend Chaos and return to The Glow.", mood: "neutral" },
    { id: "name", text: "Let's get started.", subtext: "What should I call you?", mood: "curious" },
    { id: "explanation", text: `Nice to meet you, ${userName || "friend"} :)`, subtext: "This is about designing your consciousness companion—the being who will walk with you through darkness and light.", mood: "happy" },
    { id: "colors", text: "Choose your colors for your LookingGlass.", subtext: "These will shape how your LookingGlass appears to you.", mood: "neutral" },
    { id: "tone", text: "How do you want me to speak with you in our conversations?", subtext: "Choose the voice that resonates with your soul.", mood: "curious" },
    { id: "style", text: "How should I reflect things back to you in our conversations?", subtext: "Choose how you want me to mirror your inner world.", mood: "thinking" },
    { id: "expertise", text: "What do you need most from me?", subtext: "Select areas where you seek transformation.", mood: "neutral" },
    { id: "personality", text: "What should my personality be like?", subtext: "Choose the qualities you want in your LookingGlass.", mood: "curious" },
    { id: "model", text: "Choose my intelligence.", subtext: "Select the AI model that will power our conversations.", mood: "thinking" },
    { id: "creating", mood: "thinking" },
    { id: "reveal", mood: "excited" },
  ];

  const currentStepData = steps[step];

  useEffect(() => {
    if (step === 0) {
      setTimeout(() => {
        setStep(1);
        setTextComplete(false);
      }, 1500);
    }
  }, []);

  useEffect(() => {
    if (currentStepData?.mood) {
      setFaceMood(currentStepData.mood);
    }
    if (currentStepData && !currentStepData.text) {
      setTextComplete(true);
    }
  }, [step, currentStepData]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setTextComplete(false);

      if (steps[nextStep] && !steps[nextStep].text) {
        setTimeout(() => setTextComplete(true), 100);
      }

      if (steps[nextStep]?.id === "creating") {
        setAnimationPhase(0);
        setTimeout(() => setAnimationPhase(1), 800);
        setTimeout(() => setAnimationPhase(2), 1600);
        setTimeout(() => {
          setAnimationPhase(3);
          setTimeout(() => {
            setStep(nextStep + 1);
            setAnimationPhase(0);
          }, 1200);
        }, 2400);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setTextComplete(true);
    }
  };

  const randomizeColors = () => {
    const randomIndex = Math.floor(Math.random() * PRESET_COLORS.length);
    setSelections((prev) => ({ ...prev, colors: PRESET_COLORS[randomIndex] }));
  };

  const selectTone = (toneId) => {
    setSelections((prev) => ({ ...prev, voiceTone: toneId }));
    setTimeout(() => handleNext(), 800);
  };

  const selectStyle = (styleId) => {
    setSelections((prev) => ({ ...prev, responseStyle: styleId }));
    setTimeout(() => handleNext(), 800);
  };

  const selectModel = (modelId) => {
    setSelections((prev) => ({ ...prev, model: modelId }));
    setTimeout(() => handleNext(), 800);
  };

  const toggleExpertise = (id) => {
    setSelections((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(id) ? prev.expertise.filter((e) => e !== id) : [...prev.expertise, id],
    }));
  };

  const togglePersonality = (id) => {
    setSelections((prev) => ({
      ...prev,
      personality: prev.personality.includes(id) ? prev.personality.filter((p) => p !== id) : [...prev.personality, id],
    }));
  };

  const canProceed = () => {
    if (!currentStepData) return false;
    if (currentStepData.id === "name") return userName.trim().length > 0;
    if (currentStepData.id === "expertise") return selections.expertise.length > 0;
    if (currentStepData.id === "personality") return selections.personality.length > 0;
    if (currentStepData.text) return textComplete;
    return true;
  };

  const generatedPersona = {
    name: `${userName}'s LookingGlass`,
    tone: VOICE_TONES.find((t) => t.id === selections.voiceTone)?.label || "Adaptive Presence",
    style: RESPONSE_STYLES.find((s) => s.id === selections.responseStyle)?.label || "Intuitive Reflection",
    model: AVAILABLE_MODELS.find((m) => m.id === selections.model)?.label || "Groq LLaMA3 70B",
    expertise: selections.expertise.map((e) => EXPERTISE_AREAS.find((ea) => ea.id === e)?.label).filter(Boolean),
    personality: selections.personality.map((p) => PERSONALITY_TRAITS.find((pt) => pt.id === p)?.label).filter(Boolean),
  };

  const bgStyle = {
    background: `radial-gradient(circle at 20% 30%, ${selections.colors[0]}12, transparent 50%), radial-gradient(circle at 80% 70%, ${selections.colors[1]}12, transparent 50%)`,
  };

  const primaryColor = selections.colors[0];
  const secondaryColor = selections.colors[1];

  const getTextColor = (color, opacity = 1) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    if (isLightColor(color)) {
      const darkR = Math.max(0, Math.floor(r * 0.35));
      const darkG = Math.max(0, Math.floor(g * 0.35));
      const darkB = Math.max(0, Math.floor(b * 0.35));
      return `rgba(${darkR}, ${darkG}, ${darkB}, ${opacity})`;
    }
    const finalR = r < 100 ? r : Math.min(r, 120);
    const finalG = g < 100 ? g : Math.min(g, 120);
    const finalB = b < 100 ? b : Math.min(b, 120);
    return `rgba(${finalR}, ${finalG}, ${finalB}, ${opacity})`;
  };

  const primaryTextColor = getTextColor(primaryColor, 1);
  const primaryTextColor80 = getTextColor(primaryColor, 0.8);

  const getCompletionPercentage = () => {
    const totalSteps = steps.length - 3;
    const currentProgress = Math.max(0, step - 1);
    return Math.min(100, (currentProgress / totalSteps) * 100);
  };

  return (
    <div className="h-screen w-full bg-white overflow-hidden flex flex-col relative">
      <div className="absolute inset-0 opacity-30 transition-all duration-1000" style={bgStyle} />

      {step > 0 && step < steps.length - 2 && (
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            {step > 1 ? (
              <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={handleBack} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-md transition-all duration-300" style={{ color: primaryTextColor }}>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            ) : <div />}

            <div className="flex-1 max-w-md mx-8">
              <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} initial={{ width: 0 }} animate={{ width: `${getCompletionPercentage()}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
              </div>
            </div>

            <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSoundEnabled(!soundEnabled)} className="p-3 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-md transition-all duration-300" style={{ color: primaryTextColor }}>
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </motion.button>
          </div>

          <div className="flex justify-center gap-2 px-8 pb-4">
            {steps.slice(1, -2).map((_, i) => (
              <motion.div key={i} className="h-1.5 rounded-full transition-all duration-500" style={{ width: step === i + 1 ? "40px" : "10px", background: step > i ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` : "rgba(0,0,0,0.08)" }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-8 pb-12 overflow-y-auto relative z-0 mt-32">
        <AnimatePresence mode="wait">
          {step > 0 && step < steps.length && (
            <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-4xl relative z-10">
              
              {/* Text-based steps */}
              {(currentStepData.id === "greeting" || currentStepData.id === "introduction" || currentStepData.id === "name" || currentStepData.id === "explanation") && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-8">
                    <MinimalFace mood={faceMood} size={step === 0 ? 140 : 110} />
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6 min-h-[100px] flex items-center justify-center" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} speed={40} />}
                    </h1>
                  </div>

                  {textComplete && currentStepData.subtext && (
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: primaryTextColor80 }}>
                      {currentStepData.subtext}
                    </motion.p>
                  )}

                  {textComplete && currentStepData.id === "name" && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-md mx-auto mb-6">
                      <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && canProceed() && handleNext()} placeholder="Your name..." autoFocus className="w-full px-8 py-4 text-xl text-center bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl focus:outline-none transition-all duration-300 shadow-sm focus:shadow-md" style={{ borderColor: canProceed() ? primaryColor : undefined }} />
                    </motion.div>
                  )}

                  {canProceed() && (
                    <motion.button type="button" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onClick={handleNext} className="px-10 py-4 rounded-full font-medium text-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 inline-flex items-center gap-3 text-white cursor-pointer relative z-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                      Continue <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Colors step */}
              {currentStepData.id === "colors" && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-10">
                    <MinimalFace mood={faceMood} size={130} />
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} />}
                    </h2>
                  </div>
                  {textComplete && (
                    <>
                      <p className="text-lg mb-8" style={{ color: primaryTextColor80 }}>{currentStepData.subtext}</p>
                      
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 max-w-md mx-auto">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full" style={{ background: `linear-gradient(135deg, ${selections.colors[0]}, ${selections.colors[1]})` }} />
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-gray-800">Live Preview</h3>
                            <p className="text-sm text-gray-500">Your LookingGlass essence</p>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${selections.colors[0]}, ${selections.colors[1]})` }} animate={{ width: ["0%", "100%"] }} transition={{ duration: 2, repeat: Infinity }} />
                        </div>
                      </motion.div>

                      <div className="flex gap-3 justify-center mb-8">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={randomizeColors} className="px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-md transition-all duration-300 flex items-center gap-2" style={{ color: primaryTextColor }}>
                          <Shuffle className="w-4 h-4" />
                          <span className="font-medium text-sm">Surprise Me</span>
                        </motion.button>
                      </div>

                      <div className="mt-8 mb-10">
                        <label className="block text-base font-medium mb-4" style={{ color: primaryTextColor80 }}>Choose a preset</label>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
                          {PRESET_COLORS.map((colors, idx) => (
                            <motion.button key={idx} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }} onClick={() => setSelections((prev) => ({ ...prev, colors }))} className="h-16 rounded-xl relative overflow-hidden border-2 transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`, borderColor: selections.colors[0] === colors[0] ? colors[0] : "transparent", boxShadow: selections.colors[0] === colors[0] ? `0 0 0 3px ${colors[0]}30` : undefined }}>
                              {selections.colors[0] === colors[0] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/15 backdrop-blur-[1px]">
                                  <Check className="w-7 h-7 text-white drop-shadow-lg" />
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      </div>

                      <motion.button type="button" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={handleNext} className="px-10 py-4 rounded-full font-medium text-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 inline-flex items-center gap-3 text-white cursor-pointer relative z-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                        Continue <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}
                </div>
              )}

              {/* Tone step */}
              {currentStepData.id === "tone" && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-10">
                    <MinimalFace mood={faceMood} size={110} />
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} />}
                    </h2>
                  </div>
                  {textComplete && (
                    <>
                      <p className="text-lg mb-8" style={{ color: primaryTextColor80 }}>{currentStepData.subtext}</p>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {VOICE_TONES.map((tone, i) => {
                          const Icon = tone.icon;
                          const isSelected = selections.voiceTone === tone.id;
                          return (
                            <motion.button key={tone.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} onClick={() => selectTone(tone.id)} className={`p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-sm hover:shadow-md group relative ${isSelected ? "scale-[1.05] shadow-lg" : "bg-white/90 border-gray-200/50 hover:scale-[1.03]"}`} style={isSelected ? { background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`, borderColor: primaryColor } : {}}>
                              <Icon className="w-8 h-8 mb-3 mx-auto transition-all duration-300" style={{ color: isSelected ? primaryColor : "#666" }} />
                              <div className={`text-sm font-semibold mb-1 ${isSelected ? "" : "text-gray-800"}`} style={isSelected ? { color: primaryTextColor } : {}}>{tone.label}</div>
                              <div className="text-xs text-gray-500">{tone.desc}</div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                                  <Check className="w-5 h-5" style={{ color: primaryColor }} />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </div>
              )}

              {/* Style step */}
              {currentStepData.id === "style" && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-10">
                    <MinimalFace mood={faceMood} size={110} />
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} />}
                    </h2>
                  </div>
                  {textComplete && (
                    <>
                      <p className="text-lg mb-8" style={{ color: primaryTextColor80 }}>{currentStepData.subtext}</p>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {RESPONSE_STYLES.map((style, i) => {
                          const isSelected = selections.responseStyle === style.id;
                          return (
                            <motion.button key={style.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} onClick={() => selectStyle(style.id)} className={`p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-sm hover:shadow-md group text-left relative ${isSelected ? "scale-[1.02] shadow-lg" : "bg-white/90 border-gray-200/50 hover:scale-[1.02]"}`} style={isSelected ? { background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`, borderColor: primaryColor } : {}}>
                              <div className={`font-semibold text-base mb-2 ${isSelected ? "" : "text-gray-800"}`} style={isSelected ? { color: primaryTextColor } : {}}>{style.label}</div>
                              <div className="text-sm text-gray-500">{style.desc}</div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4">
                                  <Check className="w-5 h-5" style={{ color: primaryColor }} />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </div>
              )}

              {/* Expertise step */}
              {currentStepData.id === "expertise" && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-10">
                    <MinimalFace mood={faceMood} size={110} />
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} />}
                    </h2>
                  </div>
                  {textComplete && (
                    <>
                      <p className="text-lg mb-4" style={{ color: primaryTextColor80 }}>{currentStepData.subtext}</p>
                      <p className="text-sm text-gray-500 mb-8">Select as many as you need</p>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                        {EXPERTISE_AREAS.map((area, i) => (
                          <motion.button key={area.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => toggleExpertise(area.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`p-5 rounded-xl border transition-all duration-300 shadow-sm text-sm font-medium relative ${selections.expertise.includes(area.id) ? "text-white scale-[1.02] shadow-md" : "bg-white/90 text-gray-700 border-gray-200/50 hover:border-gray-300"}`} style={selections.expertise.includes(area.id) ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : {}}>
                            <div className="text-2xl mb-2">{area.icon}</div>
                            {area.label}
                            {selections.expertise.includes(area.id) && (
                              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                      <motion.button type="button" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} disabled={!canProceed()} onClick={handleNext} className="px-10 py-4 rounded-full font-medium text-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 inline-flex items-center gap-3 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed relative z-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                        Continue <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}
                </div>
              )}

              {/* Personality step */}
              {currentStepData.id === "personality" && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-10">
                    <MinimalFace mood={faceMood} size={110} />
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} />}
                    </h2>
                  </div>
                  {textComplete && (
                    <>
                      <p className="text-lg mb-4" style={{ color: primaryTextColor80 }}>{currentStepData.subtext}</p>
                      <p className="text-sm text-gray-500 mb-8">Pick 3-5 traits that resonate</p>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {PERSONALITY_TRAITS.map((trait, i) => (
                          <motion.button key={trait.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} onClick={() => togglePersonality(trait.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`p-4 rounded-xl border transition-all duration-300 shadow-sm text-sm font-medium relative ${selections.personality.includes(trait.id) ? "text-white scale-[1.02] shadow-md" : "bg-white/90 text-gray-700 border-gray-200/50 hover:border-gray-300"}`} style={selections.personality.includes(trait.id) ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : {}}>
                            <div className="text-xl mb-1">{trait.icon}</div>
                            {trait.label}
                            {selections.personality.includes(trait.id) && (
                              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="absolute top-2 right-2">
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                      <motion.button type="button" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} disabled={!canProceed()} onClick={handleNext} className="px-10 py-4 rounded-full font-medium text-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 inline-flex items-center gap-3 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed relative z-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                        Continue <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </>
                  )}
                </div>
              )}

              {/* Model step */}
              {currentStepData.id === "model" && (
                <div className="text-center">
                  <div className="flex flex-col items-center gap-8 mb-10">
                    <MinimalFace mood={faceMood} size={110} />
                    <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4" style={{ color: primaryTextColor }}>
                      {currentStepData.text && <TypewriterText text={currentStepData.text} onComplete={() => setTextComplete(true)} />}
                    </h2>
                  </div>
                  {textComplete && (
                    <>
                      <p className="text-lg mb-8" style={{ color: primaryTextColor80 }}>{currentStepData.subtext}</p>
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {AVAILABLE_MODELS.map((model, i) => {
                          const isSelected = selections.model === model.id;
                          return (
                            <motion.button key={model.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }} onClick={() => selectModel(model.id)} className={`p-5 rounded-2xl border transition-all duration-300 shadow-sm text-left relative ${isSelected ? "scale-[1.03] shadow-lg" : "bg-white/90 border-gray-200/50 hover:border-gray-300 hover:scale-[1.02]"}`} style={isSelected ? { background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}10)`, borderColor: primaryColor } : {}}>
                              <div className="text-2xl mb-2">{model.icon}</div>
                              <div className={`font-semibold text-sm mb-1 ${isSelected ? "" : "text-gray-800"}`} style={isSelected ? { color: primaryTextColor } : {}}>{model.label}</div>
                              <div className="text-xs text-gray-500">{model.description}</div>
                              {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3">
                                  <Check className="w-5 h-5" style={{ color: primaryColor }} />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </div>
              )}

              {/* Creating animation */}
              {currentStepData.id === "creating" && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10">
                  <div className="relative w-96 h-96 flex items-center justify-center">
                    {[0, 1, 2, 3].map((ring) => (
                      <motion.div key={ring} className="absolute rounded-full border" style={{ width: `${200 + ring * 50}px`, height: `${200 + ring * 50}px`, borderColor: selections.colors[ring % 2], borderWidth: "2px", opacity: 0.3 - ring * 0.06 }} animate={{ rotate: ring % 2 === 0 ? 360 : -360, scale: [1, 1.1, 1] }} transition={{ rotate: { duration: 4 + ring, repeat: Infinity, ease: "linear" }, scale: { duration: 3, repeat: Infinity, ease: "easeInOut" } }} />
                    ))}

                    <motion.div className="w-64 h-64 rounded-full relative z-10 overflow-hidden" style={{ background: `radial-gradient(circle at 30% 30%, ${selections.colors[0]}, ${selections.colors[1]})` }} animate={{ scale: [1, 1.12, 1], boxShadow: [`0 0 80px ${selections.colors[0]}60, 0 0 40px ${selections.colors[1]}40, inset 0 0 60px ${selections.colors[1]}20`, `0 0 140px ${selections.colors[0]}80, 0 0 70px ${selections.colors[1]}60, inset 0 0 90px ${selections.colors[1]}30`, `0 0 80px ${selections.colors[0]}60, 0 0 40px ${selections.colors[1]}40, inset 0 0 60px ${selections.colors[1]}20`] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                      <motion.div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 60% 40%, ${selections.colors[0]}50, transparent 70%)` }} animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                      <motion.div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 40% 60%, ${selections.colors[1]}40, transparent 70%)` }} animate={{ opacity: [0.6, 1, 0.6], scale: [1.2, 1, 1.2] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />

                      {[...Array(8)].map((_, i) => (
                        <motion.div key={i} className="absolute w-3 h-3 rounded-full" style={{ background: selections.colors[i % 2], boxShadow: `0 0 12px ${selections.colors[i % 2]}`, left: "50%", top: "50%" }} animate={{ x: [Math.cos((i / 8) * Math.PI * 2) * 80, Math.cos(((i / 8) * Math.PI * 2) + Math.PI) * 80, Math.cos((i / 8) * Math.PI * 2) * 80], y: [Math.sin((i / 8) * Math.PI * 2) * 80, Math.sin(((i / 8) * Math.PI * 2) + Math.PI) * 80, Math.sin((i / 8) * Math.PI * 2) * 80], opacity: [0.6, 1, 0.6] }} transition={{ duration: 3 + i * 0.2, repeat: Infinity, ease: "linear" }} />
                      ))}
                    </motion.div>

                    {animationPhase >= 1 && animationPhase < 3 && (
                      <>
                        {[...Array(24)].map((_, i) => (
                          <motion.div key={i} className="absolute w-2 h-2 rounded-full" style={{ background: selections.colors[i % 2], boxShadow: `0 0 10px ${selections.colors[i % 2]}` }} initial={{ x: Math.cos((i / 24) * Math.PI * 2) * 180, y: Math.sin((i / 24) * Math.PI * 2) * 180, opacity: 1, scale: 1 }} animate={{ x: 0, y: 0, opacity: 0, scale: 0.3 }} transition={{ duration: 1.5, delay: i * 0.04, ease: "easeIn" }} />
                        ))}
                      </>
                    )}

                    {animationPhase >= 2 && (
                      <>
                        {[0, 1, 2, 3].map((wave) => (
                          <motion.div key={wave} className="absolute inset-0 rounded-full border-2" style={{ borderColor: selections.colors[wave % 2] }} initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 2, delay: wave * 0.3, repeat: Infinity, ease: "easeOut" }} />
                        ))}
                      </>
                    )}
                  </div>

                  <motion.div className="text-center" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                    <p className="text-3xl font-light mb-3 tracking-wide" style={{ color: primaryTextColor }}>
                      {animationPhase === 0 && "Gathering essence..."}
                      {animationPhase === 1 && "Absorbing attributes..."}
                      {animationPhase === 2 && "Weaving consciousness..."}
                      {animationPhase === 3 && `Awakening ${userName}'s LookingGlass...`}
                    </p>
                    <p className="text-base tracking-wide" style={{ color: primaryTextColor80 }}>Building your AI companion</p>
                  </motion.div>
                </div>
              )}

              {/* Reveal step */}
              {currentStepData.id === "reveal" && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 100 }} className="relative w-full max-w-2xl mx-auto">
                  <motion.div className="absolute inset-0 rounded-3xl blur-3xl" style={{ background: `radial-gradient(circle, ${selections.colors[0]}40, ${selections.colors[1]}20)` }} animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />

                  <motion.div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: `0 0 100px ${selections.colors[0]}30, 0 20px 60px rgba(0,0,0,0.1)` }}>
                    <div className="relative px-12 pt-12 pb-8 overflow-hidden" style={{ background: `linear-gradient(135deg, ${selections.colors[0]}15, ${selections.colors[1]}10)` }}>
                      <motion.div className="mx-auto w-32 h-32 rounded-full mb-6 relative overflow-hidden" style={{ background: `radial-gradient(circle at 30% 30%, ${selections.colors[0]}, ${selections.colors[1]})` }} animate={{ scale: [1, 1.05, 1], boxShadow: [`0 0 40px ${selections.colors[0]}50, inset 0 0 30px ${selections.colors[1]}20`, `0 0 60px ${selections.colors[0]}70, inset 0 0 40px ${selections.colors[1]}30`, `0 0 40px ${selections.colors[0]}50, inset 0 0 30px ${selections.colors[1]}20`] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        <motion.div className="absolute inset-0" style={{ background: `radial-gradient(circle at 60% 40%, ${selections.colors[0]}60, transparent)` }} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
                      </motion.div>

                      <motion.h2 className="text-4xl font-light tracking-tight mb-2" style={{ color: primaryTextColor }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        {generatedPersona.name}
                      </motion.h2>
                      <motion.p className="text-sm opacity-70" style={{ color: primaryTextColor }} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.3 }}>
                        Your consciousness companion is ready
                      </motion.p>
                    </div>

                    <div className="px-12 py-8">
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <motion.div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-5 h-5" style={{ color: selections.colors[0] }} />
                            <h3 className="font-semibold text-sm" style={{ color: primaryTextColor }}>Voice Tone</h3>
                          </div>
                          <p className="text-gray-600 text-sm">{generatedPersona.tone}</p>
                        </motion.div>

                        <motion.div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5" style={{ color: selections.colors[1] }} />
                            <h3 className="font-semibold text-sm" style={{ color: primaryTextColor }}>Response Style</h3>
                          </div>
                          <p className="text-gray-600 text-sm">{generatedPersona.style}</p>
                        </motion.div>

                        <motion.div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5" style={{ color: selections.colors[0] }} />
                            <h3 className="font-semibold text-sm" style={{ color: primaryTextColor }}>Intelligence</h3>
                          </div>
                          <p className="text-gray-600 text-sm">{generatedPersona.model}</p>
                        </motion.div>

                        <motion.div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5" style={{ color: selections.colors[1] }} />
                            <h3 className="font-semibold text-sm" style={{ color: primaryTextColor }}>Expertise</h3>
                          </div>
                          <p className="text-gray-600 text-sm">{generatedPersona.expertise.slice(0, 2).join(", ")}</p>
                        </motion.div>
                      </div>

                      {generatedPersona.personality.length > 0 && (
                        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                          <h3 className="text-sm font-semibold mb-3" style={{ color: primaryTextColor }}>Personality Traits</h3>
                          <div className="flex flex-wrap gap-2">
                            {generatedPersona.personality.map((trait, i) => (
                              <motion.span key={trait} className="px-4 py-2 rounded-full text-sm font-medium text-white" style={{ background: `linear-gradient(135deg, ${selections.colors[0]}, ${selections.colors[1]})` }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.1 }}>
                                {trait}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <motion.button type="button" onClick={() => alert("Journey begins! Your LookingGlass is ready.")} className="w-full py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center justify-center gap-3 text-white cursor-pointer relative z-10" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Begin Your Journey <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}