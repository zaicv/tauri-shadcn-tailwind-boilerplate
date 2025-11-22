"use client";

import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

interface MarkdownRendererProps {
  children: string;
  citationRenderer?: (num: number) => React.ReactNode;
}

export function MarkdownRenderer({
  children,
  citationRenderer,
}: MarkdownRendererProps) {
  // Preprocess to fix non-standard image syntax: ![alt](image: url) -> ![alt](url)
  let processedContent =
    children?.replace(/!\[([^\]]*)\]\(image:\s*([^\)]+)\)/g, "![$1]($2)") || "";

  // Convert inline citations [^N] to HTML spans with unique IDs
  processedContent = processedContent.replace(/\[\^(\d+)\]/g, (match, num) => {
    return `<span class="citation-placeholder" data-citation="${num}"></span>`;
  });

  return (
    <div className="prose prose-sm max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          ...COMPONENTS,
          span: ({ node, className, children, ...props }: any) => {
            // Handle citation placeholders
            if (
              className === "citation-placeholder" &&
              props["data-citation"]
            ) {
              const citationNum = parseInt(props["data-citation"]);
              if (citationRenderer) {
                return <>{citationRenderer(citationNum)}</>;
              }
              // Fallback if no renderer provided
              return <sup className="inline-citation">[{citationNum}]</sup>;
            }
            // Regular span
            return (
              <span className={className} {...props}>
                {children}
              </span>
            );
          },
        }}
      >
        {processedContent}
      </Markdown>
    </div>
  );
}

interface HighlightedPreProps extends React.HTMLAttributes<HTMLPreElement> {
  children: string;
  language: string;
}

const HighlightedPre: React.FC<HighlightedPreProps> = ({
  children,
  language,
  ...props
}) => {
  const [tokens, setTokens] = useState<any[][] | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { codeToTokens, bundledLanguages } = await import("shiki");

        if (!(language in bundledLanguages)) {
          return;
        }

        const { tokens } = await codeToTokens(children, {
          lang: language as keyof typeof bundledLanguages,
          themes: {
            light: "github-light",
            dark: "nord",
          },
        });

        if (mounted) {
          setTokens(tokens);
        }
      } catch (err) {
        console.error("Error loading Shiki:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [children, language]);

  return (
    <pre
      className="bg-[#1e1e1e] dark:bg-[#0d1117] text-gray-100 rounded-xl p-4 overflow-x-auto font-mono text-sm leading-6 shadow-lg border border-gray-700/50"
      {...props}
    >
      <code className="block">
        {tokens
          ? tokens.map((line, lineIndex) => (
              <span key={lineIndex} className="block">
                {line.map((token, tokenIndex) => (
                  <span
                    key={tokenIndex}
                    style={token.htmlStyle as React.CSSProperties}
                  >
                    {token.content}
                  </span>
                ))}
              </span>
            ))
          : children}
      </code>
    </pre>
  );
};

HighlightedPre.displayName = "HighlightedCode";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
  className?: string;
  language: string;
}

const CodeBlock = ({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) => {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children);

  return (
    <div className="group/code relative my-4">
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          <div className="invisible opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
            <CopyButton content={code} copyMessage="Copied!" />
          </div>
        </div>
        <HighlightedPre language={language} {...restProps}>
          {code}
        </HighlightedPre>
      </div>
    </div>
  );
};

function childrenTakeAllStringContents(element: any): string {
  if (typeof element === "string") {
    return element;
  }

  if (element?.props?.children) {
    let children = element.props.children;

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join("");
    } else {
      return childrenTakeAllStringContents(children);
    }
  }

  return "";
}

const COMPONENTS = {
  h1: withClass(
    "h1",
    "text-2xl font-bold mt-6 mb-4 leading-tight flex items-center gap-2"
  ),
  h2: withClass(
    "h2",
    "text-xl font-bold mt-5 mb-3 leading-tight flex items-center gap-2"
  ),
  h3: withClass(
    "h3",
    "text-lg font-semibold mt-4 mb-2 leading-snug flex items-center gap-2"
  ),
  h4: withClass(
    "h4",
    "text-base font-semibold mt-3 mb-2 flex items-center gap-2"
  ),
  h5: withClass("h5", "text-sm font-semibold mt-2 mb-1"),
  h6: withClass("h6", "text-sm font-medium mt-2 mb-1"),
  strong: withClass("strong", "font-semibold"),
  em: withClass("em", "italic"),
  a: ({ node, children, href, ...props }: any) => {
    // Check if the link text is just a URL
    const isRawUrl = typeof children === "string" && children === href;

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 decoration-1 hover:decoration-2 transition-all duration-150 cursor-pointer inline-flex items-center gap-1"
        {...props}
      >
        {children}
        {!isRawUrl && (
          <svg
            className="w-3 h-3 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        )}
      </a>
    );
  },
  img: ({ node, src, alt, ...props }: any) => (
    <span className="block my-4">
      <img
        src={src}
        alt={alt || ""}
        className="max-w-full h-auto rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        loading="lazy"
        {...props}
      />
      {alt && (
        <span className="block text-sm text-gray-600 dark:text-gray-400 mt-2 text-center italic">
          {alt}
        </span>
      )}
    </span>
  ),
  blockquote: withClass(
    "blockquote",
    "border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/30 rounded-r"
  ),
  code: ({ children, className, node, ...rest }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <CodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </CodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono text-[0.9em] bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700"
        )}
        {...rest}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => children,
  ol: withClass("ol", "list-decimal space-y-2 pl-6 my-4"),
  ul: withClass("ul", "list-disc space-y-2 pl-6 my-4"),
  li: withClass("li", "leading-7"),
  table: withClass(
    "table",
    "w-full border-collapse my-4 rounded-lg overflow-hidden shadow-sm"
  ),
  thead: withClass("thead", "bg-gray-100 dark:bg-gray-800"),
  th: withClass(
    "th",
    "border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  td: withClass(
    "td",
    "border border-gray-300 dark:border-gray-600 px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right"
  ),
  tr: withClass("tr", "even:bg-gray-50 dark:even:bg-gray-800/50"),
  p: withClass("p", "leading-7 my-3 whitespace-pre-wrap"),
  hr: withClass("hr", "my-6 border-gray-300 dark:border-gray-600"),
};

function withClass(Tag: keyof JSX.IntrinsicElements, classes: string) {
  const Component = ({ node, ...props }: any) => (
    <Tag className={classes} {...props} />
  );
  Component.displayName = Tag;
  return Component;
}

export default MarkdownRenderer;
