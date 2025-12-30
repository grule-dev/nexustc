import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="prose dark:prose-invert wrap-break-word w-full max-w-full [&_a]:text-primary"
      role="document"
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
