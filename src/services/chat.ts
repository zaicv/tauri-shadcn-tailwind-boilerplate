// services/chat.ts
import { supabase } from "../lib/supabaseClient";
import type { Message } from "../lib/types";
import { extractMemoriesFromResponse, addMemory } from "./memory";
import { speakWithPersonaVoice } from "./voice";
import { createErrorMessage } from "./errorHandling";
import { toast } from "sonner";
import { dispatchThreadsUpdated } from "../lib/thread-storage";
import { useWebSocketContext } from "../context/WebSocketContext";

export interface SendMessageParams {
  input: string;
  currentThread: any;
  setInput: (value: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsTyping: (value: boolean) => void;
  setCurrentThread: React.Dispatch<React.SetStateAction<any>>;
  setRetrievedMemories: React.Dispatch<React.SetStateAction<any[]>>;
  healthData: any[];
  getCurrentPersona: () => any;
  currentPersona: any;
  model: string;
  useMistral: boolean;
  useVoice: boolean;
  deepMemory?: boolean;
  notionConnected?: boolean;
  wsContext?: ReturnType<typeof useWebSocketContext> | null;
}

// Add this interface at the top
export interface ChatResponse {
  response: string;
  knowledge_base?: Array<{
    title: string;
    category?: string;
    type?: string;
    similarity?: number;
  }>;
  kb_count?: number;
  memories?: any[];
  memory_count?: number;
  superpower_name?: string | null;
  tool_result?: {
    status: "success" | "error";
    message: string;
    superpower: string;
    tool: string;
    data?: any;
  };
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const THREAD_TITLE_ENDPOINT = "https://100.83.147.76:8003/chat-title";

const requestThreadTitle = async (user: string, assistant: string) => {
  try {
    const res = await fetch(THREAD_TITLE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: user.slice(0, 400),
        assistant: assistant.slice(0, 400),
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    const rawTitle = (data?.title || "").trim();
    return rawTitle.replace(/^"|"$/g, "");
  } catch (error) {
    console.error("Failed to generate chat title", error);
    return null;
  }
};

// Global abort controller for stopping AI responses
let currentAbortController: AbortController | null = null;

export const stopAIResponse = () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
};

export const sendMessage = async (params: SendMessageParams) => {
  const {
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
    deepMemory = false,
    notionConnected = false,
    wsContext = null,
  } = params;

  if (!input.trim() || !currentThread) return;

  const userInput = input.trim();
  setInput("");
  const activePersona = getCurrentPersona();
  
  // Create abort controller for this request
  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  // Set typing state immediately so pause button appears
  setIsTyping(true);

  // 1️⃣ Push user message first
  const userMsg: Message = {
    id: Date.now(),
    sender: "user",
    text: userInput,
  };
  setMessages((prev) => [...prev, userMsg]);

  await supabase.from("chat_messages").insert({
    thread_id: currentThread.id,
    user_id: currentThread.user_id,
    role: "user",
    content: userInput,
  });

  await supabase
    .from("chat_threads")
    .update({ date_modified: new Date().toISOString() })
    .eq("id", currentThread.id);

  const safeThreadName = currentThread.name ?? "";
  let nextThreadName = safeThreadName;
  const needsProvisionalTitle =
    !safeThreadName ||
    safeThreadName.trim() === "" ||
    safeThreadName === "New Chat";

  if (needsProvisionalTitle) {
    const provisionalTitle =
      userInput.split(" ").slice(0, 6).join(" ") +
      (userInput.split(" ").length > 6 ? "..." : "");

    await supabase
      .from("chat_threads")
      .update({
        name: provisionalTitle,
        date_modified: new Date().toISOString(),
      })
      .eq("id", currentThread.id);

    nextThreadName = provisionalTitle;

    setCurrentThread((prev: any) =>
      prev ? { ...prev, name: provisionalTitle } : prev
    );
    dispatchThreadsUpdated({
      action: "update",
      id: currentThread.id,
      name: provisionalTitle,
    });
  }

  // 🆕 Local health quick checks
  const healthQuery = userInput.toLowerCase();

  if (healthData.length > 0) {
    let replyText: string | null = null;
    const latest = healthData[0];

    // --- Last Weight ---
    if (/last weight/.test(healthQuery)) {
      replyText = `Your last recorded weight was ${latest.weight} lbs on ${latest.date}.`;
    }

    // --- Last AM Blood Pressure ---
    else if (/last (am )?blood pressure/.test(healthQuery)) {
      replyText = `Your last AM blood pressure was ${latest.am_blood_pressure} on ${latest.date}.`;
    }

    // --- Last PM Blood Pressure ---
    else if (/last pm blood pressure/.test(healthQuery)) {
      replyText = `Your last PM blood pressure was ${latest.pm_blood_pressure} on ${latest.date}.`;
    }

    // --- Last Sleep ---
    else if (/last sleep/.test(healthQuery)) {
      replyText = `Your last recorded sleep was ${latest.sleep_hours} hours on ${latest.date}.`;
    }

    // --- Average Weight This Week ---
    else if (/average weight (this )?week/.test(healthQuery)) {
      const last7 = healthData.slice(0, 7);
      const avg =
        last7.reduce((sum, d) => sum + (d.weight || 0), 0) / last7.length;
      replyText = `Your average weight over the past week is ${avg.toFixed(
        1
      )} lbs.`;
    }

    // --- Average Sleep This Week ---
    else if (/average sleep (this )?week/.test(healthQuery)) {
      const last7 = healthData.slice(0, 7);
      const avg =
        last7.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / last7.length;
      replyText = `Your average sleep over the past week is ${avg.toFixed(
        1
      )} hours per night.`;
    }

    // --- Average Sleep This Month ---
    else if (/average sleep (this )?month/.test(healthQuery)) {
      const last30 = healthData.slice(0, 30);
      const avg =
        last30.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) /
        last30.length;
      replyText = `Your average sleep over the past month is ${avg.toFixed(
        1
      )} hours per night.`;
    }

    if (replyText) {
      const reply = {
        id: Date.now() + 1,
        sender: "assistant",
        text: replyText,
      };
      setMessages((prev) => [...prev, reply]);

      await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        role: "assistant",
        content: reply.text,
      });

      return; // ⛔️ stop here if handled
    }
  }

  // 3️⃣ Detect action triggers
  // setIsTyping(true) already called above

  try {
    // === ✅ Smart To-Do trigger detection with expanded natural language triggers ===
    console.log("🔍 CHECKING TODO TRIGGER:", userInput);

    // Expanded triggers for more natural phrases
    const todoTriggerRegex =
      /^(add|create|insert|schedule|remind me to|note|put)\s+(a )?(task|todo|reminder)?/i;

    console.log("🔍 REGEX TEST RESULT:", todoTriggerRegex.test(userInput));

    if (todoTriggerRegex.test(userInput)) {
      console.log("✅ TODO TRIGGER DETECTED - USING SMART PARSING!");

      // Strip the trigger phrase to get raw task
      const rawTask = userInput.replace(todoTriggerRegex, "").trim();
      console.log("📝 RAW TASK EXTRACTED:", rawTask);

      if (!rawTask) {
        console.log("❌ NO TASK CONTENT FOUND");
        const errorMsg = {
          id: Date.now() + 1,
          sender: "assistant",
          text: `❌ Please specify what task you'd like me to add.`,
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsTyping(false);
        return;
      }

      try {
        console.log("🤖 CALLING MISTRAL FOR TODO PARSING...");

        // Call Mistral to intelligently parse the todo
        const parseRes = await fetch(
          "https://100.83.147.76:8003/api/parse-todo",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rawTask: rawTask,
              availableGroups: [
                "Gain 10 lbs",
                "Adapt My Diet",
                "Physical Reconditioning",
                "The Glow",
                "Ava",
                "Marissa",
                "Family",
                "House",
                "College / Career",
                "The Glow / Mortal Brand",
                "Coffee Truck / Content",
                "Money + Admin",
                "General", // fallback
              ],
            }),
          }
        );

        if (!parseRes.ok) {
          console.error("❌ MISTRAL PARSING FAILED:", await parseRes.text());
          throw new Error("Failed to parse todo with AI");
        }

        const parsedTodo = await parseRes.json();
        console.log(
          "🧠 MISTRAL PARSED TODO:",
          JSON.stringify(parsedTodo, null, 2)
        );

        // Use the intelligently parsed data
        const todoToInsert = {
          user_id: currentThread.user_id,
          title: parsedTodo.title || rawTask,
          description: parsedTodo.description || null,
          goal_group: parsedTodo.goal_group || "General",
          priority: parsedTodo.priority || 2,
          status: "pending",
          deadline: parsedTodo.deadline || null,
        };

        console.log(
          "📦 FINAL TODO TO INSERT:",
          JSON.stringify(todoToInsert, null, 2)
        );

        // Insert into Supabase
        const { data, error } = await supabase
          .from("todos")
          .insert([todoToInsert])
          .select();

        if (error) {
          console.error("❌ SUPABASE ERROR:", error);
          throw error;
        }

        // Smart confirmation message
        let confirmationText = `📝 Got it — I added "${todoToInsert.title}" to your ${todoToInsert.goal_group} list`;

        if (todoToInsert.deadline) {
          const deadlineDate = new Date(todoToInsert.deadline);
          const now = new Date();
          const daysUntil = Math.ceil(
            (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntil <= 1) {
            confirmationText += " 🔥 (due soon!)";
          } else if (daysUntil <= 7) {
            confirmationText += ` 📅 (due in ${daysUntil} days)`;
          } else {
            confirmationText += ` 📅 (due ${deadlineDate.toLocaleDateString()})`;
          }
        }

        const priorityEmoji =
          todoToInsert.priority === 1
            ? "🔥"
            : todoToInsert.priority === 3
            ? "📝"
            : "⭐";
        confirmationText += ` ${priorityEmoji}`;

        const confirmMsg = {
          id: Date.now() + 1,
          sender: "assistant",
          text: confirmationText,
        };

        setMessages((prev) => [...prev, confirmMsg]);

        // Save to chat messages
        await supabase.from("chat_messages").insert({
          thread_id: currentThread.id,
          user_id: currentThread.user_id,
          role: "assistant",
          content: confirmMsg.text,
        });

        if (useVoice) speakWithPersonaVoice(confirmMsg.text, activePersona);
      } catch (parseError) {
        console.error("❌ TODO PARSING/INSERT EXCEPTION:", parseError);
        // fallback logic here stays the same
      }

      setIsTyping(false);
      return; // 🚪 Exit early
    } else {
      console.log("⏭️ NOT A TODO TRIGGER - CONTINUING TO MEMORY CHECK");
    }

    // === 🧠 Memory trigger detection BEFORE calling /chat ===
    const memoryTriggers = [
      /^(remember|save this|note this|store this|keep this|memorize)/i,
      /(can you remember|please remember|remember that|save to memory)/i,
      /(i need you to remember|i want you to remember)/i,
    ];

    const isMemoryTrigger = memoryTriggers.some((regex) =>
      regex.test(userInput)
    );

    if (isMemoryTrigger) {
      // Extract content after trigger phrases
      let content = userInput;
      const triggerPhrases = [
        "remember",
        "save this",
        "note this",
        "store this",
        "keep this",
        "memorize",
        "can you remember",
        "please remember",
        "remember that",
        "save to memory",
        "i need you to remember",
        "i want you to remember",
      ];

      for (const phrase of triggerPhrases) {
        const regex = new RegExp(`^${phrase}\\s*`, "i");
        if (regex.test(content)) {
          content = content.replace(regex, "").trim();
          break;
        }
      }

      if (!content) {
        const errorMsg = {
          id: Date.now() + 1,
          sender: "assistant",
          text: `❌ What would you like me to remember?`,
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsTyping(false);
        return;
      }

      const memoryToInsert = {
        name:
          content.split(" ").slice(0, 6).join(" ") +
          (content.split(" ").length > 6 ? "..." : ""),
        content: content,
        tags: ["chat", "user-requested"],
        importance: 5,
        persona_id: currentPersona?.id,
      };

      const saved = await addMemory(memoryToInsert);

      // Update retrieved memories immediately
      setRetrievedMemories((prev) => [
        ...prev,
        {
          id: saved.id,
          name: saved.name,
          content: saved.content,
          importance: saved.importance,
          created_at: saved.created_at,
        },
      ]);

      // Show assistant confirmation
      const confirmMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        text: `💾 Saved to memory: "${memoryToInsert.name}"`,
      };
      setMessages((prev) => [...prev, confirmMsg]);

      await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        role: "assistant",
        content: confirmMsg.text,
      });

      if (useVoice) speakWithPersonaVoice(confirmMsg.text, activePersona);

      setIsTyping(false);
      return; // 🚪 Exit early, skip /chat
    }

    // === Otherwise, normal chat flow ===
    if (!activePersona) {
      console.error("No current persona available");
      const errorMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "❌ No persona selected. Please select a persona first.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
      return;
    }

    if (deepMemory) {
      toast("Scanning deep memory...", {
        description: "Searching Notion and file memories",
        duration: 5000,
        icon: "🔵",
      });
    }
    
    // Use WebSocket streaming if available, otherwise fall back to REST
    const useStreaming = wsContext?.isConnected && wsContext?.sendMessage && wsContext?.registerMessageHandler;
    
    if (useStreaming) {
      // Create assistant message placeholder for streaming
      const assistantMsgId = Date.now() + 1;
      let fullReply = "";
      let metadata: any = {};
      
      const assistantMsg = {
        id: assistantMsgId,
        sender: "assistant" as const,
        text: "",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      
      // Store unregister function for cleanup
      let unregisterFn: (() => void) | null = null;
      
      // Handle abort signal
      signal.addEventListener('abort', () => {
        if (unregisterFn) {
          unregisterFn();
          unregisterFn = null;
        }
        setIsTyping(false);
        // Send cancel message to backend
        if (wsContext?.sendMessage) {
          wsContext.sendMessage({ type: "cancel_chat" });
        }
        // Remove incomplete message if aborted
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      });
      
      // Set up WebSocket listener for chunks and metadata
      unregisterFn = wsContext.registerMessageHandler((message: any) => {
        if (signal.aborted) {
          if (unregisterFn) {
            unregisterFn();
            unregisterFn = null;
          }
          return;
        }
        
        if (message.type === "chat_metadata") {
          // Store metadata (memories, KB sources, etc.)
          metadata = {
            memories: message.memories || [],
            memory_count: message.memory_count || 0,
            knowledge_base: message.knowledge_base || [],
            kb_count: message.kb_count || 0,
            superpower_name: message.superpower_name || null,
            tool_result: message.tool_result,
            is_crisis: message.is_crisis,
            consciousness_state: message.consciousness_state,
            plex_video: message.plex_video,
            file_search: message.file_search,
          };
          
          // Extract memories if they exist
          const extractedMemories = extractMemoriesFromResponse(metadata);
          if (extractedMemories.length > 0) {
            console.log(
              `🔵 DEEP MEMORY: Displaying ${extractedMemories.length} memories in UI`
            );
            setRetrievedMemories(extractedMemories);
          }
          
          // Extract knowledge base sources
          const knowledgeBaseSources = metadata.knowledge_base || [];
          if (knowledgeBaseSources.length > 0) {
            console.log(
              `📚 KNOWLEDGE BASE: ${knowledgeBaseSources.length} sources used in response`
            );
          }
          
          // Update message with metadata
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    text: fullReply || msg.text,
                    glowStateUsed: false, // Can detect from text if needed
                    knowledgeBaseSources: knowledgeBaseSources,
                    superpowerName: metadata.superpower_name || null,
                    tool_result: metadata.tool_result,
                    file_search: metadata.file_search || undefined,
                    plexVideo: metadata.plex_video || undefined,
                  }
                : msg
            )
          );
        } else if (message.type === "chat_chunk") {
          if (message.done) {
            // Streaming complete
            if (unregisterFn) {
              unregisterFn();
              unregisterFn = null;
            }
            setIsTyping(false);
            
            if (fullReply && !signal.aborted) {
              supabase.from("chat_messages").insert({
                thread_id: currentThread.id,
                user_id: currentThread.user_id,
                role: "assistant",
                content: fullReply,
              });
              
              // Generate title if needed
              const safeCurrentName = nextThreadName ?? "";
              const needsAiTitle =
                !safeCurrentName ||
                safeCurrentName.trim() === "" ||
                safeCurrentName === "New Chat" ||
                safeCurrentName === userInput;
              
              if (needsAiTitle && !signal.aborted) {
                requestThreadTitle(userInput, fullReply).then((title) => {
                  if (title && !signal.aborted) {
                    supabase
                      .from("chat_threads")
                      .update({
                        name: title,
                        date_modified: new Date().toISOString(),
                      })
                      .eq("id", currentThread.id);
                    setCurrentThread((prev: any) =>
                      prev ? { ...prev, name: title } : prev
                    );
                    dispatchThreadsUpdated({
                      action: "update",
                      id: currentThread.id,
                      name: title,
                    });
                  }
                });
              }
            }
            
            // Clear abort controller on completion
            if (currentAbortController === signal) {
              currentAbortController = null;
            }
          } else {
            // Append chunk to message
            fullReply += message.chunk || "";
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      text: fullReply,
                      // Keep existing metadata if already set
                      knowledgeBaseSources: msg.knowledgeBaseSources || metadata.knowledge_base || [],
                      superpowerName: msg.superpowerName || metadata.superpower_name || null,
                      tool_result: msg.tool_result || metadata.tool_result,
                      file_search: msg.file_search || metadata.file_search || undefined,
                      plexVideo: msg.plexVideo || metadata.plex_video || undefined,
                    }
                  : msg
              )
            );
          }
        } else if (message.type === "chat_cancelled") {
          // Chat was cancelled
          if (unregisterFn) {
            unregisterFn();
            unregisterFn = null;
          }
          setIsTyping(false);
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
        }
      });
      
      // Send chat message via WebSocket
      wsContext.sendMessage({
        type: "chat_message",
        data: {
          message: userInput,
          model,
          useMistral,
          deepMemory,
          notionConnected,
          thread_id: currentThread.id,
          user_id: currentThread.user_id,
          health_data: healthData,
          useKnowledgeBase: activePersona.useKnowledgeBase ?? true,
          id: activePersona.id,
          name: activePersona.name,
          description: activePersona.description,
          model_name: activePersona.model,
          system_prompt: activePersona.systemPrompt,
          context_summary: activePersona.contextSummary,
          chat_style: activePersona.chatStyle,
          tone_rules: activePersona.toneRules,
          mirroring_method: activePersona.mirroringMethod,
          style_guide: activePersona.styleGuide,
          use_memory_rag: activePersona.useMemoryRag,
          guiding_principles: activePersona.guidingPrinciples,
          session_priming: activePersona.sessionPriming,
        },
      });
      
      // Return early - streaming will complete via WebSocket
      return;
    }
    
    // Fallback to REST API
    const res = await fetch("https://100.83.147.76:8003/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        message: userInput,
        model,
        useMistral,
        deepMemory,
        notionConnected,
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        health_data: healthData,
        id: activePersona.id,
        name: activePersona.name,
        description: activePersona.description,
        model_name: activePersona.model,
        system_prompt: activePersona.systemPrompt,
        context_summary: activePersona.contextSummary,
        chat_style: activePersona.chatStyle,
        tone_rules: activePersona.toneRules,
        mirroring_method: activePersona.mirroringMethod,
        style_guide: activePersona.styleGuide,
        use_memory_rag: activePersona.useMemoryRag,
        guiding_principles: activePersona.guidingPrinciples,
        session_priming: activePersona.sessionPriming,
      }),
    });

    if (signal.aborted) {
      setIsTyping(false);
      return;
    }

    if (!res.ok) throw new Error(await res.text());

    const responseData: ChatResponse = await res.json();
    
    if (signal.aborted) {
      setIsTyping(false);
      return;
    }
    const reply = responseData.response || "Sorry, I couldn't answer that.";

    // Handle tool result - will be displayed inline in chat

    // Check if response indicates GlowState was used
    const glowStateIndicators = [
      "cpu", "ram", "disk", "uptime", "model", "persona", 
      "superpowers", "ollama", "plex", "disc mounted", "disc inserted"
    ];
    const glowStateUsed = glowStateIndicators.some(indicator => 
      reply.toLowerCase().includes(indicator)
    ) || userInput.toLowerCase().includes("status") || 
       userInput.toLowerCase().includes("what model") ||
       userInput.toLowerCase().includes("what's your");

    // Handle token usage if available
    if (responseData.token_usage) {
      console.log("Token usage:", responseData.token_usage);
      // You can store this in state or display it in UI
    }

    // Extract memories if they exist
    const extractedMemories = extractMemoriesFromResponse(responseData);
    if (extractedMemories.length > 0) {
      console.log(
        `🔵 DEEP MEMORY: Displaying ${extractedMemories.length} memories in UI`
      );
      setRetrievedMemories(extractedMemories);
    }

    // Extract knowledge base sources if they exist
    const knowledgeBaseSources = responseData.knowledge_base || [];
    if (knowledgeBaseSources.length > 0) {
      console.log(
        `📚 KNOWLEDGE BASE: ${knowledgeBaseSources.length} sources used in response`
      );
    }

    // Add message with tool result if present, or regular message
    // Check if file_search is in tool_result.data.output or at top level
    const fileSearchData = (responseData as any).file_search || 
                          responseData.tool_result?.data?.output?.file_search ||
                          (responseData.tool_result?.data?.output?.type === "file_search" ? responseData.tool_result.data.output : undefined);
    
    const assistantMsg = {
      id: Date.now() + 1,
      sender: "assistant" as const,
      text: reply,
      glowStateUsed: glowStateUsed,
      knowledgeBaseSources: knowledgeBaseSources,
      superpowerName: responseData.superpower_name || null,
      tool_result: responseData.tool_result || undefined,
      file_search: fileSearchData ? {
        matches: fileSearchData.matches || [],
        query: fileSearchData.query || "",
        location_hint: fileSearchData.location_hint,
        count: fileSearchData.count || 0
      } : undefined,
      plexVideo: (responseData as any).plex_video || undefined,
    };
    
    // Log for debugging
    if (fileSearchData) {
      console.log("🔍 File search data found in response:", fileSearchData);
    }
    setMessages((prev) => [...prev, assistantMsg]);

    if (!signal.aborted) {
      await supabase.from("chat_messages").insert({
        thread_id: currentThread.id,
        user_id: currentThread.user_id,
        role: "assistant",
        content: assistantMsg.text || (responseData.tool_result?.message || ""),
      });
    }
    
    // Clear abort controller on completion
    if (currentAbortController === signal) {
      currentAbortController = null;
    }

    const safeCurrentName = nextThreadName ?? "";
    const needsAiTitle =
      !safeCurrentName ||
      safeCurrentName.trim() === "" ||
      safeCurrentName === "New Chat" ||
      safeCurrentName === userInput;

    if (needsAiTitle && !signal.aborted) {
      const generatedTitle = await requestThreadTitle(userInput, reply);
      if (generatedTitle && !signal.aborted) {
        await supabase
          .from("chat_threads")
          .update({
            name: generatedTitle,
            date_modified: new Date().toISOString(),
          })
          .eq("id", currentThread.id);
        setCurrentThread((prev: any) =>
          prev ? { ...prev, name: generatedTitle } : prev
        );
        dispatchThreadsUpdated({
          action: "update",
          id: currentThread.id,
          name: generatedTitle,
        });
      }
    }
    
    setIsTyping(false);
  } catch (error: any) {
    setIsTyping(false);
    if (error.name === "AbortError") {
      // User stopped the response - don't show error
      return;
    }
    
    console.error("Chat error:", error);

    // Use the new error handling system
    const errorMessage = createErrorMessage(error);
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsTyping(false);
  }
};
