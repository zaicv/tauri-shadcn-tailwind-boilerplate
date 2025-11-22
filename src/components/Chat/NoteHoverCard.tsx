import { useEffect, useState, useRef } from "react";
import { ChevronDown, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Types
type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type NoteHoverCardProps = {
  chatInputRef: React.RefObject<HTMLTextAreaElement>;
  theme: "light" | "dark" | "system";
  onNoteClick: (note: { id: string; title: string; content: string }) => void; // NEW
  onMouseDown?: () => void; // 🔥 NEW
  onMouseUp?: () => void; // 🔥 NEW
  isHolding?: boolean; // 🔥 NEW
};

// Util: Fetch from localStorage
const getNotes = (): Note[] => {
  const stored = localStorage.getItem("luma_notes");
  return stored ? JSON.parse(stored) : [];
};

export default function NoteHoverCard({
  chatInputRef,
  theme,
  onNoteClick,
}: NoteHoverCardProps) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setNotes(getNotes());
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const noteContent = e.dataTransfer.getData("text/plain");
    if (chatInputRef.current) {
      chatInputRef.current.value += `\n\n📝 ${noteContent}`;
    }
  };

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <Button
            variant="ghost"
            className="text-xs px-2 py-1 border rounded-full"
          >
            <NotebookPen className="w-4 h-4 mr-1" />
            Notes
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </HoverCardTrigger>

        <HoverCardContent className="w-72 max-h-72 overflow-y-auto shadow-md rounded-xl p-3 space-y-2">
          {notes.length === 0 ? (
            <div className="text-gray-400 text-sm">No notes found.</div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                draggable
                onClick={() => onNoteClick(note)}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", note.content);
                }}
                className="border border-gray-200 dark:border-gray-700 p-3 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-move"
              >
                <div className="font-medium text-sm truncate">
                  {note.title || "Untitled"}
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {note.content.slice(0, 100) || "No content"}
                </div>
              </div>
            ))
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
