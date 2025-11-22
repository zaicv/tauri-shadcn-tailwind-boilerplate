import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, PenSquare, MoreHorizontal, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";

import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  sidebarOffset?: number;
  setSidebarOpen?: (open: boolean) => void;
  personaName?: string;
  personaDescription?: string;
}

export default function Header({
  sidebarOffset = 0,
  setSidebarOpen,
  personaName,
  personaDescription,
}: HeaderProps) {
  const { theme, setTheme, isDark } = useTheme();
  
  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) setUser(data.user);
    };
    getUser();
  }, []);

  const handleLoginClick = () => {
    navigate("/authbox");
  };

  return (
    <header
      className={`flex items-center px-4 h-12  ${
        theme === "dark"
          ? "bg-[#212121] border-gray-700/10 text-white"
          : "bg-white border-gray-200/10 text-black"
      }`}
    >
      {/* Left side - Sidebar toggle */}
      <div className="flex-shrink-0">
        <SidebarTrigger
          className={`p-2 ${theme === "dark" ? "text-white" : "text-black"}`}
        />
      </div>

      {/* Center - Title */}
      <div className="flex-1 flex ml-20 justify-center">
        <div
          className={`font-semibold text-base ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          GlowGPT
        </div>
      </div>

      {/* Right side buttons */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {!user && (
          <Button
            className={`rounded-full px-4 py-2 font-medium ${
              theme === "dark"
                ? "bg-white text-black hover:bg-gray-100"
                : "bg-black text-white hover:bg-gray-800"
            }`}
            onClick={handleLoginClick}
          >
            Login
          </Button>
        )}

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          className={`p-2 ${isDark ? "text-white" : "text-black "}`}
          onClick={handleThemeToggle}
        >
          {isDark ? (
            <Moon className="!h-6 !w-6 fill-current" />
          ) : (
            <Sun className="!h-6 !w-6" />
          )}
        </Button>

        <Button
          variant="ghost"
          className={`p-2 ${theme === "dark" ? "text-white" : "text-black"}`}
        >
          <PenSquare className="!h-6 !w-[20px]" />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`p-2 ${
                theme === "dark"
                  ? "text-white hover:bg-gray-800"
                  : "text-black hover:bg-gray-200"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={`w-40 ${
              theme === "dark"
                ? "bg-[#3a3a3a] border-gray-700 text-white"
                : "bg-white border-gray-200 text-black"
            }`}
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className={`justify-start ${
                  theme === "dark"
                    ? "text-white hover:bg-gray-700"
                    : "text-black hover:bg-gray-100"
                }`}
                size="sm"
              >
                Rename Chat
              </Button>
              <Button
                variant="ghost"
                className={`justify-start ${
                  theme === "dark"
                    ? "text-white hover:bg-gray-700"
                    : "text-black hover:bg-gray-100"
                }`}
                size="sm"
              >
                Delete Chat
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
