import { useState, useRef } from "react";

// Fix for missing types in TypeScript
type SpeechRecognition = any;
type SpeechRecognitionEvent = any;

const VoiceToText = ({ onSend }: { onSend: (text: string) => void }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          setTranscript((prev) => prev + result[0].transcript);
        } else {
          interimTranscript += result[0].transcript;
        }
      }
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const handleSend = () => {
    if (transcript.trim()) {
      onSend(transcript.trim());
      setTranscript("");
    }
  };

  return (
    <div className="p-2 border rounded-lg bg-background shadow flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={listening ? stopListening : startListening}
          className={`px-4 py-2 rounded ${
            listening ? "bg-red-500 text-white" : "bg-blue-500 text-white"
          }`}
        >
          {listening ? "Stop" : "Start"} Mic
        </button>
        <button
          onClick={handleSend}
          disabled={!transcript.trim()}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Send
        </button>
      </div>
      <textarea
        className="w-full p-2 border rounded"
        rows={4}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Speak or type here..."
      />
    </div>
  );
};

export default VoiceToText;