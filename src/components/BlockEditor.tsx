import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import React, { useEffect } from 'react';

interface BlockEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function BlockEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  className = '',
  style 
}: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert focus:outline-none max-w-none ${className}`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="relative w-full" style={style}>
      <EditorContent editor={editor} />
    </div>
  );
}
