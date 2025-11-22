import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Folder,
  MoreVertical,
  Edit3,
  Trash2,
  Star,
  Archive,
  Code,
  BookOpen,
  Briefcase,
  Heart,
  Lightbulb,
  Settings,
  Palette,
  Pin,
  PinOff,
  MessageSquare,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useFolders } from "@/hooks/useFolders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const FOLDER_ICONS = [
  { name: "👧🏽Ava", icon: Heart, color: "bg-pink-500" },
  { name: "💕Marissa", icon: Heart, color: "bg-pink-500" },
  { name: "🏡Family", icon: Heart, color: "bg-orange-500" },
  { name: "💸Money + Admin", icon: Briefcase, color: "bg-green-500" },
  { name: "⭐️The Glow / Mortal Brand", icon: Star, color: "bg-yellow-500" },
  {
    name: "☕️Coffee Truck / Content",
    icon: Lightbulb,
    color: "bg-orange-500",
  },
  { name: "🎓College / Career", icon: BookOpen, color: "bg-indigo-500" },
  { name: "🏃🏽‍♂️Physical Reconditioning", icon: Lightbulb, color: "bg-cyan-500" },
];

export default function FolderDashboard() {
  const navigate = useNavigate();
  const {
    folders,
    threads,
    createFolder,
    deleteFolder,
    moveThreadToFolder,
    togglePinThread,
  } = useFolders();

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("Star");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [defaultsInitialized, setDefaultsInitialized] = useState(false);

  React.useEffect(() => {
    const initializeDefaults = async () => {
      if (!defaultsInitialized && folders.length === 0) {
        for (const folder of DEFAULT_FOLDERS) {
          await createFolder({
            name: folder.name,
            description: "",
            icon: folder.icon,
            color: folder.color,
          });
        }
        setDefaultsInitialized(true);
      }
    };
    initializeDefaults();
  }, [folders.length, defaultsInitialized, createFolder]);

  const getFolderIcon = (iconName: string) => {
    const iconConfig = FOLDER_ICONS.find((icon) => icon.name === iconName);
    return iconConfig ? iconConfig.icon : Folder;
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;

    const newFolder = await createFolder({
      name: newFolderName.trim(),
      description: "",
      icon: newFolderIcon,
      color: newFolderColor,
    });

    if (newFolder) {
      setNewFolderName("");
      setShowCreateFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolder(folderId);
  };

  const filteredThreads = threads.filter((thread) =>
    thread.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#212121]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/chat")}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Folders</h1>
              <p className="text-sm text-black/50 dark:text-white/50 mt-0.5">
                Organize your conversations
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium"
          >
            New Folder
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 dark:text-white/40" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
            />
          </div>
        </div>

        {/* Folders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {folders.map((folder) => {
            const IconComponent = getFolderIcon(folder.icon);
            const threadsInFolder = threads.filter(
              (t) => t.folder_id === folder.id
            );
            return (
              <div
                key={folder.id}
                className="group p-4 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl", folder.color)}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-semibold text-base mb-1">{folder.name}</h3>
                <p className="text-sm text-black/50 dark:text-white/50">
                  {threadsInFolder.length} conversation
                  {threadsInFolder.length !== 1 ? "s" : ""}
                </p>
              </div>
            );
          })}
        </div>

        {/* Conversations List */}
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold mb-4">All Conversations</h2>
          {filteredThreads.map((thread) => {
            const folder = folders.find((f) => f.id === thread.folder_id);
            return (
              <div
                key={thread.id}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div
                  className="flex-1 min-w-0"
                  onClick={() => navigate(`/chat/${thread.id}`)}
                >
                  <div className="flex items-center gap-2">
                    {thread.is_pinned && (
                      <Pin className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    )}
                    <h3 className="font-medium text-sm truncate">
                      {thread.name || "Untitled Chat"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {folder && (
                      <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                        {React.createElement(getFolderIcon(folder.icon), {
                          className: "w-3.5 h-3.5",
                        })}
                        <span>{folder.name}</span>
                      </div>
                    )}
                    <span className="text-xs text-black/40 dark:text-white/40">
                      {new Date(
                        thread.date_modified || thread.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Move to</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => moveThreadToFolder(thread.id, null)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      No folder
                    </DropdownMenuItem>
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={() => moveThreadToFolder(thread.id, folder.id)}
                      >
                        {React.createElement(getFolderIcon(folder.icon), {
                          className: "w-4 h-4 mr-2",
                        })}
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => togglePinThread(thread.id)}
                    >
                      {thread.is_pinned ? (
                        <>
                          <PinOff className="w-4 h-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="w-4 h-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="max-w-md bg-white dark:bg-[#2f2f2f] border-black/10 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Create Folder
            </DialogTitle>
            <DialogDescription className="text-sm text-black/50 dark:text-white/50">
              Organize your conversations with a custom folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name</Label>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full h-10 px-3 rounded-xl bg-black/5 dark:bg-white/5 border-0 text-sm focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Icon</Label>
              <div className="grid grid-cols-3 gap-2">
                {FOLDER_ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setNewFolderIcon(name)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl transition-colors text-sm",
                      newFolderIcon === name
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolderColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-lg transition-all",
                      color,
                      newFolderColor === color &&
                        "ring-2 ring-offset-2 ring-black/20 dark:ring-white/20 ring-offset-white dark:ring-offset-[#2f2f2f]"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowCreateFolder(false)}
              className="px-4 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={createNewFolder}
              disabled={!newFolderName.trim()}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-black/80 dark:hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
