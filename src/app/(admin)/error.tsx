'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-200">500</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">出错了</h2>
        <p className="mt-2 text-sm text-slate-500">
          操作过程中发生了意外错误。
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-slate-400">错误 ID：{error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            重试
          </button>
          <a
            href="/admin"
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            返回控制台
          </a>
        </div>
      </div>
    </div>
  );
}
