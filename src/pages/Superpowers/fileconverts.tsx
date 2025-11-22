import {
  AlertCircle,
  Check,
  Copy,
  Crop,
  Download,
  File,
  FileAudio,
  FileImage,
  FileType,
  FileVideo,
  Loader,
  Mic,
  Package,
  Plus,
  X,
  Zap
} from "lucide-react";
import { useRef, useState } from "react";

import { useTheme } from "@/context/ThemeContext";
import { FileModal } from "../../components/Files/FileModal";
import { useWebSocket } from "../../hooks/useWebSocket";

const FORMATS = {
  video: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v'],
  audio: ['mp3', 'aac', 'wav', 'flac', 'ogg', 'm4a', 'opus'],
  image: ['jpg', 'png', 'webp', 'gif', 'bmp', 'tiff']
};

const ASPECT_RATIOS = [
  { label: 'None', value: '' },
  { label: '16:9 (Widescreen)', value: '16/9' },
  { label: '4:3 (Standard)', value: '4/3' },
  { label: '21:9 (Ultrawide)', value: '21/9' },
  { label: '1:1 (Square)', value: '1/1' },
  { label: '9:16 (Vertical)', value: '9/16' }
];

interface ConversionProgress {
  progress?: number;
  current?: string;
  total?: string;
  speed?: number;
  eta?: number;
  message?: string;
}

interface ConversionResult {
  filename: string;
  downloadUrl?: string;
  transcript?: string;
  error?: string;
  status: 'success' | 'error';
}

const FileConverts = () => {
  const { isDark } = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState("mp4");
  const [mode, setMode] = useState("convert");
  const [aspectRatio, setAspectRatio] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState(
    "/Users/zai/Desktop/converted"
  );
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);

  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ConversionResult[]>([]);
  
  // Transcription state
  const [whisperModel, setWhisperModel] = useState("base");
  const [transcriptFormat, setTranscriptFormat] = useState("txt");
  const [language, setLanguage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const clientId = useRef(
    `fileconvert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const { isConnected, registerDownloadSession } = useWebSocket(
    clientId.current,
    (message) => {
      if (
        message.type === "convert_progress" &&
        message.session_id === currentSession.current
      ) {
        const d = message.data;

        if (d.status === "complete") {
          setResults(prev => [...prev, {
            filename: d.filename,
            downloadUrl: d.download_url,
            status: 'success'
          }]);
          
          if (files.length === results.length + 1) {
            setConverting(false);
            setConversionProgress(null);
          }
        } else if (d.status === "error") {
          setResults(prev => [...prev, {
            filename: files[results.length]?.name,
            error: d.message || "Conversion failed",
            status: 'error'
          }]);
          
          if (files.length === results.length + 1) {
            setConverting(false);
            setConversionProgress(null);
          }
        } else {
          setConversionProgress({
            progress: d.progress,
            current: d.current,
            total: d.total,
            speed: d.speed,
            eta: d.eta,
          });
        }
      } else if (
        message.type === "transcribe_progress" &&
        message.session_id === currentSession.current
      ) {
        const d = message.data;

        if (d.status === "complete") {
          setResults(prev => [...prev, {
            filename: d.filename,
            downloadUrl: d.download_url,
            transcript: d.transcript,
            status: 'success'
          }]);
          
          if (files.length === results.length + 1) {
            setConverting(false);
            setConversionProgress(null);
          }
        } else if (d.status === "error") {
          setResults(prev => [...prev, {
            filename: files[results.length]?.name,
            error: d.message || "Transcription failed",
            status: 'error'
          }]);
          
          if (files.length === results.length + 1) {
            setConverting(false);
            setConversionProgress(null);
          }
        } else {
          setConversionProgress({
            message: d.message || "Processing...",
          });
        }
      }
    }
  );

  const currentSession = useRef<string | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startConversion = async () => {
    if (files.length === 0) return;

    setError("");
    setResults([]);
    setConverting(true);

    for (const file of files) {
      const sessionId = `${mode === 'transcribe' ? 'transcribe' : 'convert'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      currentSession.current = sessionId;
      
      registerDownloadSession(sessionId);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("session_id", sessionId);
      formData.append("client_id", clientId.current);
      formData.append("output_directory", selectedDirectory);
      
      let endpoint = "stream-convert";
      
      if (mode === "transcribe") {
        formData.append("model", whisperModel);
        formData.append("output_format", transcriptFormat);
        if (language) {
          formData.append("language", language);
        }
        endpoint = "stream-transcribe";
      } else {
        formData.append("target_format", targetFormat);
        
        if (mode === "aspect" && aspectRatio) {
          formData.append("aspect_ratio", aspectRatio);
        }
        if (mode === "remux") {
          formData.append("remux_only", "true");
        }
      }

      try {
        const res = await fetch(
          `https://100.83.147.76:8003/api/superpowers/file_converter/${endpoint}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `Failed to start ${mode === 'transcribe' ? 'transcription' : 'conversion'}`);
        }
      } catch (err) {
        const error = err as Error;
        setResults(prev => [...prev, {
          filename: file.name,
          error: error.message,
          status: 'error'
        }]);
      }
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const renderFileIcon = (file: File | null) => {
    if (!file) return <FileType className="w-5 h-5 text-gray-300" />;
    const type = file.type;

    if (type.includes("video")) return <FileVideo className="w-5 h-5 text-blue-500" />;
    if (type.includes("audio")) return <FileAudio className="w-5 h-5 text-green-500" />;
    if (type.includes("image")) return <FileImage className="w-5 h-5 text-purple-500" />;

    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? "bg-[#212121]" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileType className="w-8 h-8 text-white" />
          </div>

          <h1 className={`text-3xl font-semibold mb-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
            File Converter
          </h1>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>Convert files using FFmpeg & Glow Superpowers</p>

          <div className="mt-4 flex items-center justify-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Mode
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'convert', icon: Zap, label: 'Convert Format' },
              { id: 'aspect', icon: Crop, label: 'Fix Aspect Ratio' },
              { id: 'remux', icon: Package, label: 'Remux' },
              { id: 'transcribe', icon: Mic, label: 'Transcribe Audio' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                  mode === m.id
                    ? isDark
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : isDark
                    ? 'border-gray-700 bg-[#2f2f2f] text-gray-300 hover:border-gray-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <m.icon className="w-5 h-5" />
                <span className="font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center hover:border-blue-500 transition cursor-pointer ${
            isDark ? "border-gray-700" : "border-gray-300"
          }`}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input
            id="fileInput"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <Plus className={`w-8 h-8 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          <p className={isDark ? "text-gray-300" : "text-gray-700"}>
            {files.length === 0 ? "Click to upload files" : `${files.length} file${files.length !== 1 ? 's' : ''} selected`}
          </p>
          <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>Supports batch conversion</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className={`mt-6 p-4 rounded-xl border ${
            isDark ? "bg-[#2f2f2f] border-gray-700" : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}>Files to Convert</h3>
              <button
                onClick={() => setFiles([])}
                className={`text-sm ${isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-700"}`}
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                  isDark ? "bg-[#1a1a1a] border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {renderFileIcon(file)}
                    <span className={`text-sm truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>{file.name}</span>
                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className={`ml-2 ${isDark ? "text-gray-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Options */}
        {files.length > 0 && (
          <div className={`mt-6 p-6 rounded-xl border ${
            isDark ? "bg-[#2f2f2f] border-gray-700" : "bg-gray-50 border-gray-200"
          }`}>
            <h3 className={`font-medium mb-4 ${isDark ? "text-gray-100" : "text-gray-900"}`}>Settings</h3>
            
            <div className="space-y-4">
              {/* Format Selection */}
              {(mode === "convert" || mode === "remux") && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Target Format
                  </label>
                  <select
                    className={`w-full border p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDark 
                        ? "border-gray-700 bg-[#1a1a1a] text-gray-100" 
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value)}
                  >
                    <optgroup label="Video">
                      {FORMATS.video.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Audio">
                      {FORMATS.audio.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Image">
                      {FORMATS.image.map(f => (
                        <option key={f} value={f}>{f.toUpperCase()}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Aspect Ratio */}
              {mode === "aspect" && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Aspect Ratio
                  </label>
                  <select
                    className={`w-full border p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isDark 
                        ? "border-gray-700 bg-[#1a1a1a] text-gray-100" 
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    {ASPECT_RATIOS.map(ar => (
                      <option key={ar.value} value={ar.value}>{ar.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transcription Options */}
              {mode === "transcribe" && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Whisper Model
                    </label>
                    <select
                      className={`w-full border p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDark 
                          ? "border-gray-700 bg-[#1a1a1a] text-gray-100" 
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      value={whisperModel}
                      onChange={(e) => setWhisperModel(e.target.value)}
                    >
                      <option value="tiny">Tiny (fastest, least accurate)</option>
                      <option value="base">Base (recommended)</option>
                      <option value="small">Small (better accuracy)</option>
                      <option value="medium">Medium (high accuracy)</option>
                      <option value="large">Large (best accuracy, slowest)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Output Format
                    </label>
                    <select
                      className={`w-full border p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDark 
                          ? "border-gray-700 bg-[#1a1a1a] text-gray-100" 
                          : "border-gray-300 bg-white text-gray-900"
                      }`}
                      value={transcriptFormat}
                      onChange={(e) => setTranscriptFormat(e.target.value)}
                    >
                      <option value="txt">Text</option>
                      <option value="json">JSON</option>
                      <option value="srt">SRT (Subtitles)</option>
                      <option value="vtt">VTT (Web Subtitles)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Language (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., en, es, fr (auto-detect if empty)"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={`w-full border p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        isDark 
                          ? "border-gray-700 bg-[#1a1a1a] text-gray-100 placeholder-gray-500" 
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                      }`}
                    />
                  </div>
                </>
              )}

              {/* Directory Picker */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Output Directory
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedDirectory}
                    className={`flex-1 px-3 py-2 border rounded-lg ${
                      isDark 
                        ? "border-gray-700 bg-[#1a1a1a] text-gray-300" 
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                  <button
                    onClick={() => setShowDirectoryPicker(true)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark 
                        ? "bg-gray-700 text-white hover:bg-gray-600" 
                        : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>

            {/* Convert/Transcribe Button */}
            <button
              onClick={startConversion}
              className="mt-6 w-full bg-blue-500 text-white py-3 rounded-xl shadow hover:bg-blue-600 transition font-medium"
              disabled={converting}
            >
              {converting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>
                    {mode === 'transcribe' ? 'Transcribing' : 'Converting'} {results.length + 1} of {files.length}...
                  </span>
                </div>
              ) : (
                `${mode === 'transcribe' ? 'Transcribe' : 'Convert'} ${files.length} File${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        )}

        {/* Progress */}
        {converting && conversionProgress && (
          <div className={`mt-6 p-4 rounded-xl border ${
            isDark ? "bg-[#2f2f2f] border-gray-700" : "bg-gray-50 border-gray-200"
          }`}>
            {mode === 'transcribe' ? (
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 animate-spin text-blue-500" />
                <div>
                  <p className={`font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                    Transcribing...
                  </p>
                  {conversionProgress.message && (
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {conversionProgress.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className={`font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  Converting... {conversionProgress.progress}%
                </p>
                <div className={`w-full rounded-full h-2 mb-2 ${
                  isDark ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${conversionProgress.progress}%` }}
                  />
                </div>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {conversionProgress.current} / {conversionProgress.total}
                </p>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}>Results</h3>
            {results.map((result, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  result.status === 'success'
                    ? isDark
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-green-50 border-green-200'
                    : isDark
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {result.status === 'success' ? (
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className={`font-medium ${isDark ? "text-green-300" : "text-green-900"}`}>{result.filename}</p>
                        <p className={`text-sm ${isDark ? "text-green-400" : "text-green-700"}`}>
                          {result.transcript ? 'Transcription complete' : 'Conversion complete'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {result.transcript && (
                          <button
                            onClick={() => copyToClipboard(result.transcript || '', i)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                          >
                            {copiedIndex === i ? (
                              <>
                                <Check className="w-4 h-4" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" /> Copy
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(result.downloadUrl || '', result.filename)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" /> Download
                        </button>
                      </div>
                    </div>
                    
                    {result.transcript && (
                      <div className={`mt-3 p-3 rounded-lg border ${
                        isDark 
                          ? "bg-[#1a1a1a] border-green-500/30" 
                          : "bg-white border-green-200"
                      }`}>
                        <p className={`text-xs font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Transcript:</p>
                        <div className={`text-sm max-h-64 overflow-y-auto whitespace-pre-wrap ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        }`}>
                          {result.transcript}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className={`font-medium flex items-center gap-2 ${
                      isDark ? "text-red-300" : "text-red-900"
                    }`}>
                      <AlertCircle className="w-4 h-4" /> {result.filename}
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? "text-red-400" : "text-red-700"}`}>{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={`mt-6 p-4 border rounded-xl ${
            isDark 
              ? "bg-red-500/10 border-red-500/30" 
              : "bg-red-50 border-red-200"
          }`}>
            <p className={`font-medium flex items-center ${
              isDark ? "text-red-300" : "text-red-800"
            }`}>
              <AlertCircle className="w-4 h-4 mr-2" /> Error
            </p>
            <p className={`text-sm mt-1 ${isDark ? "text-red-400" : "text-red-700"}`}>{error}</p>
          </div>
        )}

        {/* Directory Picker Modal */}
        {showDirectoryPicker && (
          <FileModal
            isOpen={showDirectoryPicker}
            onClose={() => setShowDirectoryPicker(false)}
            onSelect={(path) => {
              setSelectedDirectory(path);
              setShowDirectoryPicker(false);
            }}
            mode="directory"
            title="Select Output Directory"
          />
        )}
      </div>
    </div>
  );
};

export default FileConverts;