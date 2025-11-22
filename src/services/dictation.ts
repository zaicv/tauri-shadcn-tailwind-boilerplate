// services/dictation.ts
import { useState, useRef, useCallback } from 'react';

interface UseDictationProps {
  setInput: (text: string) => void;
}

interface UseDictationReturn {
  isDictating: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startDictation: () => Promise<void>;
  stopDictation: () => void;
}

export const useDictation = ({ setInput }: UseDictationProps): UseDictationReturn => {
  // State
  const [isDictating, setIsDictating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startDictation = useCallback(async () => {
    try {
      console.log("🎤 Starting dictation...");
      setIsDictating(true);
      setIsListening(true);
      setTranscript("");
      setInterimTranscript("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎤 Microphone access granted");

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      console.log(
        "🎤 MediaRecorder created with MIME type:",
        mediaRecorder.mimeType
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(
            "🎤 Audio chunk received, size:",
            event.data.size,
            "bytes, type:",
            event.data.type
          );
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🎤 Recording stopped, processing audio...");
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        console.log("🎤 Audio blob created:");
        console.log("  - Size:", audioBlob.size, "bytes");
        console.log("  - Type:", audioBlob.type);
        console.log("  - Number of chunks:", chunksRef.current.length);

        const formData = new FormData();
        formData.append("file", audioBlob, "speech.webm");

        console.log("🎤 FormData created, sending to Whisper API endpoint...");
        console.log("  Endpoint: https://100.83.147.76:8003/transcribe");

        try {
          const response = await fetch(
            "https://100.83.147.76:8003/transcribe",
            {
              method: "POST",
              body: formData,
            }
          );

          console.log("🎤 Whisper API response received:");
          console.log("  - Status:", response.status);
          console.log("  - Status Text:", response.statusText);
          console.log("  - OK:", response.ok);

          if (response.ok) {
            const data = await response.json();
            console.log("🎤 Whisper API response data:", data);

            if (data.text) {
              const transcribedText = data.text.trim();
              console.log("🎤 Transcription successful:");
              console.log("  - Raw text:", data.text);
              console.log("  - Trimmed text:", transcribedText);
              console.log(
                "  - Text length:",
                transcribedText.length,
                "characters"
              );

              setInput(transcribedText);
              setTranscript(transcribedText);
            } else {
              console.warn("🎤 No text in Whisper API response:", data);
            }
          } else {
            const errorText = await response.text();
            console.error("🎤 Whisper API error response:", errorText);
          }
        } catch (error) {
          console.error("🎤 Transcription error:", error);
        } finally {
          console.log("🎤 Cleaning up dictation session...");
          setIsListening(false);
          setIsDictating(false);
          stream.getTracks().forEach((track) => track.stop());
          console.log("🎤 Dictation session ended");
        }
      };

      mediaRecorder.start();
      console.log("🎤 MediaRecorder started, listening for audio...");
    } catch (error) {
      console.error("🎤 Error starting dictation:", error);
      setIsListening(false);
      setIsDictating(false);
    }
  }, [setInput]);

  const stopDictation = useCallback(() => {
    console.log("🎤 Stop dictation requested");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      console.log("🎤 Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();
    } else {
      console.log(
        "🎤 MediaRecorder not in recording state:",
        mediaRecorderRef.current?.state
      );
    }
  }, []);

  return {
    isDictating,
    isListening,
    transcript,
    interimTranscript,
    startDictation,
    stopDictation,
  };
};