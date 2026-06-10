# NewsHub CMS — 架构设计文档

| 元数据       | 值                                                                              |
| ------------ | ------------------------------------------------------------------------------- |
| **文档状态** | 已评审修订 v0.2                                                                 |
| **作者**     | 技术负责人                                                                      |
| **最后更新** | 2026-06-05                                                                      |
| **版本号**   | 0.2                                                                             |
| **修订记录** | v0.1 初稿 → v0.2 架构评审修订：多分类关联、SEO 字段体系、浏览计数策略、置顶机制 |

---

## 1. 架构总览

### 1.1 架构风格

采用 **全栈 Next.js + Supabase Backend-as-a-Service** 架构。Next.js 同时承担前端渲染、服务端逻辑和 API 路由；Supabase 提供托管 PostgreSQL 数据库、认证系统和文件存储。

```
┌──────────────────────────────────────────────────────┐
│                    Vercel (Edge Network)               │
│  ┌──────────────────────────────────────────────────┐ │
│  │              Next.js (App Router)                 │ │
│  │                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │ │
│  │  │ 访客端    │  │ 管理后台  │  │ API / Server    │ │ │
│  │  │ (RSC)    │  │ (RSC+CSR)│  │ Actions + Routes │ │ │
│  │  └──────────┘  └──────────┘  └──────────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS
    ┌────────────────┼────────────────────────────────┐
    │                │                                │
    ▼                ▼                                ▼
┌──────────┐  ┌──────────────┐  ┌──────────────────────┐
│Supabase  │  │Supabase      │  │Supabase              │
│PostgreSQL│  │Auth          │  │Storage (S3-compatible)│
│(Database)│  │(Auth/Users)  │  │(Image Files)          │
└──────────┘  └──────────────┘  └──────────────────────┘
```

### 1.2 关键技术决策

| 决策     | 选择                     | 理由                                                               |
| -------- | ------------------------ | ------------------------------------------------------------------ |
| 框架     | Next.js 14+ (App Router) | 全栈框架，SSG/ISR/SSR 原生支持                                     |
| 语言     | TypeScript (strict mode) | 类型安全，长期可维护                                               |
| 样式     | TailwindCSS              | 原子化 CSS，快速开发                                               |
| 数据库   | PostgreSQL (Supabase)    | 关系型，RLS 安全策略                                               |
| ORM 层   | Supabase JS Client       | 直接使用 Supabase SDK 操作数据库，搭配类型生成                     |
| 认证     | Supabase Auth (邮箱密码) | 与数据库同生态，无需额外服务                                       |
| 存储     | Supabase Storage         | 图片文件存储，集成 RLS                                             |
| 富文本   | Tiptap (ProseMirror)     | 可扩展、React 生态友好                                             |
| 部署     | Vercel                   | 与 Next.js 原生集成，ISR 支持                                      |
| 浏览计数 | 异步延迟写入             | 基于 Next.js Server Action + revalidate 机制，合并写入避免频繁写库 |

---

## 2. 路由设计

### 2.1 访客端路由

```
/                          → 首页（新闻列表 + 置顶区域 + 最新新闻）
/news                      → 新闻列表页（分页）
/news/[slug]               → 新闻详情页
/category/[slug]           → 分类新闻列表页
/search                    → 全文搜索结果页
/sitemap.xml               → 自动生成站点地图
/404                       → 自定义 404
```

### 2.2 管理后台路由

```
/admin                     → 后台首页（Dashboard / 简要统计）
/admin/login               → 管理员登录页
/admin/news                → 新闻列表管理（含置顶开关操作）
/admin/news/create         → 创建新闻（含多分类选择、SEO 字段填写、置顶开关）
/admin/news/[id]/edit      → 编辑新闻（同上）
/admin/categories          → 分类管理
/admin/images              → 图片管理 / 图片库
/admin/admins              → 管理员管理（仅超级管理员）
```

### 2.3 路由策略

| 页面类型       | 渲染策略                   | 理由                             |
| -------------- | -------------------------- | -------------------------------- |
| 首页、新闻列表 | ISR (revalidate: 60s)      | 增量静态生成，兼顾性能和内容更新 |
| 新闻详情页     | ISR (revalidate: 60s)      | 同上；浏览计数不影响 ISR 缓存键  |
| 分类页         | ISR (revalidate: 60s)      | 同上                             |
| 搜索结果页     | SSR (Dynamic)              | 搜索参数动态，无法预渲染         |
| 管理后台       | CSR / RSC (Dynamic)        | 需要登录态，动态内容             |
| sitemap.xml    | Dynamic (generateSitemaps) | SEO 需要保持最新                 |

---

## 3. 组件架构

### 3.1 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # 访客端路由组
│   │   ├── page.tsx              # 首页（含置顶新闻区）
│   │   ├── news/
│   │   │   ├── [slug]/page.tsx   # 新闻详情（含浏览计数）
│   │   │   └── page.tsx          # 新闻列表
│   │   ├── category/
│   │   │   └── [slug]/page.tsx   # 分类页
│   │   ├── search/page.tsx       # 搜索页
│   │   ├── sitemap.ts            # sitemap.xml 生成
│   │   └── layout.tsx            # 访客端布局
│   ├── (admin)/                  # 管理后台路由组
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── news/
│   │   │   ├── categories/
│   │   │   ├── images/
│   │   │   └── admins/
│   │   └── layout.tsx            # 管理后台布局（认证检查）
│   ├── globals.css               # TailwindCSS 全局样式
│   └── layout.tsx                # 根布局
├── components/
│   ├── public/                   # 访客端组件
│   │   ├── NewsCard.tsx          # 含多分类标签、浏览数
│   │   ├── NewsList.tsx
│   │   ├── FeaturedNews.tsx      # 置顶新闻条/区
│   │   ├── Pagination.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryNav.tsx
│   │   ├── CategoryBadge.tsx     # 单分类标签徽章
│   │   ├── RichTextRenderer.tsx
│   │   └── SEOHead.tsx           # 注入 JSON-LD、OG meta
│   ├── admin/                    # 管理后台组件
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── NewsTable.tsx         # 含置顶开关、浏览数列
│   │   ├── NewsForm.tsx          # 含多分类选择、SEO 字段
│   │   ├── CategoryMultiSelect.tsx  # 多分类选择器
│   │   ├── SEOFields.tsx         # SEO 元信息编辑组件
│   │   ├── RichTextEditor.tsx
│   │   ├── ImagePicker.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── FeaturedToggle.tsx    # 置顶开关组件
│   └── ui/                       # 通用 UI 组件
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       ├── EmptyState.tsx
│       └── Card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 浏览器端 Supabase 客户端
│   │   ├── server.ts             # 服务端 Supabase 客户端
│   │   └── middleware.ts         # Auth cookie 刷新中间件
│   ├── actions/                  # Server Actions
│   │   ├── news.ts               # 新闻 CRUD（含分类关联写操作）
│   │   ├── categories.ts         # 分类管理
│   │   ├── images.ts             # 图片管理
│   │   ├── admins.ts             # 管理员管理
│   │   └── view-counter.ts       # 浏览计数异步写入
│   ├── utils/
│   │   ├── slugify.ts
│   │   ├── date.ts
│   │   ├── sanitize.ts           # HTML 清洗
│   │   └── seo.ts                # SEO 元数据构造 helper
│   └── types/
│       ├── database.ts           # 数据库类型（由 supabase gen 生成）
│       └── common.ts             # 共用类型
├── hooks/                        # 自定义 hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── usePagination.ts
└── middleware.ts                  # Next.js 中间件（Auth 保护）
```

### 3.2 关键组件说明

#### RichTextEditor (Tiptap)

- 所有编辑功能通过 Tiptap Extension 注册
- 图片插入：弹出 ImagePicker 组件，从 Supabase Storage 选图
- 内容输出：HTML 格式存储到数据库的 `news.content` 字段
- 编辑时实时保持为 Draft 状态

#### RichTextRenderer

- 在访客端渲染新闻详情
- 使用 DOMPurify 清洗 HTML（服务端清洗 + 客户端二次清洗）
- 支持 Tiptap 输出的所有标准 HTML 结构

#### CategoryMultiSelect

- 多选下拉或弹窗面板，展示全部分类树
- 支持搜索过滤分类
- 选中后显示已选分类标签列表（可点击移除）
- 提交时同步 `news_categories` 关联表（先删后插）

#### SEOFields

- 编辑表单中的折叠区域，包含：meta_title、meta_description、og_image_url
- 填写后存储在 `news` 表的对应 SEO 列
- 若管理员不填写，自动从新闻标题/摘要/封面图生成默认值

#### FeaturedToggle

- 开关组件，用于将新闻置顶/取消置顶
- 仅发布者及超级管理员可见可用
- 置顶新闻在首页 FeaturedNews 区域展示

#### ImageUploader / ImagePicker

- 上传至 Supabase Storage `images/{userId}/{timestamp}-{filename}`
- 上传后创建数据库记录到 `images` 表
- ImagePicker 展示已上传图片库，支持按时间排序

---

## 4. 数据流

### 4.1 新闻创建流程（编辑）

```
编辑填表 (NewsForm)
  → CategoryMultiSelect（选择 0~N 个分类）
  → SEOFields（填写 meta 信息，可选）
  → FeaturedToggle（仅发布者/超管）
  → RichTextEditor (Tiptap HTML)
  → Server Action: createNews()
    → 验证输入
    → 权限检查（当前用户为 Editor 或 Publisher）
    → INSERT INTO news (status: 'draft', seo_*, is_featured, ...)
    → 遍历选中分类 ID，INSERT INTO news_categories
    → 返回 news.id
  → 跳转到 /admin/news
```

### 4.2 新闻发布流程（发布者）

```
发布者在编辑页点击"发布"
  → Server Action: publishNews(newsId)
    → 权限检查（当前用户为 Publisher 或 Super Admin）
    → 验证新闻内容完整性（标题、内容必填）
    → UPDATE news SET status = 'published', published_at = NOW()
    → 触发 ISR revalidation（revalidatePath）
  → 前台 ISR 缓存刷新
```

### 4.3 搜索流程

```
访客在搜索框输入关键词
  → 跳转到 /search?q=关键词
  → 服务端 Server Action: searchNews(keyword)
    → SELECT * FROM news
      WHERE status = 'published'
      AND (title ILIKE '%keyword%' OR content ILIKE '%keyword%')
      ORDER BY is_featured DESC, published_at DESC
    → 分页结果
  → 渲染搜索结果
```

> ILIKE 搜索适用于第一版；后续可升级到 PostgreSQL `tsvector` 全文索引。

### 4.4 浏览计数流程

```
访客访问新闻详情页
  → 客户端 useEffect 触发计数 API
    → POST /api/view-count 或 Server Action
      → 内存/Redis 暂存 + 去重（同一 session 仅计一次）
      → 定期批量 UPDATE news SET view_count = view_count + N
      （合并间隔 ≤ 5 分钟）
    → 不阻塞页面渲染
  → 页面显示当前 view_count（从 ISR 缓存读取）
```

> 第一版实现简化方案：Server Action 每次接收请求后写入内存 Map，每 60 秒或累计 10 次后批量 flush 到数据库。单实例部署下可行；后续扩展可替换为 Redis 或 Supabase 实时计数器。

### 4.5 首页获取流程（含置顶）

```
服务端 RSC 查询
  → SELECT * FROM news
    WHERE status = 'published'
    ORDER BY is_featured DESC, published_at DESC
    LIMIT 21
  → 分离置顶新闻（is_featured = true）与常规新闻
  → 渲染 FeaturedNews + NewsList
```

---

## 5. 安全架构

### 5.1 认证流程

```
访客请求受保护路由
  → middleware.ts 检查 Supabase Auth session cookie
  → 无 session → 重定向到 /admin/login
  → 有 session → 继续，注入用户信息到 request header
```

### 5.2 授权检查

所有 Server Action / Route Handler 中执行权限检查：

```
Server Action 入口
  → 从 Supabase Server Client 获取当前用户
  → 从 admin_users 表查询角色
  → 对比该操作所需角色
  → 不满足 → throw AuthorizationError (401)
  → 满足 → 执行操作
```

### 5.3 Row Level Security (RLS)

Supabase PostgreSQL RLS 策略：

| 表                | 策略                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `news`            | 访客（anon）：仅 SELECT `status = 'published'`；管理员：基于角色控制 INSERT/UPDATE/DELETE   |
| `news_categories` | 访客：SELECT（与 news SELECT 策略联动）；管理员：INSERT/UPDATE/DELETE（需有相应 news 权限） |
| `categories`      | 访客：SELECT 已启用的分类；管理员：超级管理员可 INSERT/UPDATE/DELETE                        |
| `images`          | 访客：不可访问；管理员：有上传权限者 INSERT，所有管理员 SELECT                              |
| `admin_users`     | 仅超级管理员 SELECT/INSERT/UPDATE                                                           |

### 5.4 XSS 防护

- 内容入库：在 Server Action 中对 HTML 进行服务端清洗（DOMPurify server-side）
- 内容展示：客户端渲染前再次清洗
- CSP Header：通过 Next.js middleware 设置 Content-Security-Policy

### 5.5 浏览计数安全

- 计数请求做速率限制（单 IP / session 去重）
- 计数写入不暴露用户可操作的参数
- 不将 `view_count` 作为可任意修改的 API

---

## 6. 性能与缓存

### 6.1 缓存策略

| 层次                     | 策略                                       |
| ------------------------ | ------------------------------------------ |
| Next.js ISR              | 访客端页面 revalidate: 60s                 |
| Next.js Full Route Cache | 默认开启，ISR 触发时自动失效               |
| Supabase                 | 不额外添加缓存层，依赖 PostgreSQL 查询性能 |
| 图片 CDN                 | Vercel Edge + Next.js Image Optimization   |
| 浏览计数                 | 内存暂存 → 批量写入，减少数据库写压力      |

### 6.2 图片优化

- 使用 `next/image` 自动处理图片压缩、格式转换（WebP/AVIF）
- 缩略图尺寸：400×300（列表卡片）
- 详情页配图：最大 1200px 宽度
- OG 图片尺寸：1200×630px（标准 Open Graph 比例）
- Supabase Storage 配合 Image Transformation API 动态调整（需 Supabase Pro 及以上计划）

---

## 7. SEO 策略

### 7.1 元数据优先级

```
自定义 SEO 字段（管理员填写） > 自动推导（标题/摘要/封面图）
```

### 7.2 每条新闻的 SEO 数据源

| HTML meta                             | 来源列                      | 回退策略                                  |
| ------------------------------------- | --------------------------- | ----------------------------------------- |
| `<title>`                             | `news.seo_title`            | → `news.title`                            |
| `<meta name="description">`           | `news.seo_description`      | → `news.summary` → 截取 content 前 160 字 |
| `<meta property="og:title">`          | `news.seo_title`            | → `news.title`                            |
| `<meta property="og:description">`    | `news.seo_description`      | → `news.summary`                          |
| `<meta property="og:image">`          | `news.seo_og_image`         | → `news.cover_image_url`                  |
| `<meta property="og:type">`           | 固定值 `article`            | —                                         |
| `<script type="application/ld+json">` | 自动生成 NewsArticle schema | 基于所有可用字段                          |

### 7.3 Sitemap

- 自动生成 `sitemap.xml`，包含所有已发布新闻和分类页 URL
- 使用 Next.js `generateSitemaps` 动态生成
- 新闻内容更新时自动触发 ISR

---

## 8. 外部集成

| 系统              | 集成方式                       | 用途               |
| ----------------- | ------------------------------ | ------------------ |
| Supabase Auth     | SDK (`@supabase/auth-js`)      | 管理员邮箱密码登录 |
| Supabase Database | SDK (`@supabase/postgrest-js`) | CRUD 操作          |
| Supabase Storage  | SDK (`@supabase/storage-js`)   | 图片上传/浏览      |
| Tiptap            | NPM Package                    | 富文本编辑器       |

无其他外部 API 依赖。
