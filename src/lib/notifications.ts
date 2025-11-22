import React from "react";
import { toast } from "sonner";
import { 
  Download, 
  Disc, 
  Play, 
  Search, 
  Calculator, 
  Folder, 
  Heart, 
  BookOpen,
  Zap,
  CheckCircle,
  XCircle
} from "lucide-react";

// Superpower icon and display name mapping
const getSuperpowerIcon = (superpower: string) => {
  const iconMap: Record<string, any> = {
    "youtube": Download,
    "ripdisc": Disc,
    "plex": Play,
    "Web Search": Search,
    "Wolfram Alpha": Calculator,
    "file_ops": Folder,
    "Health Log": Heart,
    "Notion Deep Memory": BookOpen,
  };
  return iconMap[superpower] || Zap;
};

const getSuperpowerDisplayName = (superpower: string) => {
  const nameMap: Record<string, string> = {
    "youtube": "YouTube Downloader",
    "ripdisc": "RipDisc",
    "plex": "Plex",
    "Web Search": "Web Search",
    "Wolfram Alpha": "Wolfram Alpha",
    "file_ops": "File Operations",
    "Health Log": "Health Log",
    "Notion Deep Memory": "Notion",
  };
  return nameMap[superpower] || superpower;
};

// Easy notification helpers for different types of events
export const notify = {
  // Tool execution notifications
  tool: {
    success: (superpower: string, message: string) => {
      const Icon = getSuperpowerIcon(superpower);
      const displayName = getSuperpowerDisplayName(superpower);
      return toast.success(message, {
        description: displayName,
        icon: React.createElement(Icon, { className: "w-4 h-4" }),
        duration: 4000,
      });
    },
    error: (superpower: string, message: string) => {
      const Icon = getSuperpowerIcon(superpower);
      const displayName = getSuperpowerDisplayName(superpower);
      return toast.error(message, {
        description: displayName,
        icon: React.createElement(Icon, { className: "w-4 h-4" }),
        duration: 5000,
      });
    },
  },
  // Memory-related notifications
  memory: {
    saved: () =>
      toast.success("Memory saved", {
        description: "Successfully stored in knowledge base",
      }),
    deleted: () =>
      toast.success("Memory deleted", {
        description: "Removed from knowledge base",
      }),
    error: () =>
      toast.error("Memory error", { description: "Failed to process memory" }),
    updated: () =>
      toast.success("Memory updated", {
        description: "Changes saved successfully",
      }),
  },

  // Download notifications
  download: {
    started: (filename: string) =>
      toast.info("Download started", { description: filename }),
    completed: (filename: string) =>
      toast.success("Download complete", { description: filename }),
    failed: (filename: string) =>
      toast.error("Download failed", { description: filename }),
    progress: (filename: string, progress: number) =>
      toast.loading(`Downloading ${filename}`, {
        description: `${progress}% complete`,
      }),
  },

  // Persona notifications
  persona: {
    changed: (name: string) =>
      toast.success("Persona switched", { description: `Now using ${name}` }),
    created: (name: string) =>
      toast.success("Persona created", { description: name }),
    updated: (name: string) =>
      toast.success("Persona updated", { description: name }),
    deleted: (name: string) =>
      toast.success("Persona deleted", { description: name }),
  },

  // File operations
  file: {
    uploaded: (filename: string) =>
      toast.success("File uploaded", { description: filename }),
    deleted: (filename: string) =>
      toast.success("File deleted", { description: filename }),
    error: (filename: string) =>
      toast.error("File error", { description: filename }),
  },

  // General notifications
  success: (message: string, description?: string) =>
    toast.success(message, { description }),
  error: (message: string, description?: string) =>
    toast.error(message, { description }),
  info: (message: string, description?: string) =>
    toast.info(message, { description }),
  loading: (message: string, description?: string) =>
    toast.loading(message, { description }),
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages),
};
