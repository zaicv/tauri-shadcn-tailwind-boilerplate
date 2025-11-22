import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle } from "lucide-react";
import PersonaSwitchButton from "./PersonaSwitchButton";
import ModelSwitchButton from "./ModelSwitcher";
import { Bolt } from "lucide-react";

type Props = {
  theme: "light" | "dark" | "system";
  model: string;
  setModel: (model: string) => void;
  useMistral: boolean;
  setUseMistral: (val: boolean) => void;
};

const MorphingToolbar: React.FC<Props> = ({
  theme,
  model,
  setModel,
  useMistral,
  setUseMistral,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isDark = theme === "dark";

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
      className={`absolute bottom-4 left-4 z-50
        ${expanded ? "px-4 py-2.5" : "p-2"}
        rounded-full border backdrop-blur-md shadow-md flex items-center
        ${
          isDark ? "bg-white/5 border-zinc-700" : "bg-white/80 border-zinc-300"
        }`}
      onClick={() => !expanded && setExpanded(true)}
    >
      <AnimatePresence initial={false}>
        {expanded ? (
          <>
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3"
            >
              <PersonaSwitchButton theme={theme} />
              <ModelSwitchButton
                model={model}
                setModel={setModel}
                theme={theme}
              />
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setUseMistral(!useMistral);
                }}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 group
                ${
                  useMistral
                    ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_0_2px_rgba(250,204,21,0.4)]"
                    : isDark
                    ? "border-zinc-600 hover:border-zinc-400"
                    : "border-zinc-300 hover:border-zinc-400"
                }`}
                title="Toggle Mistral"
              >
                <Bolt
                  size={16}
                  className={`transition-colors duration-300 ${
                    useMistral
                      ? "text-yellow-400"
                      : "text-zinc-400 group-hover:text-zinc-600"
                  }`}
                />
              </motion.button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
                className="text-sm text-zinc-500 hover:text-zinc-800"
              >
                ✕
              </button>
            </motion.div>
          </>
        ) : (
          <motion.div
            key="icon"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Sparkle className="w-5 h-5 text-zinc-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MorphingToolbar;
