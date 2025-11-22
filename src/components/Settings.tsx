import { motion, AnimatePresence } from "framer-motion";
import { X, Moon } from "lucide-react";
import { FloatingDock } from "./Global/FloatingDock";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarOffset: number;
};

export default function Settings({
  showSettings,
  setShowSettings,
  sidebarOffset,
}: Props) {
  const { theme, setTheme } = useTheme();
  return (
    <>
      {/* Moon Toggle Icon */}
      <motion.button
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        className="absolute top-20 right-7 z-50 w-6 h-6 flex items-center justify-center overflow-hidden"
        initial={false}
        animate={{ x: sidebarOffset }}
        transition={{ duration: 0.2 }}
      >
        {/* Outline Moon (always visible) */}
        <Moon size={20} stroke="#4B5563" fill="none" className="absolute" />

        {/* Fill Animation Layer (appears in dark mode) */}
        <AnimatePresence>
          {theme === "dark" && (
            <motion.div
              key="fill"
              initial={{ height: 0 }}
              animate={{ height: "80%" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.1, ease: "easeInOut" }}
              className="absolute bottom-0 w-full h-full"
            >
              <Moon
                size={20}
                stroke="#bbb"
                fill="#bbb"
                className="w-full h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 crystalize ">
          <div
            className={`rounded-xl w-80 p-4 shadow-lg relative transition-colors duration-300 ${
              theme === "dark"
                ? "bg-[#3a3a3a] text-white"
                : "bg-[#ededef] text-black"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-md font-semibold">Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <hr className="mb-4" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Theme</label>
                <select
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value as "light" | "dark" | "system")
                  }
                  className="w-full p-2 rounded-md border border-gray-300 text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                (General settings placeholder)
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
