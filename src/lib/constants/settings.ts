// ──────────────────────────────────────────────
// 系统配置项定义
// 与 'use server' 文件分离，可在客户端组件中安全导入
// ──────────────────────────────────────────────

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'number';
  defaultValue: any;
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: 'site_name',
    label: '站点名称',
    description: '显示在浏览器标签页和页面标题中',
    type: 'text',
    defaultValue: 'NewsHub',
  },
  {
    key: 'site_description',
    label: '站点描述',
    description: '用于 SEO meta description',
    type: 'textarea',
    defaultValue: 'NewsHub 新闻发布系统 — 获取最新资讯',
  },
  {
    key: 'news_per_page',
    label: '每页新闻数',
    description: '前台列表每页显示的新闻数量',
    type: 'number',
    defaultValue: 20,
  },
  {
    key: 'seo_default_og_image',
    label: '默认 OG 图片 URL',
    description: '当新闻未设置 OG 图片时使用的默认图片',
    type: 'text',
    defaultValue: '',
  },
  {
    key: 'max_featured_count',
    label: '最大置顶新闻数',
    description: '首页可同时置顶的最大新闻条数',
    type: 'number',
    defaultValue: 5,
  },
];
