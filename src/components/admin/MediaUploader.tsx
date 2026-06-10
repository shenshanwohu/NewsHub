'use client';

import { useState, useRef, useCallback } from 'react';

// ──────────────────────────────────────────────
// MediaUploader — 拖拽/点击上传组件
// ──────────────────────────────────────────────

interface MediaUploaderProps {
  onUpload: (formData: FormData) => Promise<void>;
  /**
   * 存储桶: news-covers（封面）或 article-images（正文插图）
   */
  bucket?: 'news-covers' | 'article-images';
}

export function MediaUploader({
  onUpload,
  bucket = 'article-images',
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `不支持 ${file.type} 格式，仅允许 JPEG/PNG/WebP/GIF`;
    }
    if (file.size > maxSize) {
      return `文件大小 ${(file.size / (1024 * 1024)).toFixed(1)}MB 超过限制（5MB）`;
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setMessage({ type: 'error', text: validationError });
        return;
      }

      setIsUploading(true);
      setMessage(null);

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('bucket', bucket);

        await onUpload(fd);
        setMessage({ type: 'success', text: `${file.name} 上传成功` });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || '上传失败' });
      } finally {
        setIsUploading(false);
      }
    },
    [bucket, onUpload, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      // 重置 input 以允许重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [uploadFile],
  );

  return (
    <div className="mb-6">
      {/* 拖拽区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileSelect}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="text-sm text-slate-500">上传中...</p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-4xl text-slate-300">
              <svg
                className="mx-auto h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {isDragging ? '松开以上传' : '拖拽图片到此处，或点击选择'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              JPEG / PNG / WebP / GIF，最大 5MB
            </p>
          </>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
