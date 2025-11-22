import React from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const models = [
  { id: "Groq", label: "G", color: "rgb(249 115 22)" },
  { id: "Groq-LLaMA3-70B", label: "M", color: "rgb(59 130 246)" },
  { id: "GPT-4o", label: "4o", color: "rgb(168 85 247)" },
  { id: "Claude", label: "C", color: "rgb(255 86 48)" },
];

type Props = {
  model: string;
  setModel: (model: string) => void;
  theme: "light" | "dark" | "system";
};

const ModelSwitchButton: React.FC<Props> = ({ model, setModel, theme }) => {
  const current = models.find((m) => m.id === model) || models[0];

  return (
    <div className="relative w-10 select-none">
      <Select value={model} onValueChange={setModel}>
        <SelectTrigger
          className="w-10 h-10 rounded-full text-xs font-medium border-2 shadow-lg select-none appearance-none pr-0"
          style={{
            borderColor: current.color,
            boxShadow: `0 0 8px ${current.color}`,
            color: current.color,
            backgroundColor: theme === "dark" ? "#2a2a2a" : "#d8d4dc",
          }}
        >
          <motion.span
            key={current.id}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="text-[10px] leading-none"
          >
            {current.label}
          </motion.span>
        </SelectTrigger>

        <SelectContent
          side="top"
          className="text-xs bg-white text-black dark:bg-[#1a1a1a] dark:text-white border border-border shadow-lg"
        >
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSwitchButton;
