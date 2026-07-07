import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";

type Props = {
  noteId: string;
  initialContent: string;
  onChange: (markdown: string) => void;
  editorRef?: React.MutableRefObject<Editor | null>;
};

export function MarkdownEditor({ noteId, initialContent, onChange, editorRef }: Props) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing… Markdown supported." }),
      Link.configure({ openOnClick: false }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const md = (editor.storage as any).markdown.getMarkdown();
      onChangeRef.current(md);
    },
  }, [noteId]);

  useEffect(() => {
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  return (
    <EditorContent
      editor={editor}
      className="prose prose-sm dark:prose-invert max-w-none min-h-[60vh] outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[60vh]"
    />
  );
}

export type { Editor };
