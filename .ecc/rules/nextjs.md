# Next.js 模式规范

## App Router 约定

### 路由组

- 访客端路由放在 `(public)` 路由组下
- 管理后台路由放在 `(admin)` 路由组下
- 路由组不参与 URL 路径生成

### 布局嵌套

```
RootLayout (html, body, fonts, metadata)
├── (public)/layout.tsx      (Header, Footer)
│   ├── /page.tsx            首页
│   ├── /news/[slug]/page   新闻详情
│   └── /category/[slug]    分类页
└── (admin)/layout.tsx       (Sidebar, Header, Auth Guard)
    ├── /admin/page         Dashboard
    ├── /admin/news         新闻管理
    └── /admin/categories   分类管理
```

## 渲染策略

| 场景 | 策略 | 文件 |
|------|------|------|
| 公开页面（列表/详情） | ISR (`revalidate: 60`) | `page.tsx` 导出 `revalidate` |
| 搜索页 | SSR (dynamic) | `export const dynamic = 'force-dynamic'` |
| 管理后台 | Dynamic RSC | 需要登录态 |
| Sitemap | Dynamic | `sitemap.ts` |

## Server Actions

- 所有数据变更使用 Server Actions，不创建 REST API 路由
- Server Actions 写在 `src/lib/actions/` 目录下，按资源分文件
- Action 函数前缀：`create*`, `update*`, `delete*`, `publish*`
- 错误统一通过 `ActionResponse` 类型返回

```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, type ActionResponse } from '@/lib/types/common';
import { revalidatePath } from 'next/cache';

export async function createNews(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createClient();
  // ... 权限检查 + 写操作
  revalidatePath('/');
  return successResponse({ id: news.id });
}
```

## 数据获取

- 服务端组件直接调 Server Action 或 Supabase server client
- 客户端组件通过 Server Action 获取数据（`use server` 包装）
- 避免在客户端组件中使用 `useEffect` + fetch 模式获取数据

## 错误处理

- 根 `error.tsx` 捕获全局异常
- 每个路由组可设置独立的 `error.tsx`
- `not-found.tsx` 处理 404
- `loading.tsx` 展示 Suspense 回退内容

## 组件规则

（见 [component-patterns.md](./component-patterns.md)）
