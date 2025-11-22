import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

interface GlowCloudLayoutProps {
  children: React.ReactNode;
}

export function GlowCloudLayout({ children }: GlowCloudLayoutProps) {
  return <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>;
}
