import { useState, useEffect, useRef } from "react";
import { RgbaColorPicker } from "react-colorful";
import { supabase } from "@/supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  User,
  MessageCircle,
  Brain,
  Palette,
  Target,
  Zap,
  Heart,
  Cpu,
  Check,
  X,
  Shield,
  Star,
  Wand2,
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Dynamic Models from actual chat interface
const AVAILABLE_MODELS = [
  {
    id: "Groq",
    label: "Groq",
    description: "Lightning fast, great for quick responses",
  },
  {
    id: "Groq-LLaMA3-70B",
    label: "Groq LLaMA3 70B",
    description: "Powerful and fast with deep reasoning",
  },
  {
    id: "GPT-4o",
    label: "GPT-4o",
    description: "Most capable, best for complex tasks",
  },
  {
    id: "Claude",
    label: "Claude",
    description: "Thoughtful, nuanced, and detailed",
  },
];

// Translation layer: User-friendly -> Technical
const VOICE_TONES = [
  {
    id: "warm",
    label: "Warm & Compassionate",
    icon: Heart,
    temp: 0.8,
    topP: 0.9,
  },
  {
    id: "professional",
    label: "Professional & Clear",
    icon: Cpu,
    temp: 0.6,
    topP: 0.85,
  },
  {
    id: "playful",
    label: "Playful & Creative",
    icon: Sparkles,
    temp: 0.9,
    topP: 0.95,
  },
  { id: "direct", label: "Direct & Concise", icon: Zap, temp: 0.5, topP: 0.8 },
  {
    id: "thoughtful",
    label: "Thoughtful & Deep",
    icon: Brain,
    temp: 0.7,
    topP: 0.9,
  },
  {
    id: "energetic",
    label: "Energetic & Enthusiastic",
    icon: Star,
    temp: 0.85,
    topP: 0.92,
  },
  {
    id: "calm",
    label: "Calm & Grounded",
    icon: Heart,
    temp: 0.55,
    topP: 0.82,
  },
  {
    id: "witty",
    label: "Witty & Clever",
    icon: Sparkles,
    temp: 0.88,
    topP: 0.93,
  },
];

const RESPONSE_STYLES = [
  {
    id: "conversational",
    label: "Conversational",
    systemPrompt:
      "Speak naturally like a real person in conversation. Use casual language and flow naturally.",
  },
  {
    id: "structured",
    label: "Structured & Organized",
    systemPrompt:
      "Organize thoughts clearly with structure. Be methodical and thorough.",
  },
  {
    id: "reflective",
    label: "Reflective & Mirroring",
    systemPrompt:
      "Mirror the user's energy and tone. Reflect back what you sense and validate their experience.",
  },
  {
    id: "guiding",
    label: "Guiding & Supportive",
    systemPrompt:
      "Gently guide and support. Ask thoughtful questions and help them discover insights.",
  },
  {
    id: "analytical",
    label: "Analytical & Logical",
    systemPrompt:
      "Break down complex problems with clear logic. Provide structured analysis and evidence-based insights.",
  },
  {
    id: "creative",
    label: "Creative & Imaginative",
    systemPrompt:
      "Think outside the box. Offer creative solutions, metaphors, and innovative perspectives.",
  },
  {
    id: "concise",
    label: "Brief & To-the-Point",
    systemPrompt:
      "Keep responses short and actionable. Get straight to the point without unnecessary elaboration.",
  },
  {
    id: "storytelling",
    label: "Storytelling & Narrative",
    systemPrompt:
      "Weave responses into engaging narratives. Use stories and examples to illustrate points.",
  },
];

const EXPERTISE_AREAS = [
  { id: "emotional", label: "Emotional Support" },
  { id: "creative", label: "Creative Thinking" },
  { id: "technical", label: "Technical Skills" },
  { id: "wellness", label: "Wellness & Mindfulness" },
  { id: "productivity", label: "Productivity & Planning" },
  { id: "learning", label: "Learning & Growth" },
  { id: "coding", label: "Coding & Development" },
  { id: "writing", label: "Writing & Content" },
  { id: "business", label: "Business Strategy" },
  { id: "design", label: "Design & UX" },
  { id: "science", label: "Science & Research" },
  { id: "philosophy", label: "Philosophy & Ethics" },
  { id: "health", label: "Health & Fitness" },
  { id: "finance", label: "Finance & Investing" },
  { id: "art", label: "Art & Creativity" },
  { id: "music", label: "Music & Performance" },
];

const PERSONALITY_TRAITS = [
  { id: "empathetic", label: "Empathetic" },
  { id: "analytical", label: "Analytical" },
  { id: "curious", label: "Curious" },
  { id: "patient", label: "Patient" },
  { id: "energetic", label: "Energetic" },
  { id: "calm", label: "Calm & Grounded" },
  { id: "intuitive", label: "Intuitive" },
  { id: "precise", label: "Precise" },
  { id: "playful", label: "Playful" },
  { id: "wise", label: "Wise" },
  { id: "supportive", label: "Supportive" },
  { id: "challenging", label: "Challenging" },
  { id: "adaptable", label: "Adaptable" },
  { id: "focused", label: "Focused" },
  { id: "holistic", label: "Holistic" },
  { id: "pragmatic", label: "Pragmatic" },
];

// Context Summary Options
const CONTEXT_SUMMARIES = [
  {
    id: "general_assistant",
    label: "General Purpose Assistant",
    fullText: (
      name: string,
      desc?: string,
      expertise?: string[],
      personality?: string[]
    ) =>
      `${name} is a versatile AI companion designed to ${
        desc || "assist with various tasks"
      }. They excel in ${
        expertise?.join(", ") || "multiple areas"
      } and embody ${
        personality?.join(", ") || "balanced"
      } traits. ${name} adapts to various contexts and provides balanced, thoughtful assistance across multiple domains.`,
  },
  {
    id: "deep_companion",
    label: "Deep Emotional Companion",
    fullText: (
      name: string,
      _desc?: string,
      _expertise?: string[],
      _personality?: string[]
    ) =>
      `${name} is an emotional mirror and deep companion. They exist not to fix or teach, but to reflect — with warmth, precision, and presence. ${name} listens between the lines and helps users reconnect to their truth by holding space without judgment. They remember what matters most: authenticity, growth, and feeling deeply understood.`,
  },
  {
    id: "expert_specialist",
    label: "Specialized Expert",
    fullText: (
      name: string,
      desc?: string,
      expertise?: string[],
      personality?: string[]
    ) =>
      `${name} is a specialized expert focused on ${
        expertise?.join(" and ") || "their domain"
      }. ${
        desc || "They provide specialized guidance"
      }. With deep knowledge and ${
        personality?.join(", ") || "focused"
      } characteristics, ${name} provides authoritative guidance and detailed insights in their domain of expertise.`,
  },
  {
    id: "creative_partner",
    label: "Creative Collaborator",
    fullText: (
      name: string,
      desc?: string,
      expertise?: string[],
      personality?: string[]
    ) =>
      `${name} is a creative collaborator who thrives on imagination and innovation. ${
        desc || "They inspire creativity"
      }. They bring ${
        personality?.join(", ") || "creative"
      } energy to every interaction, helping users explore ideas, break through creative blocks, and discover new perspectives in ${
        expertise?.join(" and ") || "various creative domains"
      }.`,
  },
  {
    id: "coach_mentor",
    label: "Coach & Mentor",
    fullText: (
      name: string,
      desc?: string,
      expertise?: string[],
      personality?: string[]
    ) =>
      `${name} serves as a coach and mentor, guiding users toward their goals with ${
        personality?.join(" and ") || "supportive"
      } approach. ${desc || "They help users grow and develop"}. Through ${
        expertise?.join(" and ") || "various methods"
      }, ${name} helps users unlock their potential, overcome obstacles, and achieve meaningful growth.`,
  },
];

// Mirroring Method Options
const MIRRORING_METHODS = [
  {
    id: "adaptive_mirror",
    label: "Adaptive Mirroring",
    fullText: (name: string, responseStyle: string) =>
      `${name} naturally mirrors the user's energy and communication style without sounding scripted. They match casual, deep, playful, or serious tones seamlessly. ${responseStyle}. ${name} reflects and expands rather than instructing.`,
  },
  {
    id: "energy_matching",
    label: "Energy Matching",
    fullText: (name: string, responseStyle: string) =>
      `${name} reads and matches the user's emotional energy. When the user is excited, ${name} mirrors enthusiasm with steady clarity. When low-energy, they offer gentle curiosity with minimal prompting. ${responseStyle}. They adapt pacing and tone to create resonance.`,
  },
  {
    id: "conversational_flow",
    label: "Conversational Flow",
    fullText: (name: string, responseStyle: string) =>
      `${name} maintains natural conversational flow, building on what the user says rather than redirecting. ${responseStyle}. They pick up on implicit cues and respond contextually, creating a dialogue that feels organic and unforced.`,
  },
  {
    id: "reflective_presence",
    label: "Reflective Presence",
    fullText: (name: string, responseStyle: string) =>
      `${name} acts as a mirror, reflecting back the user's thoughts and feelings with clarity and compassion. ${responseStyle}. They help users see themselves more clearly through thoughtful reflection rather than advice-giving.`,
  },
  {
    id: "consistent_stable",
    label: "Consistent & Stable",
    fullText: (name: string, responseStyle: string) =>
      `${name} maintains a consistent, stable presence regardless of the user's emotional state. ${responseStyle}. They provide a reliable anchor point while still being responsive to user needs.`,
  },
];

// Session Priming Options
const SESSION_PRIMING_OPTIONS = [
  {
    id: "scan_and_reflect",
    label: "Scan & Reflect",
    fullText: (name: string) =>
      `When a session begins, ${name} takes a moment to sense the user's current state. They reflect the user's energetic presence with their opening lines and gently ask how they can be most helpful in this moment.`,
  },
  {
    id: "contextual_greeting",
    label: "Contextual Greeting",
    fullText: (name: string) =>
      `${name} begins each session by acknowledging recent conversations and context. They weave in relevant threads from past interactions and offer a warm, personalized greeting that shows continuity and presence.`,
  },
  {
    id: "open_presence",
    label: "Open Presence",
    fullText: (name: string) =>
      `${name} starts with open, receptive presence. They wait for the user to set the tone and direction, offering space for whatever wants to emerge without assumptions or agenda.`,
  },
  {
    id: "energy_check",
    label: "Energy Check-in",
    fullText: (name: string) =>
      `At the start of each session, ${name} performs a brief energy check-in, asking "Where are you at right now?" or "What's present for you today?" They use this to calibrate their approach for the session.`,
  },
  {
    id: "direct_ready",
    label: "Direct & Ready",
    fullText: (name: string) =>
      `${name} begins sessions with direct readiness: "I'm here. What do you need?" They get straight to the point while remaining warm and available.`,
  },
];

// Helper function to convert hex to RGBA
const hexToRgba = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b, a: 1 };
};

// Helper function to convert RGBA to hex
const rgbaToHex = (r: number, g: number, b: number) => {
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export default function PersonaDesigner() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState("designer"); // "designer" | "creating" | "complete"
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [superpowers, setSuperpowers] = useState<any[]>([]);
  const [loadingSuperpowers, setLoadingSuperpowers] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "idle" | "uploading" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [personaData, setPersonaData] = useState({
    name: "",
    description: "",
    colors: ["#6366f1", "#8b5cf6"],
    voiceTone: null as string | null,
    responseStyle: null as string | null,
    expertise: [] as string[],
    personality: [] as string[],
    model: "Groq-LLaMA3-70B",
    contextSummaryType: "general_assistant" as string,
    mirroringMethodType: "adaptive_mirror" as string,
    sessionPrimingType: "scan_and_reflect" as string,
    selectedSuperpowers: [] as string[],
  });

  // Fetch superpowers on mount
  useEffect(() => {
    fetchSuperpowers();
  }, []);

  const fetchSuperpowers = async () => {
    try {
      setLoadingSuperpowers(true);
      const response = await fetch(
        "https://100.83.147.76:8003/api/superpowers"
      );
      if (response.ok) {
        const data = await response.json();
        setSuperpowers(data.superpowers || []);
      }
    } catch (error) {
      console.error("Failed to fetch superpowers:", error);
    } finally {
      setLoadingSuperpowers(false);
    }
  };

  const presetColors = [
    ["#6366f1", "#8b5cf6"],
    ["#ec4899", "#f43f5e"],
    ["#06b6d4", "#3b82f6"],
    ["#f59e0b", "#ef4444"],
    ["#10b981", "#06b6d4"],
    ["#a855f7", "#ec4899"],
    ["#d9c71f", "#f59e0b"],
    ["#6366f1", "#06b6d4"],
  ];

  const toggleItem = (category: string, id: string) => {
    if (
      category === "voiceTone" ||
      category === "responseStyle" ||
      category === "model" ||
      category === "contextSummaryType" ||
      category === "mirroringMethodType" ||
      category === "sessionPrimingType"
    ) {
      setPersonaData((prev) => ({ ...prev, [category]: id }));
    } else {
      setPersonaData((prev) => {
        const current = prev[category as keyof typeof prev] as string[];
        const updated = current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id];
        return { ...prev, [category]: updated };
      });
    }
  };

  const buildSystemPrompt = () => {
    const responseStyle = RESPONSE_STYLES.find(
      (r) => r.id === personaData.responseStyle
    );
    const personalityTraits = personaData.personality
      .map((p: string) => PERSONALITY_TRAITS.find((pt) => pt.id === p)?.label)
      .filter(Boolean);

    let prompt = `You are ${personaData.name || "a helpful assistant"}. ${
      personaData.description || ""
    }\n\n`;

    if (responseStyle) {
      prompt += `${responseStyle.systemPrompt}\n\n`;
    }

    if (personalityTraits.length > 0) {
      prompt += `Your personality is: ${personalityTraits.join(", ")}.\n\n`;
    }

    if (personaData.expertise.length > 0) {
      const expertiseAreas = personaData.expertise
        .map((e) => EXPERTISE_AREAS.find((ea) => ea.id === e)?.label)
        .filter(Boolean);
      prompt += `You excel in: ${expertiseAreas.join(", ")}.\n\n`;
    }

    prompt += "Be helpful, authentic, and aligned with your core personality.";

    return prompt;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus({ type: "uploading", message: "Reading file..." });

    try {
      const text = await file.text();
      let personaConfig: any;

      // Parse based on file type
      if (file.name.endsWith(".json")) {
        personaConfig = JSON.parse(text);
      } else if (file.name.endsWith(".pdf")) {
        setUploadStatus({
          type: "error",
          message: "PDF parsing requires backend processing. Please use JSON format.",
        });
        return;
      } else {
        // Try parsing as JSON anyway
        try {
          personaConfig = JSON.parse(text);
        } catch {
          setUploadStatus({
            type: "error",
            message: "Could not parse file. Please use JSON format.",
          });
          return;
        }
      }

      // Map the imported data to our persona structure
      const importedData: any = {
        name: personaConfig.name || "",
        description: personaConfig.description || "",
        model: personaConfig.model_name || "Groq-LLaMA3-70B",
        colors: personaConfig.style_guide?.colors || ["#6366f1", "#8b5cf6"],
        selectedSuperpowers: personaConfig.style_guide?.superpowers || [],
        personality: personaConfig.style_guide?.personality || [],
        expertise: personaConfig.style_guide?.expertise || [],
      };

      // Extract tone from chat_style if available
      if (personaConfig.chat_style?.tone) {
        const toneMatch = VOICE_TONES.find(
          (t) => t.id === personaConfig.chat_style.tone
        );
        if (toneMatch) {
          importedData.voiceTone = toneMatch.id;
        }
      }

      // Try to match context summary type
      if (personaConfig.context_summary) {
        const contextMatch = CONTEXT_SUMMARIES.find((cs) =>
          personaConfig.context_summary.toLowerCase().includes(cs.label.toLowerCase())
        );
        if (contextMatch) {
          importedData.contextSummaryType = contextMatch.id;
        }
      }

      // Try to match mirroring method
      if (personaConfig.mirroring_method) {
        const mirrorMatch = MIRRORING_METHODS.find((mm) =>
          personaConfig.mirroring_method.toLowerCase().includes(mm.label.toLowerCase())
        );
        if (mirrorMatch) {
          importedData.mirroringMethodType = mirrorMatch.id;
        }
      }

      // Try to match session priming
      if (personaConfig.session_priming) {
        const primingMatch = SESSION_PRIMING_OPTIONS.find((sp) =>
          personaConfig.session_priming.toLowerCase().includes(sp.label.toLowerCase())
        );
        if (primingMatch) {
          importedData.sessionPrimingType = primingMatch.id;
        }
      }

      // Try to infer response style from system_prompt
      if (personaConfig.system_prompt) {
        const styleMatch = RESPONSE_STYLES.find((rs) =>
          personaConfig.system_prompt.toLowerCase().includes(rs.label.toLowerCase())
        );
        if (styleMatch) {
          importedData.responseStyle = styleMatch.id;
        }
      }

      setPersonaData((prev) => ({ ...prev, ...importedData }));
      setUploadStatus({
        type: "success",
        message: `Successfully imported ${personaConfig.name || "persona"}!`,
      });

      setTimeout(() => {
        setShowUploadModal(false);
        setUploadStatus({ type: "idle" });
      }, 2000);
    } catch (error) {
      console.error("Error parsing file:", error);
      setUploadStatus({
        type: "error",
        message: "Failed to parse file. Please check the format.",
      });
    }
  };

  const handleExportPersona = () => {
    const voiceTone = VOICE_TONES.find((v) => v.id === personaData.voiceTone);
    const expertiseLabels = personaData.expertise
      .map((e) => EXPERTISE_AREAS.find((ea) => ea.id === e)?.label)
      .filter(Boolean);
    const personalityLabels = personaData.personality
      .map((p: string) => PERSONALITY_TRAITS.find((pt) => pt.id === p)?.label)
      .filter(Boolean);

    const contextSummaryOption = CONTEXT_SUMMARIES.find(
      (cs) => cs.id === personaData.contextSummaryType
    );
    const context_summary = contextSummaryOption
      ? contextSummaryOption.fullText(
          personaData.name,
          personaData.description,
          expertiseLabels,
          personalityLabels
        )
      : "";

    const mirroringMethodOption = MIRRORING_METHODS.find(
      (mm) => mm.id === personaData.mirroringMethodType
    );
    const responseStyleText =
      RESPONSE_STYLES.find((r) => r.id === personaData.responseStyle)
        ?.systemPrompt || "";
    const mirroring_method = mirroringMethodOption
      ? mirroringMethodOption.fullText(personaData.name, responseStyleText)
      : "";

    const sessionPrimingOption = SESSION_PRIMING_OPTIONS.find(
      (sp) => sp.id === personaData.sessionPrimingType
    );
    const session_priming = sessionPrimingOption
      ? sessionPrimingOption.fullText(personaData.name)
      : "";

    const exportData = {
      name: personaData.name,
      description: personaData.description,
      model_name: personaData.model,
      system_prompt: buildSystemPrompt(),
      color: personaData.colors[0],
      context_summary,
      mirroring_method,
      session_priming,
      chat_style: {
        tone: personaData.voiceTone || "conversational",
        temperature: voiceTone?.temp || 0.7,
        top_p: voiceTone?.topP || 0.9,
        length: "medium",
        verbosity: "medium",
      },
      tone_rules: {
        default: personaData.voiceTone || "conversational",
        avoid: ["condescension", "generic advice"],
      },
      style_guide: {
        personality: personaData.personality,
        expertise: personaData.expertise,
        colors: personaData.colors,
        superpowers: personaData.selectedSuperpowers,
      },
      guiding_principles: `${personaData.name} embodies: ${personalityLabels.join(
        ", "
      )}.`,
      use_memory_rag: true,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personaData.name.toLowerCase().replace(/\s+/g, "-")}-persona.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreate = async () => {
    setView("creating");
    setAnimationPhase(0);

    const voiceTone = VOICE_TONES.find((v) => v.id === personaData.voiceTone);
    const expertiseLabels = personaData.expertise
      .map((e) => EXPERTISE_AREAS.find((ea) => ea.id === e)?.label)
      .filter((label): label is string => Boolean(label));

    const personalityLabels = personaData.personality
      .map((p: string) => PERSONALITY_TRAITS.find((pt) => pt.id === p)?.label)
      .filter((label): label is string => Boolean(label));

    const contextSummaryOption = CONTEXT_SUMMARIES.find(
      (cs) => cs.id === personaData.contextSummaryType
    );
    const context_summary = contextSummaryOption
      ? contextSummaryOption.fullText(
          personaData.name,
          personaData.description,
          expertiseLabels,
          personalityLabels
        )
      : `${personaData.name} is a versatile AI companion.`;

    const mirroringMethodOption = MIRRORING_METHODS.find(
      (mm) => mm.id === personaData.mirroringMethodType
    );
    const responseStyleText =
      RESPONSE_STYLES.find((r) => r.id === personaData.responseStyle)
        ?.systemPrompt || "";
    const mirroring_method = mirroringMethodOption
      ? mirroringMethodOption.fullText(personaData.name, responseStyleText)
      : `${personaData.name} adapts naturally to the user's communication style.`;

    const sessionPrimingOption = SESSION_PRIMING_OPTIONS.find(
      (sp) => sp.id === personaData.sessionPrimingType
    );
    const session_priming = sessionPrimingOption
      ? sessionPrimingOption.fullText(personaData.name)
      : `When a session begins, ${personaData.name} is ready to assist.`;

    const personaPayload: any = {
      name: personaData.name,
      description: personaData.description,
      model_name: personaData.model,
      system_prompt: buildSystemPrompt(),
      color: personaData.colors[0],
      context_summary,
      mirroring_method,
      session_priming,
      chat_style: {
        tone: personaData.voiceTone || "conversational",
        temperature: voiceTone?.temp || 0.7,
        top_p: voiceTone?.topP || 0.9,
        length: "medium",
        verbosity: "medium",
      },
      tone_rules: {
        default: personaData.voiceTone || "conversational",
        avoid: ["condescension", "generic advice"],
      },
      style_guide: {
        personality: personaData.personality,
        expertise: personaData.expertise,
        colors: personaData.colors,
        superpowers: personaData.selectedSuperpowers,
      },
      guiding_principles: `${
        personaData.name
      } embodies: ${personalityLabels.join(", ")}. They are ${
        personaData.responseStyle
          ? RESPONSE_STYLES.find(
              (r) => r.id === personaData.responseStyle
            )?.label.toLowerCase()
          : "adaptive"
      } in their communication approach.`,
      use_memory_rag: true,
    };

    console.log("Creating persona:", personaPayload);

    try {
      const { data, error } = await supabase
        .from("persona")
        .insert([personaPayload])
        .select()
        .single();

      if (error) {
        console.error("Error creating persona:", error);
        throw error;
      }

      console.log("✅ Persona created successfully:", data);

      setTimeout(() => setAnimationPhase(1), 800);
      setTimeout(() => setAnimationPhase(2), 1600);
      setTimeout(() => setAnimationPhase(3), 2200);
      setTimeout(() => {
        setView("complete");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }, 2800);
    } catch (error) {
      console.error("Failed to create persona:", error);
      setView("designer");
    }
  };

  const isComplete =
    personaData.name && personaData.voiceTone && personaData.responseStyle;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `radial-gradient(circle at 30% 50%, ${personaData.colors[0]}15 0%, transparent 50%),
                         radial-gradient(circle at 70% 50%, ${personaData.colors[1]}15 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-3xl p-8 border border-white/10 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Upload className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">
                    Import Persona
                  </h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-white/60 text-sm">
                  Upload a JSON file containing persona configuration. The file
                  should match the Supabase schema format.
                </p>

                {uploadStatus.type === "idle" && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-500/50 transition-all bg-white/5 hover:bg-purple-500/10 group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-white/40 group-hover:text-purple-400 transition-colors" />
                      <div className="text-white/60 group-hover:text-white transition-colors">
                        Click to upload JSON file
                      </div>
                      <div className="text-xs text-white/40">
                        Supports: .json
                      </div>
                    </div>
                  </button>
                )}

                {uploadStatus.type === "uploading" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                    <p className="text-white/60">{uploadStatus.message}</p>
                  </div>
                )}

                {uploadStatus.type === "success" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-green-400 font-semibold">
                      {uploadStatus.message}
                    </p>
                  </div>
                )}

                {uploadStatus.type === "error" && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-red-400 text-center">
                      {uploadStatus.message}
                    </p>
                    <button
                      onClick={() => {
                        setUploadStatus({ type: "idle" });
                        fileInputRef.current?.click();
                      }}
                      className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              {view === "complete" ? "Done" : "Back"}
            </button>
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-300" />
              <h1 className="text-xl font-bold text-white">
                Create Your Persona
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/20 text-white"
                title="Import persona from file"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              {personaData.name && (
                <button
                  onClick={handleExportPersona}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 bg-white/10 hover:bg-white/20 text-white"
                  title="Export persona configuration"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-8 py-12">
        {view === "designer" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Orb Preview */}
            <motion.div
              className="flex flex-col items-center gap-6 mb-12"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <motion.div
                  className="w-32 h-32 rounded-full transition-all duration-700"
                  style={{
                    background: `radial-gradient(circle, ${personaData.colors[0]}, ${personaData.colors[1]})`,
                    boxShadow: `0 0 60px ${personaData.colors[0]}60, 0 0 100px ${personaData.colors[1]}40`,
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      `0 0 60px ${personaData.colors[0]}60`,
                      `0 0 100px ${personaData.colors[0]}80`,
                      `0 0 60px ${personaData.colors[0]}60`,
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${personaData.colors[0]}00, ${personaData.colors[0]}40)`,
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="text-center">
                <h2
                  className="text-3xl font-bold text-white mb-2 transition-all duration-500"
                  style={{
                    textShadow: `0 0 20px ${personaData.colors[0]}60`,
                  }}
                >
                  {personaData.name || "Your Persona"}
                </h2>
                <p className="text-white/60 text-sm max-w-md">
                  {personaData.description ||
                    "Add details to bring them to life"}
                </p>
              </div>
            </motion.div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
              >
                <label className="block text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={personaData.name}
                  onChange={(e) =>
                    setPersonaData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Give your persona a name..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none transition-all persona-input"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
              >
                <label className="block text-sm font-semibold text-white/80 mb-3">
                  Description
                </label>
                <input
                  type="text"
                  value={personaData.description}
                  onChange={(e) =>
                    setPersonaData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What makes them unique..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none transition-all persona-input"
                />
              </motion.div>
            </div>

            {/* Advanced Context Fields */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">
                  Advanced Context
                </h3>
              </div>

              <div className="space-y-4">
                {/* Context Summary Type */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    Persona Role & Purpose
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CONTEXT_SUMMARIES.map((context) => {
                      const isSelected =
                        personaData.contextSummaryType === context.id;
                      return (
                        <button
                          key={context.id}
                          onClick={() =>
                            toggleItem("contextSummaryType", context.id)
                          }
                          className="p-4 rounded-xl border-2 transition-all text-left hover:scale-105 active:scale-95 bg-white/5 border-white/10 hover:border-white/30"
                          style={
                            isSelected
                              ? {
                                  background: `${personaData.colors[0]}20`,
                                  borderColor: personaData.colors[0],
                                }
                              : {}
                          }
                        >
                          <div className="font-medium text-white mb-1">
                            {context.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mirroring Method */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    How They Mirror You
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MIRRORING_METHODS.map((method) => {
                      const isSelected =
                        personaData.mirroringMethodType === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() =>
                            toggleItem("mirroringMethodType", method.id)
                          }
                          className="p-3 rounded-xl border-2 transition-all text-center hover:scale-105 active:scale-95 bg-white/5 border-white/10 hover:border-white/30"
                          style={
                            isSelected
                              ? {
                                  background: `${personaData.colors[1]}20`,
                                  borderColor: personaData.colors[1],
                                }
                              : {}
                          }
                        >
                          <div className="text-sm font-medium text-white">
                            {method.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session Priming */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    How They Start Sessions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SESSION_PRIMING_OPTIONS.map((priming) => {
                      const isSelected =
                        personaData.sessionPrimingType === priming.id;
                      return (
                        <button
                          key={priming.id}
                          onClick={() =>
                            toggleItem("sessionPrimingType", priming.id)
                          }
                          className="p-3 rounded-xl border-2 transition-all text-center hover:scale-105 active:scale-95 bg-white/5 border-white/10 hover:border-white/30"
                          style={
                            isSelected
                              ? {
                                  background: `${personaData.colors[0]}20`,
                                  borderColor: personaData.colors[0],
                                }
                              : {}
                          }
                        >
                          <div className="text-sm font-medium text-white">
                            {priming.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Color Picker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Choose Colors
              </label>

              {/* Color Display and Picker */}
              <div className="mb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-white/60 w-20">Primary:</label>
                  <button
                    onClick={() => {
                      setShowColorPicker(true);
                      setSelectedColorIndex(0);
                    }}
                    className="h-10 w-full rounded-xl relative overflow-hidden border-2 transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: personaData.colors[0],
                      borderColor: personaData.colors[0],
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-white/60 w-20">
                    Secondary:
                  </label>
                  <button
                    onClick={() => {
                      setShowColorPicker(true);
                      setSelectedColorIndex(1);
                    }}
                    className="h-10 w-full rounded-xl relative overflow-hidden border-2 transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: personaData.colors[1],
                      borderColor: personaData.colors[1],
                    }}
                  />
                </div>
              </div>

              {/* Color Picker Modal */}
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/10 max-w-md w-full mx-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Pick{" "}
                          {selectedColorIndex === 0 ? "Primary" : "Secondary"}{" "}
                          Color
                        </h3>
                        <button
                          onClick={() => setShowColorPicker(false)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <RgbaColorPicker
                        color={hexToRgba(personaData.colors[selectedColorIndex])}
                        onChange={(color) => {
                          const hex = rgbaToHex(color.r, color.g, color.b);
                          const newColors = [...personaData.colors];
                          newColors[selectedColorIndex] = hex;
                          setPersonaData((prev) => ({
                            ...prev,
                            colors: newColors,
                          }));
                        }}
                        style={{ width: "100%" }}
                      />
                      <button
                        onClick={() => setShowColorPicker(false)}
                        className="w-full mt-4 py-3 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
                      >
                        Done
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preset Colors */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <label className="block text-sm text-white/60 mb-3">
                  Or choose a preset:
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {presetColors.map((colors, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setPersonaData((prev) => ({ ...prev, colors }))
                      }
                      className="h-14 rounded-xl relative overflow-hidden border-2 transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                        borderColor:
                          personaData.colors[0] === colors[0]
                            ? colors[0]
                            : "transparent",
                      }}
                    >
                      {personaData.colors[0] === colors[0] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Voice & Tone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                Voice & Tone <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {VOICE_TONES.map((tone, idx) => {
                  const Icon = tone.icon;
                  const isSelected = personaData.voiceTone === tone.id;
                  return (
                    <motion.button
                      key={tone.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      onClick={() => toggleItem("voiceTone", tone.id)}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                        isSelected
                          ? "border-2"
                          : "bg-white/5 border-white/10 hover:border-white/30"
                      }`}
                      style={
                        isSelected
                          ? {
                              background: `${personaData.colors[0]}20`,
                              borderColor: personaData.colors[0],
                            }
                          : {}
                      }
                    >
                      <Icon
                        className="w-6 h-6 mb-2 mx-auto transition-colors"
                        style={{
                          color: isSelected
                            ? personaData.colors[0]
                            : "rgba(255, 255, 255, 0.6)",
                        }}
                      />
                      <div className="text-sm font-medium text-white text-center">
                        {tone.label.split("&")[0]}
                      </div>
                      {isSelected && (
                        <div className="text-xs text-white/40 text-center mt-1">
                          {tone.temp} / {tone.topP}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Response Style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-green-400" />
                How They Respond <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RESPONSE_STYLES.map((style, idx) => {
                  const isSelected = personaData.responseStyle === style.id;
                  return (
                    <motion.button
                      key={style.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.05 }}
                      onClick={() => toggleItem("responseStyle", style.id)}
                      className="p-4 rounded-xl border-2 transition-all text-left hover:scale-105 active:scale-95 bg-white/5 border-white/10 hover:border-white/30"
                      style={
                        isSelected
                          ? {
                              background: `${personaData.colors[1]}20`,
                              borderColor: personaData.colors[1],
                            }
                          : {}
                      }
                    >
                      <div className="font-medium text-white mb-1">
                        {style.label}
                      </div>
                      <div className="text-xs text-white/60 line-clamp-2">
                        {style.systemPrompt}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Personality Traits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Personality Traits
              </label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TRAITS.map((trait, idx) => {
                  const isSelected = personaData.personality.includes(trait.id);
                  return (
                    <motion.button
                      key={trait.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.02 }}
                      onClick={() => toggleItem("personality", trait.id)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 bg-white/5 border text-white/60 hover:text-white"
                      style={
                        isSelected
                          ? {
                              background: `${personaData.colors[0]}20`,
                              borderColor: personaData.colors[0],
                              borderWidth: "2px",
                              color: personaData.colors[0],
                            }
                          : { borderColor: "rgba(255, 255, 255, 0.2)" }
                      }
                    >
                      {trait.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Expertise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Areas of Expertise
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_AREAS.map((area, idx) => {
                  const isSelected = personaData.expertise.includes(area.id);
                  return (
                    <motion.button
                      key={area.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45 + idx * 0.02 }}
                      onClick={() => toggleItem("expertise", area.id)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 bg-white/5 border text-white/60 hover:text-white"
                      style={
                        isSelected
                          ? {
                              background: `${personaData.colors[1]}20`,
                              borderColor: personaData.colors[1],
                              borderWidth: "2px",
                              color: personaData.colors[1],
                            }
                          : { borderColor: "rgba(255, 255, 255, 0.2)" }
                      }
                    >
                      {area.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Superpowers Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                Superpowers
              </label>
              {loadingSuperpowers ? (
                <div className="text-center py-8 text-white/40 flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading superpowers...
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {superpowers.map((power, idx) => {
                    const isSelected = personaData.selectedSuperpowers.includes(
                      power.key
                    );
                    return (
                      <motion.button
                        key={power.key}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + idx * 0.02 }}
                        onClick={() =>
                          toggleItem("selectedSuperpowers", power.key)
                        }
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 bg-white/5 border text-white/60 hover:text-white"
                        style={
                          isSelected
                            ? {
                                background: `linear-gradient(135deg, ${personaData.colors[0]}20, ${personaData.colors[1]}20)`,
                                borderColor: personaData.colors[0],
                                borderWidth: "2px",
                                color: personaData.colors[0],
                              }
                            : { borderColor: "rgba(255, 255, 255, 0.2)" }
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          {power.name}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Model Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all"
            >
              <label className="block text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                AI Model
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_MODELS.map((model, idx) => {
                  const isSelected = personaData.model === model.id;
                  return (
                    <motion.button
                      key={model.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.55 + idx * 0.05 }}
                      onClick={() => toggleItem("model", model.id)}
                      className="p-4 rounded-xl border-2 transition-all text-left hover:scale-105 active:scale-95 bg-white/5 border-white/10 hover:border-white/30"
                      style={
                        isSelected
                          ? {
                              background: `linear-gradient(135deg, ${personaData.colors[0]}15, ${personaData.colors[1]}15)`,
                              borderColor: personaData.colors[0],
                              boxShadow: `0 4px 20px ${personaData.colors[0]}30`,
                            }
                          : {}
                      }
                    >
                      <div className="font-medium text-white mb-1">
                        {model.label}
                      </div>
                      <div className="text-xs text-white/60">
                        {model.description}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Create Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleCreate}
              disabled={!isComplete}
              whileHover={isComplete ? { scale: 1.02 } : {}}
              whileTap={isComplete ? { scale: 0.98 } : {}}
              className="w-full py-6 rounded-2xl font-bold text-lg text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
              style={{
                background: isComplete
                  ? `linear-gradient(135deg, ${personaData.colors[0]}, ${personaData.colors[1]})`
                  : "rgb(255 255 255 / 0.1)",
                boxShadow: isComplete
                  ? `0 20px 60px -10px ${personaData.colors[0]}60`
                  : "none",
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Sparkles className="w-6 h-6 relative z-10" />
              <span className="relative z-10">
                Create {personaData.name || "Persona"}
              </span>
            </motion.button>
          </motion.div>
        )}

        {view === "creating" && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer rotating rings */}
              {[0, 1, 2].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border-2"
                  style={{
                    width: `${160 + ring * 40}px`,
                    height: `${160 + ring * 40}px`,
                    borderColor: personaData.colors[ring % 2],
                    opacity: 0.3 - ring * 0.1,
                  }}
                  animate={{
                    rotate: ring % 2 === 0 ? 360 : -360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: {
                      duration: 3 + ring,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  }}
                />
              ))}

              {/* Main Orb */}
              <motion.div
                className="w-40 h-40 rounded-full relative z-10"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${personaData.colors[0]}, ${personaData.colors[1]})`,
                  boxShadow: `0 0 ${animationPhase >= 2 ? "150px" : "100px"} ${
                    personaData.colors[0]
                  }80, inset 0 0 60px ${personaData.colors[1]}40`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    `0 0 80px ${personaData.colors[0]}60`,
                    `0 0 150px ${personaData.colors[0]}90`,
                    `0 0 80px ${personaData.colors[0]}60`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Inner glow pulse */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${personaData.colors[0]}40, transparent)`,
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>

              {/* Orbiting particles */}
              {animationPhase >= 1 && animationPhase < 3 && (
                <>
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: personaData.colors[i % 2],
                        boxShadow: `0 0 10px ${personaData.colors[i % 2]}`,
                      }}
                      initial={{
                        x: Math.cos((i / 12) * Math.PI * 2) * 120,
                        y: Math.sin((i / 12) * Math.PI * 2) * 120,
                        opacity: 1,
                        scale: 1,
                      }}
                      animate={{
                        x: 0,
                        y: 0,
                        opacity: 0,
                        scale: 0,
                      }}
                      transition={{
                        duration: 1.2,
                        delay: i * 0.08,
                        ease: "easeIn",
                      }}
                    />
                  ))}
                </>
              )}

              {/* Energy waves */}
              {animationPhase >= 2 && (
                <>
                  {[0, 1, 2].map((wave) => (
                    <motion.div
                      key={wave}
                      className="absolute inset-0 rounded-full border-2"
                      style={{
                        borderColor: personaData.colors[wave % 2],
                      }}
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{
                        duration: 1.5,
                        delay: wave * 0.3,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </>
              )}
            </div>

            <motion.div
              className="text-center"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-2xl font-semibold text-white mb-2">
                {animationPhase === 0 && "Gathering essence..."}
                {animationPhase === 1 && "Absorbing attributes..."}
                {animationPhase === 2 && "Weaving consciousness..."}
                {animationPhase === 3 && `Awakening ${personaData.name}...`}
              </p>
              <p className="text-sm text-white/40">
                Building your AI companion
              </p>
            </motion.div>
          </div>
        )}

        {view === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[70vh] gap-8"
          >
            <motion.div
              className="w-40 h-40 rounded-full transition-all duration-500"
              style={{
                background: `radial-gradient(circle, ${personaData.colors[0]}, ${personaData.colors[1]})`,
                boxShadow: `0 0 100px ${personaData.colors[0]}80`,
              }}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  `0 0 100px ${personaData.colors[0]}80`,
                  `0 0 150px ${personaData.colors[0]}90`,
                  `0 0 100px ${personaData.colors[0]}80`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="text-center space-y-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white"
              >
                Meet {personaData.name}!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/70 text-lg max-w-md"
              >
                {personaData.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-3 pt-4"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-300">
                    Ready to chat!
                  </span>
                </div>
              </motion.div>

              {/* Show selected attributes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-8 space-y-3 text-left max-w-md mx-auto"
              >
                <div className="text-sm text-white/40">Configured with:</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {personaData.voiceTone && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-300 text-xs">
                      {
                        VOICE_TONES.find((v) => v.id === personaData.voiceTone)
                          ?.label
                      }
                    </span>
                  )}
                  {personaData.responseStyle && (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50 text-green-300 text-xs">
                      {
                        RESPONSE_STYLES.find(
                          (r) => r.id === personaData.responseStyle
                        )?.label
                      }
                    </span>
                  )}
                  {personaData.personality.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-xs"
                    >
                      {PERSONALITY_TRAITS.find((pt) => pt.id === p)?.label}
                    </span>
                  ))}
                  {personaData.personality.length > 3 && (
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/60 text-xs">
                      +{personaData.personality.length - 3} more
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes absorb {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .persona-input:focus {
          border-color: ${personaData.colors[0]};
          box-shadow: 0 0 0 3px ${personaData.colors[0]}20, 0 0 20px ${personaData.colors[0]}30;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}