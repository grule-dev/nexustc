import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="prose dark:prose-invert w-full max-w-full break-words [&_a]:text-primary"
      role="document"
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
