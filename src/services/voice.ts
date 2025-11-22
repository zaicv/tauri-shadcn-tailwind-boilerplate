let audioContextInitialized = false;
let audioPermissionGranted = false;

const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DEFAULT_VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75 };
const ELEVEN_LABS_API_KEY =
  import.meta.env.VITE_ELEVENLABS_API_KEY ||
  "sk_a0e5b90da2a8a69c97237478038280f450c47579b1ea0377";

const cleanString = (value?: string | null) =>
  typeof value === "string" ? value.trim() : undefined;

export type VoiceSettings = {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  speaking_rate?: number;
};

export interface VoiceProfile {
  voiceId: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
}

export interface PersonaVoiceSource {
  id?: string;
  name?: string;
  voiceId?: string;
  voice_id?: string;
  voiceModel?: string;
  voice_model?: string;
  voiceSettings?: VoiceSettings;
  voice_settings?: VoiceSettings;
}

const PERSONA_VOICE_OVERRIDES: Record<string, VoiceProfile> = {
  phoebe: {
    voiceId: "BZgkqPqms7Kj9ulSkVzn",
    modelId: DEFAULT_MODEL_ID,
    voiceSettings: DEFAULT_VOICE_SETTINGS,
  },
  // ➕ Add more persona-specific voices here as needed.
};

const normalizeKey = (value?: string | null) =>
  value?.toLowerCase().trim() ?? "";

const resolveVoiceProfileFromPersona = (
  persona?: PersonaVoiceSource | null
): VoiceProfile | null => {
  if (!persona) return null;

  const voiceId = cleanString(persona.voiceId || persona.voice_id);
  if (!voiceId) return null;

  return {
    voiceId,
    modelId:
      cleanString(persona.voiceModel || persona.voice_model) ||
      DEFAULT_MODEL_ID,
    voiceSettings:
      persona.voiceSettings || persona.voice_settings || DEFAULT_VOICE_SETTINGS,
  };
};

const resolveVoiceProfileFromOverrides = (
  persona?: PersonaVoiceSource | null
): VoiceProfile | null => {
  if (!persona) return null;

  const keys = [persona.id, persona.name].map(normalizeKey).filter(Boolean);
  for (const key of keys) {
    if (key && PERSONA_VOICE_OVERRIDES[key]) {
      return PERSONA_VOICE_OVERRIDES[key];
    }
  }
  return null;
};

export const getVoiceProfileForPersona = (
  persona?: PersonaVoiceSource | null
): VoiceProfile | null => {
  return (
    resolveVoiceProfileFromPersona(persona) ||
    resolveVoiceProfileFromOverrides(persona)
  );
};

export const initializeAudioContext = () => {
  if (!audioContextInitialized) {
    try {
      // Just create an Audio object - this initializes the context
      new Audio();
      audioContextInitialized = true;
      console.log("Audio context initialized");
    } catch (err) {
      console.warn("Could not initialize audio context:", err);
    }
  }
};

// New function to pre-authorize audio playback
export const authorizeAudioPlayback = async () => {
  if (!audioPermissionGranted) {
    try {
      // Create a silent audio and play it to get permission
      const silentAudio = new Audio();
      silentAudio.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      silentAudio.volume = 0;

      await silentAudio.play();
      silentAudio.pause();
      audioPermissionGranted = true;
      console.log("Audio playback authorized");
    } catch (err) {
      console.warn("Could not authorize audio playback:", err);
    }
  }
};

const playVoice = async (text: string, profile: VoiceProfile) => {
  if (!profile.voiceId) return;

  if (!ELEVEN_LABS_API_KEY) {
    console.warn("Missing ElevenLabs API key - cannot play voice.");
    return;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_LABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: profile.modelId || DEFAULT_MODEL_ID,
        voice_settings: profile.voiceSettings || DEFAULT_VOICE_SETTINGS,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.statusText}`);
  }

  const audio = new Audio(URL.createObjectURL(await response.blob()));

  try {
    await audio.play();
  } catch (playError: any) {
    if (playError?.name === "NotAllowedError") {
      console.warn(
        "Audio playback blocked. User needs to interact with the page first."
      );

      if (typeof window !== "undefined" && window.alert) {
        alert(
          "Voice playback is blocked. Please click anywhere on the page first, then try again."
        );
      }
      return;
    }
    throw playError;
  }
};

export const speakWithPersonaVoice = async (
  text: string,
  persona?: PersonaVoiceSource | null
) => {
  try {
    const profile = getVoiceProfileForPersona(persona);
    if (!profile) {
      console.info(
        "[Voice] No ElevenLabs voice configured for persona:",
        persona?.name || persona?.id || "unknown"
      );
      return;
    }
    await playVoice(text, profile);
  } catch (err) {
    console.error("Persona voice TTS error:", err);
  }
};

// Deprecated helper kept for backward compatibility with older components
export const speakPhoebe = async (text: string) => {
  await speakWithPersonaVoice(text, { name: "Phoebe" });
};
