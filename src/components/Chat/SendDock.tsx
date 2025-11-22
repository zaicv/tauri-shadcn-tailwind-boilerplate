// components/VerticalDock.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Clock, Mic, Plus } from "lucide-react";
import { useRef } from "react";

export const VerticalDock = ({ visible }: { visible: boolean }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      console.log("Uploaded files:", files);
      // You can handle uploaded files here
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-14 right-2 flex flex-col items-center gap-3 z-50"
        >
          <DockItem
            icon={<Sparkle size={20} />}
            label="Enhance"
            onClick={() => console.log("Enhance clicked")}
          />
          <DockItem
            icon={<Mic size={20} />}
            label="Voice"
            onClick={() => console.log("Voice clicked")}
          />
          <DockItem
            icon={<Clock size={20} />}
            label="Schedule"
            onClick={() => console.log("Schedule clicked")}
          />
          <DockItem
            icon={<Plus size={20} />}
            label="Add"
            onClick={handleFileUploadClick}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DockItem = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <div className="group relative flex flex-col items-center">
    <button
      onClick={onClick}
      className="rounded-full bg-zinc-200 dark:bg-zinc-700 p-2 hover:bg-yellow-300 hover:text-black transition-all"
    >
      {icon}
    </button>
    <span className="absolute -right-24 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-zinc-800 text-white rounded-md transition-opacity">
      {label}
    </span>
  </div>
);
