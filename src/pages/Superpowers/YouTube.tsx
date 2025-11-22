import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Download,
  Play,
  Clock,
  Eye,
  User,
  Server,
  Loader,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight,
  Music,
  Video,
  Plus,
  Upload,
} from "lucide-react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { FileModal } from "../../components/Files/FileModal";

const YouTubeDownloader = () => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloadedFile, setDownloadedFile] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [customFilename, setCustomFilename] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState(
    "/Users/zai/Desktop/plex/Podcasts"
  );
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [addingToPlex, setAddingToPlex] = useState(false);
  const [plexSuccess, setPlexSuccess] = useState("");

  // Add the missing inputRef
  const inputRef = useRef(null);

  // Generate unique client ID
  const clientId = useRef(
    `youtube-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // WebSocket connection
  const { isConnected, sendMessage, registerDownloadSession } = useWebSocket(
    clientId.current,
    (message) => {
      console.log("WebSocket message received:", message); // Debug log

      if (
        message.type === "download_progress" &&
        message.session_id === currentSessionId
      ) {
        const progressData = message.data;
        console.log("Progress data:", progressData); // Debug log

        if (progressData.status === "complete") {
          setDownloadedFile({
            filename: progressData.filename,
            downloadUrl: progressData.download_url,
            title: progressData.title || "Downloaded file",
          });
          setSuccess(
            `Successfully downloaded: ${progressData.title || "file"}`
          );
          setDownloading(false);
          setDownloadProgress(null); // Clear progress
        } else if (progressData.status === "error") {
          setError(progressData.message || "Download failed");
          setDownloading(false);
          setDownloadProgress(null); // Clear progress
        } else {
          // Update progress with actual values
          setDownloadProgress({
            progress: progressData.progress || 0,
            downloaded: progressData.downloaded || 0,
            total: progressData.total || 0,
            eta: progressData.eta || 0,
            speed: progressData.speed || 0,
            status: progressData.status || "downloading",
          });
        }
      }
    }
  );

  // Mock API calls - replace with your actual YouTube superpower calls
  const searchYouTube = async (searchQuery) => {
    setLoading(true);
    setError("");

    try {
      // This would call your YouTube search API
      const response = await fetch(
        "https://100.83.147.76:8003/api/search-youtube",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        }
      );

      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();

      // Mock results structure based on your existing search
      setSearchResults(data.results || []);
    } catch (err) {
      setError("Search failed. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVideoInfo = async (url) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://100.83.147.76:8003/api/superpowers/youtube/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intent: "get_video_info",
            kwargs: { url },
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.result && !data.result.error) {
        setVideoInfo(data.result);
        setSelectedVideo(url);
      } else {
        throw new Error(data.result?.error || "Failed to get video info");
      }
    } catch (err) {
      setError(err.message);
      console.error("Video info error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (format = "mp4") => {
    if (!selectedVideo) return;

    setDownloading(true);
    setError("");
    setSuccess("");
    setDownloadProgress({
      progress: 0,
      downloaded: 0,
      total: 0,
      eta: 0,
      speed: 0,
    });
    setDownloadedFile(null);

    const sessionId = `download-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setCurrentSessionId(sessionId);

    try {
      registerDownloadSession(sessionId);

      console.log("Sending download request with:", {
        url: selectedVideo,
        format,
        client_id: clientId.current,
        session_id: sessionId,
        quality: format === "mp4" ? "1080" : "192",
        custom_filename: customFilename,
        output_directory: selectedDirectory,
      }); // Debug log

      const response = await fetch(
        "https://100.83.147.76:8003/api/superpowers/youtube/stream-download",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: selectedVideo,
            format,
            client_id: clientId.current,
            session_id: sessionId,
            quality: format === "mp4" ? "1080" : "192",
            custom_filename: customFilename,
            output_directory: selectedDirectory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start download");
      }

      const result = await response.json();
      console.log("Download started:", result);
    } catch (err) {
      setError(err.message);
      console.error("Download error:", err);
      setDownloading(false);
    }
  };

  const handleDirectDownload = () => {
    if (!downloadedFile) return;

    const link = document.createElement("a");
    link.href = downloadedFile.downloadUrl;
    link.download = downloadedFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    // Check if it's a direct URL
    if (query.includes("youtube.com") || query.includes("youtu.be")) {
      await getVideoInfo(query);
    } else {
      await searchYouTube(query);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (views) => {
    if (!views) return "";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatETA = (seconds) => {
    if (!seconds || seconds === Infinity) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Helper function to call Plex API through your backend
  const callPlexDirect = async (intent, kwargs = {}) => {
    try {
      const response = await fetch(
        "https://100.83.147.76:8003/api/superpowers/plex/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, kwargs }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data.result;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("Plex API Error:", err);
      throw err;
    }
  };

  // Helper function to call FileOps API
  const callFileOps = async (intent, kwargs = {}) => {
    try {
      const response = await fetch(
        "https://100.83.147.76:8003/api/superpowers/file_ops/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, kwargs }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return data.result;
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      console.error("FileOps API Error:", err);
      throw err;
    }
  };

  // Find the correct Plex directory
  const findPlexDirectory = async () => {
    const possibleBasePaths = [
      "/Volumes/zai/Desktop/plex",
      "/Users/zai/Desktop/plex",
      "/tmp/plex",
      "./plex",
    ];

    for (const basePath of possibleBasePaths) {
      try {
        const result = await callFileOps("get_file_info", { path: basePath });
        if (result.success || !result.error) {
          console.log(`✅ Found Plex directory at: ${basePath}`);
          return basePath;
        }
      } catch (err) {
        console.log(`❌ ${basePath} not accessible:`, err.message);
      }
    }

    // If none exist, create one in a safe location
    const fallbackPath = "/tmp/plex";
    try {
      await callFileOps("create_directory", {
        path: fallbackPath,
        parents: true,
      });
      console.log(` Created fallback Plex directory at: ${fallbackPath}`);
      return fallbackPath;
    } catch (err) {
      throw new Error("Could not find or create Plex directory");
    }
  };

  // Add to Plex functionality
  const addToPlex = async () => {
    if (!downloadedFile) return;

    setAddingToPlex(true);
    setError("");
    setPlexSuccess("");

    try {
      console.log("🔄 Triggering Plex library scan...");

      // Just trigger Plex library scan - no file moving needed
      await callPlexDirect("scan_plex");

      console.log("✅ Plex library scan completed!");
      setPlexSuccess(
        `Plex libraries scanned successfully. "${videoInfo.title}" should now be available in Plex.`
      );
    } catch (err) {
      console.error("❌ Plex scan failed:", err);
      setError(`Plex scan failed: ${err.message}`);
    } finally {
      setAddingToPlex(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            YouTube Downloader
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Download videos and audio from YouTube with real-time progress
          </p>

          {/* WebSocket Status Indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-500">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paste YouTube URL or search for videos..."
              disabled={loading || downloading}
              className="w-full pl-14 pr-6 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md disabled:opacity-50"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearchResults([]);
                  setSelectedVideo(null);
                  setVideoInfo(null);
                  inputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-6 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {query.trim() && (
            <div className="text-center mt-4">
              <button
                onClick={handleSearch}
                disabled={loading || downloading}
                className="inline-flex items-center px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Plex Success Message */}
        {plexSuccess && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-purple-800 font-medium">Added to Plex</p>
              <p className="text-purple-700 text-sm mt-1">{plexSuccess}</p>
            </div>
          </div>
        )}

        {/* Video Info Card with Real-time Progress */}
        {videoInfo && selectedVideo && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex space-x-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-24 bg-gray-100 rounded-xl overflow-hidden">
                    {videoInfo.thumbnail ? (
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {videoInfo.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    {videoInfo.uploader && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{videoInfo.uploader}</span>
                      </div>
                    )}
                    {videoInfo.duration_string && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{videoInfo.duration_string}</span>
                      </div>
                    )}
                    {videoInfo.view_count && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatViews(videoInfo.view_count)}</span>
                      </div>
                    )}
                  </div>

                  {/* Real-time Download Progress */}
                  {downloading && downloadProgress && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {downloadProgress.status === "initializing"
                            ? "Initializing..."
                            : "Downloading..."}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatBytes(downloadProgress.downloaded)} /{" "}
                          {formatBytes(downloadProgress.total)}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${downloadProgress.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {downloadProgress.progress.toFixed(1)}% complete
                        </span>
                        <div className="flex space-x-3">
                          {downloadProgress.speed > 0 && (
                            <span>
                              Speed: {formatBytes(downloadProgress.speed)}/s
                            </span>
                          )}
                          <span>ETA: {formatETA(downloadProgress.eta)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Download Complete */}
                  {downloadedFile && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Download Complete
                          </p>
                          <p className="text-xs text-green-600 truncate">
                            {downloadedFile.filename}
                          </p>
                        </div>
                        <button
                          onClick={handleDirectDownload}
                          className="inline-flex items-center px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Filename Input */}
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Filename (optional)
                      </label>
                      <input
                        type="text"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        placeholder="e.g., S01E05"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Will be appended to: "{videoInfo.title}"
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Download Location
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={selectedDirectory}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={() => setShowDirectoryPicker(true)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Download Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadVideo("mp4")}
                      disabled={downloading}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow hover:shadow-md"
                    >
                      {downloading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Download Video
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => downloadVideo("mp3")}
                      disabled={downloading}
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow hover:shadow-md"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Download Audio
                    </button>

                    <button
                      onClick={addToPlex}
                      disabled={!downloadedFile || addingToPlex}
                      className="inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow hover:shadow-md"
                    >
                      {addingToPlex ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Adding to Plex...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Add to Plex
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Search Results
            </h2>
            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => getVideoInfo(result.url)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.uploader || "YouTube"}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          !error &&
          !videoInfo &&
          searchResults.length === 0 &&
          query && (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No videos found. Try a different search term.
              </p>
            </div>
          )}

        {/* Initial State */}
        {!loading && !query && !videoInfo && searchResults.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Ready to download
              </h3>
              <p className="text-gray-600 mb-8">
                Paste a YouTube URL or search for videos to get started.
                High-quality downloads in MP4 or MP3 format.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">
                  Supported formats:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-blue-500" />
                    <span>MP4 (Video)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Music className="w-4 h-4 text-green-500" />
                    <span>MP3 (Audio)</span>
                  </div>
                </div>
              </div>
            </div>
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
            title="Select Download Directory"
          />
        )}
      </div>
    </div>
  );
};

export default YouTubeDownloader;
