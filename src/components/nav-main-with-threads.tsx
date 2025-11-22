"use client";

import {
  ChevronRight,
  type LucideIcon,
  Pencil,
  Trash2,
  Edit3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { motion } from "framer-motion";
import {
  format,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from "date-fns";

type Thread = {
  id: string;
  name: string;
  date_modified?: string;
  created_at?: string;
};

type NavMainWithThreadsProps = {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  currentThreadId?: string;
  onThreadSelect?: (threadId: string) => void;
  onSidebarClose?: () => void;
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
    const date = new Date(thread.date_modified || thread.created_at || "");
    if (isToday(date)) groups["Today"].push(thread);
    else if (isYesterday(date)) groups["Yesterday"].push(thread);
    else if (isThisWeek(date)) groups["This Week"].push(thread);
    else if (isThisMonth(date)) groups["This Month"].push(thread);
    else groups["Older"].push(thread);
  });

  return groups;
}

export function NavMainWithThreads({
  items,
  currentThreadId,
  onThreadSelect,
  onSidebarClose,
}: NavMainWithThreadsProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [draftThreadNames, setDraftThreadNames] = useState<
    Record<string, string>
  >({});
  const [activePopoverThread, setActivePopoverThread] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) return;

    const { data, error } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("user_id", userId)
      .order("date_modified", { ascending: false });

    if (error) console.error("Error loading threads:", error);
    else setThreads(data || []);
  };

  const createNewThread = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) return;

    try {
      const { data: newThread, error } = await supabase
        .from("chat_threads")
        .insert([
          {
            user_id: userId,
            name: "New Chat",
            model: "Groq-LLaMA3-70B",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating new thread:", error);
        return;
      }

      setThreads((prev) => [newThread, ...prev]);
      navigate(`/chat/${newThread.id}`, { state: { threadId: newThread.id } });
      if (onSidebarClose) onSidebarClose();
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  const saveThreadName = async (threadId: string) => {
    const name = draftThreadNames[threadId]?.trim();
    if (!name) {
      setEditingThreadId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("chat_threads")
        .update({
          name,
          date_modified: new Date().toISOString(),
        })
        .eq("id", threadId);

      if (error) {
        console.error("Error updating thread name:", error.message);
      } else {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === threadId ? { ...thread, name } : thread
          )
        );
      }
    } catch (err) {
      console.error("Exception updating thread name:", err);
    } finally {
      setEditingThreadId(null);
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from("chat_threads")
        .delete()
        .eq("id", threadId);

      if (error) {
        console.error("Error deleting thread:", error.message);
      } else {
        setThreads((prev) => prev.filter((thread) => thread.id !== threadId));
        if (currentThreadId === threadId) {
          navigate("/chat");
        }
      }
    } catch (err) {
      console.error("Exception deleting thread:", err);
    }
  };

  const groupedThreads = groupThreadsByDate(threads);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.title === "Threads" || item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.title === "Threads" ? (
                    <>
                      {/* New Chat Button */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={createNewThread}
                          className="gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>New Chat</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>

                      {/* Threads List */}
                      {Object.entries(groupedThreads).map(
                        ([label, threadGroup]) =>
                          threadGroup.length > 0 && (
                            <div key={label}>
                              <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground tracking-wide select-none">
                                {label}
                              </div>
                              <div className="space-y-1">
                                {threadGroup.map((thread) => (
                                  <Popover
                                    key={thread.id}
                                    open={activePopoverThread === thread.id}
                                    onOpenChange={(open) => {
                                      if (!open) setActivePopoverThread(null);
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <div
                                        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 hover:bg-accent ${
                                          currentThreadId === thread.id
                                            ? "bg-accent font-medium"
                                            : ""
                                        }`}
                                        onContextMenu={(e) => {
                                          e.preventDefault();
                                          setActivePopoverThread(thread.id);
                                        }}
                                      >
                                        {editingThreadId === thread.id ? (
                                          <input
                                            type="text"
                                            className="w-full bg-transparent border-b border-gray-500 focus:outline-none text-sm"
                                            value={
                                              draftThreadNames[thread.id] || ""
                                            }
                                            onChange={(e) =>
                                              setDraftThreadNames((prev) => ({
                                                ...prev,
                                                [thread.id]: e.target.value,
                                              }))
                                            }
                                            onBlur={() =>
                                              saveThreadName(thread.id)
                                            }
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                saveThreadName(thread.id);
                                              } else if (e.key === "Escape") {
                                                setEditingThreadId(null);
                                              }
                                            }}
                                            autoFocus
                                          />
                                        ) : (
                                          <span
                                            className="flex-grow truncate text-sm cursor-pointer"
                                            onClick={() => {
                                              if (onThreadSelect) {
                                                onThreadSelect(thread.id);
                                              } else {
                                                navigate(`/chat/${thread.id}`);
                                              }
                                              if (onSidebarClose)
                                                onSidebarClose();
                                            }}
                                          >
                                            {thread.name || "Untitled Chat"}
                                          </span>
                                        )}
                                      </div>
                                    </PopoverTrigger>

                                    <PopoverContent
                                      align="top"
                                      side="right"
                                      className="w-48 rounded-xl shadow-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    >
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{
                                          duration: 0.15,
                                          ease: "easeOut",
                                        }}
                                        className="flex flex-col"
                                      >
                                        <button
                                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none text-gray-900 dark:text-gray-100"
                                          onClick={() => {
                                            setEditingThreadId(thread.id);
                                            setActivePopoverThread(null);
                                          }}
                                        >
                                          <Edit3 className="w-4 h-4 select-none" />
                                          Rename
                                        </button>
                                        <button
                                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                          onClick={() => {
                                            if (
                                              window.confirm(
                                                "Are you sure you want to delete this chat?"
                                              )
                                            ) {
                                              deleteThread(thread.id);
                                              setActivePopoverThread(null);
                                            }
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4 select-none" />
                                          Delete
                                        </button>
                                      </motion.div>
                                    </PopoverContent>
                                  </Popover>
                                ))}
                              </div>
                            </div>
                          )
                      )}
                    </>
                  ) : (
                    // Regular navigation items
                    item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))
                  )}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
