"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  autoHideDuration?: number; // milliseconds
}

export function NotificationToast({ 
  notification, 
  onClose, 
  autoHideDuration = 5000 
}: NotificationToastProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showClose, setShowClose] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [isHovered, autoHideDuration, notification.id, onClose]);

  useEffect(() => {
    if (isHovered) {
      const timer = setTimeout(() => setShowClose(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowClose(false);
    }
  }, [isHovered]);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50/95 dark:bg-green-950/95 border-green-200 dark:border-green-800",
          text: "text-green-900 dark:text-green-100"
        };
      case "error":
        return {
          bg: "bg-red-50/95 dark:bg-red-950/95 border-red-200 dark:border-red-800",
          text: "text-red-900 dark:text-red-100"
        };
      case "warning":
        return {
          bg: "bg-yellow-50/95 dark:bg-yellow-950/95 border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-900 dark:text-yellow-100"
        };
      default:
        return {
          bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700",
          text: "text-neutral-900 dark:text-neutral-100"
        };
    }
  };

  const styles = getStyles(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-xl px-4 py-3 shadow-lg border max-w-sm min-w-[320px]",
        styles.bg,
        "cursor-pointer backdrop-blur-sm"
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-medium text-sm mb-1", styles.text)}>
            {notification.title}
          </h4>
          <p className={cn("text-xs opacity-80 line-clamp-2", styles.text)}>
            {notification.message}
          </p>
          <p className={cn("text-xs opacity-60 mt-1", styles.text)}>
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </p>
        </div>
        <AnimatePresence>
          {showClose && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose(notification.id);
              }}
              className={cn(
                "absolute top-2 right-2 p-1 rounded-full transition-colors",
                "hover:bg-black/10 dark:hover:bg-white/10",
                styles.text
              )}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface NotificationToastsProps {
  notifications: Notification[];
  onClose: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function NotificationToasts({ 
  notifications, 
  onClose,
  position = "top-right"
}: NotificationToastsProps) {
  const positionClasses = {
    "top-right": "top-20 right-16", // Positioned to avoid bell icon
    "top-left": "top-20 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div className={cn("fixed z-[100] flex flex-col gap-3 pointer-events-none", positionClasses[position])}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              notification={notification}
              onClose={onClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

