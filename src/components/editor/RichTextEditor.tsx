'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';

// ──────────────────────────────────────────────
// RichTextEditor
// ──────────────────────────────────────────────

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '开始撰写新闻内容...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm prose-slate max-w-none focus:outline-none min-h-[400px] px-5 py-4',
      },
    },
    immediatelyRender: false,
  });

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('输入图片 URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('输入链接 URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-white px-3 py-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="B"
          title="加粗"
          className="font-bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="I"
          title="斜体"
          className="italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label="S"
          title="删除线"
          className="line-through"
        />

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive('heading', { level: 2 })}
          label="H2"
          title="二级标题"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive('heading', { level: 3 })}
          label="H3"
          title="三级标题"
        />

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="列表"
          title="无序列表"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="1."
          title="有序列表"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="❝"
          title="引用"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          label="&lt;/&gt;"
          title="代码块"
        />

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <ToolbarButton
          onClick={addLink}
          active={editor.isActive('link')}
          label="🔗"
          title="插入链接"
        />
        <ToolbarButton onClick={addImage} label="🖼" title="插入图片" />
      </div>

      {/* 编辑器区域 */}
      <EditorContent editor={editor} />
    </div>
  );
}

// ──────────────────────────────────────────────
// ToolbarButton
// ──────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  label,
  title,
  className,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-slate-600 hover:bg-slate-100'
      } ${className ?? ''}`}
    >
      {label}
    </button>
  );
}
