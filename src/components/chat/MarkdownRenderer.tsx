"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        "prose prose-invert leading-tight max-w-none prose-p:text-neutral-200 prose-li:text-neutral-200 prose-strong:text-neutral-100 prose-headings:text-neutral-100 prose-pre:text-[11px] prose-code:text-[11px]",
        className
      )}
    >
      <ReactMarkdown
        components={{
          pre: ({ children, ...props }) => (
            <pre className="overflow-x-auto" {...props}>
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;

            if (isInline) {
              return (
                <code
                  className="not-prose text-[11px] px-1 py-0.5 rounded-sm bg-neutral-800 text-neutral-200 font-mono break-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("", className)} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
