# NewsHub CMS

新闻发布系统：面向公开互联网的新闻 CMS，支持多管理员协作与角色分级权限管理。

## 技术栈

| 层面   | 技术                                              |
| ------ | ------------------------------------------------- |
| 框架   | Next.js 14 (App Router, RSC, ISR, Server Actions) |
| 语言   | TypeScript (strict mode)                          |
| 样式   | TailwindCSS                                       |
| 数据库 | PostgreSQL (Supabase)                             |
| 认证   | Supabase Auth (邮箱密码)                          |
| 存储   | Supabase Storage (图片)                           |
| 富文本 | Tiptap (ProseMirror)                              |

## 功能

### 访客端

- 首页新闻列表（置顶 + 分页 + ISR 缓存）
- 新闻详情页（富文本渲染 + SEO 元数据）
- 分类导航与分类筛选页
- 全文搜索（ILIKE 匹配）
- 站点地图 (sitemap.xml)
- Open Graph / JSON-LD 结构化数据

### 管理后台

- Dashboard 统计概览
- 新闻 CRUD（含 Tiptap 富文本编辑器）
- 分类管理（树形结构）
- 媒体库（上传/浏览/删除）
- 系统设置
- 个人资料
- 三级角色权限：超级管理员 / 发布者 / 编辑

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
git clone <repo-url>
cd newshub-cms
npm install
```

### 配置环境变量

复制 `.env.local` 到项目根目录，填入以下变量：

| 变量                            | 说明                      |
| ------------------------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 项目 URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service_role key |
| `DATABASE_URL`                  | PostgreSQL 直连字符串     |
| `NEXT_PUBLIC_SITE_URL`          | 部署后的站点域名          |

### 数据库迁移

```bash
node scripts/run-migrations.mjs
```

### 种子数据

```bash
node scripts/seed.mjs
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 部署

推荐部署到 Vercel：

1. 推送代码到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 部署

## 项目结构

```
src/
├── app/              # Next.js App Router 路由
│   ├── (public)/     # 访客端路由组
│   ├── (admin)/      # 管理后台路由组
│   └── (auth)/       # 登录路由组
├── components/       # 组件
│   ├── public/       # 访客端组件
│   ├── admin/        # 管理端组件
│   ├── editor/       # 富文本编辑器
│   └── ui/           # 通用 UI 组件
├── features/         # 业务模块 (auth)
├── lib/
│   ├── actions/      # Server Actions
│   ├── supabase/     # Supabase 客户端
│   ├── types/        # 类型定义
│   └── utils/        # 工具函数
└── middleware.ts     # Auth 中间件
```

## 许可

MIT
