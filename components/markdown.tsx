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
          h1: (props) => <h3 {...props} />,
          h2: (props) => <h3 {...props} />,
          h3: (props) => <h4 {...props} />,
          h4: (props) => <h5 {...props} />,
          h5: (props) => <h6 {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
