import * as React from "react";
import { ChevronsUpDown, Plus, User } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { useTheme } from "@/context/ThemeContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Helper function to get persona avatar display
const getPersonaAvatar = (persona: any) => {
  if (persona.avatar && persona.avatar !== "🌟") {
    return persona.avatar;
  }
  // Fallback to first letter of name
  return persona.name?.[0]?.toUpperCase() || "P";
};

// Helper function to get persona color
const getPersonaColor = (persona: any) => {
  if (persona.orbColor) {
    return persona.orbColor;
  }
  if (persona.colors && persona.colors.length > 0) {
    return persona.colors[0];
  }
  return "#ffd700"; // Default gold color
};

export function PersonaSwitcher() {
  const { isMobile } = useSidebar();
  const { isDark } = useTheme();
  const {
    currentPersona,
    personas,
    switchPersona,
    getCurrentPersona,
    loading,
  } = usePersona();

  const activePersona = getCurrentPersona();
  const personaList = Object.values(personas);

  // Loading state
  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground animate-pulse">
              <User className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Loading...</span>
              <span className="truncate text-xs">Personas</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // No personas available
  if (!activePersona || personaList.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">No Personas</span>
              <span className="truncate text-xs">Available</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const personaColor = getPersonaColor(activePersona);
  const personaAvatar = getPersonaAvatar(activePersona);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-lg font-semibold text-xs shadow-sm"
                style={{
                  backgroundColor: personaColor,
                  color: "#ffffff",
                  border: `1px solid ${personaColor}20`,
                }}
              >
                {personaAvatar.length === 1 ? (
                  <span className="text-black dark:text-white drop-shadow-sm dark:drop-shadow-md transition-colors duration-200">
                    {personaAvatar}
                  </span>
                ) : (
                  <span className="text-lg leading-none text-black dark:text-white drop-shadow-sm dark:drop-shadow-md transition-colors duration-200">
                    {personaAvatar}
                  </span>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className={`truncate font-semibold transition-colors duration-200 ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  {activePersona.name}
                </span>
                <span className={`truncate text-xs transition-colors duration-200 ${
                  isDark ? "text-white/70" : "text-gray-600"
                }`}>
                  {activePersona.model ||
                    activePersona.personality ||
                    "AI Assistant"}
                </span>
              </div>
              <ChevronsUpDown className={`ml-auto size-4 transition-colors duration-200 ${
                isDark ? "text-white/70" : "text-gray-600"
              }`} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className={`text-xs transition-colors duration-200 ${
              isDark ? "text-white/70" : "text-gray-600"
            }`}>
              Personas
            </DropdownMenuLabel>
            {personaList.map((persona, index) => {
              const isActive = currentPersona === persona.id;
              const color = getPersonaColor(persona);
              const avatar = getPersonaAvatar(persona);

              return (
                <DropdownMenuItem
                  key={persona.id}
                  onClick={() => switchPersona(persona.id)}
                  className={`gap-2 p-2 cursor-pointer ${
                    isActive ? "bg-accent" : ""
                  }`}
                >
                  <div
                    className="flex size-6 items-center justify-center rounded-sm font-semibold text-xs shadow-sm"
                    style={{
                      backgroundColor: color,
                      color: "#ffffff",
                      border: `1px solid ${color}40`,
                    }}
                  >
                    {avatar.length === 1 ? (
                      <span className="text-white drop-shadow-sm dark:drop-shadow-md">
                        {avatar}
                      </span>
                    ) : (
                      <span className="text-sm leading-none text-white drop-shadow-sm dark:drop-shadow-md">
                        {avatar}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`truncate font-medium transition-colors duration-200 ${
                      isDark ? "text-white" : "text-black"
                    }`}>{persona.name}</span>
                    <span className={`truncate text-xs transition-colors duration-200 ${
                      isDark ? "text-white/70" : "text-gray-600"
                    }`}>
                      {persona.description?.slice(0, 30) +
                        (persona.description?.length > 30 ? "..." : "") ||
                        persona.model ||
                        "AI Assistant"}
                    </span>
                  </div>
                  {index < 9 && (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={`gap-2 p-2 cursor-pointer transition-colors duration-200 ${
                isDark 
                  ? "text-white/70 hover:text-white" 
                  : "text-gray-600 hover:text-black"
              }`}
              onClick={() => {
                // You can implement navigation to persona management here
                console.log("Add new persona functionality");
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium">Manage Personas</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
