import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  registerDownloadSession: (sessionId: string) => void;
  registerMessageHandler: (handler: (message: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const clientId = `glow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const handlersRef = useRef<Set<(message: any) => void>>(new Set());
  
  const handleMessage = useCallback((message: any) => {
    console.log('Global WebSocket message:', message);
    handlersRef.current.forEach(handler => handler(message));
  }, []);
  
  const { isConnected, sendMessage, registerDownloadSession } = useWebSocket(
    clientId,
    handleMessage
  );
  
  const registerMessageHandler = useCallback((handler: (message: any) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, registerDownloadSession, registerMessageHandler }}>
      {children}
    </WebSocketContext.Provider>
  );
};