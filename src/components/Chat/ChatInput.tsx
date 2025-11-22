// src/components/ChatInput.tsx
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, ArrowUp } from 'lucide-react';

interface ChatInputProps {
  theme: 'dark' | 'light' | 'system';
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const models = ['ChatGPT 4.1', 'Groq', 'ChatGPT4.5'];

export default function ChatInput({
  theme,
  input,
  setInput,
  sendMessage,
  handleKeyDown,
}: ChatInputProps) {
  const [model, setModel] = useState(models[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
  <div
    className="
      fixed
      bottom-4
      left-1/2
      transform -translate-x-1/2
      w-full
      max-w-full
      md:max-w-[800px]
      px-4
      z-50
      chat-offset
    "
  >
    <div className="relative w-full">
      {/* Textarea input */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        rows={1}
        className={`w-full min-h-[80px] max-h-[200px] resize-none rounded-2xl border px-4 py-3 pr-14 text-sm focus:outline-none transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-transparent text-white placeholder-gray-400 border-gray-600'
            : 'bg-transparent text-black placeholder-gray-500 border-gray-300'
        }`}
      />

      {/* Model toggle dropdown button (bottom left) */}
      <div className="absolute left-3 bottom-4">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-medium transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-[#2d2d2d] border-gray-600 text-white hover:bg-gray-700'
              : 'bg-white border-gray-300 text-black hover:bg-gray-200'
          }`}
        >
          {model}
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <div
            className={`absolute mt-1 w-32 rounded-md border shadow-lg z-30 ${
              theme === 'dark'
                ? 'bg-[#2d2d2d] border-gray-600 text-white'
                : 'bg-white border-gray-300 text-black'
            }`}
          >
            {models.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setModel(m);
                  setDropdownOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-xs hover:bg-yellow-300 hover:text-black transition-colors`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Send message button (bottom right) */}
      <button
        onClick={sendMessage}
        className={`absolute right-2 bottom-4 p-1.5 rounded-[400px] transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-white text-black hover:bg-yellow-300'
            : 'bg-black text-white hover:bg-yellow-300'
        }`}
        aria-label="Send message"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  </div>
  );
}