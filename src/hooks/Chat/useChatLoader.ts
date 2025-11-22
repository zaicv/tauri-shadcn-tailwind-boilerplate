import { useCallback, useEffect, useState } from "react";
import type { Message } from "@/lib/types";
import { supabase } from "@/supabase/supabaseClient";
import { getHealthData } from "@/services/helpers";
import { useNavigate } from "react-router-dom";
import {
  dispatchThreadsUpdated,
  getStoredThreadId,
  setStoredThreadId,
} from "@/lib/thread-storage";

export const useChatLoader = (threadId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  const [currentThread, setCurrentThread] = useState<any>(null);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [retrievedMemories, setRetrievedMemories] = useState<any[]>([]);

  const loadThread = useCallback(
    async (explicitThreadId?: string) => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        console.error("Unable to load user for chat thread", userError);
        return false;
      }

      const userId = userData.user.id;
      const nextHealthData = await getHealthData(userId);
      setHealthData(nextHealthData);
      let thread;
      let targetThreadId = explicitThreadId ?? threadId;

      if (!targetThreadId) {
        const storedId = getStoredThreadId();
        if (storedId) {
          targetThreadId = storedId;
          navigate(`/chat/${storedId}`, { replace: true });
        }
      }

      if (targetThreadId) {
        const { data, error } = await supabase
          .from("chat_threads")
          .select("*")
          .eq("id", targetThreadId)
          .single();
        if (!error && data) {
          thread = data;
        } else {
          console.error("Failed to load chat thread", error);
          setStoredThreadId(null);
        }
      }

      if (!thread) {
        const { data: newThread, error: createError } = await supabase
          .from("chat_threads")
          .insert([
            { user_id: userId, name: "New Chat", model: "Groq-LLaMA3-70B" },
          ])
          .select()
          .single();
        if (createError || !newThread) {
          console.error("Failed to create new chat thread", createError);
          return false;
        }
        thread = newThread;
        setStoredThreadId(newThread.id);
        dispatchThreadsUpdated({
          action: "create",
          id: newThread.id,
          name: newThread.name,
        });
        navigate(`/chat/${newThread.id}`, { replace: true });
      } else {
        setStoredThreadId(thread.id);
      }

      setCurrentThread(thread);
      // await loadPersona(thread.model); // Removed local persona loading

      const { data: msgs, error: msgError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });

      if (msgError) {
        console.error("Failed to load chat messages", msgError);
        return false;
      }

      setMessages([
        {
          id: 0,
          sender: "assistant",
          text: "Welcome to Glow Chat. How can I help you today?",
        },
        ...(msgs || []).map((msg: any) => ({
          id: Date.now() + Math.random(),
          sender:
            msg.role === "user"
              ? "user"
              : ("assistant" as "user" | "assistant"),
          text: msg.content,
        })),
      ]);
      return true;
    },
    [navigate, threadId]
  );

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  return {
    messages,
    setMessages,
    currentThread,
    setCurrentThread,
    healthData,
    retrievedMemories,
    setRetrievedMemories,
    reloadThread: () => loadThread(),
  };
};
