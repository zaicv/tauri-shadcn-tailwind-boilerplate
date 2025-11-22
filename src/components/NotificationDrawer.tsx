"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Bell, CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlowState } from "@/hooks/useGlowState";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function NotificationDrawer() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { state } = useGlowState(3000);

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
        setNotifications(prev => [{
          id: notificationId,
          type: "info" as const,
          title: "Disc Inserted",
          message: `Disc detected at ${state.notifications.disc_path || "unknown location"}. Would you like to rip it?`,
          timestamp: new Date(state.notifications.timestamp || Date.now()),
          read: false
        }, ...prev]);
        
        // Only auto-open if it's not the initial page load
        if (!isInitialMount) {
          setOpen(true);
        }
      }
    }
  }, [state?.notifications, notifications, isInitialMount]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-md bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-2xl border-l border-white/20 dark:border-white/10 shadow-2xl"
        >
          <SheetHeader className="border-b border-gray-200/50 dark:border-white/10 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-gray-900 dark:text-white font-semibold text-lg">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/10 rounded-lg transition-all"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "border rounded-xl p-4 transition-all cursor-pointer backdrop-blur-sm",
                      notification.read 
                        ? "bg-gray-50/60 dark:bg-[#252525]/60 border-gray-200/50 dark:border-white/10 hover:bg-gray-100/60 dark:hover:bg-[#2a2a2a]/60" 
                        : "bg-white/70 dark:bg-[#1a1a1a]/70 border-gray-300/50 dark:border-white/20 shadow-lg hover:shadow-xl hover:scale-[1.01]"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={cn(
                              "font-medium text-sm",
                              !notification.read && "font-semibold",
                              "text-gray-900 dark:text-white"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-lg transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        {!notification.read && (
                          <Badge variant="outline" className="mt-2 text-xs border-blue-500 text-blue-700">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

