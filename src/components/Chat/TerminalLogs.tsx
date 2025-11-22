import React, { useEffect, useRef, useState } from "react";

const TerminalLogs = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("https://100.83.147.76:8003/logs");
        const text = await res.text();
        const lines = text.split("\n");

        setLogs((prev) => {
          if (text !== prev.join("\n")) scrollToBottom();
          return lines;
        });
      } catch (err) {
        setLogs(["Failed to fetch logs."]);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleClear = () => setLogs([]);
  const handleScrollToBottom = () => scrollToBottom();

  // Color-code based on log level keywords
  const getLogColor = (line: string) => {
    if (line.includes("ERROR")) return "text-red-500";
    if (line.includes("WARNING")) return "text-yellow-400";
    if (line.includes("INFO")) return "text-green-400";
    if (line.includes("DEBUG")) return "text-blue-400";
    return "text-gray-300";
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handleClear}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
        >
          Clear
        </button>
        <button
          onClick={handleScrollToBottom}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          Scroll to Bottom
        </button>
      </div>

      <div
        ref={containerRef}
        className="bg-black font-mono p-4 rounded h-[600px] overflow-auto whitespace-pre"
      >
        {logs.map((line, idx) => (
          <div key={idx} className={getLogColor(line)}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalLogs;
