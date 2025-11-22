export interface SearchSource {
  index: number;
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
}

/**
 * Parse search sources from markdown content
 * Looks for source metadata embedded in HTML comments
 */
export function parseSearchSources(markdown: string): {
  hasSources: boolean;
  sources: SearchSource[];
  cleanedMarkdown: string;
} {
  // Check if there are source markers
  if (!markdown.includes("<!-- SOURCES_START -->")) {
    return {
      hasSources: false,
      sources: [],
      cleanedMarkdown: markdown,
    };
  }

  const sources: SearchSource[] = [];

  // Extract all source data (with optional thumbnail)
  const sourceRegex =
    /<source data-index="(\d+)" data-url="([^"]*)" data-title="([^"]*)" data-description="([^"]*)"(?: data-thumbnail="([^"]*)")?><\/source>/g;

  let match;
  while ((match = sourceRegex.exec(markdown)) !== null) {
    const [, index, url, title, description, thumbnail] = match;

    sources.push({
      index: parseInt(index),
      url,
      title: title
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">"),
      description: description
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">"),
      thumbnail: thumbnail || undefined,
    });
  }

  // Clean the markdown - remove the HTML comments and source tags
  let cleanedMarkdown = markdown
    .replace(/<!-- SOURCES_START -->[\s\S]*?<!-- SOURCES_END -->/g, "")
    .trim();

  return {
    hasSources: sources.length > 0,
    sources,
    cleanedMarkdown,
  };
}
