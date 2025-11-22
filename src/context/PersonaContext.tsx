// contexts/PersonaContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../supabase/supabaseClient";

// Database persona interface (matches Supabase schema)
export interface DatabasePersona {
  id: string;
  name: string;
  description: string;
  model_name: string;
  system_prompt?: string;
  context_summary?: string;
  chat_style?: any;
  tone_rules?: string;
  mirroring_method?: string;
  style_guide?: string;
  use_memory_rag?: boolean;
  guiding_principles?: string;
  session_priming?: string;
  // Additional fields that might be in the database
  colors?: string[];
  personality?: string;
  expertise?: string[];
  recent_topics?: string[];
  avatar?: string;
  orb_color?: string;
  chat_theme?: string;
  color?: string; // Add this field for the actual database field
  voice_id?: string | null;
  voice_model?: string | null;
  voice_settings?: any;
}

// UI persona interface (for backwards compatibility with existing components)
export interface Persona {
  id: string;
  name: string;
  description: string;
  colors: string[];
  model: string;
  personality: string;
  expertise: string[];
  recentTopics: string[];
  avatar: string;
  orbColor: string;
  chatTheme: string;
  // Additional fields from database
  systemPrompt?: string;
  contextSummary?: string;
  chatStyle?: any;
  toneRules?: string;
  mirroringMethod?: string;
  styleGuide?: string;
  useMemoryRag?: boolean;
  guidingPrinciples?: string;
  sessionPriming?: string;
  voiceId?: string;
  voiceModel?: string;
  voiceSettings?: any;
}

export type PersonaId = string; // Make it flexible to accept any string ID

export interface PersonaContextType {
  currentPersona: PersonaId | null;
  personas: Record<string, Persona>;
  loading: boolean;
  error: string | null;
  switchPersona: (personaId: PersonaId) => void;
  getCurrentPersona: () => Persona | null;
  setCurrentPersona: (personaId: PersonaId) => void;
  refreshPersonas: () => Promise<void>;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

interface PersonaProviderProps {
  children: ReactNode;
}

// Helper function to convert database persona to UI persona
const convertDatabasePersonaToUI = (dbPersona: DatabasePersona): Persona => {
  // Use the color field from database to create colors array
  const getColors = () => {
    // First check if colors exist as a direct array (for backward compatibility)
    if (dbPersona.colors && dbPersona.colors.length > 0) {
      return dbPersona.colors;
    }

    // Then check inside style_guide for colors array
    if (
      dbPersona.style_guide &&
      typeof dbPersona.style_guide === "object" &&
      (dbPersona.style_guide as any).colors
    ) {
      const styleGuideColors = (dbPersona.style_guide as any).colors;
      if (Array.isArray(styleGuideColors) && styleGuideColors.length > 0) {
        console.log(
          "🎨 Using colors from style_guide:",
          styleGuideColors,
          "for persona:",
          dbPersona.name
        );
        return styleGuideColors;
      }
    }

    // Use the 'color' field from database to create a colors array
    if (dbPersona.color) {
      // Trim whitespace and newlines from the color value
      const cleanColor = dbPersona.color.trim();
      console.log(
        "🎨 Using color from database:",
        cleanColor,
        "for persona:",
        dbPersona.name
      );
      return [cleanColor, cleanColor]; // Use color as both colors
    }
    console.log(
      "⚠️ No color found for persona:",
      dbPersona.name,
      "using defaults"
    );
    // Fallback to default colors
    return ["#fffacd", "#ffd700"];
  };

  const colors = getColors();
  console.log("🎨 Final colors for", dbPersona.name, ":", colors);

  return {
    id: dbPersona.id,
    name: dbPersona.name,
    description: dbPersona.description,
    colors: colors, // Use the new function
    model: dbPersona.model_name,
    personality: dbPersona.personality || "AI Assistant",
    expertise: dbPersona.expertise || [],
    recentTopics: dbPersona.recent_topics || [],
    avatar: dbPersona.avatar || "🌟",
    orbColor: dbPersona.color ? dbPersona.color.trim() : "#ffd700", // Also trim here
    chatTheme: dbPersona.chat_theme || "default",
    // Additional fields
    systemPrompt: dbPersona.system_prompt,
    contextSummary: dbPersona.context_summary,
    chatStyle: dbPersona.chat_style,
    toneRules: dbPersona.tone_rules,
    mirroringMethod: dbPersona.mirroring_method,
    styleGuide: dbPersona.style_guide,
    useMemoryRag: dbPersona.use_memory_rag,
    guidingPrinciples: dbPersona.guiding_principles,
    sessionPriming: dbPersona.session_priming,
    voiceId: dbPersona.voice_id?.trim() || undefined,
    voiceModel: dbPersona.voice_model?.trim() || undefined,
    voiceSettings: dbPersona.voice_settings || undefined,
  };
};

export const PersonaProvider = ({ children }: PersonaProviderProps) => {
  const [currentPersona, setCurrentPersona] = useState<PersonaId | null>(null);
  const [personas, setPersonas] = useState<Record<string, Persona>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch personas from Supabase
  const fetchPersonas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("persona")
        .select("*")
        .order("name");

      if (fetchError) {
        throw fetchError;
      }

      console.log("📊 Raw data from Supabase:", data);

      if (data && data.length > 0) {
        const convertedPersonas: Record<string, Persona> = {};
        data.forEach((dbPersona) => {
          console.log(
            "�� Converting persona:",
            dbPersona.name,
            "with color:",
            dbPersona.color
          );
          convertedPersonas[dbPersona.id] =
            convertDatabasePersonaToUI(dbPersona);
        });

        console.log("✅ Converted personas:", convertedPersonas);
        setPersonas(convertedPersonas);

        // Set the first persona as current if none is selected
        if (!currentPersona && data.length > 0) {
          setCurrentPersona(data[0].id);
        }
      } else {
        console.warn("No personas found in database");
        setPersonas({});
      }
    } catch (err) {
      console.error("Failed to fetch personas:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch personas");

      // Fallback to default persona when Supabase fails
      const defaultPersona: Persona = {
        id: "default-1",
        name: "Glow Assistant",
        description: "Your default AI assistant",
        colors: ["#8b5cf6", "#6366f1"],
        model: "gpt-4",
        personality: "Helpful and friendly",
        expertise: ["General", "Coding", "Creative"],
        recentTopics: [],
        avatar: "✨",
        orbColor: "#8b5cf6",
        chatTheme: "default",
      };
      setPersonas({ "default-1": defaultPersona });
      if (!currentPersona) {
        setCurrentPersona("default-1");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load personas on mount
  useEffect(() => {
    fetchPersonas();
  }, []);

  const switchPersona = (personaId: PersonaId) => {
    console.log("🔄 switchPersona called with:", personaId);
    console.log("🔄 Current persona before switch:", currentPersona);

    if (personas[personaId]) {
      setCurrentPersona(personaId);
      console.log("✅ Persona switched to:", personaId);

      // Dynamic import to avoid circular dependencies
      import("@/lib/notifications").then(({ notify }) => {
        notify.persona.changed(personas[personaId].name);
      });
    } else {
      console.error("❌ Invalid persona ID:", personaId);
      setError(`Persona with ID "${personaId}" not found`);
    }
  };

  const getCurrentPersona = (): Persona | null => {
    if (!currentPersona || !personas[currentPersona]) {
      return null;
    }
    return personas[currentPersona];
  };

  const refreshPersonas = async () => {
    await fetchPersonas();
  };

  return (
    <PersonaContext.Provider
      value={{
        currentPersona,
        personas,
        loading,
        error,
        switchPersona,
        getCurrentPersona,
        setCurrentPersona,
        refreshPersonas,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

// Custom hook for easy access
export const usePersona = (): PersonaContextType => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
};
