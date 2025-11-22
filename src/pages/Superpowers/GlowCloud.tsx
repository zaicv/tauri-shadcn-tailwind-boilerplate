import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Home,
  ArrowLeft,
  Search,
  MoreHorizontal,
  Copy,
  Scissors,
  Trash2,
  Edit,
  FolderPlus,
  Upload,
  Download,
  Grid,
  List,
  SortAsc,
  Filter,
  Move,
  X,
  Check,
  ArrowRight,
  FolderOpen,
  FileText,
  Play,
  Image,
  Music,
  Video,
  Eye,
  Volume2,
  FileType,
  MonitorPlay,
  Loader2,
  CheckCircle,
  AlertCircle,
  Cloud,
  Star,
  Send,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import { FileModal } from "@/components/Files/FileModal";
import { FileOpsSidebar } from "@/components/Files/FileOpsSidebar";
import mimetypes from "mime-types";

const FileExplorer = () => {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [moveMode, setMoveMode] = useState(false);
  const [cutItems, setCutItems] = useState(new Set());
  const [showTreeModal, setShowTreeModal] = useState(false);
  const [treeData, setTreeData] = useState({});
  const [expandedNodes, setExpandedNodes] = useState(new Set(["/"]));
  const [selectedTreePath, setSelectedTreePath] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState(new Set());
  const [dropTarget, setDropTarget] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [showMediaCollector, setShowMediaCollector] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const [completedFiles, setCompletedFiles] = useState(new Set());
  const [failedFiles, setFailedFiles] = useState(new Set());
  const [currentUploadingFile, setCurrentUploadingFile] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalMode, setFileModalMode] = useState("directory");
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);

  const contextRef = useRef(null);
  const editRef = useRef(null);
  const fileInputRef = useRef(null);
  const aiChatRef = useRef(null);

  const API_BASE = "https://100.83.147.76:8003";

  // File type detection
  const getFileType = (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v"].includes(ext))
      return "video";
    if (
      ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"].includes(ext)
    )
      return "image";
    if (["mp3", "wav", "flac", "aac", "ogg", "m4a", "wma"].includes(ext))
      return "audio";
    if (["pdf", "doc", "docx", "txt", "rtf"].includes(ext)) return "document";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
    return "file";
  };

  const getFileIcon = (file) => {
    const type = getFileType(file);
    const icons = {
      video: <Video className="w-5 h-5 text-red-500" />,
      image: <Image className="w-5 h-5 text-green-500" />,
      audio: <Music className="w-5 h-5 text-purple-500" />,
      document: <FileText className="w-5 h-5 text-blue-500" />,
      archive: <File className="w-5 h-5 text-yellow-500" />,
      file: <File className="w-5 h-5 text-gray-500" />,
    };
    return icons[type];
  };

  const callFileOps = async (intent, kwargs = {}) => {
    try {
      setError("");
      const response = await fetch(
        `${API_BASE}/api/superpowers/file_ops/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, kwargs }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API call failed");
      return data.result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1]; // Remove data:type;base64, prefix
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Enhanced upload with progress simulation
  const uploadFilesToServer = async () => {
    if (uploadFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadingFiles(new Set());
    setCompletedFiles(new Set());
    setFailedFiles(new Set());

    try {
      const totalFiles = uploadFiles.length;
      const results = [];

      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setCurrentUploadingFile(file.name);
        setUploadingFiles(new Set([file.name]));

        // Simulate file upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress((i * 100 + progress) / totalFiles);
          await new Promise((resolve) => setTimeout(resolve, 50)); // Smooth progress animation
        }

        try {
          // Convert file to base64
          const base64Content = await fileToBase64(file);

          // Upload using the file_ops superpower
          const result = await callFileOps("upload_base64_file", {
            filename: file.name,
            content: base64Content,
            directory: currentPath,
          });

          if (result.success) {
            setCompletedFiles((prev) => new Set([...prev, file.name]));
            results.push({ file: file.name, status: "success" });
          } else {
            setFailedFiles((prev) => new Set([...prev, file.name]));
            results.push({
              file: file.name,
              status: "error",
              error: result.error,
            });
          }
        } catch (err) {
          setFailedFiles((prev) => new Set([...prev, file.name]));
          results.push({
            file: file.name,
            status: "error",
            error: err.message,
          });
        }

        setUploadingFiles(new Set());
      }

      // Final progress
      setUploadProgress(100);
      setCurrentUploadingFile(null);

      // Show results
      const successful = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "error").length;

      if (successful > 0) {
        console.log(`✅ Successfully uploaded ${successful} files`);
      }
      if (failed > 0) {
        console.log(`❌ Failed to upload ${failed} files`);
      }

      // Auto-close after completion if all successful
      if (failed === 0) {
        setTimeout(() => {
          setUploadFiles([]);
          setShowUploadModal(false);
          loadDirectory();
        }, 1500);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed: " + err.message);
    } finally {
      if (completedFiles.size + failedFiles.size < uploadFiles.length) {
        // Only reset if not all files processed
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          setCurrentUploadingFile(null);
          setUploadingFiles(new Set());
        }, 1000);
      }
    }
  };

  const loadDirectory = async (path = currentPath) => {
    setLoading(true);
    try {
      const result = await callFileOps("list_files", {
        directory: path,
        show_hidden: false,
      });

      if (result.success) {
        const sortedFiles = [...result.files].sort((a, b) => {
          if (a.type === "directory" && b.type === "file") return -1;
          if (a.type === "file" && b.type === "directory") return 1;

          let aVal, bVal;

          switch (sortBy) {
            case "name":
              aVal = a.name.toLowerCase();
              bVal = b.name.toLowerCase();
              break;
            case "size":
              aVal = a.size || 0;
              bVal = b.size || 0;
              break;
            case "modified":
            case "dateModified":
              aVal = a.modified || 0;
              bVal = b.modified || 0;
              break;
            case "created":
            case "dateCreated":
              aVal = a.created || a.modified || 0;
              bVal = b.created || b.modified || 0;
              break;
            case "type":
              aVal = a.type === "directory" ? "0" : getFileType(a);
              bVal = b.type === "directory" ? "0" : getFileType(b);
              break;
            case "extension":
              aVal =
                a.type === "directory"
                  ? ""
                  : (a.name.split(".").pop() || "").toLowerCase();
              bVal =
                b.type === "directory"
                  ? ""
                  : (b.name.split(".").pop() || "").toLowerCase();
              break;
            default:
              aVal = a[sortBy];
              bVal = b[sortBy];
          }

          if (aVal === bVal) return 0;
          const comparison = aVal < bVal ? -1 : 1;
          return sortOrder === "asc" ? comparison : -comparison;
        });

        setFiles(sortedFiles);

        // Collect media files for preview
        const mediaTypes = ["video", "image", "audio"];
        const media = sortedFiles.filter(
          (file) =>
            file.type === "file" && mediaTypes.includes(getFileType(file))
        );
        setMediaFiles(media);
      }
    } catch (err) {
      console.error("Failed to load directory:", err);
    } finally {
      setLoading(false);
    }
  };

  const collectMediaFromDirectory = async (path = currentPath) => {
    try {
      const result = await callFileOps("list_files", { directory: path });
      if (result.success) {
        const allMedia = [];

        // Recursively collect media files
        const processFiles = async (files, currentPath) => {
          for (const file of files) {
            if (file.type === "directory") {
              try {
                const subResult = await callFileOps("list_files", {
                  directory: file.path,
                });
                if (subResult.success) {
                  await processFiles(subResult.files, file.path);
                }
              } catch (err) {
                console.error(`Failed to scan ${file.path}:`, err);
              }
            } else {
              const fileType = getFileType(file);
              if (["video", "image", "audio"].includes(fileType)) {
                allMedia.push({
                  ...file,
                  fileType,
                  relativePath: file.path.replace(path, ""),
                });
              }
            }
          }
        };

        await processFiles(result.files, path);
        setMediaFiles(allMedia);
        setShowMediaCollector(true);
      }
    } catch (err) {
      console.error("Failed to collect media:", err);
    }
  };

  const openPreview = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  // Enhanced download function with detailed debugging
  const downloadFile = async (file) => {
    console.log("🔍 [FRONTEND DEBUG] Starting download process...");
    console.log("🔍 [FRONTEND DEBUG] File object:", file);

    try {
      // First try to get download URL for direct HTTP download
      console.log("🔍 [FRONTEND DEBUG] Calling get_download_url...");

      const result = await callFileOps("get_download_url", {
        file_path: file.path,
      });

      console.log("🔍 [FRONTEND DEBUG] get_download_url result:", result);

      if (result.success) {
        console.log(
          "🔍 [FRONTEND DEBUG] Using direct download URL:",
          result.download_url
        );

        // Use the download URL for direct download
        const downloadUrl = `${API_BASE}${result.download_url}`;
        console.log("🔍 [FRONTEND DEBUG] Full download URL:", downloadUrl);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = file.name;
        link.style.display = "none";

        console.log("🔍 [FRONTEND DEBUG] Created download link:", {
          href: link.href,
          download: link.download,
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`✅ [FRONTEND DEBUG] Download started: ${file.name}`);
      } else {
        console.log(
          "🔍 [FRONTEND DEBUG] Direct download failed, trying base64 fallback..."
        );
        console.log(
          "🔍 [FRONTEND DEBUG] Error from get_download_url:",
          result.error
        );

        // Fallback to base64 download for smaller files
        const downloadResult = await callFileOps("download_file", {
          file_path: file.path,
        });

        console.log(
          "🔍 [FRONTEND DEBUG] download_file result:",
          downloadResult
        );

        if (downloadResult.success) {
          console.log("🔍 [FRONTEND DEBUG] Converting base64 to blob...");

          // Create blob from base64 and download
          const byteCharacters = atob(downloadResult.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: downloadResult.mime_type,
          });

          console.log("🔍 [FRONTEND DEBUG] Created blob:", {
            size: blob.size,
            type: blob.type,
          });

          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = file.name;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up object URL
          setTimeout(() => URL.revokeObjectURL(link.href), 100);

          console.log(
            `✅ [FRONTEND DEBUG] Base64 download completed: ${file.name}`
          );
        } else {
          console.error(
            "❌ [FRONTEND DEBUG] Base64 download failed:",
            downloadResult.error
          );
          throw new Error(downloadResult.error || "Download failed");
        }
      }
    } catch (err) {
      console.error("❌ [FRONTEND DEBUG] Download failed:", err);
      console.error("❌ [FRONTEND DEBUG] Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(`Download failed: ${err.message}`);
    }
  };

  // Simple file URL generation like audio
  const getFileUrl = (file) => {
    const encodedPath = encodeURIComponent(file.path);
    return `${API_BASE}/api/files/stream/${encodedPath}`;
  };

  const renderPreview = () => {
    if (!previewFile) return null;

    const fileType = getFileType(previewFile);
    const fileUrl = getFileUrl(previewFile);

    switch (fileType) {
      case "video":
        const ext = previewFile.name.split(".").pop()?.toLowerCase();
        const isMKV = ext === "mkv";
        return (
          <div className="w-full">
            <video
              src={fileUrl}
              controls
              className="w-full max-h-[70vh] rounded-lg"
              preload="metadata"
              crossOrigin="anonymous"
              playsInline
            >
              <source src={fileUrl} type={isMKV ? "video/x-matroska" : undefined} />
              Your browser does not support the video tag.
            </video>
            {isMKV && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Note: MKV playback may require browser codec support. If video doesn't play, try downloading the file.
              </p>
            )}
          </div>
        );

      case "image":
        return (
          <div className="text-center">
            <img
              src={fileUrl}
              alt={previewFile.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg mx-auto"
              onLoad={() => console.log("Image loaded successfully")}
              onError={(e) => {
                console.error("Image load error:", e);
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280'%3EFailed to load%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        );

      case "audio":
        return (
          <div className="p-8 text-center space-y-4">
            <Music className="w-24 h-24 mx-auto text-purple-500" />
            <h3 className="text-lg font-medium">{previewFile.name}</h3>
            <audio src={fileUrl} controls className="w-full max-w-md mx-auto" />
          </div>
        );

      case "document":
        if (previewFile.name.toLowerCase().endsWith(".pdf")) {
          return (
            <div className="w-full h-[70vh]">
              <iframe
                src={`${fileUrl}#view=FitH`}
                className="w-full h-full border-0 rounded-lg"
                title={previewFile.name}
                onLoad={() => console.log("PDF loaded successfully")}
                onError={() => console.error("PDF load error")}
              />
            </div>
          );
        }
        return (
          <div className="p-8 text-center">
            <FileText className="w-24 h-24 mx-auto mb-4 text-blue-400" />
            <p className="text-gray-500">Document preview not available</p>
            <p className="text-sm text-gray-400 mt-2">
              Click download to view the file
            </p>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <FileType className="w-24 h-24 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">
              Preview not available for this file type
            </p>
          </div>
        );
    }
  };

  const loadTreeData = async (path) => {
    try {
      const result = await callFileOps("list_files", { directory: path });
      if (result.success) {
        const dirs = result.files.filter((f) => f.type === "directory");
        setTreeData((prev) => ({ ...prev, [path]: dirs }));
      }
    } catch (err) {
      console.error("Failed to load tree data:", err);
    }
  };

  const navigateTo = (path) => {
    setCurrentPath(path);
    setSelectedItems(new Set());
    setMoveMode(false);
    setCutItems(new Set());

    // Add to recents
    setRecents((prev) => {
      const filtered = prev.filter((p) => p !== path);
      return [path, ...filtered].slice(0, 10);
    });
  };

  const navigateUp = () => {
    const parent = currentPath.split("/").slice(0, -1).join("/") || "/";
    navigateTo(parent);
  };

  const toggleSelection = (item, event: any = null) => {
    // Allow multi-select with Shift/Cmd/Ctrl modifier
    const isMultiSelect = event?.shiftKey || event?.metaKey || event?.ctrlKey;

    const newSelection = new Set(selectedItems);
    const itemKey = item.path;

    if (!isMultiSelect && !selectedItems.has(itemKey)) {
      // Single click without modifier: replace selection
      setSelectedItems(new Set([itemKey]));
      return;
    }

    // Multi-select or toggle
    if (newSelection.has(itemKey)) {
      newSelection.delete(itemKey);
    } else {
      newSelection.add(itemKey);
    }
    setSelectedItems(newSelection);
  };

  const handleDoubleClick = (item) => {
    if (item.type === "directory") {
      navigateTo(item.path);
    } else {
      const fileType = getFileType(item);
      if (["video", "image", "audio", "document"].includes(fileType)) {
        openPreview(item);
      } else {
        downloadFile(item);
      }
    }
  };

  const handleRightClick = (e, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: item,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const startEdit = (item) => {
    setEditingItem(item.path);
    setEditValue(item.name);
    closeContextMenu();
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const saveEdit = async (item) => {
    if (!editValue.trim() || editValue === item.name) {
      cancelEdit();
      return;
    }

    try {
      const newPath = `${currentPath}/${editValue}`.replace("//", "/");
      await callFileOps("rename_file", {
        old_name: item.path,
        new_name: newPath,
      });
      cancelEdit();
      loadDirectory();
    } catch (err) {
      console.error("Failed to rename:", err);
      cancelEdit();
    }
  };

  const createFolder = async () => {
    const name = prompt("Folder name:");
    if (!name) return;

    try {
      const folderPath = `${currentPath}/${name}`.replace("//", "/");
      await callFileOps("create_directory", { path: folderPath });
      loadDirectory();
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const deleteItems = async (items = selectedItems) => {
    if (items.size === 0) return;
    if (!confirm(`Delete ${items.size} item(s)?`)) return;

    try {
      for (const itemPath of items) {
        await callFileOps("delete_file", { path: itemPath });
      }
      setSelectedItems(new Set());
      loadDirectory();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const cutFiles = () => {
    if (selectedItems.size === 0) return;
    setCutItems(new Set(selectedItems));
    setMoveMode(true);
    closeContextMenu();
  };

  const pasteFiles = async () => {
    if (cutItems.size === 0) return;

    try {
      for (const itemPath of cutItems) {
        const fileName = itemPath.split("/").pop();
        const newPath = `${currentPath}/${fileName}`.replace("//", "/");

        if (itemPath !== newPath) {
          await callFileOps("move_file", {
            source: itemPath,
            destination: newPath,
          });
        }
      }

      setCutItems(new Set());
      setMoveMode(false);
      setSelectedItems(new Set());
      loadDirectory();
    } catch (err) {
      console.error("Failed to move files:", err);
    }
  };

  const showMoveToDialog = async () => {
    if (selectedItems.size === 0) return;
    setFileModalMode("directory");
    setShowFileModal(true);
    closeContextMenu();
  };

  const plexFolders = [
    { name: "Movies", path: "/Users/zai/Desktop/plex/Movies" },
    { name: "TV Shows", path: "/Users/zai/Desktop/plex/Tv Shows" },
    { name: "Kids Movies", path: "/Users/zai/Desktop/plex/Kids Movies" },
    { name: "Kids TV Shows", path: "/Users/zai/Desktop/plex/Kids TV Shows" },
    { name: "Music", path: "/Users/zai/Desktop/plex/Music" },
    { name: "Podcasts", path: "/Users/zai/Desktop/plex/Podcasts" },
    { name: "Home Movies", path: "/Users/zai/Desktop/plex/Home Movies" },
  ];

  const moveToPlexFolder = async (folderPath) => {
    if (!contextMenu?.item) return;
    await executeMoveToPath(folderPath);
    closeContextMenu();
  };

  const cancelMoveMode = () => {
    setMoveMode(false);
    setCutItems(new Set());
  };

  const toggleTreeNode = async (path) => {
    const newExpanded = new Set(expandedNodes);
    if (expandedNodes.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      if (!treeData[path]) {
        await loadTreeData(path);
      }
    }
    setExpandedNodes(newExpanded);
  };

  // Upload handling
  const handleFileUpload = (files) => {
    setUploadFiles(Array.from(files));
    setShowUploadModal(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileDragStart = (e, file) => {
    setDraggedFiles(new Set([file.path]));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleFolderDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFolderDrop = async (e, targetFolder) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedFiles.size === 0) return;

    try {
      for (const filePath of draggedFiles) {
        const fileName = filePath.split("/").pop();
        const newPath = `${targetFolder.path}/${fileName}`.replace("//", "/");

        if (filePath !== newPath) {
          await callFileOps("move_file", {
            source: filePath,
            destination: newPath,
          });
        }
      }

      setDraggedFiles(new Set());
      setDropTarget(null);
      loadDirectory();
    } catch (err) {
      console.error("Failed to move files:", err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unit = 0;

    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit++;
    }

    return `${size.toFixed(1)} ${units[unit]}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allFiles, setAllFiles] = useState([]);

  const collectAllFiles = async (directory = "/", collected = []) => {
    try {
      const result = await callFileOps("list_files", {
        directory: directory,
        show_hidden: false,
      });

      if (result.success) {
        for (const file of result.files) {
          collected.push(file);
          if (file.type === "directory") {
            await collectAllFiles(file.path, collected);
          }
        }
      }
    } catch (err) {
      console.error("Failed to collect files from", directory, err);
    }
    return collected;
  };

  const performGlobalSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use cached files if available, otherwise collect them
      let filesToSearch = allFiles;
      if (allFiles.length === 0) {
        filesToSearch = await collectAllFiles();
        setAllFiles(filesToSearch);
      }

      // Filter files by name containing search term
      const results = filesToSearch.filter((file) =>
        file.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(results);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredFiles = searchTerm
    ? searchResults
    : files.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const pathSegments = currentPath.split("/").filter(Boolean);

  // Render tree node recursively
  const renderTreeNode = (path, level = 0) => {
    const dirs = treeData[path] || [];
    const isExpanded = expandedNodes.has(path);
    const displayName = path === "/" ? "Home" : path.split("/").pop();
    const hasChildren = dirs.length > 0;

    return (
      <div key={path}>
        <div
          className={`flex items-center space-x-2 py-2 px-2 hover:bg-gray-100 cursor-pointer rounded transition-colors ${
            selectedTreePath === path ? "bg-blue-100 text-blue-700" : ""
          }`}
          style={{ marginLeft: `${level * 16}px` }}
          onClick={() => setSelectedTreePath(path)}
        >
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await toggleTreeNode(path);
            }}
            className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>
          <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm select-none truncate">{displayName}</span>
        </div>

        {isExpanded && dirs.map((dir) => renderTreeNode(dir.path, level + 1))}
      </div>
    );
  };

  const handleFileModalSelect = (path) => {
    if (fileModalMode === "directory" && selectedItems.size > 0) {
      // Move mode
      executeMoveToPath(path);
    } else {
      // Navigate mode
      navigateTo(path);
    }
    setShowFileModal(false);
  };

  const executeMoveToPath = async (targetPath) => {
    if (!targetPath || selectedItems.size === 0) return;

    try {
      for (const itemPath of selectedItems) {
        const fileName = itemPath.split("/").pop();
        const newPath = `${targetPath}/${fileName}`.replace("//", "/");

        if (itemPath !== newPath) {
          await callFileOps("move_file", {
            source: itemPath,
            destination: newPath,
          });
        }
      }

      setSelectedItems(new Set());
      loadDirectory();
    } catch (err) {
      console.error("Failed to move files:", err);
    }
  };

  const openFileModal = (mode = "directory") => {
    setFileModalMode(mode);
    setShowFileModal(true);
  };

  const toggleFavorite = (path) => {
    setFavorites((prev) =>
      prev.includes(path) ? prev.filter((fav) => fav !== path) : [...prev, path]
    );
  };

  // AI Chat handler
  const handleAIChat = async (message) => {
    if (!message.trim()) return;

    // Get selected files
    const selectedFilesList = Array.from(selectedItems)
      .map((path) => files.find((f) => f.path === path))
      .filter(Boolean);

    // Build enriched message with file context
    let enrichedMessage = message;
    if (selectedFilesList.length > 0) {
      const fileList = selectedFilesList
        .map((f) => `- ${f.name} (${f.type})`)
        .join("\n");
      const filePaths = selectedFilesList.map((f) => f.path).join("\n");
      enrichedMessage = `User has selected ${selectedFilesList.length} file(s) in directory "${currentPath}":\n\n${fileList}\n\nFile paths:\n${filePaths}\n\nUser's request: ${message}`;
    } else {
      enrichedMessage = `Current directory: "${currentPath}"\n\nUser's request: ${message}`;
    }

    // Add user message
    const userMsg = { id: Date.now(), sender: "user", text: message };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiChatInput("");
    setAiChatLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: enrichedMessage,
          model: "Gemini",
          useMistral: true,
          thread_id: "glowcloud_ai",
          user_id: "glowcloud_user",
        }),
      });

      const data = await response.json();
      const reply = data.response || "Sorry, I couldn't process that request.";

      // Add assistant message
      const assistantMsg = { id: Date.now(), sender: "assistant", text: reply };
      setAiChatMessages((prev) => [...prev, assistantMsg]);

      // Refresh directory if operation succeeded
      if (
        reply.includes("successfully") ||
        reply.includes("✓") ||
        reply.includes("✅")
      ) {
        setTimeout(() => loadDirectory(), 500);
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      const errorMsg = {
        id: Date.now(),
        sender: "assistant",
        text: `Error: ${err.message || "Connection failed"}`,
      };
      setAiChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAiChatLoading(false);
    }
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (contextRef.current && !contextRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Auto-scroll AI chat
  useEffect(() => {
    if (aiChatRef.current && showAIChat) {
      aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
    }
  }, [aiChatMessages, showAIChat]);

  useEffect(() => {
    loadDirectory();
  }, [currentPath, sortBy, sortOrder]);

  return (
    <div className="h-screen bg-white flex">
      {/* FileOps Sidebar */}
      <FileOpsSidebar
        currentPath={currentPath}
        onNavigate={navigateTo}
        favorites={favorites}
        recents={recents}
        onToggleFavorite={toggleFavorite}
      />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={navigateUp}
                  disabled={currentPath === "/"}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateTo("/")}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center space-x-1 text-sm">
                <button
                  onClick={() => navigateTo("/")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Home
                </button>
                {pathSegments.map((segment, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <button
                      onClick={() =>
                        navigateTo(
                          "/" + pathSegments.slice(0, index + 1).join("/")
                        )
                      }
                      className="text-gray-700 hover:text-blue-600"
                    >
                      {segment}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all files..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    performGlobalSearch(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex rounded-lg border border-gray-300">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Button onClick={createFolder} size="sm">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>

              <Button
                onClick={() => openFileModal("directory")}
                variant="outline"
                size="sm"
              >
                <Search className="w-4 h-4 mr-2" />
                Quick Navigate
              </Button>

              <Button
                onClick={() => collectMediaFromDirectory()}
                variant="outline"
                size="sm"
              >
                <MonitorPlay className="w-4 h-4 mr-2" />
                Collect Media
              </Button>

              <Button
                onClick={() => toggleFavorite(currentPath)}
                variant="outline"
                size="sm"
              >
                <Star
                  className={`w-4 h-4 mr-2 ${
                    favorites.includes(currentPath)
                      ? "text-yellow-500 fill-current"
                      : ""
                  }`}
                />
                {favorites.includes(currentPath)
                  ? "Remove Favorite"
                  : "Add Favorite"}
              </Button>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center space-x-2">
                  <SortAsc className="w-4 h-4 text-gray-500" />
                  <Select
                    value={`${sortBy}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [newSortBy, newSortOrder] = value.split("-");
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                  >
                    <SelectTrigger className="w-48 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                      <SelectItem value="modified-desc">
                        Date Modified (Newest)
                      </SelectItem>
                      <SelectItem value="modified-asc">
                        Date Modified (Oldest)
                      </SelectItem>
                      <SelectItem value="created-desc">
                        Date Created (Newest)
                      </SelectItem>
                      <SelectItem value="created-asc">
                        Date Created (Oldest)
                      </SelectItem>
                      <SelectItem value="size-desc">Size (Largest)</SelectItem>
                      <SelectItem value="size-asc">Size (Smallest)</SelectItem>
                      <SelectItem value="type-asc">Type (A → Z)</SelectItem>
                      <SelectItem value="type-desc">Type (Z → A)</SelectItem>
                      <SelectItem value="extension-asc">
                        Extension (A → Z)
                      </SelectItem>
                      <SelectItem value="extension-desc">
                        Extension (Z → A)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {selectedItems.size > 0 && !moveMode && (
                  <>
                    <Button onClick={cutFiles} variant="outline" size="sm">
                      <Scissors className="w-4 h-4 mr-2" />
                      Cut
                    </Button>
                    <Button
                      onClick={showMoveToDialog}
                      variant="outline"
                      size="sm"
                    >
                      <Move className="w-4 h-4 mr-2" />
                      Move to...
                    </Button>
                    <Button
                      onClick={() => deleteItems()}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}

                {moveMode && cutItems.size > 0 && (
                  <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                    <span className="text-sm text-orange-700">
                      Moving {cutItems.size} item(s) - navigate to destination
                    </span>
                    <Button onClick={pasteFiles} size="sm" variant="default">
                      <Check className="w-3 h-3 mr-1" />
                      Paste Here
                    </Button>
                    <Button
                      onClick={cancelMoveMode}
                      size="sm"
                      variant="secondary"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500 flex-shrink-0">
              {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{filteredFiles.length} items</span>
              {searchTerm && <Badge variant="outline">Search Results</Badge>}
              {selectedItems.size > 0 && (
                <span>• {selectedItems.size} selected</span>
              )}
              {mediaFiles.length > 0 && (
                <Badge variant="secondary">
                  {mediaFiles.length} media files
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        {dragOver && (
          <div className="fixed inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-500 flex items-center justify-center z-50">
            <Card className="p-8">
              <CardContent className="text-center">
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-900">
                  Drop files to upload
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading/Error States */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            Error: {error}
          </div>
        )}

        {/* File List */}
        {!loading && !error && (
          <div className="flex-1 overflow-auto relative">
            {viewMode === "list" ? (
              <div className="divide-y divide-gray-100">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-medium text-gray-500 bg-gray-50">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Modified</div>
                </div>

                {/* Items */}
                {filteredFiles.map((file) => (
                  <div
                    key={file.path}
                    draggable={file.type === "file"}
                    onDragStart={(e) =>
                      file.type === "file" && handleFileDragStart(e, file)
                    }
                    onDragOver={
                      file.type === "directory"
                        ? handleFolderDragOver
                        : undefined
                    }
                    onDrop={
                      file.type === "directory"
                        ? (e) => handleFolderDrop(e, file)
                        : undefined
                    }
                    onClick={(e) => toggleSelection(file, e)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    onContextMenu={(e) => handleRightClick(e, file)}
                    className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 cursor-pointer select-none transition-colors ${
                      selectedItems.has(file.path)
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    } ${cutItems.has(file.path) ? "opacity-50" : ""} ${
                      file.type === "directory" && dropTarget === file.path
                        ? "bg-green-50 border-green-500"
                        : ""
                    }`}
                  >
                    <div className="col-span-6 flex items-center space-x-3">
                      {file.type === "directory" ? (
                        <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        getFileIcon(file)
                      )}
                      {editingItem === file.path ? (
                        <input
                          ref={editRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(file)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(file);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="px-1 py-0.5 border border-blue-500 rounded focus:outline-none bg-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="truncate">{file.name}</span>
                          {file.type === "file" &&
                            ["video", "image", "audio", "document"].includes(
                              getFileType(file)
                            ) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPreview(file);
                                }}
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">
                      {file.type === "file" ? formatSize(file.size) : "—"}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500 capitalize flex items-center space-x-1">
                      <span>{file.type}</span>
                      {file.type === "file" && (
                        <Badge variant="outline" className="text-xs">
                          {getFileType(file)}
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">
                      {formatDate(file.modified)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 p-4">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.path}
                    draggable={file.type === "file"}
                    onDragStart={(e) =>
                      file.type === "file" && handleFileDragStart(e, file)
                    }
                    onDragOver={
                      file.type === "directory"
                        ? handleFolderDragOver
                        : undefined
                    }
                    onDrop={
                      file.type === "directory"
                        ? (e) => handleFolderDrop(e, file)
                        : undefined
                    }
                    className={`cursor-pointer select-none transition-all hover:shadow-md ${
                      selectedItems.has(file.path)
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : ""
                    } ${cutItems.has(file.path) ? "opacity-50" : ""} ${
                      file.type === "directory" && dropTarget === file.path
                        ? "ring-2 ring-green-500 bg-green-50"
                        : ""
                    }`}
                    onClick={(e) => toggleSelection(file, e)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    onContextMenu={(e) => handleRightClick(e, file)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="relative">
                        {file.type === "directory" ? (
                          <Folder className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                        ) : (
                          <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                            {getFileIcon(file)}
                          </div>
                        )}

                        {file.type === "file" &&
                          ["video", "image", "audio", "document"].includes(
                            getFileType(file)
                          ) && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreview(file);
                              }}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                      </div>

                      {editingItem === file.path ? (
                        <input
                          ref={editRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(file)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(file);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded focus:outline-none bg-white text-center"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="text-sm truncate" title={file.name}>
                          {file.name}
                        </div>
                      )}

                      <div className="flex items-center justify-center space-x-1 mt-1">
                        {file.type === "file" && (
                          <Badge variant="outline" className="text-xs">
                            {getFileType(file)}
                          </Badge>
                        )}
                        {file.type === "file" && file.size && (
                          <div className="text-xs text-gray-500">
                            {formatSize(file.size)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredFiles.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-16">
                <Folder className="w-16 h-16 mb-4 opacity-50" />
                <div className="text-lg font-medium mb-2">
                  This folder is empty
                </div>
                <div className="text-sm">
                  Add files or create a new folder to get started
                </div>
              </div>
            )}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            ref={contextRef}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => startEdit(contextMenu.item)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3"
            >
              <Edit className="w-4 h-4" />
              <span>Rename</span>
            </button>

            {contextMenu.item.type === "file" &&
              ["video", "image", "audio", "document"].includes(
                getFileType(contextMenu.item)
              ) && (
                <button
                  onClick={() => {
                    openPreview(contextMenu.item);
                    closeContextMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
              )}

            {contextMenu.item.type === "file" && (
              <button
                onClick={() => {
                  downloadFile(contextMenu.item);
                  closeContextMenu();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={() => deleteItems(new Set([contextMenu.item.path]))}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <hr className="my-2" />
            <button
              onClick={() => {
                setSelectedItems(new Set([contextMenu.item.path]));
                cutFiles();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3"
            >
              <Scissors className="w-4 h-4" />
              <span>Cut</span>
            </button>
            <button
              onClick={() => {
                setSelectedItems(new Set([contextMenu.item.path]));
                showMoveToDialog();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3"
            >
              <Move className="w-4 h-4" />
              <span>Move to...</span>
            </button>
            <hr className="my-2" />
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Quick Move to Plex
            </div>
            {plexFolders.map((folder) => (
              <button
                key={folder.path}
                onClick={() => moveToPlexFolder(folder.path)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-3"
              >
                <Folder className="w-4 h-4 text-blue-500" />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto bg-white border border-gray-200 shadow-xl rounded-lg">
            <DialogHeader className="bg-gray-50 -m-6 mb-4 p-6 rounded-t-lg border-b border-gray-200">
              <DialogTitle className="flex items-center justify-between">
                <span className="text-gray-900 font-semibold">
                  {previewFile?.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewFile && downloadFile(previewFile)}
                  className="bg-white hover:bg-gray-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 bg-white">{renderPreview()}</div>
          </DialogContent>
        </Dialog>

        {/* Media Collector Modal */}
        <Dialog open={showMediaCollector} onOpenChange={setShowMediaCollector}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Media Collection</span>
                <Badge variant="secondary">
                  {mediaFiles.length} files found
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="videos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="videos">
                  Videos (
                  {mediaFiles.filter((f) => getFileType(f) === "video").length})
                </TabsTrigger>
                <TabsTrigger value="images">
                  Images (
                  {mediaFiles.filter((f) => getFileType(f) === "image").length})
                </TabsTrigger>
                <TabsTrigger value="audio">
                  Audio (
                  {mediaFiles.filter((f) => getFileType(f) === "audio").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-auto">
                  {mediaFiles
                    .filter((f) => getFileType(f) === "video")
                    .map((file) => (
                      <Card
                        key={file.path}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <Video className="w-8 h-8 text-red-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-sm font-medium truncate"
                                title={file.name}
                              >
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {file.relativePath}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatSize(file.size)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPreview(file)}
                              className="flex-shrink-0"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-auto">
                  {mediaFiles
                    .filter((f) => getFileType(f) === "image")
                    .map((file) => (
                      <Card
                        key={file.path}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-2">
                          <div
                            className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center cursor-pointer"
                            onClick={() => openPreview(file)}
                          >
                            <Image className="w-8 h-8 text-green-500" />
                          </div>
                          <div className="text-xs truncate" title={file.name}>
                            {file.name}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-auto">
                  {mediaFiles
                    .filter((f) => getFileType(f) === "audio")
                    .map((file) => (
                      <Card
                        key={file.path}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <Music className="w-8 h-8 text-purple-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-sm font-medium truncate"
                                title={file.name}
                              >
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {file.relativePath}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatSize(file.size)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPreview(file)}
                              className="flex-shrink-0"
                            >
                              <Volume2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-lg max-h-[80vh] bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                <span>Upload Files</span>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                      setUploadProgress(0);
                      setUploadingFiles(new Set());
                      setCompletedFiles(new Set());
                      setFailedFiles(new Set());
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Upload Progress Section */}
              {uploading && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {currentUploadingFile
                          ? `Uploading ${currentUploadingFile}...`
                          : "Processing uploads..."}
                      </span>
                    </div>
                    <span className="text-sm text-blue-700 font-medium">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>

                  <Progress value={uploadProgress} className="w-full h-2" />

                  {(completedFiles.size > 0 || failedFiles.size > 0) && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-4">
                        {completedFiles.size > 0 && (
                          <span className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            <span>{completedFiles.size} completed</span>
                          </span>
                        )}
                        {failedFiles.size > 0 && (
                          <span className="flex items-center space-x-1 text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span>{failedFiles.size} failed</span>
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500">
                        {completedFiles.size + failedFiles.size} of{" "}
                        {uploadFiles.length}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Files List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    Files to upload ({uploadFiles.length})
                  </h3>
                  <span className="text-xs text-gray-500">
                    to {currentPath}
                  </span>
                </div>

                <div className="max-h-64 overflow-auto space-y-2 border rounded-lg p-2 bg-gray-50">
                  {uploadFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No files selected</p>
                      <p className="text-xs">
                        Click "Add Files" to choose files
                      </p>
                    </div>
                  ) : (
                    uploadFiles.map((file, index) => {
                      const isUploading = uploadingFiles.has(file.name);
                      const isCompleted = completedFiles.has(file.name);
                      const isFailed = failedFiles.has(file.name);

                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                            isCompleted
                              ? "bg-green-50 border-green-200"
                              : isFailed
                              ? "bg-red-50 border-red-200"
                              : isUploading
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : isFailed ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : isUploading ? (
                              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            ) : (
                              getFileIcon({ name: file.name, type: "file" })
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-gray-900">
                              {file.name}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{formatSize(file.size)}</span>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {getFileType({ name: file.name })}
                              </Badge>
                            </div>
                          </div>

                          {!uploading && !isCompleted && !isFailed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = [...uploadFiles];
                                newFiles.splice(index, 1);
                                setUploadFiles(newFiles);
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={uploadFilesToServer}
                  disabled={uploadFiles.length === 0 || uploading}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {uploadFiles.length} file
                      {uploadFiles.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>

                {!uploading && (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Add Files
                  </Button>
                )}
              </div>

              {/* Upload Complete Message */}
              {!uploading &&
                completedFiles.size > 0 &&
                completedFiles.size === uploadFiles.length && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-900">
                        All files uploaded successfully!
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Files have been saved to {currentPath}
                    </p>
                  </div>
                )}

              {/* Upload Errors */}
              {!uploading && failedFiles.size > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-900">
                      {failedFiles.size} file{failedFiles.size !== 1 ? "s" : ""}{" "}
                      failed to upload
                    </span>
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    Please try uploading the failed files again
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* File Modal */}
        <FileModal
          isOpen={showFileModal}
          onClose={() => setShowFileModal(false)}
          onSelect={handleFileModalSelect}
          mode={fileModalMode}
          title={
            fileModalMode === "directory"
              ? "Navigate to Directory"
              : "Select File"
          }
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFileUpload(e.target.files);
            }
          }}
        />
      </div>

      {/* AI Chat Floating Button */}
      <button
        onClick={() => setShowAIChat(true)}
        className={`fixed bottom-6 right-6 z-40 ${
          selectedItems.size > 0
            ? "bg-blue-500 hover:bg-blue-600 shadow-lg"
            : "bg-gray-500 hover:bg-gray-600"
        } text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 ${
          selectedItems.size > 0 ? "animate-pulse" : ""
        }`}
        title={
          selectedItems.size > 0
            ? `Ask AI about ${selectedItems.size} selected file(s)`
            : "Ask AI for file help"
        }
      >
        <Sparkles className="w-6 h-6" />
        {selectedItems.size > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-2 border-white">
            {selectedItems.size}
          </Badge>
        )}
      </button>

      {/* AI Chat Modal */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-white flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <span>AI File Assistant</span>
              </div>
              {selectedItems.size > 0 && (
                <Badge variant="outline" className="text-xs">
                  {selectedItems.size} file{selectedItems.size !== 1 ? "s" : ""}{" "}
                  selected
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Messages */}
          <div
            ref={aiChatRef}
            className="flex-1 overflow-auto space-y-4 mb-4 pr-2"
          >
            {aiChatMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500 opacity-50" />
                <p className="text-sm font-medium mb-2">
                  AI File Assistant Ready
                </p>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  {selectedItems.size > 0
                    ? `You have ${selectedItems.size} file(s) selected. I can help you rename, organize, or perform operations on them.`
                    : "Select files to get help, or ask me general questions about your files."}
                </p>
                {selectedItems.size > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left max-w-md mx-auto">
                    <p className="text-xs font-medium text-blue-900 mb-2">
                      Example requests:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• "Rename these to S2E25, S2E26, S2E27..."</li>
                      <li>• "Add a prefix to all selected files"</li>
                      <li>• "Remove the first 3 characters from each name"</li>
                      <li>• "Convert all to lowercase"</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {aiChatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {aiChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center space-x-2 border-t pt-4">
            <input
              type="text"
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !aiChatLoading) {
                  e.preventDefault();
                  handleAIChat(aiChatInput);
                }
              }}
              placeholder="Ask AI to help with your files..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={aiChatLoading}
            />
            <Button
              onClick={() => handleAIChat(aiChatInput)}
              disabled={aiChatLoading || !aiChatInput.trim()}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileExplorer;
