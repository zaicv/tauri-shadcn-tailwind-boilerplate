// =======================================================
// 🎭 ACTOR'S SCRIPT & DELIVERY NOTES - Chat State Management
// =======================================================
// The actor's personal notes about their lines, delivery style,
// and current conversation state
import { useState } from "react";
import { sendMessage } from "@/services/chat";
import { retrieveMemories } from "@/services/memory";
import { useOptimizedInput } from "@/hooks/useOptimizedInput";
import { useWebSocketContext } from "@/context/WebSocketContext";

interface UseChatStateProps {
  currentThread: any;
  setMessages: (messages: any) => void;
  setCurrentThread: (thread: any) => void;
  setRetrievedMemories: (memories: any[]) => void;
  healthData: any;
  getCurrentPersona: () => any;
  currentPersona: any;
  deepMemory: boolean;
  notionConnected: boolean;
  useKnowledgeBase: boolean; // ✅ ADD THIS
}

export const useChatState = ({
  currentThread,
  setMessages,
  setCurrentThread,
  setRetrievedMemories,
  healthData,
  getCurrentPersona,
  currentPersona,
  deepMemory,
  notionConnected,
  useKnowledgeBase, // ✅ ADD THIS
}: UseChatStateProps) => {
  // -----------------------------
  // 🎭 Actor's Current Lines & Delivery Style
  // -----------------------------
  const [model, setModel] = useState("GPT-4o");
  const { value: input, onChange: setInput } = useOptimizedInput("");
  const [isTyping, setIsTyping] = useState(false);
  const [useMistral, setUseMistral] = useState(false);
  const [useVoice, setUseVoice] = useState(false);
  const [retrievedMemories, setRetrievedMemoriesLocal] = useState<any[]>([]);
  const wsContext = useWebSocketContext();
  
  // ❌ REMOVE THIS LINE - it's now passed as a prop
  // const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);

  // -----------------------------
  // 🎭 Actor's Performance Functions
  // -----------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage({
        input,
        currentThread,
        setInput,
        setMessages,
        setIsTyping,
        setCurrentThread,
        setRetrievedMemories,
        healthData,
        getCurrentPersona,
        currentPersona,
        model,
        useMistral,
        useVoice,
        deepMemory,
        notionConnected,
        wsContext,
      });
    }
  };

  const handleSendClick = () => {
    sendMessage({
      input,
      currentThread,
      setInput,
      setMessages,
      setIsTyping,
      setCurrentThread,
      setRetrievedMemories,
      healthData,
      getCurrentPersona,
      currentPersona,
      model,
      useMistral,
      useVoice,
      deepMemory,
      notionConnected,
      wsContext,
    });
  };

  const handleMemoryTest = async () => {
    if (input.trim()) {
      try {
        const memories = await retrieveMemories(input.trim(), { deepMemory });
        setRetrievedMemoriesLocal(memories);
        setRetrievedMemories(memories);
      } catch (err) {
        console.error("Memory test failed:", err);
      }
    }
  };

  // -----------------------------
  // 🎭 Return Actor's Script
  // -----------------------------
  return {
    // Current State
    model,
    setModel,
    input,
    setInput,
    isTyping,
    setIsTyping,
    useMistral,
    setUseMistral,
    useVoice,
    setUseVoice,
    retrievedMemories: retrievedMemories,
    // Performance Functions
    handleKeyDown,
    handleSendClick,
    handleMemoryTest,
  };
};
