// hooks/useChatThread.ts
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAnimation } from "framer-motion";
import { supabase } from "@/supabase/supabaseClient";
import { createErrorMessage } from "@/services/errorHandling";

export type Message = {
  id: number;
  sender: "user" | "assistant";
  text: string;
  isError?: boolean;
  errorInfo?: any;
};

const models = [
  "Groq-LLaMA3-70B",
  "Groq",
  "ChatGPT 3.5",
  "ChatGPT 4.1",
  "Claude",
];

export function useChatThread() {
  const navigate = useNavigate();
  const { threadId } = useParams();

  // -----------------------------
  // State
  // -----------------------------
  const [model, setModel] = useState("Groq-LLaMA3-70B");
  const [persona, setPersona] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentThread, setCurrentThread] = useState<any>(null);
  const [retrievedMemories, setRetrievedMemories] = useState<any[]>([]);
  const [useMistral, setUseMistral] = useState(false);
  const [useVoice, setUseVoice] = useState(false);

  // -----------------------------
  // Refs & Animations
  // -----------------------------
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarControls = useAnimation();

  // -----------------------------
  // Effects - Load thread & persona
  // -----------------------------
  useEffect(() => {
    (async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) return;

      const userId = userData.user.id;
      let thread;

      if (threadId) {
        const { data, error } = await supabase
          .from("chat_threads")
          .select("*")
          .eq("id", threadId)
          .single();
        if (error) return;
        thread = data;
      } else {
        const { data: newThread } = await supabase
          .from("chat_threads")
          .insert([
            { user_id: userId, name: "New Chat", model: "Groq-LLaMA3-70B" },
          ])
          .select()
          .single();
        if (!newThread) return;
        thread = newThread;
      }

      setCurrentThread(thread);
      await loadPersona(thread.model);

      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });

      setMessages([
        {
          id: 0,
          sender: "assistant",
          text: "Welcome to Glow Chat. How can I help you today?",
        },
        ...(msgs ?? []).map((msg) => ({
          id: Date.now() + Math.random(),
          sender: msg.role,
          text: msg.content,
        })),
      ]);
    })();
  }, [threadId]);

  // -----------------------------
  // Persona loader
  // -----------------------------
  const loadPersona = async (modelName: string) => {
    try {
      const { data } = await supabase
        .from("persona")
        .select(
          `id, name, description, model_name, system_prompt, context_summary, chat_style, tone_rules, mirroring_method, style_guide, use_memory_rag, guiding_principles, session_priming`
        )
        .eq("model_name", modelName)
        .single();

      if (!data) return;

      if (data.chat_style && typeof data.chat_style !== "object") {
        try {
          data.chat_style = JSON.parse(data.chat_style);
        } catch {
          data.chat_style = null;
        }
      }
      setPersona(data);
    } catch (err) {
      console.error("[DEBUG] Persona load failed:", err);
    }
  };

  // -----------------------------
  // Handlers
  // -----------------------------
  const sendMessage = async () => {
    if (!input.trim() || !currentThread) return;

    const userInput = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: userInput },
    ]);
    setInput("");
    setIsTyping(true);

    try {
      await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        role: "user",
        content: userInput,
      });

      const res = await fetch("https://100.83.147.76:8003/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          model,
          useMistral,
          thread_id: currentThread.id,
          user_id: currentThread.user_id,
          ...persona,
        }),
      });

      const responseData = await res.json();
      const reply = responseData.response || "Sorry, I couldn't answer that.";

      if (responseData.memories) {
        setRetrievedMemories(responseData.memories);
      }

      const assistantMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        text: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        role: "assistant",
        content: assistantMsg.text,
      });
    } catch (err: any) {
      console.error("Chat error:", err);

      // Use the new error handling system
      const errorMessage = createErrorMessage(err);
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return {
    model,
    setModel,
    persona,
    messages,
    input,
    setInput,
    currentThread,
    retrievedMemories,
    sendMessage,
    useMistral,
    setUseMistral,
    useVoice,
    setUseVoice,
    textareaRef,
    sidebarRef,
    sidebarControls,
    models,
  };
}
