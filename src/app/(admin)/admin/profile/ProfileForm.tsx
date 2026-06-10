'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateMyProfile } from '@/lib/actions/profiles';

// ──────────────────────────────────────────────
// ProfileForm — 编辑显示名称
// ──────────────────────────────────────────────

interface ProfileFormProps {
  initialDisplayName: string;
}

export function ProfileForm({ initialDisplayName }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateMyProfile({ display_name: displayName });
      if (result.success) {
        setMessage({ type: 'success', text: '保存成功' });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '保存失败' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          显示名称
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="输入显示名称（作者署名）"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-slate-400">
          此名称将显示在新闻详情页的作者位置
        </p>
      </div>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? '保存中...' : '保存'}
      </button>
    </form>
  );
}
