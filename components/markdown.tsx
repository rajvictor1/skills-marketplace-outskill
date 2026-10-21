import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * Renders untrusted SKILL.md content. rehype-sanitize strips any HTML/script,
 * so a malicious skill body can never inject markup into our page. We never
 * use dangerouslySetInnerHTML on skill content.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-skill">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ children }) => <h3>{children}</h3>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h4>{children}</h4>,
          h4: ({ children }) => <h5>{children}</h5>,
          h5: ({ children }) => <h6>{children}</h6>,
          table: ({ children }) => (
            <div
              className="max-w-full overflow-x-auto"
              role="region"
              aria-label="Recipe content table"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
