import React, { useState, useEffect } from "react";
import { X, Bell, Loader2, Check, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const ControlCenterDrawer = () => {
  const { isDark } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memoriesExpanded, setMemoriesExpanded] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "System Update",
      description: "Glow AI updated to v2.1",
      time: "2m ago",
    },
    {
      id: 2,
      title: "Memory Sync",
      description: "Cloud sync completed",
      time: "1h ago",
    },
  ]);

  const [backgroundTasks, setBackgroundTasks] = useState([
    {
      id: 1,
      label: "The Avengers (2012) Blu-ray Rip",
      status: "running",
      progress: 67,
    },
    {
      id: 2,
      label: "Comics Explained - YouTube Download",
      status: "running",
      progress: 42,
    },
    {
      id: 3,
      label: "The Flash Season 2 → PlexServer",
      status: "running",
      progress: 89,
    },
  ]);

  const retrievedMemories = [
    {
      id: 1,
      name: "User prefers dark mode",
      content: "Consistently uses dark theme across sessions",
      similarity: 0.92,
    },
    {
      id: 2,
      name: "Marvel fan",
      content: "Frequently rips Marvel movies",
      similarity: 0.85,
    },
    {
      id: 3,
      name: "Plex server setup",
      content: "Has external HDD for media storage",
      similarity: 0.78,
    },
    {
      id: 4,
      name: "YouTube content",
      content: "Watches Comics Explained channel",
      similarity: 0.65,
    },
    {
      id: 5,
      name: "File organization",
      content: "Prefers organized media library",
      similarity: 0.55,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundTasks((prev) =>
        prev.map((task) => {
          if (task.status === "running" && task.progress < 100) {
            const newProgress = Math.min(
              task.progress + Math.random() * 3,
              100
            );
            return {
              ...task,
              progress: newProgress,
              status: newProgress >= 100 ? "done" : "running",
            };
          }
          return task;
        })
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getMatchColor = (similarity: number) => {
    if (similarity >= 0.8) return "bg-emerald-500";
    if (similarity >= 0.5) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusStyles = (status: "running" | "queued" | "done" | "error") => {
    const styles: Record<"running" | "queued" | "done" | "error", string> = {
      running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      queued: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      error: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return styles[status] || styles.queued;
  };

  // Broadcast open state to the app for layout adjustments
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("control-center:openchange", {
        detail: { open: drawerOpen },
      })
    );
  }, [drawerOpen]);

  if (!drawerOpen) {
    return (
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Open Control Center"
        className="fixed top-4 right-12 z-50 p-2 rounded-full text-white hover:bg-white/10 transition-colors"
      >
        <Bell size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-none">
      {/* Transparent pass-through area; do not block clicks */}
      <div className="flex-1 pointer-events-none" />

      {/* Control Center Drawer */}
      <aside
        className="pointer-events-auto w-full sm:w-80 bg-[#0a0a0a] border-l border-white/[0.08] flex flex-col overflow-hidden"
        style={{
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="text-sm font-semibold text-white">Control Center</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 space-y-8">
          {/* Notifications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Notifications
              </h3>
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="group relative bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-3.5 transition-all cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-0.5">
                        {n.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {n.description}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 flex-shrink-0">
                      {n.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Background Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Background Tasks
              </h3>
            </div>
            <div className="space-y-3">
              {backgroundTasks.map((task) => (
                <div key={task.id} className="bg-white/[0.03] rounded-xl p-3.5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="text-sm font-medium text-white mb-1 truncate">
                        {task.label}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${getStatusStyles(
                            task.status as
                              | "running"
                              | "queued"
                              | "done"
                              | "error"
                          )}`}
                        >
                          {task.status === "running" && (
                            <Loader2 size={10} className="animate-spin" />
                          )}
                          {task.status === "done" && <Check size={10} />}
                          {task.status === "error" && <AlertCircle size={10} />}
                          {task.status}
                        </span>
                        {typeof task.progress === "number" && (
                          <span className="text-xs text-gray-500">
                            {Math.round(task.progress)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Memories */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Current Chat Memories
              </h3>
              <button
                onClick={() => setMemoriesExpanded(!memoriesExpanded)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                {memoriesExpanded ? "Collapse" : "Expand"}
              </button>
            </div>

            {memoriesExpanded && (
              <div className="space-y-0">
                {retrievedMemories.map((memory, idx) => (
                  <div
                    key={memory.id}
                    className="relative flex gap-3 pb-6 last:pb-0"
                  >
                    {/* Timeline line */}
                    {idx !== retrievedMemories.length - 1 && (
                      <div className="absolute left-[5px] top-[14px] bottom-0 w-px bg-white/[0.08]" />
                    )}

                    {/* Dot */}
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${getMatchColor(
                          memory.similarity
                        )} ring-4 ring-[#0a0a0a]`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <div className="text-sm font-medium text-white mb-0.5">
                        {memory.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-2">
                        {memory.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Available Superpowers */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Available Superpowers
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "youtube", label: "YouTube DL", icon: "📹" },
                { key: "file_ops", label: "File Ops", icon: "📁" },
                { key: "ripdisc", label: "Rip Disc", icon: "💿" },
                { key: "glowcloud", label: "Glow Cloud", icon: "☁️" },
              ].map((sp) => (
                <button
                  key={sp.key}
                  className="bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-3 text-left transition-all group"
                >
                  <div className="text-xl mb-1">{sp.icon}</div>
                  <div className="text-xs font-medium text-white group-hover:text-blue-400 transition-colors">
                    {sp.label}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Glow Orb - Fixed at bottom */}
        <div className="border-t border-white/[0.08] p-6 flex justify-center bg-[#0a0a0a]">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 animate-pulse cursor-pointer hover:scale-110 transition-transform"
              style={{
                boxShadow:
                  "0 0 40px rgba(139, 92, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.4)",
              }}
            />
          </div>
        </div>
      </aside>

      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
};

export default ControlCenterDrawer;
