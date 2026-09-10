import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

const proseClass =
  "prose prose-sm dark:prose-invert max-w-none " +
  "prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-semibold prose-headings:tracking-tight " +
  "prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm " +
  "prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground/90 " +
  "prose-strong:font-semibold prose-strong:text-foreground " +
  "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:marker:text-muted-foreground " +
  "prose-a:text-accent prose-a:no-underline hover:prose-a:underline " +
  "prose-blockquote:border-l-accent/40 prose-blockquote:text-muted-foreground " +
  "prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[12px] prose-code:before:content-none prose-code:after:content-none " +
  "prose-pre:my-3 prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-muted/60 prose-pre:p-3 " +
  "prose-hr:my-4 prose-table:text-xs";

export function MarkdownContent({
  content,
  streaming = false,
  className,
}: {
  content: string;
  streaming?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative text-sm leading-relaxed text-foreground", className)}>
      <div className={cn(proseClass, streaming && "opacity-[0.98]")}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      {streaming && (
        <span
          aria-hidden
          className="mt-1 inline-block h-4 w-[2px] rounded-full bg-foreground/75 align-middle animate-[chatCaret_1s_ease-in-out_infinite]"
        />
      )}
    </div>
  );
}
