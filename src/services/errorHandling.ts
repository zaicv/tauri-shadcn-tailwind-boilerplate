import { AlertCircle, WifiOff, Server, Clock } from "lucide-react";

export interface ErrorInfo {
  type: "network" | "server" | "timeout" | "rate_limit" | "auth" | "unknown";
  title: string;
  message: string;
  icon: any;
  color: string;
  suggestion?: string;
}

export function analyzeError(error: any, response?: Response): ErrorInfo {
  console.error("Analyzing error:", error, response);

  // Network/Connection errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: "network",
      title: "Connection Failed",
      message: "Unable to reach the server. Check your internet connection.",
      icon: WifiOff,
      color: "text-red-500",
      suggestion: "Try refreshing the page or check if the server is running.",
    };
  }

  // Server not reachable
  if (
    error.message?.includes("Failed to fetch") ||
    error.code === "ECONNREFUSED"
  ) {
    return {
      type: "server",
      title: "Server Not Available",
      message: "The AI server appears to be offline.",
      icon: Server,
      color: "text-orange-500",
      suggestion:
        "Please wait a moment and try again, or contact support if this persists.",
    };
  }

  // Timeout errors
  if (error.message?.includes("timeout") || error.name === "TimeoutError") {
    return {
      type: "timeout",
      title: "Request Timeout",
      message: "The server took too long to respond.",
      icon: Clock,
      color: "text-yellow-500",
      suggestion: "The server might be busy. Please try again in a moment.",
    };
  }

  // HTTP Status Code Errors
  if (response) {
    switch (response.status) {
      case 429:
        return {
          type: "rate_limit",
          title: "Rate Limited",
          message: "Too many requests. Please wait before trying again.",
          icon: Clock,
          color: "text-yellow-500",
          suggestion: "Wait a minute before sending another message.",
        };
      case 401:
      case 403:
        return {
          type: "auth",
          title: "Authentication Error",
          message: "Access denied. Please check your credentials.",
          icon: AlertCircle,
          color: "text-red-500",
          suggestion: "Try logging out and logging back in.",
        };
      case 500:
      case 502:
      case 503:
        return {
          type: "server",
          title: "Server Error",
          message: "The server encountered an internal error.",
          icon: Server,
          color: "text-red-500",
          suggestion:
            "This is usually temporary. Please try again in a few minutes.",
        };
      case 404:
        return {
          type: "server",
          title: "Service Not Found",
          message: "The chat service endpoint was not found.",
          icon: Server,
          color: "text-orange-500",
          suggestion:
            "The server configuration might have changed. Contact support.",
        };
      default:
        return {
          type: "unknown",
          title: `HTTP ${response.status}`,
          message: `Request failed with status ${response.status}`,
          icon: AlertCircle,
          color: "text-red-500",
          suggestion: "Please try again or contact support if this continues.",
        };
    }
  }

  // Generic error fallback
  return {
    type: "unknown",
    title: "Unexpected Error",
    message:
      error.message || "Something went wrong while processing your request.",
    icon: AlertCircle,
    color: "text-red-500",
    suggestion: "Please try again. If the problem persists, contact support.",
  };
}

export function createErrorMessage(error: any, response?: Response) {
  const errorInfo = analyzeError(error, response);

  return {
    id: Date.now(),
    sender: "assistant" as const,
    text: errorInfo.message,
    isError: true,
    errorInfo,
  };
}
