import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Search,
  Settings,
  Film,
  Tv,
  Music,
  Users,
  Server,
  AlertCircle,
  Loader,
  Upload,
  X,
  Check,
  ChevronDown,
  Eye,
  Calendar,
  Clock,
  Grid,
  List,
  RefreshCw,
  Plus,
  Folder,
  ImageIcon,
  Video,
  Headphones,
  BookOpen,
  Star,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Scan,
  CloudUpload,
  Home,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PlexDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [libraryItems, setLibraryItems] = useState({});
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [libraryRecentlyAdded, setLibraryRecentlyAdded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_BASE = "https://100.83.147.76:8003";
  const PLEX_BASE_URL = "https://100.83.147.76:32400";
  const PLEX_TOKEN = "_T2i8yEtx18sGVMsqHmR";

  // Map library types to Plex folder names
  const libraryFolderMap = {
    movie: "Movies",
    show: "Tv Shows",
    tv: "Tv Shows",
    artist: "Music",
    music: "Music",
    podcast: "Podcasts",
    "kids-movie": "Kids Movies",
    "kids-tv": "Kids TV Shows",
    "home-movie": "Home Movies",
  };

  // Helper function to call Plex API
  const callPlexDirect = async (intent, kwargs = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/superpowers/plex/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, kwargs }),
      });
      const data = await response.json();
      if (response.ok) return data.result;
      throw new Error(data.error || "Unknown error");
    } catch (err) {
      console.error("Plex API Error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to call FileOps API
  const callFileOps = async (intent, kwargs = {}) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/superpowers/file_ops/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intent, kwargs }),
        }
      );
      const data = await response.json();
      if (response.ok) return data.result;
      throw new Error(data.error || "Unknown error");
    } catch (err) {
      console.error("FileOps API Error:", err);
      throw err;
    }
  };

  // Get Plex thumbnail URL
  const getThumbnailUrl = (thumb, ratingKey) => {
    if (!thumb && !ratingKey) return null;
    if (thumb && thumb.startsWith("http")) return thumb;
    const baseUrl = `${PLEX_BASE_URL}${
      thumb || `/library/metadata/${ratingKey}/thumb`
    }`;
    return `${baseUrl}?X-Plex-Token=${PLEX_TOKEN}`;
  };

  // Get library icon
  const getLibraryIcon = (type) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case "movie":
        return <Film className="w-5 h-5 text-red-500" />;
      case "show":
      case "tv":
        return <Tv className="w-5 h-5 text-blue-500" />;
      case "artist":
      case "music":
        return <Music className="w-5 h-5 text-purple-500" />;
      case "podcast":
        return <Headphones className="w-5 h-5 text-green-500" />;
      default:
        return <Server className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get media type icon
  const getMediaIcon = (type) => {
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case "video":
      case "movie":
        return <Film className="w-4 h-4 text-red-500" />;
      case "show":
      case "episode":
        return <Tv className="w-4 h-4 text-blue-500" />;
      case "track":
      case "song":
      case "music":
        return <Music className="w-4 h-4 text-purple-500" />;
      case "podcast":
        return <Headphones className="w-4 h-4 text-green-500" />;
      case "artist":
        return <Users className="w-4 h-4 text-purple-500" />;
      case "album":
        return <Music className="w-4 h-4 text-purple-500" />;
      default:
        return <Video className="w-4 h-4 text-gray-500" />;
    }
  };

  // Test connection and fetch libraries
  const testConnection = async () => {
    setLoading(true);
    setError("");
    try {
      const librariesData = await callPlexDirect("list_plex_libraries");
      let libraries = [];
      if (librariesData?.libraries && Array.isArray(librariesData.libraries)) {
        libraries = librariesData.libraries;
      } else if (Array.isArray(librariesData)) {
        libraries = librariesData;
      } else {
        throw new Error("Invalid libraries data format");
      }
      setLibraries(libraries);
      setIsConnected(true);

      // Load recently added for each library
      await loadRecentlyAdded(libraries);
    } catch (err) {
      console.error("❌ Connection failed:", err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Load recently added items for all libraries
  const loadRecentlyAdded = async (librariesList = libraries) => {
    try {
      const allRecentlyAdded = [];
      for (const library of librariesList) {
        const itemsData = await callPlexDirect("list_plex_items", {
          key: library.key,
        });
        let items = [];
        if (itemsData?.items && Array.isArray(itemsData.items)) {
          items = itemsData.items;
        } else if (Array.isArray(itemsData)) {
          items = itemsData;
        }

        // Add library info to each item and take only the most recent 5 per library
        const itemsWithLibrary = items.slice(0, 5).map((item) => ({
          ...item,
          libraryTitle: library.title,
          libraryType: library.type,
          libraryKey: library.key,
        }));
        allRecentlyAdded.push(...itemsWithLibrary);
      }

      // Sort by added date (most recent first)
      allRecentlyAdded.sort((a, b) => {
        const aDate = parseInt(a.addedAt) || 0;
        const bDate = parseInt(b.addedAt) || 0;
        return bDate - aDate;
      });

      setRecentlyAdded(allRecentlyAdded.slice(0, 20));
    } catch (err) {
      console.error("❌ Recently added fetch failed:", err);
    }
  };

  // Load recently added items for specific library
  const loadLibraryRecentlyAdded = async (libraryKey) => {
    try {
      const itemsData = await callPlexDirect("list_plex_items", {
        key: libraryKey,
      });
      let items = [];
      if (itemsData?.items && Array.isArray(itemsData.items)) {
        items = itemsData.items;
      } else if (Array.isArray(itemsData)) {
        items = itemsData;
      }

      // Items are already sorted by added date from backend
      setLibraryRecentlyAdded(items.slice(0, 12));
    } catch (err) {
      console.error("❌ Library recently added fetch failed:", err);
    }
  };

  // Load library items
  const loadLibraryItems = async (libraryKey) => {
    if (libraryItems[libraryKey]) return;

    try {
      const itemsData = await callPlexDirect("list_plex_items", {
        key: libraryKey,
      });
      let items = [];
      if (itemsData?.items && Array.isArray(itemsData.items)) {
        items = itemsData.items;
      } else if (Array.isArray(itemsData)) {
        items = itemsData;
      }

      setLibraryItems((prev) => ({
        ...prev,
        [libraryKey]: items,
      }));
    } catch (err) {
      console.error("❌ Library items fetch failed:", err);
    }
  };

  // Scan libraries
  const scanLibraries = async () => {
    try {
      setLoading(true);
      await callPlexDirect("scan_plex");
      await testConnection();
    } catch (err) {
      console.error("❌ Scan failed:", err);
      setError(err.message);
    }
  };

  // Upload file to server
  const uploadFileToServer = async (file, filename) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filename", filename);
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("File upload failed");
    return await response.json();
  };

  // Handle upload
  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadName || !uploadType) return;
    setUploading(true);
    try {
      const uploadResult = await uploadFileToServer(
        uploadFile,
        uploadFile.name
      );
      const plexBasePath = "/tmp/plex"; // Simplified path
      const folderName = libraryFolderMap[uploadType] || "Movies";
      const targetDir = `${plexBasePath}/${folderName}`;
      const targetPath = `${targetDir}/${uploadName}${getFileExtension(
        uploadFile.name
      )}`;

      await callFileOps("create_directory", { path: targetDir, parents: true });
      await callFileOps("move_file", {
        source: uploadResult.filepath,
        destination: targetPath,
      });

      await callPlexDirect("scan_plex");
      await testConnection();

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName("");
      setUploadType("");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getFileExtension = (filename) => {
    return filename.substring(filename.lastIndexOf("."));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  // Auto-connect on component mount
  useEffect(() => {
    testConnection();
  }, []);

  // Load library items when library is selected
  useEffect(() => {
    if (selectedLibrary) {
      loadLibraryItems(selectedLibrary.key);
      loadLibraryRecentlyAdded(selectedLibrary.key);
    }
  }, [selectedLibrary]);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header Toolbar */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-2">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Plex Dashboard</h1>
                <p className="text-sm text-slate-300">
                  Media Library Management
                </p>
              </div>
            </div>

            {/* Toolbar Actions */}
            <div className="flex items-center space-x-3">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 mr-4">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-slate-300">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>

              {/* Toolbar Buttons */}
              <Button
                onClick={() => setSelectedLibrary(null)}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>

              <Button
                onClick={scanLibraries}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Scan className="w-4 h-4 mr-2" />
                Scan Libraries
              </Button>

              <Button
                onClick={() => setShowUploadModal(true)}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <CloudUpload className="w-4 h-4 mr-2" />
                Upload Media
              </Button>

              <Button
                onClick={testConnection}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center space-x-2 text-orange-400 mb-4">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Error</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <Button
                onClick={testConnection}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* Connection Form */}
        {!isConnected && !loading && (
          <Card className="mb-8 bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-white">
                Connect to Plex Server
              </h2>
              <p className="text-slate-300 mb-4">
                Connecting through backend API at {API_BASE}
              </p>
              <Button onClick={testConnection} disabled={loading}>
                {loading ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Server className="w-4 h-4 mr-2" />
                )}
                {loading ? "Connecting..." : "Connect"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard */}
        {isConnected && !loading && (
          <div className="space-y-8">
            {/* Recently Added Section - Only show when no library selected */}
            {!selectedLibrary && recentlyAdded.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Recently Added
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-slate-200"
                  >
                    {recentlyAdded.length} items
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {recentlyAdded.map((item, index) => (
                    <Card
                      key={`${item.rating_key || item.key || index}`}
                      className="group cursor-pointer hover:shadow-lg transition-all duration-200 bg-slate-800 border-slate-700"
                    >
                      <CardContent className="p-0">
                        <div className="aspect-[2/3] bg-slate-700 rounded-t-lg overflow-hidden">
                          {item.thumb || item.rating_key ? (
                            <img
                              src={getThumbnailUrl(item.thumb, item.rating_key)}
                              alt={item.title || `Item ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-700">
                            {getMediaIcon(item.type || item.libraryType)}
                          </div>
                        </div>
                        <div className="p-3">
                          <h3
                            className="font-medium text-sm truncate text-white"
                            title={item.title}
                          >
                            {item.title || `Item ${index + 1}`}
                          </h3>
                          <div className="flex items-center justify-between mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-600 text-slate-300"
                            >
                              {item.libraryTitle || "Unknown"}
                            </Badge>
                            {item.year && item.year !== "Unknown" && (
                              <span className="text-xs text-slate-400">
                                {item.year}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Libraries Section - Only show when no library selected */}
            {!selectedLibrary && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Libraries
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-slate-200"
                  >
                    {libraries.length} libraries
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {libraries.map((library, index) => (
                    <Card
                      key={library.key || index}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 group bg-slate-800 border-slate-700"
                      onClick={() => setSelectedLibrary(library)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            {getLibraryIcon(library.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">
                              {library.title ||
                                library.name ||
                                `Library ${index + 1}`}
                            </h3>
                            <p className="text-sm text-slate-400 capitalize">
                              {library.type || "unknown"}
                            </p>
                            {library.disk_usage &&
                              library.disk_usage !== "Unknown" && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {library.disk_usage}
                                </p>
                              )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Library Items View */}
            {selectedLibrary && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => setSelectedLibrary(null)}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {selectedLibrary.title}
                      </h2>
                      <p className="text-sm text-slate-400 capitalize">
                        {selectedLibrary.type} •{" "}
                        {libraryItems[selectedLibrary.key]?.length || 0} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setViewMode("grid")}
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      className={
                        viewMode === "grid"
                          ? ""
                          : "border-slate-600 text-slate-300 hover:bg-slate-700"
                      }
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setViewMode("list")}
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      className={
                        viewMode === "list"
                          ? ""
                          : "border-slate-600 text-slate-300 hover:bg-slate-700"
                      }
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Recently Added to This Library */}
                {libraryRecentlyAdded.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Recently Added to {selectedLibrary.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-slate-700 text-slate-200"
                      >
                        {libraryRecentlyAdded.length} items
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {libraryRecentlyAdded.map((item, index) => (
                        <Card
                          key={`recent-${item.rating_key || item.key || index}`}
                          className="group cursor-pointer hover:shadow-lg transition-all duration-200 bg-slate-800 border-slate-700"
                        >
                          <CardContent className="p-0">
                            <div className="aspect-[2/3] bg-slate-700 rounded-t-lg overflow-hidden">
                              {item.thumb || item.rating_key ? (
                                <img
                                  src={getThumbnailUrl(
                                    item.thumb,
                                    item.rating_key
                                  )}
                                  alt={item.title || `Item ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-700">
                                {getMediaIcon(
                                  item.type || selectedLibrary.type
                                )}
                              </div>
                            </div>
                            <div className="p-3">
                              <h3
                                className="font-medium text-sm truncate text-white"
                                title={item.title}
                              >
                                {item.title || `Item ${index + 1}`}
                              </h3>
                              <div className="flex items-center justify-between mt-1">
                                {item.year && item.year !== "Unknown" && (
                                  <span className="text-xs text-slate-400">
                                    {item.year}
                                  </span>
                                )}
                                {item.quality && item.quality !== "Unknown" && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-slate-600 text-slate-300"
                                  >
                                    {item.quality}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Library Items */}
                {libraryItems[selectedLibrary.key] ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        All {selectedLibrary.title} Items
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-slate-700 text-slate-200"
                      >
                        {libraryItems[selectedLibrary.key].length} items
                      </Badge>
                    </div>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
                          : "space-y-2"
                      }
                    >
                      {libraryItems[selectedLibrary.key].map((item, index) =>
                        viewMode === "grid" ? (
                          <Card
                            key={`${item.rating_key || item.key || index}`}
                            className="group cursor-pointer hover:shadow-lg transition-all duration-200 bg-slate-800 border-slate-700"
                          >
                            <CardContent className="p-0">
                              <div className="aspect-[2/3] bg-slate-700 rounded-t-lg overflow-hidden">
                                {item.thumb || item.rating_key ? (
                                  <img
                                    src={getThumbnailUrl(
                                      item.thumb,
                                      item.rating_key
                                    )}
                                    alt={item.title || `Item ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      e.target.nextSibling.style.display =
                                        "flex";
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-700">
                                  {getMediaIcon(
                                    item.type || selectedLibrary.type
                                  )}
                                </div>
                              </div>
                              <div className="p-3">
                                <h3
                                  className="font-medium text-sm truncate text-white"
                                  title={item.title}
                                >
                                  {item.title || `Item ${index + 1}`}
                                </h3>
                                <div className="flex items-center justify-between mt-1">
                                  {item.year && item.year !== "Unknown" && (
                                    <span className="text-xs text-slate-400">
                                      {item.year}
                                    </span>
                                  )}
                                  {item.quality &&
                                    item.quality !== "Unknown" && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-slate-600 text-slate-300"
                                      >
                                        {item.quality}
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card
                            key={`${item.rating_key || item.key || index}`}
                            className="group cursor-pointer hover:shadow-md transition-all duration-200 bg-slate-800 border-slate-700"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                                  {item.thumb || item.rating_key ? (
                                    <img
                                      src={getThumbnailUrl(
                                        item.thumb,
                                        item.rating_key
                                      )}
                                      alt={item.title || `Item ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-700">
                                    {getMediaIcon(
                                      item.type || selectedLibrary.type
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-white truncate">
                                    {item.title || `Item ${index + 1}`}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {item.year && item.year !== "Unknown" && (
                                      <span className="text-sm text-slate-400">
                                        {item.year}
                                      </span>
                                    )}
                                    {item.quality &&
                                      item.quality !== "Unknown" && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-slate-600 text-slate-300"
                                        >
                                          {item.quality}
                                        </Badge>
                                      )}
                                    {item.size && item.size !== "Unknown" && (
                                      <span className="text-xs text-slate-500">
                                        {item.size}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">Loading library items...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Upload Media</h3>
              <Button
                onClick={() => setShowUploadModal(false)}
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select File
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) {
                      setUploadFile(file);
                      setUploadName(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUploadFile(file);
                        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">
                      {uploadFile
                        ? uploadFile.name
                        : "Click to select or drag and drop"}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Media Name
                </label>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Enter media name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Library Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                >
                  <option value="">Select library type</option>
                  <option value="movie">Movies</option>
                  <option value="show">TV Shows</option>
                  <option value="music">Music</option>
                  <option value="podcast">Podcasts</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowUploadModal(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadSubmit}
                  disabled={
                    !uploadFile || !uploadName || !uploadType || uploading
                  }
                  className="flex-1"
                >
                  {uploading ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlexDashboard;
