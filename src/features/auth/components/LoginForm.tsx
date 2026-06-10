'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/actions/auth';

// ──────────────────────────────────────────────
// LoginForm
// ──────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // 全页刷新以确保 session cookie 被浏览器正确携带
        window.location.href = redirectTo;
      } else {
        setError(result.error);
        setIsLoading(false);
      }
    } catch {
      setError('登录失败，请稍后重试');
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-slate-700"
        >
          邮箱
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-slate-700"
        >
          密码
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            登录中...
          </span>
        ) : (
          '登录'
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
