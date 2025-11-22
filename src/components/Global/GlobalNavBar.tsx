import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { label: "Chat", path: "/chat" },
  { label: "Personas", path: "/personas" },
  { label: "Superpowers", path: "/superpowers" },
  { label: "Memories", path: "/memories" },
  { label: "Knowledge", path: "/knowledge-base" },
  { label: "Dashboard", path: "/glow-dashboard" },
];

// Simple SidebarTrigger - now we're always inside SidebarProvider
function SafeSidebarTrigger({ className }: { className?: string }) {
  return <SidebarTrigger className={className} />;
}

export function GlobalNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme(); // Subscribe to theme changes
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({ width: 0, left: 0 });
  const [isNavVisible, setIsNavVisible] = useState(true);

  const handleNavigate = (path: string) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === "/chat") {
      return location.pathname === "/" || location.pathname.startsWith("/chat");
    }
    return location.pathname.startsWith(path);
  };

  // Update indicator position when route changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = NAV_LINKS.findIndex((link) => {
        if (link.path === "/chat") {
          return location.pathname === "/" || location.pathname.startsWith("/chat");
        }
        return location.pathname.startsWith(link.path);
      });
      
      if (activeIndex === -1 || !buttonRefs.current[activeIndex] || !navRef.current) return;

      const activeButton = buttonRefs.current[activeIndex];
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - navRect.left,
      });
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateIndicator, 0);

    // Update on resize
    const handleResize = () => {
      requestAnimationFrame(updateIndicator);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [location.pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 flex items-center justify-center px-4 py-3 backdrop-blur-xl  transition-colors duration-200 ${
      isDark 
        ? "bg-[#212121]" 
        : "bg-white"
    }`}>
      <div className="flex items-center gap-3 relative w-full max-w-7xl">
        {/* Sidebar Toggle - Left side */}
        <div className="flex-shrink-0">
          <SafeSidebarTrigger
            className={`p-2 transition-colors duration-200 ${isDark ? "text-white" : "text-black"}`}
          />
        </div>
        
        {/* Centered Nav */}
        <nav
          ref={navRef}
          className={`relative flex items-center mr-1 gap-1 rounded-full border px-2 py-1 shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-500 ease-in-out mx-auto ${
            isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'
          } ${
            isDark 
              ? "border-white/10 bg-zinc-900/70" 
              : "border-gray-300/50 bg-gray-100/90"
          }`}
        >
          {/* Sliding indicator */}
          <span
            ref={indicatorRef}
            className={`absolute top-1.5 h-[calc(100%-0.75rem)] rounded-full shadow-[inset_0_1px_0_rgba(0,0,0,0.1)] transition-all duration-300 ease-out ${
              isDark ? "bg-black/80" : "bg-white/90"
            }`}
            style={{
              width: `${indicatorStyle.width}px`,
              left: `${indicatorStyle.left}px`,
            }}
          />
          
          {NAV_LINKS.map((link, index) => {
            const active = isActive(link.path);

            return (
              <button
                type="button"
                key={link.path}
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                onClick={() => handleNavigate(link.path)}
                className={`relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  active
                    ? isDark ? "text-white" : "text-black"
                    : isDark 
                      ? "text-zinc-300 hover:text-white hover:bg-white/5" 
                      : "text-gray-600 hover:text-black hover:bg-gray-200/50"
                }`}
              >
                <span className="relative whitespace-nowrap">{link.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Toggle Button (Dot) - Right side */}
        <button
          type="button"
          onClick={() => setIsNavVisible(!isNavVisible)}
          className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-300 hover:scale-110 ml-auto ${
            isDark 
              ? "border-white/10 bg-zinc-900/70 hover:bg-zinc-800/70" 
              : "border-gray-300/50 bg-gray-100/90 hover:bg-gray-200/70"
          }`}
          aria-label={isNavVisible ? "Hide navigation" : "Show navigation"}
        >
          <div className={`h-2 w-2 rounded-full transition-all duration-300 ${
            isDark ? "bg-white" : "bg-gray-700"
          } ${
            isNavVisible ? 'opacity-100' : 'opacity-50'
          }`} />
        </button>
      </div>
    </header>
  );
}

