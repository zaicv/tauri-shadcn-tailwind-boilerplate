import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Stethoscope, Brain } from "lucide-react";

const personas = [
  { id: "general", name: "General", color: "red", icon: <User size={14} /> },
  {
    id: "doctor",
    name: "Doctor",
    color: "green",
    icon: <Stethoscope size={14} />,
  },
  {
    id: "therapist",
    name: "Therapist",
    color: "gold",
    icon: <Brain size={14} />,
  },
];

type Props = {
  theme: "light" | "dark" | "system";
};

export default function PersonaSwitchButton({ theme }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const persona = personas[activeIndex];

  const handleClick = () => {
    setActiveIndex((prev) => (prev + 1) % personas.length);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="relative overflow-hidden flex items-center justify-center w-10 h-10 leading-none rounded-full text-white font-medium shadow-lg"
      style={{
        border: `2px solid ${persona.color}`,
        boxShadow: `0 0 8px ${persona.color}`,
        color: persona.color,
        backgroundColor: theme === "dark" ? "#2a2a2a" : "#d8d4dc",
      }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={persona.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="leading-none"
        >
          {persona.icon}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
