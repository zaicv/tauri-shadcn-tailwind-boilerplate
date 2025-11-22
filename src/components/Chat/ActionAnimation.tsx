import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Database,
  Youtube,
  Wifi,
  CheckCircle,
} from "lucide-react";

interface ActionAnimationProps {
  type: "plex" | "youtube-download" | "youtube-search" | "web-search";
  isActive: boolean;
  onComplete?: () => void;
}

const ActionAnimation: React.FC<ActionAnimationProps> = ({
  type,
  isActive,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const duration = type === "youtube-download" ? 5000 : 3000;
    const steps = type === "plex" ? 4 : 3;
    const stepDuration = duration / steps;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (duration / 50);
        if (next >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onComplete?.(), 500);
          return 100;
        }
        return next;
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= steps) {
          clearInterval(stepInterval);
          return steps;
        }
        return next;
      });
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isActive, type, onComplete]);

  const getActionConfig = () => {
    switch (type) {
      case "plex":
        return {
          icon: Database,
          color: "#f59e0b",
          gradient: "from-amber-400 to-orange-500",
          title: "Scanning Plex Library",
          steps: [
            "Connecting to Plex server...",
            "Scanning media directories...",
            "Indexing content metadata...",
            "Finalizing library scan...",
          ],
        };
      case "youtube-download":
        return {
          icon: Download,
          color: "#ef4444",
          gradient: "from-red-400 to-red-600",
          title: "Downloading from YouTube",
          steps: [
            "Extracting video information...",
            "Processing download request...",
            "Download complete!",
          ],
        };
      case "youtube-search":
        return {
          icon: Youtube,
          color: "#dc2626",
          gradient: "from-red-500 to-red-700",
          title: "Searching YouTube",
          steps: [
            "Querying YouTube API...",
            "Processing search results...",
            "Results ready!",
          ],
        };
      case "web-search":
        return {
          icon: Search,
          color: "#3b82f6",
          gradient: "from-blue-400 to-blue-600",
          title: "Searching the web",
          steps: [
            "Querying search engines...",
            "Analyzing results...",
            "Search complete!",
          ],
        };
      default:
        return {
          icon: Wifi,
          color: "#6b7280",
          gradient: "from-gray-400 to-gray-600",
          title: "Processing request",
          steps: ["Working on it..."],
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  if (!isActive) return null;

  return (
    <div className="flex flex-col space-y-4 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 w-80">
      {/* Header with icon and title */}
      <div className="flex items-center space-x-3">
        <div
          className={`relative w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}
        >
          <IconComponent className={`w-4 h-4 text-white animate-pulse`} />
          <div
            className="absolute -inset-1 rounded-lg bg-gradient-to-br opacity-30 animate-ping"
            style={{
              background: `linear-gradient(135deg, ${config.color}40, ${config.color}80)`,
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white/90 flex items-center space-x-2">
            <span>{config.title}</span>
            <div className="flex space-x-1">
              <div
                className="w-1 h-1 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1 h-1 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1 h-1 bg-white/60 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </h3>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-150 ease-out relative`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Current step */}
      <div className="flex items-center space-x-3">
        {progress < 100 ? (
          <>
            <div
              className={`w-2 h-2 rounded-full bg-gradient-to-br ${config.gradient} animate-pulse`}
            />
            <span className="text-xs text-white/70 font-medium">
              {config.steps[Math.min(currentStep, config.steps.length - 1)]}
            </span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              Complete!
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionAnimation;
