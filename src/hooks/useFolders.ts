import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabase/supabaseClient";

export type Thread = {
  id: string;
  name: string;
  created_at: string;
  date_modified: string | null;
  folder_id?: string | null;
  is_pinned?: boolean;
};

export type Folder = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  is_expanded: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const DEFAULT_FOLDERS = [
  {
    name: "🥩Gain my set point & heal my body",
    icon: "Heart",
    color: "bg-red-500",
  },
  { name: "🍽️Adapt My Diet", icon: "Book", color: "bg-green-500" },
  { name: "✵The Glow (mk VII)", icon: "Star", color: "bg-purple-500" },
  { name: "✶Isaiah", icon: "Heart", color: "bg-pink-500" },
  { name: "👧🏽Ava", icon: "Heart", color: "bg-orange-500" },
  { name: "💕Marissa", icon: "Heart", color: "bg-cyan-500" },
  { name: "🏡Family", icon: "Heart", color: "bg-yellow-500" },
  { name: "💸Money + Admin", icon: "Briefcase", color: "bg-indigo-500" },
  { name: "⭐️The Glow / Mortal Brand", icon: "Star", color: "bg-blue-500" },
  {
    name: "☕️Coffee Truck / Content",
    icon: "Lightbulb",
    color: "bg-green-500",
  },
  { name: "🎓College / Career", icon: "Book", color: "bg-purple-500" },
  { name: "🏃🏽‍♂️Physical Reconditioning", icon: "Heart", color: "bg-red-500" },
];

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  const createDefaultFolders = useCallback(async (userId: string) => {
    try {
      const foldersToCreate = DEFAULT_FOLDERS.map((folder, index) => ({
        user_id: userId,
        name: folder.name,
        description: `A collection of ${folder.name.toLowerCase()} conversations`,
        icon: folder.icon,
        color: folder.color,
        is_expanded: true,
        sort_order: index,
      }));

      const { data, error } = await supabase
        .from("chat_folders")
        .insert(foldersToCreate)
        .select();

      if (!error && data) {
        setFolders(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error creating default folders:", error);
      return false;
    }
  }, []);

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data } = await supabase
        .from("chat_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });

      // If no folders exist, create default ones
      if (!data || data.length === 0) {
        await createDefaultFolders(user.id);
      } else {
        setFolders(data);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    } finally {
      setLoading(false);
    }
  }, [createDefaultFolders]);

  const loadThreads = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("is_pinned", { ascending: false })
        .order("date_modified", { ascending: false });

      setThreads(data || []);
    } catch (error) {
      console.error("Error loading threads:", error);
    }
  }, []);

  const createFolder = useCallback(
    async (folderData: {
      name: string;
      icon: string;
      color: string;
      description?: string;
    }) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return null;

        const { data: newFolder, error } = await supabase
          .from("chat_folders")
          .insert([
            {
              user_id: user.id,
              name: folderData.name.trim(),
              description: folderData.description || "",
              icon: folderData.icon,
              color: folderData.color,
              is_expanded: true,
              sort_order: folders.length,
            },
          ])
          .select()
          .single();

        if (!error && newFolder) {
          setFolders((prev) => [...prev, newFolder]);
          return newFolder;
        }
        return null;
      } catch (error) {
        console.error("Error creating folder:", error);
        return null;
      }
    },
    [folders.length]
  );

  const updateFolder = useCallback(
    async (folderId: string, updates: Partial<Folder>) => {
      try {
        const { error } = await supabase
          .from("chat_folders")
          .update(updates)
          .eq("id", folderId);

        if (!error) {
          setFolders((prev) =>
            prev.map((folder) =>
              folder.id === folderId ? { ...folder, ...updates } : folder
            )
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating folder:", error);
        return false;
      }
    },
    []
  );

  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      // Move threads out of this folder first
      await supabase
        .from("chat_threads")
        .update({ folder_id: null })
        .eq("folder_id", folderId);

      const { error } = await supabase
        .from("chat_folders")
        .delete()
        .eq("id", folderId);

      if (!error) {
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setThreads((prev) =>
          prev.map((t) =>
            t.folder_id === folderId ? { ...t, folder_id: null } : t
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting folder:", error);
      return false;
    }
  }, []);

  const moveThreadToFolder = useCallback(
    async (threadId: string, folderId: string | null) => {
      try {
        const { error } = await supabase
          .from("chat_threads")
          .update({
            folder_id: folderId,
            date_modified: new Date().toISOString(),
          })
          .eq("id", threadId);

        if (!error) {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === threadId ? { ...t, folder_id: folderId } : t
            )
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error moving thread:", error);
        return false;
      }
    },
    []
  );

  const togglePinThread = useCallback(
    async (threadId: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return false;

      const newPinnedState = !thread.is_pinned;
      try {
        const { error } = await supabase
          .from("chat_threads")
          .update({
            is_pinned: newPinnedState,
            date_modified: new Date().toISOString(),
          })
          .eq("id", threadId);

        if (!error) {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === threadId ? { ...t, is_pinned: newPinnedState } : t
            )
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error toggling pin:", error);
        return false;
      }
    },
    [threads]
  );

  const refreshData = useCallback(async () => {
    await Promise.all([loadFolders(), loadThreads()]);
  }, [loadFolders, loadThreads]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    folders,
    threads,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveThreadToFolder,
    togglePinThread,
    refreshData,
  };
}
