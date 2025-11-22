import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Clock, Mic, Plus } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export const VerticalDock = ({
  visible,
  dockRef,
}: {
  visible: boolean;
  dockRef: React.RefObject<HTMLDivElement>;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate(); // <-- React Router hook

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      console.log("Uploaded files:", files);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
          />

          {/* Dock Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed ml-44 mt-44 pt-40 flex flex-col items-center gap-8 z-50"
            ref={dockRef}
          >
            <DockItem
              icon={<Sparkle size={28} stroke="white" strokeWidth={2.5} />}
              label="Chat (look)"
              onClick={() => navigate("/look")}
            />
            <DockItem
              icon={<Mic size={28} stroke="white" strokeWidth={2.5} />}
              label="GPTs"
              onClick={() => navigate("/gpts")}
            />
            <DockItem
              icon={<Clock size={28} stroke="white" strokeWidth={2.5} />}
              label="Home"
              onClick={() => navigate("/")}
            />
            <DockItem
              icon={<Plus size={28} stroke="white" strokeWidth={2.5} />}
              label="Speak"
              onClick={() => navigate("/speak")}
            />

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </motion.div>
        </>
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
      className="rounded-full border-2 border-white p-6 bg-transparent hover:bg-white/10 transition-all"
    >
      {icon}
    </button>
    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-sm px-3 py-1 bg-zinc-800 text-white rounded-md transition-opacity whitespace-nowrap">
      {label}
    </span>
  </div>
);
