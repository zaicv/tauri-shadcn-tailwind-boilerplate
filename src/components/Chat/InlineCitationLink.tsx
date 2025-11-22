"use client";

import React, { useEffect } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { SearchSource } from "@/utils/parseSearchResults";
import { cn } from "@/lib/utils";

interface InlineCitationLinkProps {
  citationNumber: number;
  source?: SearchSource;
  theme: "light" | "dark" | "system";
}

export function InlineCitationLink({
  citationNumber,
  source,
  theme,
}: InlineCitationLinkProps) {
  const isDark = theme === "dark";

  if (!source) {
    return (
      <sup className="inline-citation" data-citation={citationNumber}>
        [{citationNumber}]
      </sup>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <sup
          className={cn(
            "inline-citation cursor-pointer",
            "inline-flex items-center justify-center",
            "ml-1 px-1.5 py-0.5 rounded-md",
            "text-xs font-medium no-underline",
            "transition-all duration-200",
            isDark
              ? "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 hover:scale-105"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105"
          )}
          data-citation={citationNumber}
        >
          [{citationNumber}]
        </sup>
      </HoverCardTrigger>
      <HoverCardContent
        className={cn(
          "w-96 p-0 overflow-hidden",
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        )}
        sideOffset={5}
      >
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {/* Thumbnail if available */}
          {source.thumbnail && (
            <div className="w-full h-32 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={source.thumbnail}
                alt={source.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div className="p-4 space-y-2">
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
                  "text-xs font-medium truncate",
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

            {/* URL */}
            <div
              className={cn(
                "text-xs truncate font-mono pt-1",
                isDark ? "text-gray-600" : "text-gray-400"
              )}
            >
              {source.url}
            </div>
          </div>
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}

export default InlineCitationLink;
