'use client';

interface SEOFieldsProps {
  seoTitle: string;
  seoDescription: string;
  seoOgImage: string;
  onChange: (
    field: 'seoTitle' | 'seoDescription' | 'seoOgImage',
    value: string,
  ) => void;
}

export function SEOFields({
  seoTitle,
  seoDescription,
  seoOgImage,
  onChange,
}: SEOFieldsProps) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">SEO 设置</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          自定义搜索引擎和社交分享的展示内容。留空则自动从新闻内容生成。
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          SEO 标题
        </label>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => onChange('seoTitle', e.target.value)}
          placeholder="留空则使用新闻标题"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          SEO 描述
        </label>
        <textarea
          rows={3}
          value={seoDescription}
          onChange={(e) => onChange('seoDescription', e.target.value)}
          placeholder="留空则使用新闻摘要"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          OG 图片 URL
        </label>
        <input
          type="url"
          value={seoOgImage}
          onChange={(e) => onChange('seoOgImage', e.target.value)}
          placeholder="留空则使用封面图"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
