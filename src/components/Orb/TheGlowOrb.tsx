import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Scene from "./Scene";
import GPTCarousel from "./GPTCarousel";
import { createErrorMessage } from "@/services/errorHandling";

// Types
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

type Message = {
  id: number;
  sender: "user" | "assistant";
  text: string;
  isError?: boolean;
  errorInfo?: any;
};

interface TheGlowOrbProps {
  onLongHold?: () => void;
  onShortClick?: () => void;
  isListeningProp?: boolean; // Renamed from isListening to avoid conflict
  className?: string;
}

export default function TheGlowOrb({
  onLongHold,
  onShortClick,
  isListeningProp = false, // Renamed from isListening
  className = "",
}: TheGlowOrbProps) {
  // State
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [listening, setListening] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showAgentWindow, setShowAgentWindow] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>("idle");
  const [agentLog, setAgentLog] = useState<string[]>([]);
  const [currentAgentType, setCurrentAgentType] = useState<string>("terminal");
  const [detectedSuperpower, setDetectedSuperpower] = useState<string | null>(
    null
  );

  // Refs
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Personas data
  const personas = [
    {
      id: "phoebe",
      name: "Phoebe",
      description:
        "Warm, soft, comforting, understanding, reflective. Great for general chat, doctor questions, research, and summarization.",
      colors: ["#fffacd", "#ffd700"],
      model: "ChatGPT 4.1",
      personality: "Compassionate Healer",
      expertise: [
        "Medical Research",
        "Emotional Support",
        "Knowledge Synthesis",
      ],
      recentTopics: ["Stress Management", "Nutrition Science", "Mindfulness"],
      avatar: "🌟",
      status: "online",
      energy: 87,
      security: "verified",
    },
    {
      id: "kai",
      name: "Kai",
      description:
        "Cool, sharp, insightful, grounded. Ideal for coding help, debugging, or strategic thinking.",
      colors: ["#64c8ff", "#ccf9ff"],
      model: "Groq (Mistral)",
      personality: "Strategic Architect",
      expertise: ["Code Analysis", "System Design", "Problem Solving"],
      recentTopics: ["React Optimization", "API Architecture", "Performance"],
      avatar: "⚡",
      status: "online",
      energy: 94,
      security: "verified",
    },
    {
      id: "luna",
      name: "Luna",
      description:
        "Creative, dreamy, poetic, expressive. Best for art, writing, and creative ideation.",
      colors: ["#ffb4f0", "#ffd6e8"],
      model: "Claude 3",
      personality: "Creative Muse",
      expertise: ["Creative Writing", "Art Direction", "Storytelling"],
      recentTopics: [
        "Poetry Workshop",
        "Character Design",
        "Narrative Structure",
      ],
      avatar: "✨",
      status: "online",
      energy: 76,
      security: "verified",
    },
  ];

  // Superpowers data
  const superpowers = [
    {
      id: "plex",
      name: "Plex Control",
      description: "Manage your Plex media server",
      icon: "",
      color: "#E5A00D",
      prompts: [
        "Scan library for new content",
        'Play "The Matrix" in living room',
        "Show recently added movies",
        "Update metadata for TV shows",
        "Check server status",
        "Find movies with Tom Hanks",
      ],
    },
    {
      id: "home",
      name: "Smart Home",
      description: "Control your smart home devices",
      icon: "🏠",
      color: "#10B981",
      prompts: [
        "Turn off all lights",
        "Set living room to movie mode",
        "Check security cameras",
        "Adjust thermostat to 72°F",
        "Lock all doors",
        "Turn on porch light",
      ],
    },
    {
      id: "music",
      name: "Music Control",
      description: "Manage your music and playlists",
      icon: "",
      color: "#8B5CF6",
      prompts: [
        "Play my favorites playlist",
        "Skip to next song",
        "What's currently playing?",
        "Create a workout playlist",
        "Find similar artists",
        "Set sleep timer for 30 minutes",
      ],
    },
    {
      id: "weather",
      name: "Weather & Climate",
      description: "Weather updates and climate control",
      icon: "️",
      color: "#06B6D4",
      prompts: [
        "What's the weather like?",
        "Will it rain tomorrow?",
        "Show 7-day forecast",
        "Adjust AC for optimal comfort",
        "Check air quality",
        "When will the storm pass?",
      ],
    },
  ];

  // Effects
  useEffect(() => {
    if (transcript) {
      processVoiceCommand(transcript);
    }
  }, [transcript]);

  // Handlers
  const handleOrbMouseDown = () => {
    orbHoldTimeout.current = setTimeout(() => {
      // Long hold detected → open carousel
      setIsOrbHolding(true);
      setShowCarousel(true);
      orbHoldTimeout.current = null;
      if (onLongHold) onLongHold();
    }, 600); // 600ms threshold for hold
  };

  const handleOrbMouseUp = () => {
    if (orbHoldTimeout.current) {
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;

      // Short click detected → trigger dictation
      if (!listening) {
        startListening();
      } else {
        stopListening();
      }
      if (onShortClick) onShortClick();
    }
    setIsOrbHolding(false);
  };

  const handleCarouselSelect = (persona: Persona) => {
    setShowCarousel(false);
    // Handle persona selection if needed
    console.log("Selected Persona:", persona);
  };

  const startListening = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err && err.name === "OverconstrainedError") {
          console.error("getUserMedia OverconstrainedError:", err.message, err);
        } else {
          console.error(
            "getUserMedia error:",
            err && err.name,
            err && err.message,
            err
          );
        }
        alert("Microphone error: " + (err && err.message));
        return;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Available media devices:", devices);
      console.log("Using stream tracks:", stream.getTracks());

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped.");
        const audioBlob = new Blob(chunks, { type: mimeType });
        console.log("Audio blob created:", audioBlob);
        console.log("Blob size (bytes):", audioBlob.size);
        console.log("Blob type:", audioBlob.type);

        const formData = new FormData();
        formData.append(
          "file",
          audioBlob,
          "speech." + (mimeType === "audio/webm" ? "webm" : "mp4")
        );

        try {
          console.log("Sending audio to /transcribe endpoint...");
          const res = await fetch("https://100.83.147.76:8003/transcribe", {
            method: "POST",
            body: formData,
          });

          console.log("Fetch response status:", res.status);
          const data = await res.json();
          console.log("Transcription response data:", data);

          if (data.text) {
            const transcribedText = data.text.trim();
            setTranscript((prev) => prev + " " + transcribedText);
            console.log("Transcript updated:", transcribedText);
            await sendToChat(transcribedText);
          } else {
            console.warn("No text returned from /transcribe endpoint.");
          }
        } catch (err) {
          console.error("Transcription error:", err);
        }
      };

      mediaRecorder.start();
      recognitionRef.current = mediaRecorder;
      setListening(true);
      setIsListening(true);
      console.log("Listening...");
    } catch (err: any) {
      console.error(
        "getUserMedia error:",
        err && err.name,
        err && err.message,
        err
      );
      alert("Microphone error: " + (err && err.message));
      return;
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
    setIsListening(false);
    console.log("Stopped listening.");

    // Always show chat modal after stopping listening, even if no transcription
    if (chatMessages.length === 0) {
      setShowChatModal(true);
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    let detectedPower = null;
    let agentType = "terminal";

    if (
      lowerCommand.includes("plex") ||
      lowerCommand.includes("movie") ||
      lowerCommand.includes("show") ||
      lowerCommand.includes("library")
    ) {
      detectedPower = "plex";
      agentType = "media";
    } else if (
      lowerCommand.includes("lights") ||
      lowerCommand.includes("smart home") ||
      lowerCommand.includes("thermostat")
    ) {
      detectedPower = "home";
      agentType = "dashboard";
    } else if (
      lowerCommand.includes("music") ||
      lowerCommand.includes("spotify") ||
      lowerCommand.includes("playlist")
    ) {
      detectedPower = "music";
      agentType = "music";
    } else if (
      lowerCommand.includes("weather") ||
      lowerCommand.includes("temperature")
    ) {
      detectedPower = "weather";
      agentType = "weather";
    }

    if (detectedPower) {
      setDetectedSuperpower(detectedPower);
      setCurrentAgentType(agentType);
      setShowAgentWindow(true);
      setAgentStatus("working");
      setAgentLog([]);
      simulateAgentWork(command, detectedPower);
    }
  };

  const simulateAgentWork = async (prompt: string, superpowerId: string) => {
    const steps = getAgentSteps(prompt, superpowerId);

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAgentLog((prev) => [...prev, steps[i]]);
    }

    setAgentStatus("completed");
    setTimeout(() => {
      setAgentStatus("idle");
    }, 3000);
  };

  const getAgentSteps = (prompt: string, superpowerId: string) => {
    if (superpowerId === "plex") {
      if (prompt.includes("Scan library")) {
        return [
          " Connecting to Plex server...",
          "📡 Authenticating with server credentials...",
          "📚 Scanning Movies library...",
          "🔄 Processing 1,247 media files...",
          "️ Updating metadata for new content...",
          "✅ Library scan completed successfully!",
        ];
      } else if (prompt.includes("Play")) {
        return [
          "🎬 Searching for requested movie...",
          ' Found "The Matrix" (1999)',
          "📱 Connecting to Living Room Plex client...",
          "▶️ Starting playback...",
          " Audio: English 5.1, Subtitles: Off",
          "✅ Now playing on Living Room TV!",
        ];
      }
    } else if (superpowerId === "home") {
      if (prompt.includes("lights")) {
        return [
          "💡 Scanning smart home network...",
          " Found 12 connected light fixtures",
          "⚡ Sending OFF command to all lights...",
          "✅ All lights turned off successfully!",
        ];
      }
    }

    return [
      "🤖 Processing your request...",
      "⚙️ Executing command...",
      "✅ Task completed successfully!",
    ];
  };

  const sendToChat = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: text.trim(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setShowChatModal(true);
    setIsChatLoading(true);

    let response: Response | undefined;

    try {
      console.log("Sending to chat endpoint:", text);
      response = await fetch("https://100.83.147.76:8003/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          model: "Groq-LLaMA3-70B",
          useMistral: false,
          thread_id: "desktop-chat",
          user_id: "desktop-user",
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Chat response:", data);

      let responseText = "";
      if (data.response) {
        responseText = data.response;
      } else if (data.reply) {
        responseText = data.reply;
      } else if (data.error) {
        responseText = `Error: ${data.error}`;
      } else {
        responseText = "Sorry, I couldn't generate a response.";
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: responseText,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);

      // Use the new error handling system
      const errorMessage = createErrorMessage(err, response);
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setShowChatModal(false);
  };

  return (
    <>
      {/* Central Intelligence Orb */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 ${className}`}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseDown={handleOrbMouseDown}
          onMouseUp={handleOrbMouseUp}
          onMouseLeave={handleOrbMouseUp}
        >
          <motion.div
            className={`z-0 cursor-pointer bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-sm transition-all duration-200 ${
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

      {/* Carousel Overlay */}
      <AnimatePresence>
        {showCarousel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowCarousel(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Select AI Companion
                </h2>
                <p className="text-white/70">Choose your persona to continue</p>
              </div>
              <GPTCarousel theme="dark" onSelect={handleCarouselSelect} />
              <button
                onClick={() => setShowCarousel(false)}
                className="mt-6 px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-300 mx-auto block"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Recognition Feedback */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-4 h-4 bg-red-500 rounded-full"
              />
              <div>
                <p className="font-semibold">🎤 Listening...</p>
                <p className="text-sm text-gray-300">
                  Speak your command to Phoebe
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChatModal && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed z-50 bottom-[400px] right-[50px] w-[500px] h-[400px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-black/5 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-800">
                  AI Assistant
                </span>
                <span className="text-xs text-gray-500">
                  {chatMessages.length} messages
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-gray-200/50 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                  title="Clear chat"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="p-1.5 hover:bg-gray-200/50 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="h-[calc(100%-60px)] relative bg-gradient-to-br from-gray-50/50 to-white/50">
              {chatMessages.length === 0 && !isChatLoading ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎤</div>
                    <p className="text-sm">Start speaking to chat with AI</p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          msg.sender === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            AI is thinking
                          </span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice-Activated Agent Window */}
      <AnimatePresence>
        {showAgentWindow && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-8 right-8 z-50 w-96 h-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  AI Agent -{" "}
                  {detectedSuperpower
                    ? superpowers.find((p) => p.id === detectedSuperpower)?.name
                    : "Processing"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    agentStatus === "working"
                      ? "bg-yellow-400 animate-pulse"
                      : agentStatus === "completed"
                      ? "bg-green-400"
                      : "bg-gray-400"
                  }`}
                ></div>
                <button
                  onClick={() => setShowAgentWindow(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 p-4">
              <div className="h-full bg-black rounded-lg p-3 font-mono text-sm overflow-y-auto">
                <div className="space-y-1">
                  {agentLog.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-green-400"
                    >
                      <span className="text-gray-500 text-xs mr-2">
                        [{new Date().toLocaleTimeString()}]
                      </span>
                      {log}
                    </motion.div>
                  ))}
                  {agentStatus === "working" && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-yellow-400"
                    >
                      <span className="text-gray-500 text-xs mr-2">
                        [{new Date().toLocaleTimeString()}]
                      </span>
                      ⚡ Processing...
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
