import React, { useState, useRef } from "react";
import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  Mic,
  Sparkle,
  Brain,
  Square,
  Paperclip,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import Toolbar from "./Toolbar";
import { VerticalDock } from "./SendDock";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import GPTCarousel from "../Orb/GPTCarousel";
import Scene from "../Orb/Scene";
import { useDictation } from "@/services/dictation";

type InputBoxProps = {
  sidebarOffset: number;
  theme: "light" | "dark" | "system";
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  input: string;
  setInput: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  setModel: (model: string) => void;
  model: string;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  models: string[];
  sendMessage: () => void;
  useMistral: boolean;
  setUseMistral: (val: boolean) => void;
  onAddDownloadTask: (url: string) => void;
  useVoice: boolean;
  setUseVoice: (val: boolean) => void;
  onToggleMemoryTree: () => void;
  memoryTreeVisible: boolean;
  onMemoryTest: () => void;
};

const models = [
  { id: "Groq", label: "G", color: "rgb(249 115 22)" },
  { id: "Groq-LLaMA3-70B", label: "M", color: "rgb(59 130 246)" },
  { id: "GPT-4o", label: "4o", color: "rgb(168 85 247)" },
  { id: "Claude", label: "C", color: "rgb(255 86 48)" },
];

const InputBox: React.FC<InputBoxProps> = ({
  sidebarOffset,
  theme,
  textareaRef,
  input,
  setInput,
  handleKeyDown,
  setModel,
  model,
  sendMessage,
  useMistral,
  setUseMistral,
  useVoice,
  setUseVoice,
  onToggleMemoryTree,
  memoryTreeVisible,
  onMemoryTest,
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showDock, setShowDock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Orb dictation state
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const { isDictating, isListening, startDictation, stopDictation } =
    useDictation({ setInput });

  const currentModel = models.find((m) => m.id === model);
  const navigate = useNavigate();
  const [isNotesHolding, setIsNotesHolding] = useState(false);
  const notesHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const [charUsage, setCharUsage] = useState<{
    used: number;
    limit: number;
  } | null>(null);
  const [showCharPopup, setShowCharPopup] = useState(false);
  const micHoldTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchCharacterUsage = async () => {
    try {
      const res = await fetch("https://api.elevenlabs.io/v1/user", {
        method: "GET",
        headers: {
          "xi-api-key": "sk_...",
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      setCharUsage({
        used: data?.character_count || 0,
        limit: data?.character_limit || 0,
      });
      setShowCharPopup(true);
      setTimeout(() => setShowCharPopup(false), 3000);
    } catch (err) {
      console.error("Failed to fetch character usage", err);
    }
  };

  const handleMicHoldStart = () => {
    micHoldTimeout.current = setTimeout(() => {
      fetchCharacterUsage();
    }, 600);
  };

  const handleMicHoldEnd = () => {
    if (micHoldTimeout.current) {
      clearTimeout(micHoldTimeout.current);
      micHoldTimeout.current = null;
    }
  };

  const holdTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    holdTimeout.current = setTimeout(() => {
      setShowDock(true);
    }, 400);
  };

  const handleMouseUp = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }

    if (!showDock) {
      handleSubmit();
    }

    setShowDock(false);
  };

  const sparkleHoldTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);
  const [openNote, setOpenNote] = useState<null | {
    id: string;
    title: string;
    content: string;
  }>(null);

  const cycleModel = () => {
    const currentIndex = models.findIndex((m) => m.id === model);
    const nextIndex = (currentIndex + 1) % models.length;
    setModel(models[nextIndex].id);
  };

  const handleSparkleMouseDown = () => {
    sparkleHoldTimeout.current = setTimeout(() => {
      setUseMistral((prev) => !prev);
      sparkleHoldTimeout.current = null;
    }, 600);
  };

  const handleSparkleMouseUp = () => {
    if (sparkleHoldTimeout.current) {
      clearTimeout(sparkleHoldTimeout.current);
      sparkleHoldTimeout.current = null;

      clickCount.current++;
      if (clickCount.current === 1) {
        clickTimeout.current = setTimeout(() => {
          cycleModel();
          clickCount.current = 0;
        }, 250);
      } else if (clickCount.current === 2) {
        clearTimeout(clickTimeout.current!);
        setShowToolbar((prev) => !prev);
        clickCount.current = 0;
      }
    }
  };

  const handleNotesMouseDown = () => {
    setIsNotesHolding(true);
    notesHoldTimeout.current = setTimeout(() => {
      navigate("/luma");
    }, 600);
  };

  const handleNotesMouseUp = () => {
    setIsNotesHolding(false);
    if (notesHoldTimeout.current) {
      clearTimeout(notesHoldTimeout.current);
      notesHoldTimeout.current = null;
    }
  };

  const [showCarousel, setShowCarousel] = useState(false);

  const toggleCarousel = () => {
    setShowCarousel((prev) => !prev);
  };

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      setIsLoading(true);
      sendMessage();
      // Simulate loading state
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      animate={{ x: sidebarOffset }}
      transition={{ duration: 0.2 }}
      className="relative max-w-[800px] mx-auto pr-1 pl-1 mx-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="">
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={sendMessage}
          className="w-full"
        >
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Paperclip className="size-4" />
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="hover:bg-secondary/50 rounded-full p-1"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <PromptInputTextarea
            placeholder="Type your message..."
            ref={textareaRef}
            onKeyDown={handleKeyDown}
          />

          <PromptInputActions className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* File upload */}
              <PromptInputAction tooltip="Attach files">
                <label
                  htmlFor="file-upload"
                  className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full"
                >
                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Paperclip className="text-primary size-5" />
                </label>
              </PromptInputAction>

              {/* Voice toggle button */}
              <PromptInputAction tooltip="Toggle Voice">
                <button
                  onMouseDown={handleMicHoldStart}
                  onMouseUp={handleMicHoldEnd}
                  onTouchStart={handleMicHoldStart}
                  onTouchEnd={handleMicHoldEnd}
                  onClick={() => setUseVoice((prev) => !prev)}
                  className={`w-8 h-8 flex select-none items-center justify-center rounded-full transition-all duration-300 ${
                    useVoice
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                      : "hover:bg-secondary-foreground/10"
                  }`}
                >
                  <Mic
                    className={`w-5 h-5 transition-all duration-300 ${
                      useVoice
                        ? "text-white drop-shadow-[0_0_6px_rgba(168,85,247,0.9)]"
                        : "text-primary"
                    }`}
                  />
                </button>
              </PromptInputAction>

              {/* Model selector */}
              <PromptInputAction tooltip="Model Selector">
                <button
                  onMouseDown={handleSparkleMouseDown}
                  onMouseUp={handleSparkleMouseUp}
                  onTouchStart={handleSparkleMouseDown}
                  onTouchEnd={handleSparkleMouseUp}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 border-2 hover:bg-secondary-foreground/10`}
                  style={{
                    borderColor: currentModel?.color,
                    boxShadow: `0 0 6px ${currentModel?.color}`,
                  }}
                >
                  {showToolbar ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <Sparkle
                      className={`w-5 h-5 transition-all duration-300 ${
                        useMistral
                          ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]"
                          : "text-primary"
                      }`}
                    />
                  )}
                </button>
              </PromptInputAction>

              {/* Memory Tree Toggle */}
              <PromptInputAction tooltip="Toggle Memory Tree">
                <button
                  onClick={onToggleMemoryTree}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                    memoryTreeVisible
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "hover:bg-secondary-foreground/10 text-primary"
                  }`}
                >
                  <Brain className="w-5 h-5" />
                </button>
              </PromptInputAction>

              {/* Orb Dictation Tool */}
              <PromptInputAction tooltip="Voice Dictation">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseDown={() => {
                    orbHoldTimeout.current = setTimeout(() => {
                      setIsOrbHolding(true);
                    }, 600);
                  }}
                  onMouseUp={() => {
                    if (orbHoldTimeout.current) {
                      clearTimeout(orbHoldTimeout.current);
                      orbHoldTimeout.current = null;
                      if (!isDictating) {
                        startDictation();
                      } else {
                        stopDictation();
                      }
                    }
                    setIsOrbHolding(false);
                  }}
                  onMouseLeave={() => {
                    if (orbHoldTimeout.current) {
                      clearTimeout(orbHoldTimeout.current);
                      orbHoldTimeout.current = null;
                    }
                    setIsOrbHolding(false);
                  }}
                  className="relative w-8 h-8 cursor-pointer"
                >
                  <motion.div
                    className={`z-0 bg-[#f9f9f9] border border-[#ddd] rounded-full shadow-sm transition-all duration-200 ${
                      isOrbHolding ? "scale-110 shadow-lg" : ""
                    }`}
                    style={{ width: 32, height: 32 }}
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
                </motion.div>
              </PromptInputAction>
            </div>

            {/* Send button - positioned in bottom right */}
            <PromptInputAction
              tooltip={isLoading ? "Stop generation" : "Send message"}
            >
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full bg-white text-black hover:bg-gray-100"
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
              >
                {isLoading ? (
                  <Square className="size-5 fill-current" />
                ) : (
                  <ArrowUp className="size-5" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>

        {/* Character usage popup */}
        {showCharPopup && charUsage && (
          <div className="absolute bottom-16 right-5 bg-white dark:bg-zinc-800 text-sm px-4 py-2 rounded-xl shadow-xl z-50">
            <p className="text-black dark:text-white">
              🧮 {charUsage.used.toLocaleString()} /{" "}
              {charUsage.limit.toLocaleString()} characters used
            </p>
          </div>
        )}

        {/* Floating Toolbar */}
        {showCarousel && (
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
              onClick={() => setShowCarousel(false)}
            />
            <div className="absolute bottom-[170px] w-full z-50">
              <GPTCarousel
                theme={theme}
                onSelect={() => setShowCarousel(false)}
              />
            </div>
          </>
        )}

        <AnimatePresence>
          {showToolbar && (
            <motion.div
              key="toolbar"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute -top-[145px] right-2 z-30"
            >
              <Toolbar
                theme={theme}
                model={model}
                setModel={setModel}
                useMistral={useMistral}
                setUseMistral={setUseMistral}
                textareaRef={textareaRef}
                onNoteClick={(note) => setOpenNote(note)}
                onNotesMouseDown={handleNotesMouseDown}
                onNotesMouseUp={handleNotesMouseUp}
                isNotesHolding={isNotesHolding}
                toggleCarousel={toggleCarousel}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vertical Dock */}
        <AnimatePresence>
          {showDock && (
            <div className="absolute bottom-[60px] right-2 z-40">
              <VerticalDock />
            </div>
          )}
        </AnimatePresence>

        {/* Note Modal */}
        {openNote && (
          <Sheet open={!!openNote} onOpenChange={() => setOpenNote(null)}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{openNote.title}</SheetTitle>
                <SheetDescription>Note content</SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-full mt-4">
                <p className="whitespace-pre-wrap">{openNote.content}</p>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </motion.div>
  );
};

export default InputBox;
