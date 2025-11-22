"use client";

import React from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { SearchSource } from "@/utils/parseSearchResults";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WebSearchSourcesProps {
  sources: SearchSource[];
  theme: "light" | "dark" | "system";
}

export function WebSearchSources({ sources, theme }: WebSearchSourcesProps) {
  if (sources.length === 0) return null;

  const isDark = theme === "dark";

  return (
    <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
      <div className="flex flex-wrap gap-2 items-center">
        <span
          className={cn(
            "text-sm font-medium mr-1",
            isDark ? "text-gray-400" : "text-gray-600"
          )}
        >
          Sources
        </span>
        {sources.map((source, idx) => (
          <motion.div
            key={source.index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.2,
              delay: idx * 0.05,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <HoverCard openDelay={300} closeDelay={200}>
              <HoverCardTrigger asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    "px-2.5 py-1.5 rounded-lg",
                    "text-xs font-medium",
                    "transition-all duration-200",
                    "hover:scale-105",
                    isDark
                      ? "bg-gray-800 hover:bg-gray-750 text-gray-300 border border-gray-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                  )}
                >
                  <img
                    src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                      source.url
                    )}`}
                    alt=""
                    className="w-4 h-4 rounded-sm"
                    width={16}
                    height={16}
                  />
                  <span>{source.index}</span>
                </a>
              </HoverCardTrigger>
              <HoverCardContent
                className={cn(
                  "w-96 p-0 overflow-hidden animate-in fade-in-0 zoom-in-95",
                  isDark
                    ? "bg-gray-900 border-gray-700"
                    : "bg-white border-gray-200"
                )}
                sideOffset={8}
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Thumbnail if available */}
                  {source.thumbnail && (
                    <div className="w-full h-36 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={source.thumbnail}
                        alt={source.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4 space-y-2.5">
                    {/* Domain with favicon */}
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
                          source.url
                        )}`}
                        alt=""
                        className="w-4 h-4 rounded-sm"
                        width={16}
                        height={16}
                      />
                      <div
                        className={cn(
                          "text-xs font-semibold truncate",
                          isDark ? "text-blue-400" : "text-blue-600"
                        )}
                      >
                        {new URL(source.url).hostname.replace("www.", "")}
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      className={cn(
                        "font-semibold text-sm leading-tight line-clamp-2",
                        isDark ? "text-gray-100" : "text-gray-900"
                      )}
                    >
                      {source.title}
                    </h4>

                    {/* Description */}
                    <p
                      className={cn(
                        "text-sm leading-relaxed line-clamp-3",
                        isDark ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      {source.description}
                    </p>
                  </div>
                </a>
              </HoverCardContent>
            </HoverCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default WebSearchSources;
