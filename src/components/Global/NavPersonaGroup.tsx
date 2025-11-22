import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Star } from "lucide-react";

export function NavPersonaGroup({ persona, onThreadSelect, currentThreadId }) {
  const [open, setOpen] = useState(true);

  const pinned = persona.threads.filter(t => t.pinned);
  const others = persona.threads.filter(t => !t.pinned);

  return (
    <div className="mb-2">
      {/* Persona header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-2 py-1 text-sm font-medium hover:bg-accent rounded-md"
      >
        <span>{persona.name}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Threads list */}
      {open && (
        <div className="ml-3 mt-1 space-y-1">
          {pinned.length > 0 && (
            <div>
              {pinned.map(thread => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  active={thread.id === currentThreadId}
                  onClick={() => onThreadSelect?.(thread.id)}
                />
              ))}
              <div className="border-t my-1" />
            </div>
          )}

          {others.map(thread => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              active={thread.id === currentThreadId}
              onClick={() => onThreadSelect?.(thread.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThreadItem({ thread, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-2 py-1 text-sm rounded-md cursor-pointer hover:bg-accent ${
        active ? "bg-accent font-medium" : ""
      }`}
    >
      <span className="truncate">{thread.title}</span>
      <MoreHorizontal size={14} className="text-muted-foreground" />
    </div>
  );
}