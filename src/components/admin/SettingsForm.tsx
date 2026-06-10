'use client';

import { useState } from 'react';
import { updateSetting } from '@/lib/actions/settings';
import { SETTING_DEFINITIONS } from '@/lib/constants/settings';
import type { SettingsMap } from '@/lib/actions/settings';

// ──────────────────────────────────────────────
// SettingsForm — 系统配置表单
// ──────────────────────────────────────────────

interface SettingsFormProps {
  initialSettings: SettingsMap;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<SettingsMap>({ ...initialSettings });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    key: string;
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSave(key: string, value: any) {
    setSavingKey(key);
    setMessage(null);

    try {
      const result = await updateSetting(key, value);
      if (result.success) {
        setMessage({ key, type: 'success', text: '保存成功' });
      } else {
        setMessage({ key, type: 'error', text: result.error });
      }
    } catch (err: any) {
      setMessage({ key, type: 'error', text: err.message || '保存失败' });
    } finally {
      setSavingKey(null);
    }
  }

  function handleChange(key: string, value: any) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      {SETTING_DEFINITIONS.map((def) => {
        const value = settings[def.key] ?? def.defaultValue;
        const isSaving = savingKey === def.key;
        const msg = message?.key === def.key ? message : null;

        return (
          <div
            key={def.key}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-900">
                {def.label}
              </label>
              <p className="mt-0.5 text-xs text-slate-500">{def.description}</p>
            </div>

            {def.type === 'textarea' ? (
              <textarea
                rows={3}
                value={value ?? ''}
                onChange={(e) => handleChange(def.key, e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : def.type === 'number' ? (
              <input
                type="number"
                value={value ?? ''}
                onChange={(e) => handleChange(def.key, Number(e.target.value))}
                className="block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            ) : (
              <input
                type="text"
                value={value ?? ''}
                onChange={(e) => handleChange(def.key, e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave(def.key, settings[def.key])}
                disabled={isSaving}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>

              {msg && (
                <span
                  className={`text-sm ${
                    msg.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {msg.text}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          配置修改后立即生效。站点名称和描述将在前台页面展示中体现。
        </p>
      </div>
    </div>
  );
}
