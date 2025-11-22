import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/supabase/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  LogIn,
  MessageCircle,
  Zap,
  Cloud,
  Brain,
  Server,
  Video,
  Activity,
  Disc,
  Folder,
  Sparkles,
  Heart,
  Radio,
  LayoutDashboard,
  Sun,
  TreePine,
  FileType,
  Monitor,
} from "lucide-react";
import { SettingsModal } from "@/components/Global/SettingsModal";

import { NavMain } from "@/components/Sidebar/nav-main";
import { NavProjects } from "@/components/Sidebar/nav-projects";
import { NavUser } from "@/components/Sidebar/nav-user";
import { PersonaSwitcher } from "@/components/Sidebar/persona-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { NavThreads } from "@/components/Sidebar/nav-threads";
import { NavFolders } from "@/components/Sidebar/nav-folders";

// Updated data without the teams section
const data = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) setUser(data.user);
    };
    getUser();
  }, []);

  const userData = {
    name: user?.user_metadata?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.user_metadata?.avatar_url || "",
  };

  const handleLoginClick = () => {
    navigate("/authbox");
  };

  const navigationItems = [
    { label: "Chat", path: "/chat", icon: MessageCircle },
    { label: "FullChat", path: "/fullchat", icon: SquareTerminal },
    { label: "Personas", path: "/personas", icon: Sparkles },
    { label: "GlowOnboarding", path: "/glow-onboarding", icon: Heart },
    { label: "Folders", path: "/folders", icon: Folder },
    { label: "GlowDashboard", path: "/glow-dashboard", icon: LayoutDashboard },
    { label: "GlowOS", path: "/glow-os", icon: Monitor },
    { label: "Alaura", path: "/alauralog", icon: Activity },
    { label: "Superpowers", path: "/superpowers", icon: Zap },
    { label: "GlowCloud", path: "/glowcloud", icon: Cloud },
    { label: "Memories", path: "/memories", icon: Brain },
    { label: "Plex", path: "/plex", icon: Server },
    { label: "YouTube", path: "/youtube", icon: Video },
    { label: "RipDisc", path: "/ripdisc", icon: Disc },
    { label: "FileConverter", path: "/tools/file-converter", icon: FileType },
    { label: "GlowDev", path: "/glow-dev", icon: Brain },
    { label: "Mind Garden", path: "/mind-garden", icon: TreePine },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="mt-20">
        <PersonaSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavThreads />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  onClick={() => navigate(item.path)}
                  tooltip={item.label}
                  className="hover:bg-gray-100 dark:hover:bg-white/10 focus:bg-gray-100 dark:focus:bg-white/10 transition-colors duration-200"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <NavFolders />
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                console.log("🔧 Settings button clicked, opening modal");
                setSettingsOpen(true);
              }}
              className={`transition-colors duration-200 ${
                isDark 
                  ? "hover:bg-white/10 focus:bg-white/10" 
                  : "hover:bg-gray-100 focus:bg-gray-100"
              }`}
            >
              <Settings2 className={`h-4 w-4 transition-colors duration-200 ${
                isDark ? "text-white" : "text-black"
              }`} />
              <span className={`transition-colors duration-200 ${
                isDark ? "text-white" : "text-black"
              }`}>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {user ? (
            <NavUser user={userData} />
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={handleLoginClick}
                className="hover:bg-white/10 focus:bg-white/10"
              >
                <LogIn className="h-8 w-8 rounded-lg text-gray-600 dark:text-white/70 transition-colors duration-200" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-black dark:text-white transition-colors duration-200">
                    Login
                  </span>
                  <span className="truncate text-xs text-gray-600 dark:text-white/70 transition-colors duration-200">
                    Sign in to your account
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <SidebarRail />
    </Sidebar>
  );
}
