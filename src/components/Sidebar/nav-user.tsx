"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
  Settings,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabase/supabaseClient";
import { useTheme } from "@/context/ThemeContext";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/authbox");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className={`rounded-lg transition-colors duration-200 ${
                  isDark ? "bg-white/10 text-white" : "bg-gray-200 text-black"
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className={`truncate font-semibold transition-colors duration-200 ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  {user.name}
                </span>
                <span className={`truncate text-xs transition-colors duration-200 ${
                  isDark ? "text-white/70" : "text-gray-600"
                }`}>
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className={`ml-auto size-4 transition-colors duration-200 ${
                isDark ? "text-white/70" : "text-gray-600"
              }`} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={`w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg backdrop-blur-xl transition-colors duration-200 ${
              isDark 
                ? "bg-[#212121] border-white/10 text-white" 
                : "bg-white border-gray-200/50 text-black"
            }`}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className={`rounded-lg transition-colors duration-200 ${
                    isDark ? "bg-white/10 text-white" : "bg-gray-200 text-black"
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className={`truncate font-semibold transition-colors duration-200 ${
                    isDark ? "text-white" : "text-black"
                  }`}>
                    {user.name}
                  </span>
                  <span className={`truncate text-xs transition-colors duration-200 ${
                    isDark ? "text-white/70" : "text-gray-600"
                  }`}>
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className={`transition-colors duration-200 ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`} />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className={`cursor-pointer transition-colors duration-200 ${
                  isDark 
                    ? "text-white hover:bg-white/10 focus:bg-white/10" 
                    : "text-black hover:bg-gray-100 focus:bg-gray-100"
                }`}
                onClick={handleProfileClick}
              >
                <User className="w-4 h-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`cursor-pointer transition-colors duration-200 ${
                  isDark 
                    ? "text-white hover:bg-white/10 focus:bg-white/10" 
                    : "text-black hover:bg-gray-100 focus:bg-gray-100"
                }`}
                onClick={handleSettingsClick}
              >
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className={`transition-colors duration-200 ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`} />
            <DropdownMenuGroup>
              <DropdownMenuItem className={`cursor-pointer transition-colors duration-200 ${
                isDark 
                  ? "text-white hover:bg-white/10 focus:bg-white/10" 
                  : "text-black hover:bg-gray-100 focus:bg-gray-100"
              }`}>
                <BadgeCheck className="w-4 h-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer transition-colors duration-200 ${
                isDark 
                  ? "text-white hover:bg-white/10 focus:bg-white/10" 
                  : "text-black hover:bg-gray-100 focus:bg-gray-100"
              }`}>
                <CreditCard className="w-4 h-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className={`cursor-pointer transition-colors duration-200 ${
                isDark 
                  ? "text-white hover:bg-white/10 focus:bg-white/10" 
                  : "text-black hover:bg-gray-100 focus:bg-gray-100"
              }`}>
                <Bell className="w-4 h-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className={`transition-colors duration-200 ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`} />
            <DropdownMenuItem
              className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
