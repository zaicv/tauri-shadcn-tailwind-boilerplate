import React, { useState, useEffect, useRef } from "react";
import {
  Disc,
  LogOut, // Changed from Eject to LogOut
  Play,
  Pause,
  RefreshCw,
  Settings,
  Folder,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  HardDrive,
  Monitor,
  Download,
  Upload,
  Move,
  Trash2,
  Eye,
  Edit,
  X,
  Check,
  Film,
  Tv,
  Clock,
  FileVideo,
  Zap,
  Database,
  Server,
  Activity,
  Target,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "../../hooks/useWebSocket";
import { FileModal } from "../../components/Files/FileModal";

const DiscRippingDashboard = () => {
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [discInfo, setDiscInfo] = useState(null);
  const [makemkvStatus, setMakemkvStatus] = useState(null);
  const [moviesFolder, setMoviesFolder] = useState(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Ripping state
  const [isRipping, setIsRipping] = useState(false);
  const [ripProgress, setRipProgress] = useState<any>(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [completionData, setCompletionData] = useState<any>(null);

  // Modals
  const [showManualMetadata, setShowManualMetadata] = useState(false);
  const [manualFile, setManualFile] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [showFileModal, setShowFileModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expandedSections, setExpandedSections] = useState(
    new Set(["drives", "disc"])
  );

  // Episode Numbering Modal
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [episodeData, setEpisodeData] = useState(null);
  const [episodeMappings, setEpisodeMappings] = useState({});

  const API_BASE = "https://100.83.147.76:8003";

  // Generate unique client ID for WebSocket
  const clientId = useRef(
    `ripdisc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // WebSocket connection for real-time progress
  const { isConnected, sendMessage, registerDownloadSession } = useWebSocket(
    clientId.current,
    (message) => {
      if (
        message.type === "download_progress" &&
        message.session_id === currentSessionId
      ) {
        const progressData = message.data;

        if (progressData.status === "complete") {
          setSuccess("Disc processing completed successfully!");
          setIsRipping(false);
          setRipProgress(null);
          setCompletionData(progressData.completion_actions);
          loadDashboardData(); // Refresh all data
        } else if (progressData.status === "error") {
          setError(progressData.message || "Processing failed");
          setIsRipping(false);
          setRipProgress(null);
        } else if (progressData.status === "awaiting_episode_numbers") {
          // Show episode numbering modal
          setEpisodeData({
            fallbackFiles: progressData.fallback_files,
            volumeName: progressData.volume_name,
            baseTitle: progressData.base_title,
            sessionId: currentSessionId
          });
          
          // Initialize episode mappings with suggested values
          const mappings = {};
          progressData.fallback_files.forEach(file => {
            mappings[file.filename] = file.suggested_episode;
          });
          setEpisodeMappings(mappings);
          setShowEpisodeModal(true);
          
          setRipProgress({
            progress: progressData.progress || 75,
            message: "Waiting for episode number input...",
            status: "awaiting_input",
            processedCount: 0,
            totalFiles: progressData.fallback_files.length,
            missingFiles: [],
          });
        } else {
          setRipProgress({
            progress: progressData.progress || 0,
            message: progressData.message || "Processing...",
            status: progressData.status || "processing",
            processedCount: progressData.processed_count || 0,
            totalFiles: progressData.total_files || 0,
            missingFiles: progressData.missing_files || [],
          });
        }
      }
    }
  );

  // Helper function to call RipDisc API
  const callRipDiscDirect = async (intent: any, kwargs: any = {}) => {
    try {
      setError("");
      const response = await fetch(
        `${API_BASE}/api/superpowers/ripdisc/execute`,
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
      console.error("RipDisc API Error:", err);
      throw err;
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

  // Load all dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load drives
      const drivesData = await callRipDiscDirect("detect_drives");
      console.log("🔍 Drives data:", drivesData);
      console.log("🔍 Individual drives:", drivesData.drives);
      setDrives(drivesData.drives || []);

      // Load MakeMKV status
      const makemkvData = await callRipDiscDirect("check_makemkv_status");
      console.log("🔍 MakeMKV status:", makemkvData);
      setMakemkvStatus(makemkvData);

      // Load movies folder info
      const folderData = await callRipDiscDirect("get_movies_folder_info");
      console.log("🔍 Movies folder:", folderData);
      setMoviesFolder(folderData);

      // Load pending files
      const pendingData = await callRipDiscDirect("get_pending_files");
      console.log("🔍 Pending files:", pendingData);
      setPendingFiles(pendingData.pending_files || []);

      // Auto-select first drive with disc
      const driveWithDisc = drivesData.drives?.find((d) => d.has_disc);
      console.log("🔍 Drive with disc:", driveWithDisc);
      if (driveWithDisc && !selectedDrive) {
        setSelectedDrive(driveWithDisc);
        loadDiscInfo(driveWithDisc);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load disc information for selected drive
  const loadDiscInfo = async (drive: any) => {
    console.log("🔍 Loading disc info for drive:", drive);
    if (!drive) {
      console.log("🔍 No drive selected:", { drive });
      setDiscInfo(null);
      return;
    }

    try {
      const info = await callRipDiscDirect("get_disc_info", {
        drive_path: drive.mount_point || drive.device,
      });
      console.log("🔍 Disc info loaded:", info);
      setDiscInfo(info);
    } catch (err) {
      console.error("❌ Failed to load disc info:", err);
    }
  };

  // Eject disc from drive
  const ejectDisc = async (drive) => {
    try {
      setLoading(true);
      const result = await callRipDiscDirect("eject_disc", {
        drive_path: drive.mount_point || drive.device,
      });

      if (result.success) {
        setSuccess("Disc ejected successfully");
        // Refresh drives after a short delay
        setTimeout(() => loadDashboardData(), 2000);
      } else {
        setError(result.error || "Failed to eject disc");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start disc ripping with WebSocket progress
  const startRipping = async (fullRip = true) => {
    if (!selectedDrive) return;

    setIsRipping(true);
    setError("");
    setSuccess("");
    setRipProgress({
      progress: 0,
      message: "Initializing disc rip...",
      status: "initializing",
    });

    const sessionId = `ripdisc-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setCurrentSessionId(sessionId);

    try {
      registerDownloadSession(sessionId);

      const response = await fetch(
        `${API_BASE}/api/superpowers/ripdisc/stream-rip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: fullRip ? "full_rip" : "post_process",
            client_id: clientId.current,
            session_id: sessionId,
            drive_path: selectedDrive.mount_point || selectedDrive.device,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start ripping process");
      }

      const result = await response.json();
      console.log("Ripping started:", result);
    } catch (err: any) {
      setError(err.message);
      setIsRipping(false);
      setRipProgress(null);
    }
  };

  // Handle manual metadata submission
  const submitManualMetadata = async () => {
    if (!manualFile || !manualTitle) return;

    try {
      setLoading(true);
      const result = await callRipDiscDirect("manual_metadata", {
        filename: manualFile,
        title: manualTitle,
        websocket_callback: null, // Could add WebSocket support here too
        session_id: `manual-${Date.now()}`,
      });

      if (result.status === "success") {
        setSuccess(
          `Successfully processed "${manualFile}" as "${manualTitle}"`
        );
        setShowManualMetadata(false);
        setManualFile("");
        setManualTitle("");
        loadDashboardData(); // Refresh data
      } else {
        setError(result.error || "Manual metadata processing failed");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Move file using FileOps
  const moveFile = async (sourcePath, destinationPath) => {
    try {
      const result = await callFileOps("move_file", {
        source: sourcePath,
        destination: destinationPath,
      });

      if (result.success) {
        setSuccess(`File moved successfully to ${destinationPath}`);
        loadDashboardData();
      } else {
        setError(result.error || "Failed to move file");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle adding files to Plex
  const handleAddToPlex = async () => {
    try {
      setLoading(true);
      const result = await callRipDiscDirect("scan_plex");
      if (result.success) {
        setSuccess("Plex library scan triggered successfully!");
        setCompletionData(null);
      } else {
        setError("Failed to trigger Plex scan");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle downloading processed files
  const handleDownloadFiles = async () => {
    try {
      if (!completionData?.processed_files) return;

      if (completionData.processed_files.length === 1) {
        const filename = completionData.processed_files[0];
        const encodedPath = encodeURIComponent(`/Users/zai/Movies/${filename}`);
        window.open(`${API_BASE}/api/files/download/${encodedPath}`, "_blank");
      } else {
        setError("Multiple file download not yet implemented");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Component mount
  // Manual connect only; no auto polling to avoid spinning the drive
  useEffect(() => {
    // no-op on mount
  }, []);

  // Update disc info when selected drive changes
  useEffect(() => {
    console.log("🔍 Selected drive changed:", selectedDrive);
    if (selectedDrive) {
      loadDiscInfo(selectedDrive);
    }
  }, [selectedDrive]);

  // Debug current state
  console.log("🔍 Render state:", {
    selectedDrive,
    discInfo,
    drives: drives.length,
    hasDiscDrive: drives.find((d) => d.has_disc),
  });

  // Add this function to handle episode number submission
  const submitEpisodeNumbers = async () => {
    if (!episodeData?.sessionId) return;

    try {
      setLoading(true);
      const result = await callRipDiscDirect("set_episode_numbers", {
        session_id: episodeData.sessionId,
        episode_mappings: episodeMappings
      });

      if (result.status === "success" || result.status === "partial_success") {
        setSuccess("Episode numbers set successfully!");
        setShowEpisodeModal(false);
        setEpisodeData(null);
        setEpisodeMappings({});
        
        if (result.completion_actions) {
          setCompletionData(result.completion_actions);
        }
        
        setIsRipping(false);
        setRipProgress(null);
        loadDashboardData();
      } else {
        setError(result.error || "Failed to set episode numbers");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this function to handle episode number changes
  const handleEpisodeChange = (filename: string, episodeNumber: string) => {
    setEpisodeMappings(prev => ({
      ...prev,
      [filename]: episodeNumber
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Disc className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Disc Ripper
                </h1>
                <p className="text-gray-600">DVD & Blu-ray to Plex Pipeline</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-6">
              {/* WebSocket Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? "Connected" : "Offline"}
                </span>
              </div>

              {/* MakeMKV Status */}
              {makemkvStatus && (
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      makemkvStatus.installed ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    MakeMKV {makemkvStatus.installed ? "Ready" : "Not Found"}
                  </span>
                </div>
              )}

              {/* Actions */}
              <Button
                onClick={loadDashboardData}
                disabled={loading || isRipping}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Connect
              </Button>
              <Button
                onClick={loadDashboardData}
                disabled={loading || isRipping}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <Button
              onClick={() => setError("")}
              variant="ghost"
              size="sm"
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 text-sm mt-1">{success}</p>
            </div>
            <Button
              onClick={() => setSuccess("")}
              variant="ghost"
              size="sm"
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Completion Actions */}
        {completionData && completionData.show_next_steps && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Ripping Complete!
                    </h3>
                    <p className="text-sm text-green-700">
                      {completionData.processed_files?.length || 0} files
                      processed and ready
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setCompletionData(null)}
                  variant="ghost"
                  size="sm"
                  className="text-green-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-green-900">
                  What would you like to do next?
                </h4>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleAddToPlex}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Add to Plex
                  </Button>

                  <Button
                    onClick={handleDownloadFiles}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Files
                  </Button>

                  <Button
                    onClick={() => setShowFileModal(true)}
                    variant="outline"
                    className="border-gray-600 text-gray-600 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Browse Files
                  </Button>
                </div>

                {completionData.processed_files && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-2">
                      Processed Files:
                    </h5>
                    <div className="space-y-1">
                      {completionData.processed_files.map((filename, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-600 flex items-center"
                        >
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                          {filename}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Ripping Progress */}
        {isRipping && ripProgress && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Processing Disc
                    </h3>
                    <p className="text-sm text-blue-700">
                      {ripProgress.message}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {ripProgress.progress.toFixed(0)}%
                </Badge>
              </div>

              <Progress value={ripProgress.progress} className="mb-4" />

              {ripProgress.processedCount > 0 && (
                <div className="flex items-center justify-between text-sm text-blue-700">
                  <span>
                    Processed {ripProgress.processedCount} of{" "}
                    {ripProgress.totalFiles} files
                  </span>
                  {ripProgress.missingFiles?.length > 0 && (
                    <span>
                      {ripProgress.missingFiles.length} need manual metadata
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Optical Drives Section */}
            <Card className="border-gray-200">
              <CardContent className="p-0">
                <div
                  className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSection("drives")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Optical Drives
                      </h2>
                      <Badge variant="secondary">
                        {drives.length} detected
                      </Badge>
                    </div>
                    {expandedSections.has("drives") ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedSections.has("drives") && (
                  <div className="p-6">
                    {drives.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No optical drives detected</p>
                        <p className="text-sm mt-1">
                          Connect a DVD/Blu-ray drive and refresh
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {drives.map((drive, index) => (
                          <div
                            key={index}
                            className={`p-4 border rounded-xl transition-all cursor-pointer ${
                              selectedDrive === drive
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            onClick={() => {
                              console.log("🔍 Selecting drive:", drive);
                              setSelectedDrive(drive);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    drive.has_disc
                                      ? "bg-green-100"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <Disc
                                    className={`w-5 h-5 ${
                                      drive.has_disc
                                        ? "text-green-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {drive.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {drive.product}
                                  </p>
                                  {drive.mount_point && (
                                    <p className="text-xs text-gray-500">
                                      {drive.mount_point}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {drive.has_disc && (
                                  <>
                                    <Badge
                                      variant={
                                        drive.disc_info
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      Disc Present
                                    </Badge>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        ejectDisc(drive);
                                      }}
                                      variant="outline"
                                      size="sm"
                                      disabled={loading || isRipping}
                                    >
                                      <LogOut className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Disc Information Section */}
            {(selectedDrive?.has_disc || discInfo?.has_disc) && (
              <Card className="border-gray-200">
                <CardContent className="p-0">
                  <div
                    className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleSection("disc")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Film className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                          Disc Information
                        </h2>
                        {discInfo?.disc_type && (
                          <Badge variant="outline">{discInfo.disc_type}</Badge>
                        )}
                      </div>
                      {expandedSections.has("disc") ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedSections.has("disc") && (
                    <div className="p-6">
                      {discInfo ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Title
                              </h4>
                              <p className="text-gray-700">
                                {discInfo.title || "Unknown"}
                              </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">
                                Type
                              </h4>
                              <p className="text-gray-700">
                                {discInfo.disc_type || "Unknown"}
                              </p>
                            </div>
                            {discInfo.size && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Size
                                </h4>
                                <p className="text-gray-700">{discInfo.size}</p>
                              </div>
                            )}
                            {discInfo.structure && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Structure
                                </h4>
                                <p className="text-gray-700">
                                  {discInfo.structure}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Ripping Actions */}
                          <div className="pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-3">
                              <Button
                                onClick={() => startRipping(true)}
                                disabled={
                                  isRipping || !makemkvStatus?.installed
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Full Rip & Process
                              </Button>

                              <Button
                                onClick={() => startRipping(false)}
                                disabled={isRipping}
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                Post-Process Only
                              </Button>
                            </div>

                            {!makemkvStatus?.installed && (
                              <p className="text-sm text-amber-600 mt-2 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                MakeMKV is required for disc ripping
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Info className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Loading disc information...</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending Files
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {pendingFiles.length}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Free Space
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {moviesFolder?.free_space || "N/A"}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Movies Folder Status */}
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Folder className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Movies Folder</h3>
                  <Badge
                    variant={
                      moviesFolder?.accessible ? "default" : "destructive"
                    }
                  >
                    {moviesFolder?.accessible ? "Accessible" : "Not Accessible"}
                  </Badge>
                </div>

                {moviesFolder && (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-700">Path</p>
                      <p className="text-gray-600 font-mono text-xs bg-gray-50 p-2 rounded">
                        {moviesFolder.path}
                      </p>
                    </div>

                    {moviesFolder.files?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Recent Files ({moviesFolder.files.length})
                        </p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {moviesFolder.files.slice(0, 5).map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="truncate flex-1 mr-2">
                                {file.name}
                              </span>
                              <span className="text-gray-500">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {moviesFolder.disk_usage && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Storage</span>
                          <span className="text-gray-900">
                            {moviesFolder.disk_usage.used} /{" "}
                            {moviesFolder.disk_usage.total}
                          </span>
                        </div>
                        <Progress
                          value={moviesFolder.disk_usage.usage_percent}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Files */}
            {pendingFiles.length > 0 && (
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Files Needing Metadata
                    </h3>
                    <Button
                      onClick={() => setShowManualMetadata(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Metadata
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingFiles.map((file, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setManualFile(file.filename);
                          setManualTitle(
                            file.filename.replace(/\.[^/.]+$/, "")
                          );
                          setShowManualMetadata(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500">{file.size}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Manual Metadata Modal */}
      <Dialog open={showManualMetadata} onOpenChange={setShowManualMetadata}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Manual Metadata Entry</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename
              </label>
              <select
                value={manualFile}
                onChange={(e) => {
                  setManualFile(e.target.value);
                  setManualTitle(e.target.value.replace(/\.[^/.]+$/, ""));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a file...</option>
                {pendingFiles.map((file, index) => (
                  <option key={index} value={file.filename}>
                    {file.filename}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Movie/Show Title
              </label>
              <Input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="Enter the correct title..."
                className="focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the exact title as it appears on TMDB
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => setShowManualMetadata(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={submitManualMetadata}
              disabled={!manualFile || !manualTitle || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Process
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Episode Numbering Modal */}
      <Dialog open={showEpisodeModal} onOpenChange={setShowEpisodeModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Tv className="w-5 h-5 text-blue-600" />
              <span>Set Episode Numbers</span>
            </DialogTitle>
          </DialogHeader>

          {episodeData && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  TV Show: {episodeData.baseTitle}
                </h4>
                <p className="text-sm text-blue-700">
                  Volume: {episodeData.volumeName}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Set the correct episode numbers for each file below
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {episodeData.fallbackFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        Track: {file.track_number}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-gray-700">
                        Episode:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        value={episodeMappings[file.filename] || file.suggested_episode}
                        onChange={(e) => handleEpisodeChange(file.filename, e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowEpisodeModal(false);
                    setEpisodeData(null);
                    setEpisodeMappings({});
                    setIsRipping(false);
                    setRipProgress(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitEpisodeNumbers}
                  disabled={loading || !Object.keys(episodeMappings).length}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Continue Processing
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Modal for browsing */}
      {showFileModal && (
        <FileModal
          isOpen={showFileModal}
          onClose={() => setShowFileModal(false)}
          onSelect={(path) => {
            console.log("Selected path:", path);
            setShowFileModal(false);
          }}
          mode="file"
          title="Select File"
        />
      )}
    </div>
  );
};

export default DiscRippingDashboard;
