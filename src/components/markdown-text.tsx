"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownTextProps = {
  content: string;
  className?: string;
};

type MarkdownInlineProps = {
  content: string;
  className?: string;
};

const inlineComponents: Components = {
  p: ({ children }) => <>{children}</>,
  h1: ({ children }) => <>{children}</>,
  h2: ({ children }) => <>{children}</>,
  h3: ({ children }) => <>{children}</>,
  h4: ({ children }) => <>{children}</>,
  h5: ({ children }) => <>{children}</>,
  h6: ({ children }) => <>{children}</>,
  ul: ({ children }) => <>{children}</>,
  ol: ({ children }) => <>{children}</>,
  li: ({ children }) => <>{children} </>,
  blockquote: ({ children }) => <>{children}</>,
  code: ({ children }) => <>{children as ReactNode}</>,
  pre: ({ children }) => <>{children}</>,
};

export function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function MarkdownInline({ content, className }: MarkdownInlineProps) {
  return (
    <span className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
        {content}
      </ReactMarkdown>
    </span>
  );
}
