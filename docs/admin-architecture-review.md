# Sprint 3.1 — 后台管理系统架构设计文档

| 元数据       | 值                                                               |
| ------------ | ---------------------------------------------------------------- |
| **文档状态** | 待评审                                                           |
| **Sprint**   | 3.1 — Admin CMS 架构设计                                         |
| **作者**     | 技术负责人                                                       |
| **日期**     | 2026-06-05                                                       |
| **前置文档** | PRD.md v0.2, Architecture.md v0.2, Database.md v0.2, ADR-001~005 |

---

## 目录

1. [Admin Route Architecture](#1-admin-route-architecture)
2. [Layout Architecture](#2-layout-architecture)
3. [Feature Architecture](#3-feature-architecture)
4. [Component Architecture](#4-component-architecture)
5. [RBAC Architecture](#5-rbac-architecture)
6. [Data Fetching Architecture](#6-data-fetching-architecture)
7. [Folder Structure](#7-folder-structure)
8. [ADR](#8-adr)

---

## 1. Admin Route Architecture

### 1.1 路由总览

所有管理后台路由位于 `(admin)` 路由组下，前缀 `/admin`。

```
Route Group: (admin)
│
├── /admin/login                     # 登录页（公开路由，中间件排除）
├── AdminLayout (layout.tsx)         # 保护路由，需认证
│   │
│   ├── /admin/dashboard              # 控制台首页
│   ├── /admin/news                   # 新闻列表
│   ├── /admin/news/create            # 创建新闻
│   ├── /admin/news/[id]              # 编辑新闻
│   ├── /admin/categories             # 分类管理
│   ├── /admin/media                  # 媒体库
│   ├── /admin/settings               # 系统设置
│   └── /admin/profile                # 个人资料
```

### 1.2 各页面职责

#### `/admin/dashboard`

| 属性       | 值                                                     |
| ---------- | ------------------------------------------------------ |
| **职责**   | 后台首页，展示关键统计数据和近期活动                   |
| **内容**   | 总新闻数、已发布数、草稿数、最新新闻列表、快速操作入口 |
| **数据源** | Server Component 直接查询 Supabase                     |
| **权限**   | 所有已登录管理员                                       |
| **状态**   | ✅ 骨架已存在                                          |

#### `/admin/news`

| 属性       | 值                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **职责**   | 新闻列表管理，筛选、排序、批量操作                                                               |
| **内容**   | 数据表格（标题、分类、状态、作者、时间、浏览数、置顶开关）、筛选栏（状态/分类/日期）、分页、搜索 |
| **数据源** | Server Component 初始加载 + 客户端筛选                                                           |
| **权限**   | 所有已登录管理员（编辑仅见自己的草稿）                                                           |

#### `/admin/news/create`

| 属性       | 值                                                                        |
| ---------- | ------------------------------------------------------------------------- |
| **职责**   | 创建新新闻                                                                |
| **内容**   | NewsForm 组件（标题、富文本编辑器、分类多选、封面图、SEO 字段、置顶开关） |
| **数据源** | 表单提交通过 Server Action                                                |
| **权限**   | Editor / Publisher / Super Admin                                          |

#### `/admin/news/[id]`

| 属性       | 值                                                                |
| ---------- | ----------------------------------------------------------------- |
| **职责**   | 编辑已有新闻                                                      |
| **参数**   | `id` — news UUID                                                  |
| **内容**   | NewsForm 组件（预填充已有数据）、预览按钮、发布/下架按钮          |
| **数据源** | Server Component 根据 id 加载 + Server Action 提交                |
| **权限**   | Editor（仅自己的草稿）/ Publisher（全部草稿+已发布）/ Super Admin |

#### `/admin/categories`

| 属性       | 值                                                        |
| ---------- | --------------------------------------------------------- |
| **职责**   | 分类管理，树形展示与 CRUD                                 |
| **内容**   | 树形分类列表、添加/编辑/删除分类、排序拖拽、启用/禁用切换 |
| **数据源** | Server Component + Server Action                          |
| **权限**   | 仅 Super Admin                                            |

#### `/admin/media`

| 属性       | 值                                                  |
| ---------- | --------------------------------------------------- |
| **职责**   | 媒体库管理，上传与浏览                              |
| **内容**   | 图片网格展示、上传拖拽区、搜索/筛选、复制 URL、删除 |
| **数据源** | Client Component 通过 Server Action 加载/上传       |
| **权限**   | 所有已登录管理员                                    |

#### `/admin/settings`

| 属性       | 值                                                               |
| ---------- | ---------------------------------------------------------------- |
| **职责**   | 系统配置管理                                                     |
| **内容**   | 表单展示所有配置项（站点名称、描述、每页新闻数、默认 OG 图片等） |
| **数据源** | Server Component + Server Action                                 |
| **权限**   | 仅 Super Admin                                                   |

#### `/admin/profile`

| 属性       | 值                                                       |
| ---------- | -------------------------------------------------------- |
| **职责**   | 当前管理员个人资料                                       |
| **内容**   | 显示当前用户信息（邮箱、角色、显示名称），可修改显示名称 |
| **数据源** | Server Component + Server Action                         |
| **权限**   | 所有已登录管理员（仅看自己的资料）                       |

### 1.3 路由守卫策略

```
请求 /admin/*
  → middleware.ts 检查 Supabase Auth session
    → 无 session → 重定向 /admin/login (保留 returnUrl)
    → 有 session → 允许进入 AdminLayout
      → AdminLayout 中调用 getUser() + getProfile()
        → session 过期 → 重定向 /admin/login
        → profile.is_active = false → 登出提示
        → 正常 → 渲染内容
```

**例外**：`/admin/login` 不经过 AdminLayout 守卫，由独立页面处理。

### 1.4 路由参数设计

| 路由               | 查询参数                                      | 用途             |
| ------------------ | --------------------------------------------- | ---------------- |
| `/admin/news`      | `?page=1&status=draft&category=xxx&q=keyword` | 分页、筛选、搜索 |
| `/admin/news/[id]` | `?tab=editor&preview=true`                    | 编辑器/预览切换  |
| `/admin/media`     | `?page=1&type=image&q=keyword`                | 分页、类型、搜索 |

---

## 2. Layout Architecture

### 2.1 布局层级

```
RootLayout (html, body, fonts)
  └── AdminLayout (auth guard)
        ├── AdminSidebar (fixed, collapsible)
        │     ├── Logo / Brand
        │     ├── NavItem: Dashboard
        │     ├── NavItem: 新闻管理
        │     ├── NavItem: 分类管理
        │     ├── NavItem: 媒体库
        │     ├── NavItem: 设置 (super_admin only)
        │     └── NavItem: 个人资料
        │
        ├── AdminHeader (sticky top)
        │     ├── Mobile menu toggle
        │     ├── Breadcrumb
        │     └── UserMenu (avatar, name, logout)
        │
        └── ContentArea (scrollable main)
              ├── Breadcrumb (mobile fallback)
              └── Page content (children)
```

### 2.2 组件层级关系

```
<AdminLayout>                         ← app/(admin)/layout.tsx (Server Component)
  ├── <AdminSidebar>                  ← Client Component ('use client')
  │     ├── <SidebarLogo />
  │     └── <SidebarNav>
  │           ├── <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
  │           ├── <NavSection label="内容管理">
  │           │     ├── <NavItem to="/admin/news" icon={Newspaper} label="新闻管理" />
  │           │     ├── <NavItem to="/admin/categories" icon={FolderTree} label="分类管理" />
  │           │     └── <NavItem to="/admin/media" icon={Image} label="媒体库" />
  │           └── <NavSection label="系统">
  │                 ├── <NavItem to="/admin/settings" icon={Settings} label="系统设置" /> (super_admin only)
  │                 └── <NavItem to="/admin/profile" icon={User} label="个人资料" />
  │
  ├── <AdminHeader>                   ← Client Component ('use client')
  │     ├── <Breadcrumb items={...} />
  │     └── <UserMenu>
  │           ├── <UserAvatar name={...} />
  │           ├── <Dropdown: 个人资料 />
  │           └── <Dropdown: 退出登录 />
  │
  └── <main className="content-area">
        {children}                    ← Page content (Server or Client Component)
  </AdminLayout>
```

### 2.3 布局状态管理

| 状态              | 存储位置                       | 说明                               |
| ----------------- | ------------------------------ | ---------------------------------- |
| Sidebar 折叠/展开 | `localStorage` + React Context | 记住用户偏好                       |
| 当前活跃导航项    | URL path                       | Single source of truth，无额外状态 |
| 用户信息          | React Context (`AuthContext`)  | 从 Server Component 注入初始值     |
| 面包屑            | React Context + URL path       | 自动从路由深度推导                 |

### 2.4 响应式行为

| 断点              | Sidebar                      | Header         | Content    |
| ----------------- | ---------------------------- | -------------- | ---------- |
| `lg+` (≥1024px)   | 固定 64px/256px，始终可见    | 紧凑           | 自适应填充 |
| `md` (768-1023px) | 可折叠，默认隐藏             | 含菜单展开按钮 | 全宽       |
| `sm` (<768px)     | 覆盖式抽屉（overlay drawer） | 简化           | 全宽       |

### 2.5 布局数据依赖

AdminLayout 作为 Server Component 获取：

```
AdminLayout (Server Component)
  → createClient() → getUser() + getProfile()
    → 无用户 → redirect('/admin/login')
    → 有用户 → 将 user / profile 通过 Context Provider 传递给子树
```

---

## 3. Feature Architecture

### 3.1 Feature 目录结构

```
src/features/
├── auth/
│   ├── actions/               # login, logout, getCurrentUser
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   └── UserMenu.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   └── index.ts               # 公开导出
│
├── dashboard/
│   ├── actions/               # getDashboardStats, getRecentNews
│   ├── components/
│   │   ├── StatsCard.tsx
│   │   ├── RecentNewsList.tsx
│   │   └── QuickActions.tsx
│   └── index.ts
│
├── news/
│   ├── actions/               # createNews, updateNews, deleteNews, publishNews, getNews, listNews
│   ├── components/
│   │   ├── NewsForm.tsx       # 创建/编辑表单（含所有子组件）
│   │   ├── NewsTable.tsx      # 数据表格
│   │   ├── NewsFilters.tsx    # 筛选栏
│   │   ├── NewsStatusBadge.tsx
│   │   ├── FeaturedToggle.tsx
│   │   └── NewsPreview.tsx
│   ├── hooks/
│   │   └── useNewsFilters.ts
│   └── index.ts
│
├── categories/
│   ├── actions/               # createCategory, updateCategory, deleteCategory, listCategories
│   ├── components/
│   │   ├── CategoryTree.tsx
│   │   ├── CategoryForm.tsx
│   │   └── CategoryMultiSelect.tsx  # 供 news 功能使用
│   └── index.ts
│
├── media/
│   ├── actions/               # uploadMedia, deleteMedia, listMedia
│   ├── components/
│   │   ├── MediaGrid.tsx
│   │   ├── MediaUploader.tsx
│   │   ├── ImagePicker.tsx    # 供 news 功能使用（弹出选择）
│   │   └── MediaCard.tsx
│   └── index.ts
│
└── settings/
    ├── actions/               # getSettings, updateSettings
    ├── components/
    │   ├── SettingsForm.tsx
    │   └── SettingField.tsx
    └── index.ts
```

### 3.2 职责边界

| Feature      | 职责                                                | 不包含                                     |
| ------------ | --------------------------------------------------- | ------------------------------------------ |
| `auth`       | 登录/登出、session 管理、当前用户获取、AuthContext  | 用户 CRUD（属于 admin management）         |
| `dashboard`  | Dashboard 统计卡片、最近动态、快速操作入口          | 具体的新闻查询逻辑                         |
| `news`       | 新闻完整 CRUD、发布/下架、置顶、SEO、分类关联、预览 | 富文本编辑器本身（抽离为通用组件）         |
| `categories` | 分类树管理、CRUD、排序、多选组件                    | 新闻的分类关联写操作（在 news 中）         |
| `media`      | 文件上传/删除/浏览、图片选择器                      | 富文本中的图片插入（由 Editor 调用 Media） |
| `settings`   | 系统配置读取/更新                                   | 配置项的 UI 展示形态                       |

### 3.3 Feature 间依赖关系

```
auth ───→ 所有 Feature（权限检查）
news ───→ categories（CategoryMultiSelect）
news ───→ media（ImagePicker for cover）
settings ───→ auth（仅 super_admin）
dashboard ───→ news（获取统计数字）
```

**依赖注入方式**：Feature 之间不直接 import，通过 `lib/actions/` 统一入口调用。如 `CategoryMultiSelect` 是 categories Feature 的组件，由 news Feature 通过 props 使用。

### 3.4 Feature 内部模块边界

每个 Feature 遵循统一内部结构：

```
feature/
├── actions/       ← Server Actions（'use server'）
├── components/    ← React 组件（'use client' 或 RSC）
├── hooks/         ← 自定义 hooks（可选）
└── index.ts       ← 公开 API 导出
```

**规则**：

- `actions/` 中的函数使用 `'use server'` 指令
- `components/` 中的交互组件使用 `'use client'` 指令
- `index.ts` 只导出对外的公共 API（组件、类型）
- Feature 内部实现细节不暴露给外部

---

## 4. Component Architecture

### 4.1 组件分层

```
层 1: ui/              ← 通用 UI 原子组件，无业务逻辑
层 2: forms/           ← 表单组件，有验证逻辑但无业务耦合
层 3: tables/          ← 数据表格，有筛选/排序但数据源抽象
层 4: editor/          ← 富文本编辑器，独立封装的 Tiptap
层 5: media/           ← 媒体相关组件，有 Storage 交互
层 6: features/        ← 业务组件，最顶层
```

### 4.2 UI 组件规划

| 组件          | Props                                               | 说明       | 状态        |
| ------------- | --------------------------------------------------- | ---------- | ----------- |
| `Button`      | `variant`, `size`, `loading`, `disabled`            | 统一按钮   | ✅ Sprint 1 |
| `Input`       | `label`, `error`, `type`                            | 文本输入   | 📋 待实现   |
| `Select`      | `options`, `value`, `placeholder`                   | 下拉选择   | 📋 待实现   |
| `Textarea`    | `label`, `error`, `rows`                            | 多行文本   | 📋 待实现   |
| `Modal`       | `open`, `onClose`, `title`, `size`                  | 模态框     | ✅ Sprint 1 |
| `Dialog`      | `open`, `onConfirm`, `variant`                      | 确认对话框 | 📋 待实现   |
| `Badge`       | `variant: 'default'\|'success'\|'warning'\|'error'` | 状态标签   | ✅ Sprint 1 |
| `Skeleton`    | `width`, `height`, `rounded`                        | 加载占位   | ✅ Sprint 1 |
| `EmptyState`  | `icon`, `title`, `description`, `action`            | 空状态     | ✅ Sprint 1 |
| `Card`        | `children`, `className`                             | 卡片容器   | ✅ Sprint 1 |
| `Spinner`     | `size`                                              | 加载旋转   | 📋 待实现   |
| `Toast`       | —                                                   | 全局通知   | 📋 待实现   |
| `Toggle`      | `checked`, `onChange`, `disabled`                   | 开关       | 📋 待实现   |
| `Pagination`  | `page`, `totalPages`, `onChange`                    | 分页       | 📋 待实现   |
| `Breadcrumb`  | `items: {label, href}[]`                            | 面包屑     | 📋 待实现   |
| `Avatar`      | `name`, `src`, `size`                               | 用户头像   | 📋 待实现   |
| `Dropdown`    | `trigger`, `items`                                  | 下拉菜单   | 📋 待实现   |
| `Tooltip`     | `content`, `children`                               | 工具提示   | 📋 待实现   |
| `SearchInput` | `value`, `onChange`, `placeholder`                  | 搜索输入   | 📋 待实现   |
| `Tabs`        | `tabs: {label, value}[], active, onChange`          | 标签切换   | 📋 待实现   |

### 4.3 表单组件规划

| 组件               | 职责                                          | 是否跨 Feature |
| ------------------ | --------------------------------------------- | -------------- |
| `FormField`        | 统一表单字段包装（label + error + help text） | 是             |
| `FormSection`      | 表单段落分组（带标题和描述）                  | 是             |
| `ImageUploadField` | 图片上传表单域（预览 + 上传 + 删除）          | 是             |

### 4.4 数据表格规划

| 组件              | 职责                                   |
| ----------------- | -------------------------------------- |
| `DataTable`       | 通用数据表格，支持列定义、排序、行点击 |
| `TablePagination` | 表格分页                               |

**DataTable 接口设计**：

```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
}

interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
  width?: string;
}
```

### 4.5 富文本编辑器规划

| 组件             | 职责                                                            |
| ---------------- | --------------------------------------------------------------- |
| `RichTextEditor` | Tiptap 编辑器封装，所有工具栏                                   |
| `EditorToolbar`  | 工具栏（B/I/U/S、H2-H4、quote、code、list、table、link、image） |
| `EditorContent`  | 编辑器内容区域                                                  |

### 4.6 媒体组件规划

| 组件            | 职责                         | 使用场景                 |
| --------------- | ---------------------------- | ------------------------ |
| `MediaGrid`     | 图片网格展示（懒加载）       | 媒体库页面               |
| `MediaCard`     | 单张图片卡片                 | 媒体库页面               |
| `MediaUploader` | 拖拽/点击上传区域            | 媒体库页面               |
| `ImagePicker`   | 选择图片弹窗（从媒体库选图） | 新闻封面设置、编辑器插图 |

---

## 5. RBAC Architecture

### 5.1 角色定义

| 角色       | 值            | 说明                                          |
| ---------- | ------------- | --------------------------------------------- |
| 超级管理员 | `super_admin` | 系统全部权限                                  |
| 发布者     | `publisher`   | 内容管理 + 发布 + 置顶                        |
| 编辑       | `editor`      | 仅内容创作（无权发布/置顶/管理分类/管理设置） |

### 5.2 全量权限矩阵

符号说明: ✓ = 允许 ✗ = 拒绝 △ = 有条件允许

#### 页面访问

| 页面/路由               | 访客 | Editor         | Publisher | Super Admin |
| ----------------------- | ---- | -------------- | --------- | ----------- |
| `/admin/login`          | ✓    | —              | —         | —           |
| `/admin/dashboard`      | ✗    | ✓              | ✓         | ✓           |
| `/admin/news`           | ✗    | ✓ (仅自己的)   | ✓         | ✓           |
| `/admin/news/create`    | ✗    | ✓              | ✓         | ✓           |
| `/admin/news/[id]/edit` | ✗    | △ 仅自己的草稿 | ✓         | ✓           |
| `/admin/categories`     | ✗    | ✗              | ✗         | ✓           |
| `/admin/media`          | ✗    | ✓              | ✓         | ✓           |
| `/admin/settings`       | ✗    | ✗              | ✗         | ✓           |
| `/admin/profile`        | ✗    | ✓              | ✓         | ✓           |

#### 数据操作

| 操作                   | Editor | Publisher | Super Admin |
| ---------------------- | ------ | --------- | ----------- |
| **新闻**               |        |           |             |
| 查看全部新闻（含草稿） | ✓      | ✓         | ✓           |
| 创建新闻               | ✓      | ✓         | ✓           |
| 编辑自己的草稿         | ✓      | ✓         | ✓           |
| 编辑他人的草稿         | ✗      | ✓         | ✓           |
| 编辑已发布的新闻       | ✗      | ✓         | ✓           |
| 删除自己的草稿         | ✓      | ✓         | ✓           |
| 删除他人的草稿         | ✗      | ✓         | ✓           |
| 删除已发布的新闻       | ✗      | ✗         | ✓           |
| 发布草稿 → 已发布      | ✗      | ✓         | ✓           |
| 下架已发布 → 草稿      | ✗      | ✓         | ✓           |
| 设置置顶               | ✗      | ✓         | ✓           |
| **分类**               |        |           |             |
| 查看分类列表           | ✓      | ✓         | ✓           |
| 创建/编辑/删除分类     | ✗      | ✗         | ✓           |
| **媒体**               |        |           |             |
| 上传图片               | ✓      | ✓         | ✓           |
| 删除自己的图片         | ✓      | ✓         | ✓           |
| 删除他人的图片         | ✗      | ✗         | ✓           |
| **系统**               |        |           |             |
| 查看设置               | ✗      | ✗         | ✓           |
| 修改设置               | ✗      | ✗         | ✓           |
| 管理管理员             | ✗      | ✗         | ✓           |

### 5.3 权限校验实现策略

#### 层 1: RLS（数据库层）

已在 Sprint 2.2 中实现。见 `09_rls.sql` 中 29 条策略。

#### 层 2: Server Action 守卫（应用层）

每个 Server Action 入口处统一调用：

```typescript
async function requireRole(...roles: AdminRole[]) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('auth_id', user.id)
    .single();

  if (!profile || !profile.is_active) throw new Error('FORBIDDEN');
  if (!roles.includes(profile.role)) throw new Error('FORBIDDEN');

  return profile;
}
```

#### 层 3: UI 层（展示层）

侧边栏导航、操作按钮根据角色条件渲染：

```typescript
const canManageSettings = profile.role === 'super_admin';
{canManageSettings && <NavItem to="/admin/settings" />}
```

### 5.4 角色分配与变更

- 角色变更仅通过 `/admin/admins` 页面由超级管理员操作
- 第一版不在 admin 页面建 `admins` 管理页面，通过 Supabase Dashboard 直接管理 profiles 表
- 后续 Sprint 增加管理员管理页面

---

## 6. Data Fetching Architecture

### 6.1 架构模式选择

```
┌─────────────────────────────────────────────────┐
│                 Next.js App Router                │
│                                                    │
│  Server Components (RSC)                           │
│  ├── 直接调用 Supabase Server Client               │
│  ├── 用于页面初始数据加载                           │
│  └── 自动支持 Suspense + Streaming                  │
│                                                    │
│  Server Actions ('use server')                      │
│  ├── 所有数据变更操作                              │
│  ├── 调用 Supabase Server Client (service_role)     │
│  ├── revalidatePath 触发 ISR 缓存刷新              │
│  └── 返回 ActionResponse<T> 统一格式                │
│                                                    │
│  Client Components ('use client')                   │
│  ├── 调用 Server Actions 获取/变更数据               │
│  ├── 使用 Supabase Browser Client (anon key)        │
│  │   └── 用途：Auth 监听、图片上传 URL 生成         │
│  └── 不使用 useEffect + fetch 模式                   │
└─────────────────────────────────────────────────┘
```

### 6.2 各客户端使用场景

| 客户端                      | 导入路径                    | 使用场景                                                                    | 注意事项                                            |
| --------------------------- | --------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| **Supabase Server Client**  | `@/lib/supabase/server`     | Server Components 数据获取、Server Actions 数据变更                         | 使用 cookie-based auth；在 RSC 中 `await cookies()` |
| **Supabase Browser Client** | `@/lib/supabase/client`     | Auth 状态监听（`onAuthStateChange`）、Storage 上传 URL 生成、客户端实时订阅 | 使用 anon key；不用于 DML 操作                      |
| **Supabase Middleware**     | `@/lib/supabase/middleware` | 仅 `middleware.ts` 中 session 刷新                                          | 使用 `updateSession` 模式                           |

### 6.3 数据获取决策树

```
页面加载时需要数据？
├── 是，且数据对所有用户相同 → Server Component 直接查询
│     └── createServerClient() → await query → 渲染
│
├── 是，且数据需要登录态 → Server Component + getUser()
│     └── createServerClient() → getUser() → 带过滤条件的查询 → 渲染
│
├── 是，且数据需要客户端交互（搜索/筛选/分页）
│     └── Server Component 初始加载 + Client 端 Server Action 调用
│           └── 'use client' → invoke Server Action → update UI
│
└── 是，且数据变化需要实时同步
      └── Client Component + Supabase Browser Client 订阅
            └── supabase.channel().subscribe()
```

### 6.4 数据流模式

#### 模式 A: Server Component 直查（列表页、详情页）

```
Page (RSC)
  → createServerClient()
  → supabase.from('news').select('...').eq('status', 'published')
  → 渲染 NewsList、NewsDetail
  → 无需客户端状态管理
```

#### 模式 B: Server Action 提交（创建、编辑、删除）

```
Form (Client Component)
  → handleSubmit
  → Server Action: createNews(formData)
    → requireRole('editor', 'publisher', 'super_admin')
    → validate input
    → supabase.from('news').insert(...)
    → revalidatePath('/admin/news')
    → return ActionResponse
  → 成功 → router.push('/admin/news')
  → 失败 → showToast(error)
```

#### 模式 C: 混合模式（新闻列表 + 客户端筛选）

```
Page (RSC)
  → createServerClient()
  → 获取初始新闻列表（最近 20 条）
  → 获取分类列表（供筛选器使用）
  → 渲染 NewsTable(initialData) + NewsFilters
    │
    └── NewsFilters (Client Component)
          → 筛选条件变更
          → invoke Server Action: listNews({ status, categoryId, page, q })
          → 更新表格数据
```

### 6.5 数据获取规则

| 规则             | 说明                                                             |
| ---------------- | ---------------------------------------------------------------- |
| RSC 优先         | 初始页面数据优先在 Server Component 中获取                       |
| Action 写操作    | 所有 INSERT/UPDATE/DELETE 通过 Server Action                     |
| 避免客户端裸查询 | Client Component 不直接 `supabase.from('news').select()`         |
| 缓存管理         | 写操作后调用 `revalidatePath()` 或 `revalidateTag()`             |
| 错误处理         | Server Action 统一返回 `ActionResponse<T>` 类型                  |
| 加载状态         | Server Component 使用 `loading.tsx`；Client 使用 `useTransition` |
| 空状态           | 所有列表组件处理空数据，展示 EmptyState                          |

### 6.6 Server Action 目录规划

```
src/lib/actions/           ← 统一入口（跨 Feature 共享）
├── news.ts                ← 新闻 CRUD
├── categories.ts          ← 分类 CRUD
├── media.ts               ← 媒体上传/删除
├── auth.ts                ← 登录/登出/当前用户
├── settings.ts            ← 配置读写
└── view-counter.ts        ← 浏览计数异步写入
```

**与 Feature actions 的关系**：

- `lib/actions/` 中的是**底层共享 Server Actions**，被 pages 和 features 共同使用
- `features/*/actions/` 中的是**业务编排层**，可组合多个共享 Action

---

## 7. Folder Structure

### 7.1 最终目录结构

```
src/
├── app/
│   ├── (public)/                       ← 访客端路由组
│   │   ├── news/
│   │   │   ├── [slug]/page.tsx
│   │   │   └── page.tsx
│   │   ├── category/
│   │   │   └── [slug]/page.tsx
│   │   ├── search/page.tsx
│   │   ├── sitemap.ts
│   │   ├── page.tsx                    ← 首页
│   │   └── layout.tsx                  ← 访客端布局
│   │
│   ├── (admin)/                        ← 管理后台路由组
│   │   ├── admin/
│   │   │   ├── login/page.tsx          ← 登录页（无布局守卫）
│   │   │   ├── dashboard/page.tsx      ← 控制台
│   │   │   ├── news/
│   │   │   │   ├── page.tsx            ← 新闻列表
│   │   │   │   ├── create/page.tsx     ← 创建新闻
│   │   │   │   └── [id]/page.tsx       ← 编辑新闻
│   │   │   ├── categories/page.tsx     ← 分类管理
│   │   │   ├── media/page.tsx          ← 媒体库
│   │   │   ├── settings/page.tsx       ← 系统设置
│   │   │   └── profile/page.tsx        ← 个人资料
│   │   └── layout.tsx                  ← Admin 布局（Sidebar + Header）
│   │
│   ├── globals.css
│   ├── layout.tsx                      ← 根布局
│   ├── loading.tsx                     ← 全局加载
│   ├── error.tsx                       ← 全局错误
│   └── not-found.tsx                   ← 404
│
├── components/
│   ├── ui/                             ← 通用 UI 原子组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Dialog.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Card.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   ├── Toggle.tsx
│   │   ├── Pagination.tsx
│   │   ├── Breadcrumb.tsx
│   │   ├── Avatar.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Tooltip.tsx
│   │   ├── SearchInput.tsx
│   │   └── Tabs.tsx
│   │
│   ├── forms/                          ← 通用表单组件
│   │   ├── FormField.tsx
│   │   ├── FormSection.tsx
│   │   └── ImageUploadField.tsx
│   │
│   ├── tables/                         ← 通用数据表格
│   │   ├── DataTable.tsx
│   │   └── TablePagination.tsx
│   │
│   ├── editor/                         ← 富文本编辑器
│   │   ├── RichTextEditor.tsx
│   │   └── EditorToolbar.tsx
│   │
│   └── media/                          ← 媒体组件
│       ├── MediaGrid.tsx
│       ├── MediaCard.tsx
│       ├── MediaUploader.tsx
│       └── ImagePicker.tsx
│
├── features/
│   ├── auth/
│   │   ├── actions/
│   │   │   └── auth.ts                ← login, logout, getCurrentUser
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── index.ts
│   │
│   ├── dashboard/
│   │   ├── actions/
│   │   │   └── dashboard.ts           ← getStats, getRecentNews
│   │   ├── components/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentNewsList.tsx
│   │   │   └── QuickActions.tsx
│   │   └── index.ts
│   │
│   ├── news/
│   │   ├── actions/
│   │   │   └── news.ts                ← CRUD + publish + featured
│   │   ├── components/
│   │   │   ├── NewsForm.tsx
│   │   │   ├── NewsTable.tsx
│   │   │   ├── NewsFilters.tsx
│   │   │   ├── NewsStatusBadge.tsx
│   │   │   ├── FeaturedToggle.tsx
│   │   │   └── NewsPreview.tsx
│   │   ├── hooks/
│   │   │   └── useNewsFilters.ts
│   │   └── index.ts
│   │
│   ├── categories/
│   │   ├── actions/
│   │   │   └── categories.ts          ← CRUD + tree
│   │   ├── components/
│   │   │   ├── CategoryTree.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryMultiSelect.tsx
│   │   └── index.ts
│   │
│   ├── media/
│   │   ├── actions/
│   │   │   └── media.ts               ← upload + delete + list
│   │   ├── components/                 ← 仅业务编排
│   │   └── index.ts
│   │
│   └── settings/
│       ├── actions/
│       │   └── settings.ts            ← get + update
│       ├── components/
│       │   └── SettingsForm.tsx
│       └── index.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  ← Browser Client
│   │   ├── server.ts                  ← Server Client
│   │   └── middleware.ts              ← Session refresh
│   ├── actions/                       ← 共享底层 Server Actions
│   │   ├── news.ts
│   │   ├── categories.ts
│   │   ├── media.ts
│   │   ├── auth.ts
│   │   ├── settings.ts
│   │   └── view-counter.ts
│   ├── utils/
│   │   ├── slugify.ts
│   │   ├── date.ts
│   │   ├── sanitize.ts
│   │   ├── seo.ts
│   │   └── cn.ts                      ← clsx + tailwind-merge
│   └── types/
│       ├── database.ts                ← supabase gen types 生成
│       └── common.ts                  ← ActionResponse, AdminRole, NewsStatus
│
├── hooks/                             ← 全局共享 hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── usePagination.ts
│
├── providers/                         ← React Context Providers
│   ├── AuthProvider.tsx
│   └── ToastProvider.tsx
│
└── middleware.ts                      ← Next.js 中间件（Auth session 刷新）
```

### 7.2 目录职责总结

| 目录          | 角色         | 包含                               |
| ------------- | ------------ | ---------------------------------- |
| `app/`        | 页面路由     | 布局、页面组件、loading/error 边界 |
| `components/` | 通用 UI      | 无业务逻辑的可复用组件             |
| `features/`   | 业务模块     | 按领域组织的业务组件+Actions       |
| `lib/`        | 共享基础设施 | Supabase 客户端、工具函数、类型    |
| `hooks/`      | 全局钩子     | 跨 Feature 共享的 React Hooks      |
| `providers/`  | Context      | React Context 提供者               |

---

## 8. Architecture Decision Records

### ADR-006: Admin Architecture

| 字段             | 值               |
| ---------------- | ---------------- |
| **标题**         | 后台管理系统架构 |
| **状态**         | 提议             |
| **日期**         | 2026-06-05       |
| **受影响的文档** | Architecture.md  |

**背景**：需要确定管理后台的路由结构、布局层级和组件组织方式。

**决策**：

1. **路由组织**：使用 Next.js Route Group `(admin)` 将所有管理路由隔离，与访客端路由共享根布局但使用独立的 AdminLayout
2. **布局结构**：固定 Sidebar + 固定 Header + 滚动 Content 的三栏结构，Sidebar 在移动端为 overlay drawer
3. **Feature 架构**：按业务域拆分为 `features/` 目录，每个 Feature 包含自己的 Actions、Components 和 Hooks
4. **通用组件**：抽离到 `components/ui/`、`components/forms/`、`components/tables/`、`components/editor/`、`components/media/`
5. **状态管理**：URL 作为 Single Source of Truth（不引入 Redux/Zustand），Auth 状态通过 React Context 透传

**后果**：

- 正面：路由清晰隔离，Feature 边界明确，组件高度可复用
- 负面：Feature 间共享组件需要提升到 `components/` 层，可能增加前期重构成本

### ADR-007: RBAC Strategy

| 字段             | 值                                  |
| ---------------- | ----------------------------------- |
| **标题**         | 角色权限控制策略                    |
| **状态**         | 提议                                |
| **日期**         | 2026-06-05                          |
| **受影响的文档** | PRD.md, Architecture.md, 09_rls.sql |

**背景**：PRD 要求三级角色（super_admin / publisher / editor），需要在 RLS 和 Server Action 两个层面实施权限控制。

**决策**：

1. **三层防护**：
   - RLS（数据库层）：控制行级可见性和写权限（已在 Sprint 2.2 实施）
   - Server Action（应用层）：`requireRole()` 函数验证操作权限
   - UI 层（展示层）：按条件渲染操作按钮
2. **角色存储在 profiles.role**：从 auth.uid() 通过 profiles 表查询，不信任客户端传递的角色信息
3. **角色粒度**：编辑无权操作他人的草稿、无权发布、无权置顶；发布者有全部内容管理权限，但无权删除已发布新闻和管理系统；超级管理员拥有一切权限

**后果**：

- 正面：多层防护纵深防御
- 正面：RLS 和应用层校验互相备份
- 负面：新增角色需要修改 RLS 策略、Server Action 守卫和 UI 层三处代码

### ADR-008: Data Fetching Strategy

| 字段             | 值              |
| ---------------- | --------------- |
| **标题**         | 数据获取策略    |
| **状态**         | 提议            |
| **日期**         | 2026-06-05      |
| **受影响的文档** | Architecture.md |

**背景**：后台管理系统需要在服务端渲染、客户端交互和实时更新之间做出数据获取架构选择。

**决策**：

1. **Server Components 优先**：所有页面初始数据在 RSC 中通过 `createServerClient()` 获取
2. **Server Actions 处理变更**：所有 INSERT/UPDATE/DELETE 通过 Server Action 实现，统一返回 `ActionResponse<T>` 类型
3. **Client 调用模式**：Client Component 不直接使用 `supabase.from(...)` 查询数据库，通过调用 Server Action 间接获取数据
4. **Supabase Browser Client 仅用于**：Auth 状态监听和 Storage 上传操作
5. **缓存管理**：写操作后调用 `revalidatePath()` 或 `revalidateTag()` 使相关缓存失效
6. **URL 驱动筛选**：列表页的筛选条件通过 URL searchParams 驱动，而非 React state

**后果**：

- 正面：服务端渲染有利于首屏性能（ISR）
- 正面：Server Actions 提供类型安全的数据变更
- 正面：URL 驱动的筛选状态可分享/可收藏
- 负面：实时更新场景需要额外的 WebSocket/Supabase Realtime 支持（第一版不需要）

---

## 附录：Sprint 3 实施建议

### 实施顺序

| 顺序 | 模块                                                     | 预估 | 依赖                                |
| ---- | -------------------------------------------------------- | ---- | ----------------------------------- |
| 1    | `components/ui/` 补齐（约 12 个组件）                    | 2d   | 无                                  |
| 2    | `features/auth/` + AdminLayout Auth Guard                | 1d   | ui                                  |
| 3    | `features/dashboard/`                                    | 0.5d | auth                                |
| 4    | `features/categories/`（含 CategoryMultiSelect）         | 1.5d | auth, ui                            |
| 5    | `features/news/`（最复杂，含 NewsForm + RichTextEditor） | 3d   | auth, ui, categories, media, editor |
| 6    | `components/editor/`（Tiptap）                           | 2d   | ui, media                           |
| 7    | `components/media/` + `features/media/`                  | 1.5d | auth, ui                            |
| 8    | `features/settings/`                                     | 0.5d | auth, ui                            |
| 9    | `components/tables/`                                     | 1d   | ui                                  |
| 10   | `components/forms/`                                      | 0.5d | ui                                  |

**总计**：约 14 个工作日，可分 3 个子 Sprint 执行。
