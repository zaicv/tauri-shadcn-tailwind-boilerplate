import React, { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabaseClient";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Plus,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  Tag,
  Star,
  CheckSquare,
  Square,
  Layers,
} from "lucide-react";
import MultipleSelector from "@/components/ui/multi-select";
import { motion, AnimatePresence } from "framer-motion";

const personaList = [
  {
    id: "1ef18c68-c104-44fa-ad76-fe33ad693332",
    name: "Phoebe",
    src: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png",
    fallback: "PH",
  },
  {
    id: "uuid-for-luma",
    name: "Luma",
    src: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-2.png",
    fallback: "LU",
  },
  {
    id: "uuid-for-amber",
    name: "Amber",
    src: "https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-3.png",
    fallback: "AM",
  },
];

const MULTI_PART_OPTIONS = [
  { value: "no", label: "Single-part" },
  { value: "yes", label: "Multi-part" },
];

const deriveMultiPartTag = (metadata: any): "yes" | "no" => {
  if (!metadata) return "no";
  const raw =
    metadata.multi_part_tag !== undefined
      ? metadata.multi_part_tag
      : metadata.is_multi_part;

  if (typeof raw === "string") {
    const value = raw.trim().toLowerCase();
    if (["yes", "true", "1", "y"].includes(value)) return "yes";
    if (["no", "false", "0", "n"].includes(value)) return "no";
  }
  if (typeof raw === "boolean") {
    return raw ? "yes" : "no";
  }
  if (typeof raw === "number") {
    return raw ? "yes" : "no";
  }
  return "no";
};

const groupMemoriesByFile = (memories) => {
  const grouped = {};
  const standalone = [];
  memories.forEach((memory) => {
    if (memory.name?.includes(" - Part ")) {
      const baseName = memory.name.split(" - Part ")[0];
      if (!grouped[baseName]) {
        grouped[baseName] = {
          id: `group-${baseName}`,
          name: baseName,
          parts: [],
          persona_id: memory.persona_id,
          tags: memory.tags,
          importance: memory.importance,
          created_at: memory.created_at,
          file_path: memory.file_path,
          file_type: memory.file_type,
          file_name: memory.file_name,
          isGroup: true,
          multi_part_tag: "yes",
        };
      }
      grouped[baseName].parts.push(memory);
      grouped[baseName].parts.sort(
        (a, b) =>
          (parseInt(a.name.split(" - Part ")[1]) || 0) -
          (parseInt(b.name.split(" - Part ")[1]) || 0)
      );
    } else {
      standalone.push(memory);
    }
  });
  return [...Object.values(grouped), ...standalone];
};

const CollapsiblePart = ({ part, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="border border-black/10 dark:border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
          <h4 className="font-medium text-sm">Part {index + 1}</h4>
          <span className="text-xs text-black/50 dark:text-white/50">
            ({part.content.length} chars)
          </span>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-black/10 dark:border-white/10"
          >
            <div className="p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {part.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MemoryCard = ({
  memory,
  persona,
  onClick,
  onToggleSelect,
  isSelected,
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    onClick={onClick}
    className={`group cursor-pointer p-4 rounded-2xl transition-all border ${
      isSelected
        ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
        : "border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="relative">
        <Avatar className="w-10 h-10 ring-2 ring-black/5 dark:ring-white/5">
          <AvatarImage src={persona?.src} />
          <AvatarFallback>{persona?.fallback}</AvatarFallback>
        </Avatar>
        {!memory.isGroup && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(memory.id);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-black border border-black/10 dark:border-white/10 flex items-center justify-center shadow-sm"
            title="Select memory"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-black dark:text-white" />
            ) : (
              <Square className="w-4 h-4 text-black/60 dark:text-white/60" />
            )}
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate mb-1">{memory.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {memory.isGroup && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              <Sparkles className="w-3 h-3" />
              {memory.parts.length} parts
            </span>
          )}
          {!memory.isGroup && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                memory.multi_part_tag === "yes"
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-300"
                  : "bg-green-500/10 text-green-600 dark:text-green-300"
              }`}
            >
              <Layers className="w-3 h-3" />
              {memory.multi_part_tag === "yes" ? "Multi-part" : "Single-part"}
            </span>
          )}
          {memory.importance >= 5 && (
            <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full">
              <Star className="w-3 h-3" />
              Important
            </span>
          )}
          {memory.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-black/50 dark:text-white/50 mt-2">
          {format(new Date(memory.created_at), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </div>
  </motion.div>
);

const MemoryListView = ({
  memories,
  personaList,
  searchQuery,
  onEditMemory,
  onDeleteMemory,
  deletingMemoryId,
  selectedMemoryIds,
  onToggleSelect,
}) => {
  const [groupBy, setGroupBy] = useState("none");
  const getPersona = (id) => personaList.find((p) => p.id === id);
  const fileGroupedMemories = groupMemoriesByFile(
    memories.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content?.toLowerCase().includes(searchQuery.toLowerCase())
    )


    
  );

  const groupFunctions = {
    none: () => ({ All: fileGroupedMemories }),
    persona: () =>
      fileGroupedMemories.reduce((acc, mem) => {
        const key = getPersona(mem.persona_id)?.name || "Unknown";
        acc[key] = acc[key] || [];
        acc[key].push(mem);
        return acc;
      }, {}),
    tags: () =>
      fileGroupedMemories.reduce((acc, mem) => {
        (mem.tags || ["Untagged"]).forEach((tag) => {
          acc[tag] = acc[tag] || [];
          acc[tag].push(mem);
        });
        return acc;
      }, {}),
    importance: () =>
      Object.fromEntries(
        Object.entries(
          fileGroupedMemories.reduce((acc, mem) => {
            const key = `Level ${mem.importance}`;
            acc[key] = acc[key] || [];
            acc[key].push(mem);
            return acc;
          }, {})
        ).sort(
          (a, b) => parseInt(b[0].split(" ")[1]) - parseInt(a[0].split(" ")[1])
        )
      ),
  };

  const grouped = groupFunctions[groupBy]();
  const [selectedMemory, setSelectedMemory] = useState(null);
  const handleDelete = async () => {
    if (!selectedMemory || !onDeleteMemory) return;
    const wasDeleted = await onDeleteMemory(selectedMemory);
    if (wasDeleted) setSelectedMemory(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {fileGroupedMemories.length}{" "}
            {fileGroupedMemories.length === 1 ? "Memory" : "Memories"}
          </h2>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[140px] h-9 rounded-xl bg-black/5 dark:bg-white/5 border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="persona">By Persona</SelectItem>
              <SelectItem value="tags">By Tags</SelectItem>
              <SelectItem value="importance">By Importance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="space-y-2">
            {groupBy !== "none" && (
              <h3 className="text-sm font-medium text-black/50 dark:text-white/50 mb-3">
                {group} ({items.length})
              </h3>
            )}
            <div className="space-y-1">
              {items.map((memory) => {
                const persona = getPersona(memory.persona_id);
                const isSelected =
                  !memory.isGroup && selectedMemoryIds.includes(memory.id);
                return (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    persona={persona}
                    onClick={() => setSelectedMemory(memory)}
                    onToggleSelect={onToggleSelect}
                    isSelected={isSelected}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedMemory}
        onOpenChange={() => setSelectedMemory(null)}
      >
        <DialogContent className="max-w-3xl bg-white dark:bg-[#2f2f2f] border-black/10 dark:border-white/10 max-h-[85vh] overflow-y-auto">
          {selectedMemory && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={getPersona(selectedMemory.persona_id)?.src}
                  />
                  <AvatarFallback>
                    {getPersona(selectedMemory.persona_id)?.fallback}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-semibold">
                    {selectedMemory.name}
                  </h3>
                  <p className="text-sm text-black/50 dark:text-white/50">
                    {format(new Date(selectedMemory.created_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>
              {selectedMemory.isGroup ? (
                <div className="space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      📄 Split into {selectedMemory.parts.length} parts for
                      better AI processing
                    </p>
                  </div>
                  {selectedMemory.parts.map((part, i) => (
                    <CollapsiblePart key={part.id} part={part} index={i} />
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-base">
                  {selectedMemory.content}
                </p>
              )}
              {selectedMemory.file_path && (
                <div className="mt-6 p-4 border-t border-black/10 dark:border-white/10 space-y-3">
                  <h4 className="font-semibold">Attached File</h4>
                  {selectedMemory.file_type?.includes("pdf") && (
                    <iframe
                      src={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${selectedMemory.file_path}`}
                      className="w-full h-96 border border-black/10 dark:border-white/10 rounded-xl"
                    />
                  )}
                  {selectedMemory.file_type?.startsWith("image/") && (
                    <img
                      src={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${selectedMemory.file_path}`}
                      alt={selectedMemory.file_name}
                      className="w-full max-h-96 object-contain rounded-xl"
                    />
                  )}
                  {selectedMemory.file_type?.startsWith("audio/") && (
                    <audio
                      controls
                      src={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${selectedMemory.file_path}`}
                      className="w-full"
                    />
                  )}
                  <div className="flex gap-2">
                    <a
                      href={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${selectedMemory.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium"
                    >
                      Preview
                    </a>
                    <a
                      href={`https://mhdzzfhtvvlnkitnbqqr.supabase.co/storage/v1/object/public/file-stores/${selectedMemory.file_path}`}
                      download={selectedMemory.file_name}
                      className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                    >
                      Download
                    </a>
                  </div>
                </div>
              )}
              <div className="mt-6 p-4 bg-black/5 dark:bg-white/5 rounded-xl space-y-2 text-sm">
                <p>
                  <strong>Tags:</strong>{" "}
                  {selectedMemory.tags?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Importance:</strong> {selectedMemory.importance}/6
                </p>
                <p>
                  <strong>Persona:</strong>{" "}
                  {getPersona(selectedMemory.persona_id)?.name}
                </p>
                <p>
                  <strong>Multi-part:</strong>{" "}
                  {selectedMemory.isGroup
                    ? "Yes"
                    : selectedMemory.multi_part_tag === "yes"
                    ? "Yes"
                    : "No"}
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                {!selectedMemory.isGroup && (
                  <button
                    onClick={() => {
                      onEditMemory?.(selectedMemory);
                      setSelectedMemory(null);
                    }}
                    className="w-full sm:w-auto h-10 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium"
                  >
                    Edit Memory
                  </button>
                )}
                {!selectedMemory.isGroup && (
                  <button
                    onClick={handleDelete}
                    disabled={deletingMemoryId === selectedMemory.id}
                    className="w-full sm:w-auto h-10 px-4 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {deletingMemoryId === selectedMemory.id && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const Memories = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [addingMemory, setAddingMemory] = useState(false);
  const [addMemoryError, setAddMemoryError] = useState("");
  const [editMemoryError, setEditMemoryError] = useState("");
  const [updatingMemory, setUpdatingMemory] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [editMemoryData, setEditMemoryData] = useState({
    name: "",
    content: "",
    tags: [],
    importance: "6",
    persona_id: "",
    multi_part_tag: "no",
  });
  const [deletingMemoryId, setDeletingMemoryId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMemory, setNewMemory] = useState({
    name: "",
    content: "",
    tags: [],
    importance: "6",
    persona_id: "",
    multi_part_tag: "no",
  });
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [batchUpdating, setBatchUpdating] = useState(false);
  const [batchError, setBatchError] = useState("");

  useEffect(() => {
    const loadTags = async () => {
      const { data } = await supabase.from("memories").select("tags");
      const tagSet = new Set();
      data?.forEach(
        (m) => Array.isArray(m.tags) && m.tags.forEach((tag) => tagSet.add(tag))
      );
      setAllTags(Array.from(tagSet).map((tag) => ({ value: tag, label: tag })));
    };
    loadTags();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else {
      const normalized = (data || []).map((memory) => ({
        ...memory,
        multi_part_tag: deriveMultiPartTag(memory.metadata),
      }));
      setMemories(normalized);
      setSelectedMemoryIds((prev) =>
        prev.filter((id) => normalized.some((memory) => memory.id === id))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const openEditDialog = (memory) => {
    if (!memory) return;
    setEditingMemory(memory);
    setEditMemoryData({
      name: memory.name || "",
      content: memory.content || "",
      tags: memory.tags || [],
      importance: String(memory.importance || 6),
      persona_id: memory.persona_id || "",
      multi_part_tag: memory.multi_part_tag || "no",
    });
    setEditMemoryError("");
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingMemory(null);
    setEditMemoryError("");
    setEditMemoryData({
      name: "",
      content: "",
      tags: [],
      importance: "6",
      persona_id: "",
      multi_part_tag: "no",
    });
  };

  const updateMemory = async () => {
    if (!editingMemory) return;
    if (!editMemoryData.name.trim()) {
      setEditMemoryError("Memory name is required");
      return;
    }
    if (!editMemoryData.persona_id.trim()) {
      setEditMemoryError("Persona is required");
      return;
    }
    setUpdatingMemory(true);
    setEditMemoryError("");
    try {
      const metadata = {
        ...(editingMemory.metadata || {}),
        multi_part_tag: editMemoryData.multi_part_tag,
        is_multi_part: editMemoryData.multi_part_tag === "yes",
      };
      const payload = {
        name: editMemoryData.name.trim(),
        content: editMemoryData.content,
        tags: editMemoryData.tags,
        importance: parseInt(editMemoryData.importance, 10) || 1,
        persona_id: editMemoryData.persona_id,
        metadata,
      };
      const { error: updateError } = await supabase
        .from("memories")
        .update(payload)
        .eq("id", editingMemory.id);
      if (updateError) throw updateError;
      await fetchMemories();
      closeEditDialog();
    } catch (err) {
      setEditMemoryError(err.message);
    } finally {
      setUpdatingMemory(false);
    }
  };

  const handleDeleteMemory = async (memory) => {
    if (!memory) return false;
    const confirmed = window.confirm(
      `Delete "${memory.name}"? This action cannot be undone.`
    );
    if (!confirmed) return false;
    setDeleteError("");
    setDeletingMemoryId(memory.id);
    try {
      if (memory.file_path) {
        const { error: storageError } = await supabase.storage
          .from("file-stores")
          .remove([memory.file_path]);
        if (storageError) {
          console.warn("Storage removal failed:", storageError.message);
        }
      }
      const { error: deleteErrorResp } = await supabase
        .from("memories")
        .delete()
        .eq("id", memory.id);
      if (deleteErrorResp) throw deleteErrorResp;
      await fetchMemories();
      return true;
    } catch (err) {
      setDeleteError(err.message);
      return false;
    } finally {
      setDeletingMemoryId(null);
    }
  };

  const toggleMemorySelection = (memoryId: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(memoryId)
        ? prev.filter((id) => id !== memoryId)
        : [...prev, memoryId]
    );
  };

  const clearSelection = () => {
    setSelectedMemoryIds([]);
    setBatchError("");
  };

  const handleBatchMultiPartUpdate = async (tag: "yes" | "no") => {
    if (selectedMemoryIds.length === 0) return;
    setBatchUpdating(true);
    setBatchError("");
    try {
      for (const memoryId of selectedMemoryIds) {
        const memory = memories.find((m) => m.id === memoryId);
        if (!memory) continue;
        const metadata = {
          ...(memory.metadata || {}),
          multi_part_tag: tag,
          is_multi_part: tag === "yes",
        };
        const { error: updateError } = await supabase
          .from("memories")
          .update({ metadata })
          .eq("id", memoryId);
        if (updateError) throw updateError;
      }
      await fetchMemories();
      setSelectedMemoryIds([]);
    } catch (err) {
      setBatchError(err.message || "Failed to update multi-part tag");
    } finally {
      setBatchUpdating(false);
    }
  };

  const addMemory = async () => {
    if (!newMemory.name.trim() || !newMemory.persona_id.trim()) {
      setAddMemoryError("Name and Persona are required");
      return;
    }
    setAddingMemory(true);
    setAddMemoryError("");
    let filePath = null;
    try {
      if (file) {
        setUploading(true);
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("file-stores")
          .upload(fileName, file);
        setUploading(false);
        if (uploadError)
          throw new Error("File upload error: " + uploadError.message);
        filePath = uploadData.path;
      }
      const metadata = {
        multi_part_tag: newMemory.multi_part_tag,
        is_multi_part: newMemory.multi_part_tag === "yes",
      };
      const memoryToInsert = {
        name: newMemory.name,
        content: newMemory.content,
        tags: newMemory.tags,
        importance: parseInt(newMemory.importance, 10) || 5,
        persona_id: newMemory.persona_id,
        file_path: filePath,
        file_type: file?.type || null,
        file_name: file?.name || null,
        metadata,
      };
      const response = await fetch(
        "https://100.83.147.76:8003/api/add-memory",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memoryToInsert),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Unknown error");
      }
      await fetchMemories();
      setNewMemory({
        name: "",
        content: "",
        tags: [],
        importance: "6",
        persona_id: "",
        multi_part_tag: "no",
      });
      setFile(null);
      setDialogOpen(false);
    } catch (err) {
      setAddMemoryError(err.message);
    } finally {
      setAddingMemory(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#212121]">
      <div className="border-b border-black/10 dark:border-white/10 p-6 mt-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold mb-4">Memories</h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search memories..."
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-400">
              Error: {error}
            </div>
          )}
          {deleteError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400">
              {deleteError}
            </div>
          )}
          {batchError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm mb-4">
              {batchError}
            </div>
          )}
          {selectedMemoryIds.length > 0 && (
            <div className="mb-4 p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  {selectedMemoryIds.length} selected
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  Update the multi-part tag for all selected memories.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBatchMultiPartUpdate("yes")}
                  disabled={batchUpdating}
                  className="px-3 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
                >
                  {batchUpdating ? "Updating..." : "Mark as Multi-part"}
                </button>
                <button
                  onClick={() => handleBatchMultiPartUpdate("no")}
                  disabled={batchUpdating}
                  className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-50"
                >
                  {batchUpdating ? "Updating..." : "Mark as Single-part"}
                </button>
                <button
                  onClick={clearSelection}
                  disabled={batchUpdating}
                  className="px-3 py-2 rounded-xl border border-black/20 dark:border-white/20 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
          {!loading && !error && memories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-black/50 dark:text-white/50">
                No memories found
              </p>
            </div>
          )}
          {!loading && !error && memories.length > 0 && (
            <MemoryListView
              memories={memories}
              personaList={personaList}
              searchQuery={searchQuery}
              onEditMemory={openEditDialog}
              onDeleteMemory={handleDeleteMemory}
              deletingMemoryId={deletingMemoryId}
              selectedMemoryIds={selectedMemoryIds}
              onToggleSelect={toggleMemorySelection}
            />
          )}
        </div>
      </div>

      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#2f2f2f] border-black/10 dark:border-white/10">
          <h2 className="text-xl font-semibold mb-4">Add Memory</h2>
          {addMemoryError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm mb-4">
              {addMemoryError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Attach File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,.html,.json,.mp3,.wav,.m4a,.jpg,.jpeg,.png,.gif"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0]);
                  setAddMemoryError("");
                }}
                className="w-full p-2 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-black/10 dark:file:bg-white/10 file:text-black dark:file:text-white hover:file:bg-black/20 dark:hover:file:bg-white/20"
                disabled={addingMemory}
              />
              {file && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ {file.name}
                </p>
              )}
            </div>
            <input
              type="text"
              placeholder="Memory name"
              value={newMemory.name}
              onChange={(e) => {
                setNewMemory({ ...newMemory, name: e.target.value });
                setAddMemoryError("");
              }}
              className="w-full h-10 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm"
              disabled={addingMemory}
            />
            <textarea
              placeholder="Content (optional if uploading file)"
              rows={4}
              value={newMemory.content}
              onChange={(e) => {
                setNewMemory({ ...newMemory, content: e.target.value });
                setAddMemoryError("");
              }}
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm resize-none"
              disabled={addingMemory}
            />
            <MultipleSelector
              value={newMemory.tags.map((tag) => ({ value: tag, label: tag }))}
              onChange={(selected) =>
                setNewMemory({
                  ...newMemory,
                  tags: selected.map((t) => t.value),
                })
              }
              defaultOptions={allTags}
              placeholder="Add tags..."
              creatable
              className="w-full"
              hideClearAllButton
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={newMemory.importance}
                onValueChange={(value) =>
                  setNewMemory({ ...newMemory, importance: value })
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-black/5 dark:bg-white/5 border-0">
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={newMemory.persona_id}
                onValueChange={(value) =>
                  setNewMemory({ ...newMemory, persona_id: value })
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-black/5 dark:bg-white/5 border-0">
                  <SelectValue placeholder="Persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {personaList.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={persona.src} />
                            <AvatarFallback>{persona.fallback}</AvatarFallback>
                          </Avatar>
                          {persona.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Select
              value={newMemory.multi_part_tag}
              onValueChange={(value) =>
                setNewMemory({ ...newMemory, multi_part_tag: value })
              }
            >
              <SelectTrigger className="h-10 rounded-xl bg-black/5 dark:bg-white/5 border-0">
                <SelectValue placeholder="Multi-part Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MULTI_PART_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <button
              onClick={addMemory}
              disabled={addingMemory}
              className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addingMemory ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? "Uploading..." : "Processing..."}
                </>
              ) : (
                "Add Memory"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-w-md bg-white dark:bg-[#2f2f2f] border-black/10 dark:border-white/10">
          <h2 className="text-xl font-semibold mb-4">
            Edit {editingMemory?.name || "Memory"}
          </h2>
          {editMemoryError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm mb-4">
              {editMemoryError}
            </div>
          )}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Memory name"
              value={editMemoryData.name}
              onChange={(e) =>
                setEditMemoryData({ ...editMemoryData, name: e.target.value })
              }
              className="w-full h-10 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm"
              disabled={updatingMemory}
            />
            <textarea
              placeholder="Content"
              rows={4}
              value={editMemoryData.content}
              onChange={(e) =>
                setEditMemoryData({
                  ...editMemoryData,
                  content: e.target.value,
                })
              }
              className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm resize-none"
              disabled={updatingMemory}
            />
            <MultipleSelector
              value={editMemoryData.tags.map((tag) => ({
                value: tag,
                label: tag,
              }))}
              onChange={(selected) =>
                setEditMemoryData({
                  ...editMemoryData,
                  tags: selected.map((t) => t.value),
                })
              }
              defaultOptions={allTags}
              placeholder="Tags..."
              creatable
              className="w-full"
              hideClearAllButton
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={editMemoryData.importance}
                onValueChange={(value) =>
                  setEditMemoryData({ ...editMemoryData, importance: value })
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-black/5 dark:bg-white/5 border-0">
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={editMemoryData.persona_id}
                onValueChange={(value) =>
                  setEditMemoryData({ ...editMemoryData, persona_id: value })
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-black/5 dark:bg-white/5 border-0">
                  <SelectValue placeholder="Persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {personaList.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={persona.src} />
                            <AvatarFallback>{persona.fallback}</AvatarFallback>
                          </Avatar>
                          {persona.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Select
              value={editMemoryData.multi_part_tag}
              onValueChange={(value) =>
                setEditMemoryData({ ...editMemoryData, multi_part_tag: value })
              }
            >
              <SelectTrigger className="h-10 rounded-xl bg-black/5 dark:bg-white/5 border-0">
                <SelectValue placeholder="Multi-part Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MULTI_PART_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <button
              onClick={updateMemory}
              disabled={updatingMemory}
              className="w-full h-10 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updatingMemory ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Memories;
