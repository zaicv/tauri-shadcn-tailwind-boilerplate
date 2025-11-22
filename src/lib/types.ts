


export type Message = {
    id: number;
    sender: "user" | "assistant";
    text?: string;
    glowStateUsed?: boolean; // Debug: indicates GlowState was used
    superpowerName?: string | null; // Name of superpower being used
    knowledgeBaseSources?: any[]; // Knowledge base sources used
    tool_result?: {
      status: "success" | "error";
      message: string;
      superpower: string;
      tool: string;
      data?: any;
    };
    // Add this for video messages
    plexVideo?: {
      type: "plex_video";
      title: string;
      videoSrc: string;
      thumbnailSrc: string;
      thumbnailAlt: string;
      plexWebUrl: string;
      duration?: string;
      library?: string;
      message: string;
    };
    // Add this for file search results
    file_search?: {
      matches: Array<{
        name: string;
        path: string;
        type: "file" | "directory";
        size?: number;
        modified?: number;
      }>;
      query: string;
      location_hint?: string;
      count: number;
    };
  };