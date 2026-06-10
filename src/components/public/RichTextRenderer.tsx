'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface RichTextRendererProps {
  html: string;
  className?: string;
}

// 允许的 HTML 标签白名单（与 Tiptap 输出对齐）
const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div',
  'figure', 'figcaption',
];

const ALLOWED_ATTRS = [
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'class', 'style',
  'colspan', 'rowspan',
];

export function RichTextRenderer({ html, className = '' }: RichTextRendererProps) {
  const sanitized = useMemo(() => {
    if (typeof window === 'undefined') return html;

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ALLOWED_ATTRS,
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target'],
    });
  }, [html]);

  return (
    <div
      className={`prose-news ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
