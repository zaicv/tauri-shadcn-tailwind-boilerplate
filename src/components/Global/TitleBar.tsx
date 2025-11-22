import { useState, useEffect } from "react";
import { X, Minus, Square } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Detect if we're running in Tauri
const isTauriApp = () => {
  if (typeof window === 'undefined') return false;
  const isTauriProtocol = window.location.protocol === 'tauri:' || 
                           window.location.hostname === 'tauri.localhost';
  const hasTauriGlobal = '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
  return isTauriProtocol || hasTauriGlobal;
};

export function TitleBar() {
  const [isHovered, setIsHovered] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    const detected = isTauriApp();
    setIsTauri(detected);
  }, []);

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Close failed:', error);
    }
  };

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Minimize failed:', error);
    }
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    try {
      const appWindow = getCurrentWindow();
      const isFullscreen = await appWindow.isFullscreen();
      if (isFullscreen) {
        await appWindow.setFullscreen(false);
      } else {
        await appWindow.setFullscreen(true);
      }
    } catch (error) {
      console.error('Fullscreen failed:', error);
    }
  };

  const handleDoubleClick = async () => {
    if (!isTauri) return;
    // macOS behavior: double-click title bar toggles fullscreen
    await handleMaximize();
  };

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-10 z-[99999] flex items-center pl-3 pointer-events-auto"
      style={{
        background: 'transparent',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* macOS Traffic Lights */}
      <div 
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
          {/* Close Button - Red */}
          <button
            onClick={handleClose}
            className="group relative w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-all duration-200 flex items-center justify-center shadow-sm"
            aria-label="Close"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <X
              className={`w-2 h-2 text-[#4d0000] transition-opacity duration-200 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              strokeWidth={3}
            />
          </button>

          {/* Minimize Button - Yellow */}
          <button
            onClick={handleMinimize}
            className="group relative w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffcc00] transition-all duration-200 flex items-center justify-center shadow-sm"
            aria-label="Minimize"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <Minus
              className={`w-2 h-2 text-[#5c4600] transition-opacity duration-200 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              strokeWidth={3}
            />
          </button>

          {/* Maximize Button - Green */}
          <button
            onClick={handleMaximize}
            className="group relative w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#30d158] transition-all duration-200 flex items-center justify-center shadow-sm"
            aria-label="Maximize"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <Square
              className={`w-1.5 h-1.5 text-[#003d0d] transition-opacity duration-200 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
              strokeWidth={3}
            />
          </button>
        </div>
    </div>
  );
}

