import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Home,
  ArrowLeft,
  ArrowRight,
  Grid3x3,
  List,
  Folder,
  File,
  Star,
  Clock,
  Download,
  Image as ImageIcon,
  Music,
  Video,
  Code,
  Archive,
  FileText,
  ChevronRight,
  Eye,
  Trash2,
  Copy,
  Share2,
  Tag,
  MoreHorizontal,
  X,
  Maximize2,
  Minimize2,
  Columns3,
  Grid2x2,
  LayoutGrid,
  FolderOpen,
  HardDrive,
  Users,
  CloudIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  mode?: "directory" | "file";
  title?: string;
  initialPath?: string | null;
}

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modified?: number;
  extension?: string;
  icon?: string;
  color?: string;
}

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  type: "location" | "favorite" | "tag" | "device";
  color?: string;
}

type ViewMode = "icons" | "list" | "columns" | "gallery";
type SortBy = "name" | "size" | "modified" | "kind";

const getFileIcon = (file: FileItem, size: "sm" | "md" | "lg" = "md") => {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-16 h-16";
  
  if (file.type === "directory") {
    return <Folder className={`${sizeClass} text-[#5EB0EF]`} fill="currentColor" />;
  }

  const ext = file.extension?.toLowerCase();
  if (["jpg", "png", "gif", "svg", "webp", "jpeg"].includes(ext || ""))
    return <ImageIcon className={`${sizeClass} text-[#34C759]`} />;
  if (["mp3", "wav", "flac", "m4a", "aac"].includes(ext || ""))
    return <Music className={`${sizeClass} text-[#AF52DE]`} />;
  if (["mp4", "avi", "mkv", "mov", "webm"].includes(ext || ""))
    return <Video className={`${sizeClass} text-[#FF453A]`} />;
  if (["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "go", "rs"].includes(ext || ""))
    return <Code className={`${sizeClass} text-[#FF9F0A]`} />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || ""))
    return <Archive className={`${sizeClass} text-[#FFD60A]`} />;
  if (["txt", "md", "doc", "docx", "pdf"].includes(ext || ""))
    return <FileText className={`${sizeClass} text-[#8E8E93]`} />;

  return <File className={`${sizeClass} text-[#8E8E93]`} />;
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "—";
  const sizes = ["bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today, " + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return "Yesterday, " + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const getFileKind = (file: FileItem): string => {
  if (file.type === "directory") return "Folder";
  const ext = file.extension?.toLowerCase();
  if (["jpg", "png", "gif", "svg", "webp", "jpeg"].includes(ext || "")) return `${ext?.toUpperCase()} Image`;
  if (["mp3", "wav", "flac", "m4a"].includes(ext || "")) return `${ext?.toUpperCase()} Audio`;
  if (["mp4", "avi", "mkv", "mov"].includes(ext || "")) return `${ext?.toUpperCase()} Video`;
  if (["js", "ts", "py", "java"].includes(ext || "")) return `${ext?.toUpperCase()} Source Code`;
  if (["txt", "md"].includes(ext || "")) return "Plain Text";
  if (ext) return `${ext.toUpperCase()} Document`;
  return "Document";
};

export const FileModal: React.FC<FileModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mode = "directory",
  title = "Finder",
  initialPath = null,
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath || "/");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("icons");
  const [history, setHistory] = useState<string[]>([initialPath || "/"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [columnPaths, setColumnPaths] = useState<string[]>([initialPath || "/"]);
  const [columnFiles, setColumnFiles] = useState<Record<string, FileItem[]>>({});
  const [showHidden, setShowHidden] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file?: FileItem } | null>(null);
  const [quickLookFile, setQuickLookFile] = useState<FileItem | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  const API_BASE = "https://100.83.147.76:8003";
  const fileListRef = useRef<HTMLDivElement>(null);
  const lastClickRef = useRef<{ path: string; time: number } | null>(null);

  const sidebarItems: SidebarItem[] = [
    {
      name: "Favorites",
      path: "",
      icon: <Star className="w-4 h-4 text-[#FFD60A]" fill="currentColor" />,
      type: "location",
    },
    {
      name: "Recents",
      path: "",
      icon: <Clock className="w-4 h-4 text-[#8E8E93]" />,
      type: "location",
    },
    {
      name: "Desktop",
      path: "/Users/zaibriggs/Desktop",
      icon: <FolderOpen className="w-4 h-4 text-[#5EB0EF]" />,
      type: "location",
    },
    {
      name: "Documents",
      path: "/Users/zaibriggs/Documents",
      icon: <FileText className="w-4 h-4 text-[#5EB0EF]" />,
      type: "location",
    },
    {
      name: "Downloads",
      path: "/Users/zaibriggs/Downloads",
      icon: <Download className="w-4 h-4 text-[#5EB0EF]" />,
      type: "location",
    },
    {
      name: "Applications",
      path: "/Applications",
      icon: <Grid2x2 className="w-4 h-4 text-[#5EB0EF]" />,
      type: "location",
    },
    {
      name: "Home",
      path: "/Users/zaibriggs",
      icon: <Home className="w-4 h-4 text-[#5EB0EF]" />,
      type: "location",
    },
    {
      name: "Computer",
      path: "/",
      icon: <HardDrive className="w-4 h-4 text-[#8E8E93]" />,
      type: "device",
    },
  ];

  const loadDirectory = useCallback(
    async (path: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/superpowers/file_ops/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: "list_files",
              kwargs: { directory: path, show_hidden: showHidden },
            }),
          }
        );

        const data = await response.json();
        if (data.result?.success) {
          const processedFiles = data.result.files.map((file: any) => ({
            ...file,
            extension: file.type === "file" ? file.name.split(".").pop() : undefined,
          }));

          const sorted = sortFiles(processedFiles, sortBy, sortOrder);
          setFiles(sorted);
          
          // Update column files if in column view
          if (viewMode === "columns") {
            setColumnFiles(prev => ({ ...prev, [path]: sorted }));
          }
        }
      } catch (err) {
        console.error("Failed to load directory:", err);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortOrder, showHidden, viewMode]
  );

  const sortFiles = (files: FileItem[], sortBy: SortBy, sortOrder: "asc" | "desc") => {
    const sorted = [...files].sort((a, b) => {
      // Always put directories first
            if (a.type === "directory" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "directory") return 1;

            let comparison = 0;
            switch (sortBy) {
              case "size":
                comparison = (a.size || 0) - (b.size || 0);
                break;
              case "modified":
                comparison = (a.modified || 0) - (b.modified || 0);
                break;
        case "kind":
          comparison = getFileKind(a).localeCompare(getFileKind(b));
          break;
              default:
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
            }
            return sortOrder === "asc" ? comparison : -comparison;
          });
    return sorted;
  };

  const navigateTo = useCallback(
    (path: string, addToHistory = true) => {
      setCurrentPath(path);
      loadDirectory(path);

      if (addToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== path) {
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        }
      }

      // Update column paths if in column view
      if (viewMode === "columns") {
        const pathParts = path.split("/").filter(Boolean);
        const newColumnPaths = ["/"];
        let currentPath = "";
        pathParts.forEach(part => {
          currentPath += "/" + part;
          newColumnPaths.push(currentPath);
        });
        setColumnPaths(newColumnPaths);
        
        // Load files for each column
        newColumnPaths.forEach(colPath => {
          if (!columnFiles[colPath]) {
            loadDirectory(colPath);
          }
        });
      }
    },
    [history, historyIndex, viewMode, columnFiles, loadDirectory]
  );

  const navigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigateTo(history[newIndex], false);
    }
  };

  const navigateForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigateTo(history[newIndex], false);
    }
  };

  const navigateUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
    navigateTo(parent);
  };

  const handleFileClick = (file: FileItem, event: React.MouseEvent) => {
    const now = Date.now();
    const isDoubleClick = lastClickRef.current && 
      lastClickRef.current.path === file.path && 
      now - lastClickRef.current.time < 300;

    if (isDoubleClick) {
      // Double click - open folder or select file
      if (file.type === "directory") {
        navigateTo(file.path);
      } else {
        onSelect(file.path);
        onClose();
      }
      lastClickRef.current = null;
    } else {
      // Single click - select
      lastClickRef.current = { path: file.path, time: now };
      
      if (event.metaKey || event.ctrlKey) {
        // Cmd/Ctrl + Click - toggle selection
        setSelectedPaths(prev => 
          prev.includes(file.path) 
            ? prev.filter(p => p !== file.path)
            : [...prev, file.path]
        );
      } else if (event.shiftKey && selectedPaths.length > 0) {
        // Shift + Click - range selection
        const lastSelected = selectedPaths[selectedPaths.length - 1];
        const lastIndex = files.findIndex(f => f.path === lastSelected);
        const currentIndex = files.findIndex(f => f.path === file.path);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const range = files.slice(start, end + 1).map(f => f.path);
        setSelectedPaths(range);
      } else {
        // Regular click - single selection
        setSelectedPaths([file.path]);
      }
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        e.preventDefault();
        handleArrowNavigation(e.key);
        break;
      case "Enter":
        e.preventDefault();
        handleEnterKey();
        break;
      case " ":
        e.preventDefault();
        if (selectedPaths.length === 1) {
          const file = files.find(f => f.path === selectedPaths[0]);
          if (file) setQuickLookFile(file);
        }
        break;
      case "Escape":
        if (quickLookFile) {
          setQuickLookFile(null);
        } else if (searchTerm) {
          setSearchTerm("");
        }
        break;
      case "Backspace":
        if (!searchTerm && e.metaKey) {
          e.preventDefault();
          // Cmd+Backspace - delete
        } else if (!searchTerm) {
          e.preventDefault();
          navigateUp();
        }
        break;
    }

    // Cmd+Arrow shortcuts
    if (e.metaKey) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateUp();
      } else if (e.key === "ArrowDown" && selectedPaths.length === 1) {
        e.preventDefault();
        handleEnterKey();
      } else if (e.key === "[") {
        e.preventDefault();
        navigateBack();
      } else if (e.key === "]") {
        e.preventDefault();
        navigateForward();
      }
    }
  }, [isOpen, selectedPaths, files, searchTerm, quickLookFile]);

  const handleArrowNavigation = (key: string) => {
    if (files.length === 0) return;

    const currentIndex = selectedPaths.length > 0 
      ? files.findIndex(f => f.path === selectedPaths[0])
      : -1;

    let newIndex = currentIndex;

    switch (key) {
      case "ArrowUp":
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case "ArrowDown":
        newIndex = Math.min(files.length - 1, currentIndex + 1);
        break;
      case "ArrowLeft":
        navigateUp();
        return;
      case "ArrowRight":
        if (currentIndex >= 0 && files[currentIndex].type === "directory") {
          navigateTo(files[currentIndex].path);
        }
        return;
    }

    if (newIndex >= 0 && newIndex < files.length) {
      setSelectedPaths([files[newIndex].path]);
      // Scroll into view
      const element = document.querySelector(`[data-file-path="${files[newIndex].path}"]`);
      element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  const handleEnterKey = () => {
    if (selectedPaths.length === 1) {
      const file = files.find(f => f.path === selectedPaths[0]);
      if (file) {
        if (file.type === "directory") {
          navigateTo(file.path);
        } else {
          onSelect(file.path);
          onClose();
        }
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file?: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  useEffect(() => {
    if (isOpen) {
      navigateTo(initialPath || currentPath);
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  useEffect(() => {
    if (viewMode === "columns" && currentPath) {
      const pathParts = currentPath.split("/").filter(Boolean);
      const newColumnPaths = ["/"];
      let path = "";
      pathParts.forEach(part => {
        path += "/" + part;
        newColumnPaths.push(path);
      });
      setColumnPaths(newColumnPaths);
    }
  }, [viewMode, currentPath]);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const IconsView = ({ items }: { items: FileItem[] }) => (
    <div className="p-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-6">
      {items.map((file) => (
        <div
          key={file.path}
            data-file-path={file.path}
            className={`flex flex-col items-center cursor-pointer group transition-all ${
              selectedPaths.includes(file.path)
                ? "bg-blue-500/20 rounded-lg"
                : ""
            }`}
            onClick={(e) => handleFileClick(file, e)}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            <div className={`p-3 rounded-lg transition-all ${
              selectedPaths.includes(file.path) 
                ? "bg-blue-500/30" 
                : "group-hover:bg-gray-100/50"
            }`}>
              {getFileIcon(file, "lg")}
          </div>
            <div className={`mt-2 text-xs text-center max-w-full px-2 py-1 rounded ${
              selectedPaths.includes(file.path)
                ? "bg-blue-500 text-white"
                : "text-gray-700"
            }`}>
              <div className="truncate">{file.name}</div>
            </div>
        </div>
      ))}
      </div>
    </div>
  );

  const ListView = ({ items }: { items: FileItem[] }) => (
    <div className="flex flex-col">
      <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2 grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
        <div 
          className="col-span-5 flex items-center cursor-pointer hover:text-gray-900"
          onClick={() => {
            if (sortBy === "name") {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy("name");
              setSortOrder("asc");
            }
          }}
        >
          Name {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
        </div>
        <div
          className="col-span-2 cursor-pointer hover:text-gray-900"
          onClick={() => {
            if (sortBy === "modified") {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy("modified");
              setSortOrder("asc");
            }
          }}
        >
          Date Modified {sortBy === "modified" && (sortOrder === "asc" ? "▲" : "▼")}
        </div>
        <div
          className="col-span-2 cursor-pointer hover:text-gray-900"
          onClick={() => {
            if (sortBy === "size") {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy("size");
              setSortOrder("asc");
            }
          }}
        >
          Size {sortBy === "size" && (sortOrder === "asc" ? "▲" : "▼")}
        </div>
        <div 
          className="col-span-3 cursor-pointer hover:text-gray-900"
          onClick={() => {
            if (sortBy === "kind") {
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            } else {
              setSortBy("kind");
              setSortOrder("asc");
            }
          }}
        >
          Kind {sortBy === "kind" && (sortOrder === "asc" ? "▲" : "▼")}
        </div>
      </div>
      {items.map((file) => (
        <div
          key={file.path}
          data-file-path={file.path}
          className={`px-4 py-2 grid grid-cols-12 gap-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50 ${
            selectedPaths.includes(file.path)
              ? "bg-blue-500/10 border-l-4 border-l-blue-500"
              : ""
          }`}
          onClick={(e) => handleFileClick(file, e)}
          onContextMenu={(e) => handleContextMenu(e, file)}
        >
          <div className="col-span-5 flex items-center space-x-3 min-w-0">
            {getFileIcon(file, "sm")}
            <span className="text-sm text-gray-900 truncate">{file.name}</span>
          </div>
          <div className="col-span-2 text-sm text-gray-600">
            {file.modified ? formatDate(file.modified) : "—"}
          </div>
          <div className="col-span-2 text-sm text-gray-600">
            {file.type === "directory" ? "—" : formatFileSize(file.size || 0)}
          </div>
          <div className="col-span-3 text-sm text-gray-600">
            {getFileKind(file)}
          </div>
        </div>
      ))}
    </div>
  );

  const ColumnsView = () => {
    useEffect(() => {
      columnPaths.forEach(path => {
        if (!columnFiles[path]) {
          loadDirectory(path);
        }
      });
    }, [columnPaths]);

    return (
      <div className="flex h-full overflow-x-auto">
        {columnPaths.map((path, colIndex) => {
          const colFiles = columnFiles[path] || [];
          const nextPath = columnPaths[colIndex + 1];
          
          return (
            <div
              key={path}
              className="min-w-[250px] border-r border-gray-200 flex-shrink-0"
            >
              <div className="h-full overflow-y-auto">
                {colFiles.map((file) => {
                  const isSelected = file.path === nextPath || selectedPaths.includes(file.path);
                  
                  return (
                    <div
                      key={file.path}
                      data-file-path={file.path}
                      className={`px-4 py-2 flex items-center space-x-3 cursor-pointer transition-colors border-b border-gray-100 ${
                        isSelected
                          ? "bg-blue-500/10"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={(e) => {
                        handleFileClick(file, e);
                        if (file.type === "directory") {
                          const newColumnPaths = columnPaths.slice(0, colIndex + 1);
                          newColumnPaths.push(file.path);
                          setColumnPaths(newColumnPaths);
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                    >
                      {getFileIcon(file, "sm")}
                      <span className="text-sm text-gray-900 truncate flex-1">
                        {file.name}
                      </span>
                      {file.type === "directory" && (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
          </div>
                  );
                })}
          </div>
            </div>
          );
        })}
      </div>
    );
  };

  const GalleryView = ({ items }: { items: FileItem[] }) => (
    <div className="p-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {items.map((file) => (
          <div
            key={file.path}
            data-file-path={file.path}
            className={`rounded-xl overflow-hidden cursor-pointer group transition-all shadow-sm hover:shadow-md ${
              selectedPaths.includes(file.path)
                ? "ring-4 ring-blue-500"
                : "ring-1 ring-gray-200"
            }`}
            onClick={(e) => handleFileClick(file, e)}
            onContextMenu={(e) => handleContextMenu(e, file)}
          >
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              {getFileIcon(file, "lg")}
            </div>
            <div className="p-3 bg-white">
              <div className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {file.type === "directory" ? "Folder" : formatFileSize(file.size || 0)}
              </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );

  const pathSegments = currentPath.split("/").filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`${
          isMaximized ? "max-w-full h-screen" : "max-w-7xl h-[85vh]"
        } flex flex-col p-0 bg-white border border-gray-300 shadow-2xl rounded-xl overflow-hidden transition-all`}
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* macOS-style Title Bar */}
        <div className="h-12 bg-gradient-to-b from-gray-100 to-gray-50 border-b border-gray-300 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-[#FF5F57] hover:bg-[#FF5F57]/80 transition-colors"
            />
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FFBD2E]/80 transition-colors"
            />
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-3 h-3 rounded-full bg-[#28CA42] hover:bg-[#28CA42]/80 transition-colors"
            />
          </div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
          <div className="w-16" />
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateBack}
                disabled={historyIndex === 0}
                className="h-8 px-2 hover:bg-gray-100 disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateForward}
                disabled={historyIndex === history.length - 1}
                className="h-8 px-2 hover:bg-gray-100 disabled:opacity-30"
              >
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </Button>
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("icons")}
                className={`h-7 px-2 ${viewMode === "icons" ? "bg-white shadow-sm" : ""}`}
                title="Icons"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 px-2 ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
                title="List"
              >
                  <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("columns")}
                className={`h-7 px-2 ${viewMode === "columns" ? "bg-white shadow-sm" : ""}`}
                title="Columns"
              >
                <Columns3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("gallery")}
                className={`h-7 px-2 ${viewMode === "gallery" ? "bg-white shadow-sm" : ""}`}
                title="Gallery"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-gray-100"
                title="Share"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-gray-100"
                title="Tags"
              >
                <Tag className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-gray-100"
                title="More"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
            </div>

          {/* Path Bar and Search */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 flex items-center space-x-1 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo("/")}
                className="h-6 px-2 text-xs hover:bg-gray-200/50"
              >
                ~
              </Button>
              {pathSegments.map((segment, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigateTo("/" + pathSegments.slice(0, index + 1).join("/"))
                    }
                    className="h-6 px-2 text-xs hover:bg-gray-200/50"
                  >
                    {segment}
                  </Button>
                </React.Fragment>
              ))}
            </div>

            <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
                placeholder="Search"
              value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 bg-gray-100 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <motion.div 
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            className="w-52 bg-gray-50/80 backdrop-blur-xl border-r border-gray-200 overflow-y-auto"
          >
            <div className="p-3 space-y-1">
              {/* Favorites Section */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                  Favorites
                  </div>
                {sidebarItems.filter(item => item.type === "location").slice(0, 2).map((item) => (
                      <button
                    key={item.name}
                    onClick={() => item.path && navigateTo(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-1.5 text-sm rounded-md transition-all ${
                          currentPath === item.path
                        ? "bg-blue-100/80 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100/80"
                        }`}
                      >
                        {item.icon}
                        <span className="truncate">{item.name}</span>
                      </button>
                    ))}
                </div>

              {/* Locations Section */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                  Locations
                </div>
                {sidebarItems.filter(item => item.type === "location").slice(2).map((item) => (
                  <button
                    key={item.name}
                    onClick={() => item.path && navigateTo(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-1.5 text-sm rounded-md transition-all ${
                      currentPath === item.path
                        ? "bg-blue-100/80 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100/80"
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </button>
              ))}
            </div>

              {/* Devices Section */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                  Devices
          </div>
                {sidebarItems.filter(item => item.type === "device").map((item) => (
                  <button
                    key={item.name}
                    onClick={() => item.path && navigateTo(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-1.5 text-sm rounded-md transition-all ${
                      currentPath === item.path
                        ? "bg-blue-100/80 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100/80"
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div ref={fileListRef} className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
                    <div className="text-gray-500 text-sm">Loading...</div>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Folder className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <div className="text-gray-500 text-lg font-medium">
                      {searchTerm ? "No matching files" : "This folder is empty"}
                    </div>
                  </div>
                </div>
              ) : viewMode === "icons" ? (
                <IconsView items={filteredFiles} />
              ) : viewMode === "list" ? (
                <ListView items={filteredFiles} />
              ) : viewMode === "columns" ? (
                <ColumnsView />
              ) : (
                <GalleryView items={filteredFiles} />
              )}
        </div>

            {/* Status Bar */}
            <div className="h-6 bg-gray-50 border-t border-gray-200 px-4 flex items-center justify-between text-xs text-gray-600">
              <div>{filteredFiles.length} items</div>
              {selectedPaths.length > 0 && (
                <div>{selectedPaths.length} selected</div>
              )}
            </div>
            </div>
          </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-gray-600 font-mono truncate max-w-[60%]">
            {selectedPaths.length > 0 ? selectedPaths[0] : currentPath}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-8 px-4 text-sm border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedPaths.length > 0) {
                  onSelect(selectedPaths[0]);
                  onClose();
                } else {
                  onSelect(currentPath);
                  onClose();
                }
              }}
              disabled={mode === "file" && selectedPaths.length === 0}
              className="h-8 px-4 text-sm bg-blue-500 hover:bg-blue-600 text-white"
            >
              Select
            </Button>
          </div>
        </div>

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-[9999] bg-white/95 backdrop-blur-xl border border-gray-300 rounded-lg shadow-2xl overflow-hidden min-w-[200px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-blue-500 hover:text-white flex items-center space-x-3 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span>Quick Look</span>
                  <span className="ml-auto text-xs opacity-60">Space</span>
                </button>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-blue-500 hover:text-white flex items-center space-x-3 transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-blue-500 hover:text-white flex items-center space-x-3 transition-colors">
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                  <span className="ml-auto text-xs opacity-60">⌘C</span>
                </button>
                <div className="h-px bg-gray-200 my-1" />
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-blue-500 hover:text-white flex items-center space-x-3 transition-colors">
                  <Tag className="w-4 h-4" />
                  <span>Tags...</span>
                </button>
                <div className="h-px bg-gray-200 my-1" />
                <button className="w-full px-4 py-2 text-sm text-left hover:bg-red-500 hover:text-white flex items-center space-x-3 transition-colors text-red-600">
                  <Trash2 className="w-4 h-4" />
                  <span>Move to Trash</span>
                  <span className="ml-auto text-xs opacity-60">⌘⌫</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Look Panel */}
        <AnimatePresence>
          {quickLookFile && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                onClick={() => setQuickLookFile(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-12"
                onClick={() => setQuickLookFile(null)}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(quickLookFile, "md")}
                      <div>
                        <div className="font-semibold text-gray-900">{quickLookFile.name}</div>
                        <div className="text-xs text-gray-500">
                          {getFileKind(quickLookFile)} • {formatFileSize(quickLookFile.size || 0)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickLookFile(null)}
                      className="hover:bg-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="p-12 flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100">
                    {getFileIcon(quickLookFile, "lg")}
                  </div>
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Modified</div>
                        <div className="text-gray-900">
                          {quickLookFile.modified ? formatDate(quickLookFile.modified) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Size</div>
                        <div className="text-gray-900">
                          {formatFileSize(quickLookFile.size || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

