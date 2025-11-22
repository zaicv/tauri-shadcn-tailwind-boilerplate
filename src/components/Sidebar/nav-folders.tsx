// src/components/Sidebar/nav-folders.tsx
"use client";

import * as React from "react";
import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
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
} from "lucide-react";
import { useFolders } from "@/hooks/useFolders";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Types are now imported from the hook

// Folder icons and colors
const FOLDER_ICONS = [
  { name: "Star", icon: Star, color: "text-yellow-500" },
  { name: "Archive", icon: Archive, color: "text-blue-500" },
  { name: "Code", icon: Code, color: "text-green-500" },
  { name: "Book", icon: BookOpen, color: "text-purple-500" },
  { name: "Briefcase", icon: Briefcase, color: "text-indigo-500" },
  { name: "Heart", icon: Heart, color: "text-pink-500" },
  { name: "Lightbulb", icon: Lightbulb, color: "text-orange-500" },
  { name: "Settings", icon: Settings, color: "text-gray-500" },
  { name: "Palette", icon: Palette, color: "text-cyan-500" },
];

const FOLDER_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
  "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
  "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300",
  "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-300",
  "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300",
  "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950 dark:border-cyan-800 dark:text-cyan-300",
  "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300",
  "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300",
];

export function NavFolders() {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const { isDark } = useTheme();
  const {
    folders,
    threads,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveThreadToFolder,
    togglePinThread,
  } = useFolders();

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("Star");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  // Data loading is now handled by the useFolders hook

  const getFolderIcon = (iconName: string) => {
    const iconConfig = FOLDER_ICONS.find((icon) => icon.name === iconName);
    return iconConfig ? iconConfig.icon : Folder;
  };

  const getFolderIconColor = (iconName: string) => {
    const iconConfig = FOLDER_ICONS.find((icon) => icon.name === iconName);
    return iconConfig ? iconConfig.color : "text-gray-500";
  };

  const handleOpenThread = (id: string) => {
    navigate(`/chat/${id}`);
    if (isMobile) setOpenMobile(false);
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) return;

    const newFolder = await createFolder({
      name: newFolderName.trim(),
      description: `A collection of ${newFolderName.toLowerCase()} conversations`,
      icon: newFolderIcon,
      color: newFolderColor,
    });

    if (newFolder) {
      setNewFolderName("");
      setNewFolderIcon("Star");
      setNewFolderColor(FOLDER_COLORS[0]);
      setShowCreateFolder(false);
    }
  };

  const toggleFolder = async (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;

    const newExpandedState = !folder.is_expanded;
    await updateFolder(folderId, { is_expanded: newExpandedState });
  };

  const saveFolderName = async (folderId: string) => {
    const name = draftNames[folderId]?.trim();
    setEditingFolderId(null);
    if (!name) return;

    await updateFolder(folderId, { name });
  };

  // Functions are now available directly from the hook

  // Separate pinned and unpinned threads
  const pinnedThreads = threads.filter((t) => t.is_pinned && !t.folder_id);
  const ungroupedThreads = threads.filter((t) => !t.is_pinned && !t.folder_id);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Folders</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible defaultOpen={false} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Organize Conversations">
                <Folder />
                <span>Organize</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {/* Create Folder Button */}
                <SidebarMenuSubItem>
                  <Dialog
                    open={showCreateFolder}
                    onOpenChange={setShowCreateFolder}
                  >
                    <DialogTrigger asChild>
                      <SidebarMenuSubButton>
                        <FolderPlus className="h-3 w-3" />
                        <span>Create Folder</span>
                      </SidebarMenuSubButton>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 shadow-2xl">
                      <DialogHeader className="space-y-3 pb-4">
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-600/20">
                            <FolderPlus className="w-6 h-6 text-blue-400" />
                          </div>
                          Create New Folder
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-base">
                          Organize your conversations with custom folders and
                          themes.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-8 py-6">
                        {/* Folder Name Section */}
                        <div className="space-y-3">
                          <Label
                            htmlFor="folder-name"
                            className="text-white font-semibold text-sm"
                          >
                            Folder Name
                          </Label>
                          <Input
                            id="folder-name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Enter folder name..."
                            className="h-12 bg-white/10 border-gray-600 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Icon Selection Section */}
                        <div className="space-y-4">
                          <Label className="text-white font-semibold text-sm">
                            Choose Icon
                          </Label>
                          <div className="grid grid-cols-3 gap-3">
                            {FOLDER_ICONS.map(({ name, icon: Icon, color }) => (
                              <Button
                                key={name}
                                variant={
                                  newFolderIcon === name ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setNewFolderIcon(name)}
                                className={`h-14 justify-start gap-3 transition-all duration-200 ${
                                  newFolderIcon === name
                                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-lg"
                                    : "bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10 hover:border-gray-500"
                                }`}
                              >
                                <Icon
                                  className={`w-5 h-5 ${
                                    newFolderIcon === name
                                      ? "text-white"
                                      : color
                                  }`}
                                />
                                <span className="text-xs font-medium">
                                  {name}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Color Theme Section */}
                        <div className="space-y-4">
                          <Label className="text-white font-semibold text-sm">
                            Color Theme
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            {FOLDER_COLORS.map((color, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setNewFolderColor(color)}
                                className={`h-12 rounded-lg border-2 transition-all duration-200 ${
                                  newFolderColor === color
                                    ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 scale-105"
                                    : "hover:scale-105"
                                } ${color}`}
                              >
                                <span className="text-sm font-semibold">
                                  {color.includes("blue") && "Blue"}
                                  {color.includes("green") && "Green"}
                                  {color.includes("purple") && "Purple"}
                                  {color.includes("pink") && "Pink"}
                                  {color.includes("orange") && "Orange"}
                                  {color.includes("cyan") && "Cyan"}
                                  {color.includes("yellow") && "Yellow"}
                                  {color.includes("indigo") && "Indigo"}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Preview Section */}
                        {newFolderName && (
                          <div className="space-y-3">
                            <Label className="text-white font-semibold text-sm">
                              Preview
                            </Label>
                            <div
                              className={`p-4 rounded-lg border-2 ${newFolderColor} transition-all duration-200`}
                            >
                              <div className="flex items-center gap-3">
                                {React.createElement(
                                  getFolderIcon(newFolderIcon),
                                  {
                                    className: `w-6 h-6 ${getFolderIconColor(
                                      newFolderIcon
                                    )}`,
                                  }
                                )}
                                <div>
                                  <p className="font-semibold text-lg">
                                    {newFolderName}
                                  </p>
                                  <p className="text-sm opacity-80">
                                    A collection of{" "}
                                    {newFolderName.toLowerCase()} conversations
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="gap-3 pt-4 border-t border-gray-700">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateFolder(false)}
                          className="flex-1 h-11 bg-white/5 border-gray-600 text-gray-300 hover:bg-white/10 hover:border-gray-500"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createNewFolder}
                          disabled={!newFolderName.trim()}
                          className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FolderPlus className="w-4 h-4 mr-2" />
                          Create Folder
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </SidebarMenuSubItem>

                {/* Pinned Threads */}
                {pinnedThreads.length > 0 && (
                  <>
                    <SidebarMenuSubItem>
                      <div className={`px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider font-medium transition-colors duration-200 ${
                        isDark ? "text-white/50" : "text-gray-500"
                      }`}>
                        Pinned
                      </div>
                    </SidebarMenuSubItem>
                    {pinnedThreads.map((thread) => (
                      <SidebarMenuSubItem key={thread.id}>
                        <div className="group/thread relative">
                          <SidebarMenuSubButton
                            onClick={() => handleOpenThread(thread.id)}
                            className="w-full pr-8"
                          >
                            <Pin className="h-3 w-3 text-yellow-500" />
                            <span className="truncate">
                              {thread.name || "Untitled Chat"}
                            </span>
                          </SidebarMenuSubButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/thread:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              className={`w-44 rounded-lg backdrop-blur-xl transition-colors duration-200 ${
                                isDark 
                                  ? "bg-black/95 border-white/10 text-white" 
                                  : "bg-white border-gray-200 text-black"
                              }`}
                            >
                              <DropdownMenuLabel>
                                Move to folder
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                              <DropdownMenuItem
                                onClick={() =>
                                  moveThreadToFolder(thread.id, null)
                                }
                              >
                                <MessageSquare className="h-4 w-4" />
                                <span>Ungrouped</span>
                              </DropdownMenuItem>
                              {folders.map((folder) => (
                                <DropdownMenuItem
                                  key={folder.id}
                                  onClick={() =>
                                    moveThreadToFolder(thread.id, folder.id)
                                  }
                                >
                                  <span className="mr-2">
                                    {folder.name.charAt(0)}
                                  </span>
                                  {folder.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                              <DropdownMenuItem
                                onClick={() => togglePinThread(thread.id)}
                              >
                                <PinOff className="h-4 w-4" />
                                <span>Unpin</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuSubItem>
                    ))}
                  </>
                )}

                {/* Folders */}
                {folders.map((folder) => {
                  const threadsInFolder = threads.filter(
                    (thread) => thread.folder_id === folder.id
                  );

                  return (
                    <SidebarMenuSubItem key={folder.id}>
                      <div className="group/folder">
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFolder(folder.id)}
                            className="h-6 w-6 p-0 mr-2 hover:bg-white/10"
                          >
                            {folder.is_expanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </Button>
                          <span className="text-sm mr-2">
                            {folder.name.charAt(0)}
                          </span>
                          {editingFolderId === folder.id ? (
                            <Input
                              type="text"
                              value={draftNames[folder.id] || folder.name}
                              onChange={(e) =>
                                setDraftNames((prev) => ({
                                  ...prev,
                                  [folder.id]: e.target.value,
                                }))
                              }
                              onBlur={() => saveFolderName(folder.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  saveFolderName(folder.id);
                                if (e.key === "Escape")
                                  setEditingFolderId(null);
                              }}
                              className={`flex-1 h-6 text-sm bg-transparent border-none p-0 focus-visible:ring-0 transition-colors duration-200 ${
                                isDark ? "text-white" : "text-black"
                              }`}
                              autoFocus
                            />
                          ) : (
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className={`text-sm font-semibold truncate transition-colors duration-200 ${
                                isDark ? "text-white" : "text-black"
                              }`}>
                                {folder.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs h-4 px-1.5 transition-colors duration-200 ${
                                  isDark ? "bg-white/10 text-white/70" : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {threadsInFolder.length}
                              </Badge>
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="opacity-0 group-hover/folder:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
                                <MoreVertical className="w-3 h-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              className={`w-44 rounded-lg backdrop-blur-xl transition-colors duration-200 ${
                                isDark 
                                  ? "bg-black/95 border-white/10 text-white" 
                                  : "bg-white border-gray-200 text-black"
                              }`}
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingFolderId(folder.id);
                                  setDraftNames((prev) => ({
                                    ...prev,
                                    [folder.id]: folder.name,
                                  }));
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                                <span>Rename</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                              <DropdownMenuItem
                                onClick={() => deleteFolder(folder.id)}
                                className="text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {folder.is_expanded && threadsInFolder.length > 0 && (
                          <div className="ml-6 mt-1 space-y-1">
                            {threadsInFolder.map((thread) => (
                              <div
                                key={thread.id}
                                className="group/thread relative flex items-center rounded-md hover:bg-white/10 transition-colors p-1"
                              >
                                <MessageSquare className="w-3 h-3 mr-2 opacity-60" />
                                <button
                                  onClick={() => handleOpenThread(thread.id)}
                                  className={`flex-1 text-left text-xs truncate transition-colors duration-200 ${
                                    isDark 
                                      ? "text-white/80 hover:text-white" 
                                      : "text-gray-600 hover:text-black"
                                  }`}
                                >
                                  {thread.name || "Untitled Chat"}
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="opacity-0 group-hover/thread:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
                                      <MoreVertical className="w-3 h-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    side="right"
                                    align="start"
                                    className={`w-44 rounded-lg backdrop-blur-xl transition-colors duration-200 ${
                                isDark 
                                  ? "bg-black/95 border-white/10 text-white" 
                                  : "bg-white border-gray-200 text-black"
                              }`}
                                  >
                                    <DropdownMenuLabel>
                                      Move to folder
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        moveThreadToFolder(thread.id, null)
                                      }
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                      <span>Ungrouped</span>
                                    </DropdownMenuItem>
                                    {folders
                                      .filter((f) => f.id !== folder.id)
                                      .map((otherFolder) => (
                                        <DropdownMenuItem
                                          key={otherFolder.id}
                                          onClick={() =>
                                            moveThreadToFolder(
                                              thread.id,
                                              otherFolder.id
                                            )
                                          }
                                        >
                                          <span className="mr-2">
                                            {otherFolder.name.charAt(0)}
                                          </span>
                                          {otherFolder.name}
                                        </DropdownMenuItem>
                                      ))}
                                    <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                                    <DropdownMenuItem
                                      onClick={() => togglePinThread(thread.id)}
                                    >
                                      {thread.is_pinned ? (
                                        <>
                                          <PinOff className="h-4 w-4" />
                                          <span>Unpin</span>
                                        </>
                                      ) : (
                                        <>
                                          <Pin className="h-4 w-4" />
                                          <span>Pin</span>
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </SidebarMenuSubItem>
                  );
                })}

                {/* Ungrouped Threads */}
                {ungroupedThreads.length > 0 && (
                  <>
                    <SidebarMenuSubItem>
                      <div className={`px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider font-medium transition-colors duration-200 ${
                        isDark ? "text-white/50" : "text-gray-500"
                      }`}>
                        Recent
                      </div>
                    </SidebarMenuSubItem>
                    {ungroupedThreads.slice(0, 5).map((thread) => (
                      <SidebarMenuSubItem key={thread.id}>
                        <div className="group/thread relative">
                          <SidebarMenuSubButton
                            onClick={() => handleOpenThread(thread.id)}
                            className="w-full pr-8"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span className="truncate">
                              {thread.name || "Untitled Chat"}
                            </span>
                          </SidebarMenuSubButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/thread:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              side="right"
                              align="start"
                              className={`w-44 rounded-lg backdrop-blur-xl transition-colors duration-200 ${
                                isDark 
                                  ? "bg-black/95 border-white/10 text-white" 
                                  : "bg-white border-gray-200 text-black"
                              }`}
                            >
                              <DropdownMenuLabel>
                                Move to folder
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                              {folders.map((folder) => (
                                <DropdownMenuItem
                                  key={folder.id}
                                  onClick={() =>
                                    moveThreadToFolder(thread.id, folder.id)
                                  }
                                >
                                  <span className="mr-2">
                                    {folder.name.charAt(0)}
                                  </span>
                                  {folder.name}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator className={`transition-colors duration-200 ${
                                isDark ? "bg-white/10" : "bg-gray-200"
                              }`} />
                              <DropdownMenuItem
                                onClick={() => togglePinThread(thread.id)}
                              >
                                <Pin className="h-4 w-4" />
                                <span>Pin</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuSubItem>
                    ))}
                  </>
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
