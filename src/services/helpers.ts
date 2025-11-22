import { supabase } from "../supabase/supabaseClient";

export const getOrCreateThread = async (userId: string) => {
  const { data: existing, error: fetchErr } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("user_id", userId)
    .limit(1);

  if (fetchErr) throw fetchErr;
  if (existing.length > 0) return existing[0];

  const { data: created, error: createErr } = await supabase
    .from("chat_threads")
    .insert([{ user_id: userId, name: "New Chat", model: "Groq-LLaMA3-70B" }])
    .select()
    .single();

  if (createErr) throw createErr;
  return created;
};

export const getHealthData = async (userId: string) => {
  const { data, error } = await supabase
    .from("health")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false }) // newest first
    .limit(30); // grab last 30 days, adjust as needed

  if (error) {
    console.error("Error fetching health data:", error);
    return [];
  }
  return data;
};

export const getPersonaColor = (personaName?: string) => {
  switch (personaName?.toLowerCase()) {
    case "phoebe":
      return "#facc15";
    case "kai":
      return "#3b82f6";
    case "luna":
      return "#10b981";
    default:
      return "#9ca3af";
  }
};
export { supabase };

