import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase/supabaseClient";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  Search,
  FileText,
  Upload,
  X,
  File,
  Image as ImageIcon,
  Music,
  Video,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getFileIcon = (fileType: string) => {
  if (fileType?.includes("pdf")) return FileText;
  if (fileType?.startsWith("image/")) return ImageIcon;
  if (fileType?.startsWith("audio/")) return Music;
  if (fileType?.startsWith("video/")) return Video;
  return File;
};

const getFileInfo = (entry: any) => {
  // First check direct columns (preferred), then fall back to metadata for backwards compatibility
  return {
    file_path: entry.file_path || entry.metadata?.file_path,
    file_type: entry.file_type || entry.metadata?.file_type,
    file_name: entry.file_name || entry.metadata?.file_name,
  };
};

const KnowledgeCard = ({ entry, onClick }) => {
  const fileInfo = getFileInfo(entry);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group cursor-pointer p-4 rounded-2xl transition-all border border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
          {fileInfo.file_type ? (
            React.createElement(getFileIcon(fileInfo.file_type), {
              className: "w-5 h-5 text-black/60 dark:text-white/60",
            })
          ) : (
            <FileText className="w-5 h-5 text-black/60 dark:text-white/60" />
          )}
        </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate mb-1">{entry.title}</h3>
        {entry.category && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full mb-2">
            {entry.category}
          </span>
        )}
        <p className="text-xs text-black/50 dark:text-white/50">
          {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </div>
  </motion.div>
  );
};

const KnowledgeBase = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);
  const [addError, setAddError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    category: "",
    content_type: "",
    tags: [],
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      for (const file of files) {
        await handleFileUpload(file);
      }
    },
    []
  );

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setAddError("");

    try {
      // Upload file to Supabase storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("file-stores")
        .upload(fileName, file);

      if (uploadError) throw new Error("File upload error: " + uploadError.message);

      // Create knowledge base entry - backend will extract text
      const entryData = {
        title: newEntry.title || file.name.replace(/\.[^/.]+$/, ""),
        content: newEntry.content || "", // Will be extracted by backend
        category: newEntry.category || "general",
        content_type: file.type || "document",
        tags: newEntry.tags || [],
        file_path: uploadData.path,
        file_type: file.type,
        file_name: file.name,
        is_active: true,
        access_level: "public",
      };

      // Add entry via API (backend will extract text from file)
      const apiUrl = import.meta.env.VITE_API_URL || "https://100.83.147.76:8003";
      const response = await fetch(
        `${apiUrl}/api/add-knowledge-base`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add entry");
      }

      await fetchEntries();
      setDialogOpen(false);
      setNewEntry({ title: "", content: "", category: "", content_type: "", tags: [] });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await handleFileUpload(file);
    }
  };

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) await handleFileUpload(file);
      } else if (item.kind === "string" && item.type === "text/plain") {
        item.getAsString(async (text) => {
          if (text.trim()) {
            setNewEntry((prev) => ({
              ...prev,
              content: prev.content ? `${prev.content}\n${text}` : text,
            }));
          }
        });
      }
    }
  }, []);

  const addTextEntry = async () => {
    if (!newEntry.title.trim()) {
      setAddError("Title is required");
      return;
    }
    if (!newEntry.content.trim()) {
      setAddError("Content is required");
      return;
    }

    setAddingEntry(true);
    setAddError("");

    try {
      const entryData = {
        title: newEntry.title.trim(),
        content: newEntry.content.trim(),
        category: newEntry.category || "general",
        content_type: newEntry.content_type || "text",
        tags: newEntry.tags || [],
        is_active: true,
        access_level: "public",
      };

      const apiUrl = import.meta.env.VITE_API_URL || "https://100.83.147.76:8003";
      const response = await fetch(
        `${apiUrl}/api/add-knowledge-base`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entryData),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add entry");
      }

      await fetchEntries();
      setDialogOpen(false);
      setNewEntry({ title: "", content: "", category: "", content_type: "", tags: [] });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddingEntry(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="h-screen flex flex-col bg-white dark:bg-[#212121]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-[#2f2f2f] rounded-3xl p-12 border-2 border-dashed border-blue-500"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
              <p className="text-xl font-semibold text-center">
                Drop files here to add to knowledge base
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-b border-black/10 dark:border-white/10 p-6 mt-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Knowledge Base</h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-black/20 dark:text-white/20" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-400 mb-4">
              Error: {error}
            </div>
          )}

          {addError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm mb-4">
              {addError}
            </div>
          )}

          {!loading && !error && filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-black/20 dark:text-white/20" />
              <p className="text-black/50 dark:text-white/50 mb-2">
                {searchQuery ? "No entries found" : "No knowledge base entries yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-black/40 dark:text-white/40">
                  Drag and drop files or click the + button to add content
                </p>
              )}
            </div>
          )}

          {!loading && !error && filteredEntries.length > 0 && (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <KnowledgeCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => setSelectedEntry(entry)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#2f2f2f] border-black/10 dark:border-white/10 max-h-[85vh] overflow-y-auto">
          <DialogTitle>Add to Knowledge Base</DialogTitle>
          <DialogDescription>
            Upload files or add text directly to your knowledge base
          </DialogDescription>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-black/40 dark:text-white/40" />
              <p className="text-sm font-medium mb-1">Drop files here or click to browse</p>
              <p className="text-xs text-black/50 dark:text-white/50">
                Supports PDF, DOC, TXT, images, audio, and more
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            <div className="border-t border-black/10 dark:border-white/10 pt-4">
              <p className="text-sm font-medium mb-2">Or add text directly:</p>
              <input
                type="text"
                placeholder="Title"
                value={newEntry.title}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, title: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm mb-3"
              />
              <textarea
                placeholder="Content (or paste text here)"
                rows={6}
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm resize-none"
              />
              <input
                type="text"
                placeholder="Category (optional)"
                value={newEntry.category}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, category: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm mt-3"
              />
            </div>

            <button
              onClick={addTextEntry}
              disabled={addingEntry || uploading}
              className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(addingEntry || uploading) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? "Uploading..." : "Adding..."}
                </>
              ) : (
                "Add Entry"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-3xl bg-white dark:bg-[#2f2f2f] border-black/10 dark:border-white/10 max-h-[85vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogTitle>{selectedEntry.title}</DialogTitle>
              <DialogDescription>
                {selectedEntry.category && `Category: ${selectedEntry.category}`}
                {selectedEntry.category && " • "}
                Created {format(new Date(selectedEntry.created_at), "PPP 'at' p")}
              </DialogDescription>
              <div className="flex items-start justify-end mb-4">
                <button
                  onClick={() => copyToClipboard(selectedEntry.content)}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-base">
                  {selectedEntry.content}
                </p>
              </div>

              {(() => {
                const fileInfo = getFileInfo(selectedEntry);
                return fileInfo.file_path && (
                  <div className="mt-6 p-4 border-t border-black/10 dark:border-white/10 space-y-3">
                    <h4 className="font-semibold">Attached File</h4>
                    {fileInfo.file_type?.includes("pdf") && (
                      <iframe
                        src={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${fileInfo.file_path}`}
                        className="w-full h-96 border border-black/10 dark:border-white/10 rounded-xl"
                      />
                    )}
                    {fileInfo.file_type?.startsWith("image/") && (
                      <img
                        src={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${fileInfo.file_path}`}
                        alt={fileInfo.file_name}
                        className="w-full max-h-96 object-contain rounded-xl"
                      />
                    )}
                    {fileInfo.file_type?.startsWith("audio/") && (
                      <audio
                        controls
                        src={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${fileInfo.file_path}`}
                        className="w-full"
                      />
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBase;

