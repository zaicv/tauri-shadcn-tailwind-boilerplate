// src/components/Sidebar/nav-threads.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useTheme } from "@/context/ThemeContext";
import {
  MessageCircle,
  MoreHorizontal,
  Edit3,
  Trash2,
  Plus,
  Search,
} from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInput,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  dispatchThreadsUpdated,
  getStoredThreadId,
  setStoredThreadId,
  THREADS_UPDATED_EVENT,
} from "@/lib/thread-storage";
import type { ThreadUpdateDetail } from "@/lib/thread-storage";

type Thread = {
  id: string;
  name: string;
  created_at: string;
  date_modified: string | null;
  folder_id?: string | null;
};

function groupThreadsByDate(threads: Thread[]) {
  const groups: Record<string, Thread[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  threads.forEach((thread) => {
    const date = new Date(thread.date_modified || thread.created_at);
    if (isToday(date)) groups["Today"].push(thread);
    else if (isYesterday(date)) groups["Yesterday"].push(thread);
    else if (isThisWeek(date)) groups["This Week"].push(thread);
    else if (isThisMonth(date)) groups["This Month"].push(thread);
    else groups["Older"].push(thread);
  });

  return groups;
}

export function NavThreads() {
  const navigate = useNavigate();
  const { threadId: routeThreadId } = useParams();
  const { isMobile, setOpenMobile } = useSidebar();
  const { isDark } = useTheme();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [persistedThreadId, setPersistedThreadId] = useState<string | null>(
    () => (typeof window === "undefined" ? null : getStoredThreadId())
  );

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("date_modified", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading threads:", error);
        setThreads([]);
      } else {
        setThreads(data || []);
      }
    } catch (err) {
      console.error("Error loading threads:", err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!routeThreadId) return;
    setPersistedThreadId(routeThreadId);
  }, [routeThreadId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleThreadsEvent = (event: Event) => {
      const custom = event as CustomEvent<ThreadUpdateDetail>;
      const detail = custom.detail;

      if (detail?.id && detail?.name) {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === detail.id ? { ...thread, name: detail.name } : thread
          )
        );
      } else {
        loadThreads();
      }

      setPersistedThreadId(getStoredThreadId());
    };

    window.addEventListener(THREADS_UPDATED_EVENT, handleThreadsEvent);
    return () => {
      window.removeEventListener(THREADS_UPDATED_EVENT, handleThreadsEvent);
    };
  }, [loadThreads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      (t.name || "Untitled Chat").toLowerCase().includes(q)
    );
  }, [threads, search]);

  const grouped = useMemo(() => groupThreadsByDate(filtered), [filtered]);
  const activeThreadId = routeThreadId ?? persistedThreadId ?? null;

  const handleOpenThread = (id: string) => {
    setStoredThreadId(id);
    setPersistedThreadId(id);
    navigate(`/chat/${id}`);
    if (isMobile) setOpenMobile(false);
  };

  const handleCreateThread = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: newThread, error } = await supabase
      .from("chat_threads")
      .insert([
        { user_id: user.id, name: "New Chat", model: "Groq-LLaMA3-70B" },
      ])
      .select()
      .single();

    if (!error && newThread) {
      const typedThread = newThread as Thread;
      setThreads((prev) => [typedThread, ...prev]);
      dispatchThreadsUpdated({
        action: "create",
        id: typedThread.id,
        name: typedThread.name,
      });
      handleOpenThread(newThread.id);
    }
  };

  const saveThreadName = async (id: string) => {
    const name = draftNames[id]?.trim();
    setEditingId(null);
    if (!name) return;

    const { error } = await supabase
      .from("chat_threads")
      .update({ name, date_modified: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
      dispatchThreadsUpdated({ action: "update", id, name });
    }
  };

  const deleteThread = async (id: string) => {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (!error) {
      const remaining = threads.filter((t) => t.id !== id);
      setThreads(remaining);
      dispatchThreadsUpdated({ action: "delete", id });

      if (activeThreadId === id) {
        const fallback = remaining[0];
        if (fallback) {
          handleOpenThread(fallback.id);
        } else {
          setStoredThreadId(null);
          setPersistedThreadId(null);
          navigate("/chat");
        }
      }
    }
  };

  const totalThreads = filtered.length;

  return (
    <SidebarGroup className="space-y-4 px-2">
      <div className={`flex items-center justify-between rounded-2xl px-3 py-2 backdrop-blur transition-colors duration-200 ${
        isDark ? "bg-white/5" : "bg-gray-100"
      }`}>
        <SidebarGroupLabel className={`text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-200 ${
          isDark ? "text-white/70" : "text-gray-600"
        }`}>
          Chats
        </SidebarGroupLabel>
        <button
          type="button"
          onClick={handleCreateThread}
          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-medium transition-colors duration-200 ${
            isDark 
              ? "bg-white/15 text-white hover:bg-white/25" 
              : "bg-gray-200 text-black hover:bg-gray-300"
          }`}
        >
          <Plus className="h-3 w-3" />
          New Chat
        </button>
      </div>

      <div className="px-1">
        <div className="relative">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 transition-colors duration-200 ${
            isDark ? "text-white/40" : "text-gray-400"
          }`} />
          <SidebarInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className={`h-9 rounded-2xl pl-8 text-sm transition-colors duration-200 ${
              isDark 
                ? "border-white/10 bg-white/5 text-white placeholder:text-white/50" 
                : "border-gray-200 bg-gray-100 text-black placeholder:text-gray-500"
            }`}
          />
        </div>
      </div>

      <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1 pb-2">
        {loading && (
          <div className="space-y-2 px-1">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className={`h-10 rounded-2xl animate-pulse ${
                  isDark ? "bg-white/10" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {!loading && totalThreads === 0 && (
          <div className={`rounded-2xl border border-dashed px-4 py-6 text-center text-xs transition-colors duration-200 ${
            isDark 
              ? "border-white/10 text-white/60" 
              : "border-gray-200 text-gray-600"
          }`}>
            Start a conversation to see it appear here.
          </div>
        )}

        {!loading &&
          Object.entries(grouped).map(([label, items]) =>
            items.length ? (
              <div key={label} className="space-y-2">
                <p className={`px-2 text-[11px] font-medium uppercase tracking-[0.3em] transition-colors duration-200 ${
                  isDark ? "text-white/40" : "text-gray-500"
                }`}>
                  {label}
                </p>
                <div className="space-y-1.5">
                  {items.map((thread) => {
                    if (editingId === thread.id) {
                      return (
                        <div key={thread.id} className="px-2">
                          <SidebarInput
                            value={
                              draftNames[thread.id] ??
                              thread.name ??
                              "Untitled Chat"
                            }
                            onChange={(e) =>
                              setDraftNames((prev) => ({
                                ...prev,
                                [thread.id]: e.target.value,
                              }))
                            }
                            onBlur={() => saveThreadName(thread.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveThreadName(thread.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className={`h-8 rounded-xl text-sm transition-colors duration-200 ${
                              isDark ? "bg-white/10 text-white" : "bg-gray-200 text-black"
                            }`}
                            autoFocus
                          />
                        </div>
                      );
                    }

                    const isActive = activeThreadId === thread.id;
                    return (
                      <div
                        key={thread.id}
                        className="group relative overflow-hidden rounded-2xl"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenThread(thread.id)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-colors duration-200 ${
                            isActive
                              ? isDark 
                                ? "bg-white/15 text-white shadow-lg ring-1 ring-white/40" 
                                : "bg-gray-200 text-black shadow-lg ring-1 ring-gray-300"
                              : isDark 
                                ? "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black"
                          }`}
                        >
                          <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs transition-colors duration-200 ${
                            isDark ? "bg-white/15 text-white" : "bg-gray-200 text-black"
                          }`}>
                            <MessageCircle className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 truncate">
                            {thread.name || "Untitled Chat"}
                          </span>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-0 transition-all group-hover:opacity-100 duration-200 ${
                              isDark 
                                ? "text-white/50 hover:bg-white/10 hover:text-white" 
                                : "text-gray-500 hover:bg-gray-200 hover:text-black"
                            }`}
                          >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                Conversation options
                              </span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="start"
                            className={`w-44 rounded-2xl border backdrop-blur-xl transition-colors duration-200 ${
                              isDark 
                                ? "border-white/10 bg-zinc-900/95 text-white" 
                                : "border-gray-200 bg-white text-black"
                            }`}
                          >
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setEditingId(thread.id);
                                setDraftNames((prev) => ({
                                  ...prev,
                                  [thread.id]: thread.name || "",
                                }));
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Rename</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className={`transition-colors duration-200 ${
                              isDark ? "bg-white/10" : "bg-gray-200"
                            }`} />
                            <DropdownMenuItem
                              className="cursor-pointer text-red-400 focus:text-red-400"
                              onClick={() => deleteThread(thread.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
      </div>
    </SidebarGroup>
  );
}
