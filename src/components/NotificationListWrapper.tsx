"use client";

import { useState, useEffect } from "react";
import { NotificationList, type NotificationItem } from "@/components/animate-ui/components/community/notification-list";
import { NotificationToasts } from "@/components/NotificationToast";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlowState } from "@/hooks/useGlowState";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/context/ThemeContext";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function NotificationListWrapper() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const [showList, setShowList] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { state } = useGlowState(3000);
  const { isDark } = useTheme();

  // Mark initial mount as complete after first render
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Check for new notifications from GlowState
  useEffect(() => {
    if (state?.notifications?.disc_inserted) {
      const notificationId = `disc-${state.notifications.timestamp}`;
      const exists = notifications.some(n => n.id === notificationId);
      
      if (!exists) {
        const newNotification: Notification = {
          id: notificationId,
          type: "info" as const,
          title: "Disc Inserted",
          message: `Disc detected at ${state.notifications.disc_path || "unknown location"}. Would you like to rip it?`,
          timestamp: new Date(state.notifications.timestamp || Date.now()),
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast for new notification (not on initial mount)
        if (!isInitialMount) {
          setActiveToasts(prev => [...prev, newNotification]);
        }
      }
    }
  }, [state?.notifications, notifications, isInitialMount]);

  // Remove toast when dismissed
  const handleToastClose = (id: string) => {
    setActiveToasts(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setActiveToasts(prev => prev.filter(n => n.id !== id));
  };

  // Convert notifications to NotificationItem format for NotificationList
  const notificationItems: NotificationItem[] = notifications.slice(0, 3).map(notification => ({
    id: notification.id,
    title: notification.title,
    subtitle: notification.message,
    time: formatDistanceToNow(notification.timestamp, { addSuffix: true }),
    count: !notification.read ? 1 : undefined,
    onClick: () => {
      markAsRead(notification.id);
    },
  }));

  return (
    <>
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowList(!showList)}
        className={cn(
          "relative h-10 w-10 rounded-full transition-all duration-200",
          isDark
            ? "text-white hover:bg-white/10"
            : "text-black hover:bg-black/10"
        )}
        aria-label="Toggle notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-xs flex items-center justify-center font-medium",
            "bg-red-500 border-2",
            isDark ? "border-[#212121]" : "border-white"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification List - Toggled by bell icon */}
      {showList && notifications.length > 0 && (
        <div className="fixed top-28 right-4 z-[60]">
          <NotificationList 
            notifications={notificationItems}
            onViewAll={() => {}} // No action needed since list is already visible
          />
        </div>
      )}

      {/* Toast Notifications */}
      <NotificationToasts 
        notifications={activeToasts} 
        onClose={handleToastClose}
        position="top-right"
      />
    </>
  );
}

