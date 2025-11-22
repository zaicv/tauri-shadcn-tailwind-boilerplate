import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Components } from "react-markdown";
import GPTCarousel from "../../components/Orb/GPTCarousel";
import { createErrorMessage } from "../../services/errorHandling";

type Message = {
  id: number;
  sender: "user" | "assistant";
  text: string;
  isError?: boolean;
  errorInfo?: any;
};

type EtherealTypingOrbProps = {
  className?: string;
  color?: string; // Tailwind-style color hex or rgba string
};

export function EtherealTypingOrb({
  className = "",
  color = "rgb(48, 48, 48)",
}: EtherealTypingOrbProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 4,
        ease: "linear",
      },
    });
  }, [controls]);

  // Helper for partial transparencies
  const getRGBA = (opacity: number) => {
    const rgba = color
      .replace("rgb(", "")
      .replace("rgba(", "")
      .replace(")", "")
      .split(",")
      .map((c) => parseFloat(c.trim()));
    return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${opacity})`;
  };

  return (
    <div
      className={`relative w-4 h-4 ${className}`}
      style={{ marginLeft: "20px" }}
    >
      <motion.div
        animate={controls}
        className="absolute top-0 left-0 w-4 h-4 rounded-full"
        style={{
          border: `2px solid ${getRGBA(0.6)}`,
          boxShadow: "none", // NO glow
          backgroundColor: getRGBA(0.8),
        }}
      />
    </div>
  );
}

const components: Components = {
  a: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode;
  }) => (
    <a
      {...props}
      className="text-blue-500 underline hover:text-blue-600"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),

  img: ({
    children,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    children?: React.ReactNode;
  }) => <img {...props} className="my-2 max-w-full rounded-lg" />,

  ul: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLUListElement> & {
    children?: React.ReactNode;
  }) => (
    <ul className="list-disc list-inside ml-4" {...props}>
      {children}
    </ul>
  ),

  ol: ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLOListElement> & {
    children?: React.ReactNode;
  }) => (
    <ol className="list-decimal list-inside ml-4" {...props}>
      {children}
    </ol>
  ),

  li: ({
    children,
    ...props
  }: React.LiHTMLAttributes<HTMLLIElement> & {
    children?: React.ReactNode;
  }) => (
    <li className="mb-1" {...props}>
      {children}
    </li>
  ),

  code: ({
    inline,
    className,
    children,
    ...props
  }: React.HTMLAttributes<HTMLElement> & {
    inline?: boolean;
    children?: React.ReactNode;
    className?: string;
  }) => {
    return inline ? (
      <code className="bg-gray-200 px-1 py-0.5 rounded text-red-600" {...props}>
        {children}
      </code>
    ) : (
      <pre className="bg-gray-800 text-white p-3 rounded overflow-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};
export default function GPTs() {
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      sender: "assistant",
      text: "Welcome to Glow Chat. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setIsTyping(true); // Start typing indicator

    try {
      const res = await fetch("https://100.83.147.76:8003/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
      });

      console.log("Raw response:", res);
      const data = await res.json();
      console.log("Parsed response:", data);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text:
          data.response ||
          data.reply ||
          "Sorry, I could not generate a response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);

      // Use the new error handling system
      const errorMessage = createErrorMessage(err);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false); // End typing indicator
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={`w-full min-h-[100dvh] max-h-[100dvh] mx-auto max-w-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-[#141414] text-white" : "bg-[#ededef] text-black"
      }`}
    >
      {/* --- Filter Overlay Layer --- */}
      <div className="fixed inset-0 z-10 pointer-events-none prismGlow backdrop-brightness-110 backdrop-contrast-105" />

      <div className="flex-1 w-full px-4 pt-[220px] pb-[calc(env(safe-area-inset-bottom)+90px)] flex flex-col items-center justify-start">
        <GPTCarousel
          theme={"light"}
          onSelect={() => {
            console.log("Orb selected!");
            // You can set state here to hide carousel or do something else
          }}
        />
      </div>

      {/* Moon Toggle Icon */}
      <motion.button
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        className="absolute top-4 right-14 z-50 w-6 h-6 flex items-center justify-center overflow-hidden"
        initial={false}
        animate={{}}
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

      {/* Main Content */}

      <motion.div
        animate={{ marginLeft: sidebarOpen ? 256 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col flex-1 items-center w-full min-h-0"
      ></motion.div>
    </div>
  );
}
// Add global styles for chat offset
