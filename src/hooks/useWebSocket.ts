import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  session_id?: string;
  data?: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  registerDownloadSession: (sessionId: string) => void;
}

export const useWebSocket = (
  clientId: string,
  onMessage?: (message: WebSocketMessage) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const onMessageRef = useRef(onMessage);

  // Update the ref when onMessage changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(`wss://100.83.147.76:8003/ws/${clientId}`);

      ws.onopen = () => {
        console.log("🔌 WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("📨 WebSocket message:", message);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error("❌ Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );
          console.log(
            `🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
    }
  }, [clientId]); // Only depend on clientId

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ WebSocket not connected, cannot send message");
    }
  }, []);

  const registerDownloadSession = useCallback(
    (sessionId: string) => {
      sendMessage({
        type: "register_download",
        session_id: sessionId,
      });
    },
    [sendMessage]
  );

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clientId]); // Only reconnect when clientId changes

  return {
    isConnected,
    sendMessage,
    registerDownloadSession,
  };
};
