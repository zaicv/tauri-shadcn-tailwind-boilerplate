// =======================================================
// Imports
// =======================================================
import { useState, useRef, useEffect } from "react";
import InputBox from "./InputBox";
import ChatMessages from "./ChatMessages";
import { supabase } from "../../supabase/supabaseClient";
import { createErrorMessage } from "@/services/errorHandling";
import { speakWithPersonaVoice } from "@/services/voice";

// =======================================================
// Types
// =======================================================
type Message = {
  id: number;
  sender: "user" | "assistant";
  text: string;
  isError?: boolean;
  errorInfo?: any;
};

// =======================================================
// Component
// =======================================================
export default function ChatModal({ threadIdProp }: { threadIdProp?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [currentThread, setCurrentThread] = useState<any>(null);
  const [model, setModel] = useState("Groq-LLaMA3-70B");
  const [persona, setPersona] = useState<any>(null);
  const [useVoice, setUseVoice] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // =======================================================
  // Load thread & messages
  // =======================================================
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const userId = userData.user.id;
      let thread;

      if (threadIdProp) {
        const { data, error } = await supabase
          .from("chat_threads")
          .select("*")
          .eq("id", threadIdProp)
          .single();
        if (!error) thread = data;
      } else {
        const { data: newThread } = await supabase
          .from("chat_threads")
          .insert([{ user_id: userId, name: "New Chat", model }])
          .select()
          .single();
        thread = newThread;
      }

      if (!thread) return;

      setCurrentThread(thread);

      // Load messages
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });

      setMessages([
        {
          id: 0,
          sender: "assistant",
          text: "Welcome! How can I help you today?",
        },
        ...(msgs || []).map((msg: any) => ({
          id: Date.now() + Math.random(),
          sender: msg.role === "user" ? "user" : "assistant",
          text: msg.content,
        })),
      ]);

      // Load persona
      const { data: personaData } = await supabase
        .from("persona")
        .select("*")
        .eq("model_name", thread.model)
        .single();
      setPersona(personaData);
    })();
  }, [threadIdProp]);

  // =======================================================
  // Handlers
  // =======================================================
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentThread) return;

    const userInput = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: userInput },
    ]);
    setInput("");

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
          thread_id: currentThread.id,
          ...persona,
        }),
      });

      const { response: reply } = await res.json();
      const assistantMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        text: reply || "Sorry, I couldn't answer that.",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        sender: "assistant",
        text: assistantMsg.text,
      });

      if (useVoice) speakWithPersonaVoice(assistantMsg.text, persona);
    } catch (err: any) {
      console.error("Chat error:", err);

      // Use the new error handling system
      const errorMessage = createErrorMessage(err);
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // =======================================================
  // Render
  // =======================================================
  return (
    <div className="flex flex-col h-full w-full bg-transparent text-white">
      <div className="flex-1 overflow-y-auto">
        <ChatMessages messages={messages} theme="dark" />
      </div>
      <div className="p-4">
        <InputBox
          textareaRef={textareaRef}
          input={input}
          setInput={setInput}
          handleKeyDown={handleKeyDown}
          sendMessage={sendMessage}
          model={model}
          setModel={setModel}
          useVoice={useVoice}
          setUseVoice={setUseVoice}
          sidebarOffset={0}
          theme={"light"}
          dropdownOpen={false}
          setDropdownOpen={function (open: boolean): void {
            throw new Error("Function not implemented.");
          }}
          models={[]}
          useMistral={false}
          setUseMistral={function (val: boolean): void {
            throw new Error("Function not implemented.");
          }}
          onAddDownloadTask={function (url: string): void {
            throw new Error("Function not implemented.");
          }}
        />
      </div>
    </div>
  );
}
