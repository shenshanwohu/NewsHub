# Sprint 3.2 — Auth & RBAC 设计文档

| 元数据       | 值                                                     |
| ------------ | ------------------------------------------------------ |
| **文档状态** | 待评审                                                 |
| **Sprint**   | 3.2 — Auth & RBAC Design                               |
| **作者**     | 技术负责人                                             |
| **日期**     | 2026-06-05                                             |
| **前置文档** | admin-architecture-review.md, Database.md, ADR-006~008 |

---

## 目录

1. [Authentication Flow](#1-authentication-flow)
2. [Middleware Strategy](#2-middleware-strategy)
3. [RBAC Strategy](#3-rbac-strategy)
4. [Auth Module Architecture](#4-auth-module-architecture)
5. [Auth Utilities Design](#5-auth-utilities-design)
6. [Edge Cases](#6-edge-cases)
7. [Security Review](#7-security-review)
8. [ADR](#8-adr)

---

## 1. Authentication Flow

### 1.1 完整认证生命周期

```
┌──────────────────────────────────────────────────────────────────┐
│                     Authentication Lifecycle                       │
│                                                                    │
│  ┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────┐ │
│  │ 登录页面  │───>│ Supabase  │───>│  Set      │───>│ Admin    │ │
│  │ /admin/  │    │ Auth      │    │ Cookie    │    │ Layout   │ │
│  │ login    │<───│ (API)     │<───│ (httpOnly)│<───│ (Guard)  │ │
│  └──────────┘    └───────────┘    └────────────┘    └──────────┘ │
│       │                │                              │           │
│       │ 错误           │ Token 刷新                    │ 验证      │
│       ▼                ▼                              ▼           │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────────┐   │
│  │ 错误提示  │    │ Middleware│    │  Session 有效 → 渲染内容  │   │
│  │          │    │ auto-     │    │  Session 失效 → 重定向    │   │
│  │          │    │ refresh   │    │  Profile 禁用 → 登出     │   │
│  └──────────┘    └───────────┘    └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 登录流程

```
步骤 1: 管理员访问 /admin/login
  → 检查是否有已有 session
    → 有 → 重定向到 /admin/dashboard
    → 无 → 显示 LoginForm

步骤 2: 管理员填写邮箱 + 密码，点击登录
  → LoginForm (Client Component) 调用 Server Action: login(email, password)
    → Server Action 调用 supabase.auth.signInWithPassword({ email, password })
      → 成功:
        → Supabase Auth 自动设置 httpOnly cookie (通过 middleware 响应)
        → 返回 ActionResponse<{ user }>
      → 失败:
        → 返回 ActionResponse<{ error: 'INVALID_CREDENTIALS' | 'USER_DISABLED' }>

步骤 3: 客户端接收结果
  → 成功 → router.push('/admin/dashboard')
  → 失败 → 显示错误信息（"邮箱或密码错误"）
```

**登录表单交互**：

```
LoginForm (Client Component)
  ├── Email Input (带验证)
  ├── Password Input (带显示/隐藏)
  ├── 登录 Button (loading 状态)
  └── 错误提示区域 (toast 或内联)
```

### 1.3 登出流程

```
步骤 1: 管理员点击 UserMenu → "退出登录"
  → UserMenu 调用 Server Action: logout()
    → supabase.auth.signOut()
    → 清除所有 Auth cookie (middleware 处理)
    → 返回 ActionResponse

步骤 2: 客户端接收结果
  → router.push('/admin/login')
  → 清除客户端状态 (AuthContext)
```

**登出触发点**：

- UserMenu 下拉菜单中的"退出登录"按钮
- Session 过期后的自动登出
- 管理员被禁用后的强制登出

### 1.4 Session 刷新流程

Session 刷新由 Supabase Auth 自动处理，通过 `middleware.ts` 中的 `updateSession()` 函数：

```
每次请求到达 middleware.ts
  → updateSession(request)
    → 从 request cookies 读取 Supabase Auth session
    → 调用 supabase.auth.getUser() 验证 session
      → session 有效且未过期 → 继续（可能刷新 token）
      → session 过期 → 尝试 refresh token
        → refresh 成功 → 设置新 cookie → 继续
        → refresh 失败 → 清除 cookie → 请求继续（页面守卫处理重定向）
    → 返回 response（带更新后的 cookie）
```

**关键设计点**：

- Session 刷新对应用层透明：middleware 自动处理
- 访问令牌过期时间：Supabase 默认 1 小时
- 刷新令牌过期时间：Supabase 默认 30 天
- 刷新令牌仅在 middleware 中使用（安全考量）

### 1.5 Session 失效处理

| 失效场景          | 检测位置                    | 处理方式                               |
| ----------------- | --------------------------- | -------------------------------------- |
| 访问令牌过期      | Middleware                  | 自动刷新（静默）                       |
| 刷新令牌过期      | Middleware                  | 清除 cookie，页面重定向到 /admin/login |
| 用户主动登出      | Server Action               | 清除 cookie + 重定向                   |
| 管理员被禁用      | AdminLayout (RSC)           | 执行登出 + 重定向 + 提示"账号已被禁用" |
| Profile 被删除    | AdminLayout / Server Action | 同禁用处理                             |
| Supabase 项目变更 | 全部                        | 所有 session 失效，需要重新登录        |

---

## 2. Middleware Strategy

### 2.1 中间件职责

```
middleware.ts (Next.js Edge Middleware)
  │
  ├── 1. 刷新 Supabase Auth session（updateSession）
  │     ├── 读取 cookies
  │     ├── 调用 supabase.auth.getUser()
  │     ├── 自动刷新过期 token
  │     └── 写回更新后的 cookies
  │
  └── 2. 路由保护（请求到达 AdminLayout 之前）
        ├── 检查请求路径
        ├── 判断是否需要认证
        └── 无 session → 重定向到 /admin/login
```

### 2.2 公开路由定义

以下路由不需要认证（匹配 `matcher` 范围后由中间件放行）：

| 路由                                   | 说明             | 备注                           |
| -------------------------------------- | ---------------- | ------------------------------ |
| `/admin/login`                         | 登录页           | 中间件不做保护，由页面自身检查 |
| `/_next/static/*`                      | Next.js 静态资源 | matcher 排除                   |
| `/_next/image/*`                       | 图片优化         | matcher 排除                   |
| `/*.ico` / `/*.{png,jpg,svg,gif,webp}` | 静态图片         | matcher 排除                   |

**中间件 matcher 配置**（已有）：

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 2.3 重定向策略

| 场景                      | 来源               | 目标                                 | 状态码 |
| ------------------------- | ------------------ | ------------------------------------ | ------ |
| 未登录访问 `/admin/*`     | `/admin/news`      | `/admin/login?redirect=/admin/news`  | 302    |
| 已登录访问 `/admin/login` | `/admin/login`     | `/admin/dashboard`                   | 302    |
| Session 过期后操作        | 任意 Server Action | 返回 UNAUTHORIZED 错误，客户端重定向 | —      |

**redirect 参数传递**：

```
未登录用户尝试访问 /admin/news
  → middleware 检测无 session
  → 重定向到 /admin/login?redirect=/admin/news
  → 登录成功后读取 redirect 参数
  → router.push('/admin/news')
```

### 2.4 中间件边界

中间件**不承担**以下职责（由后续层处理）：

- ❌ 角色校验（RBAC）— 由 Server Action 守卫处理
- ❌ Profile 完整性检查 — 由 AdminLayout 处理
- ❌ 业务逻辑过滤 — 由 RLS + Server Action 处理
- ❌ 页面级路由保护 — 由 AdminLayout 处理

中间件**只做**：

- ✅ Session cookie 刷新
- ✅ 基本的未认证重定向（保护 /admin/\* 路径）

---

## 3. RBAC Strategy

### 3.1 三层防护模型

```
Request
  │
  ▼
Layer 1: 路由层 (Middleware)
  ├── 检查：是否有 Supabase Auth session
  ├── 结果：无 → 重定向登录 | 有 → 放行
  └── 不检查角色
  │
  ▼
Layer 2: 布局层 (Server Component - AdminLayout)
  ├── 检查：session 有效 + profiles 存在 + profiles.is_active
  ├── 结果：无效 → 重定向/登出 | 有效 → 渲染 + 注入 AuthContext
  └── 不检查角色（仅验证管理员身份）
  │
  ▼
Layer 3: 数据层 (Server Action / RSC / RLS)
  ├── RLS: 行级数据权限（数据库层面）
  ├── requireRole(): 操作权限校验（应用层面）
  └── UI 条件渲染: 按钮/菜单可见性（展示层面）
```

### 3.2 Server Component 角色处理

Server Component 负责**初始数据加载时的权限过滤**和**页面级访问控制**。

#### 页面级访问控制

对于**仅限 Super Admin 的页面**（如 `/admin/settings`），在 Server Component 中检查角色：

```
AdminSettingsPage (Server Component)
  → getCurrentProfile()
    → role !== 'super_admin'
      → redirect('/admin/dashboard')
    → role === 'super_admin'
      → 正常渲染页面
```

#### 数据级过滤

列表页根据角色返回不同数据（与 RLS 配合）：

```
AdminNewsPage (Server Component)
  → getCurrentProfile()
  → 使用 profile.role 构造查询（可选，RLS 已处理行级过滤）
  → 渲染 NewsTable
```

**说明**：服务端不需要显式按角色过滤查询，RLS 已自动限制行可见性。但页面级别的访问控制（整个页面不可见）需要在 RSC 中主动检查。

### 3.3 Server Action 角色处理

每个 Server Action 入口处调用 `requireRole()` 进行权限校验：

```
createNews()
  → requireRole('editor', 'publisher', 'super_admin')
  → 执行业务逻辑

deleteNews(newsId)
  → requireRole('super_admin')  // 仅超级管理员可删除已发布
  → (或 requireRole('editor') + 校验是否是自己的草稿)
  → 执行业务逻辑

publishNews(newsId)
  → requireRole('publisher', 'super_admin')
  → 执行业务逻辑

manageCategories()
  → requireRole('super_admin')
  → 执行业务逻辑

updateSettings()
  → requireRole('super_admin')
  → 执行业务逻辑
```

**requireRole 的设计**：可以接受多个角色，满足任一即通过。

### 3.4 Client Component 角色处理

Client Component 通过 `useAuth()` hook 获取当前用户信息和角色，用于：

#### 条件渲染

```
// 侧边栏导航
const { profile } = useAuth();
{profile?.role === 'super_admin' && <NavItem to="/admin/settings" />}

// 操作按钮
{canDelete && <Button variant="danger" onClick={handleDelete}>删除</Button>}
```

#### 状态派生

角色相关的 UI 状态通过 `useAuth` 中的辅助函数派生：

```typescript
const { canPublish, canManageCategories, canManageSettings } = useAuth();
// canPublish = profile.role === 'publisher' || profile.role === 'super_admin'
// canManageCategories = profile.role === 'super_admin'
// canManageSettings = profile.role === 'super_admin'
```

**安全原则**：Client Component 中的角色检查仅用于 UI 展示，**不得作为安全决策依据**。真正的权限校验在 Server Action 中。

### 3.5 角色校验函数汇总

| 函数                                      | 使用位置            | 返回            | 失败行为                         |
| ----------------------------------------- | ------------------- | --------------- | -------------------------------- |
| `requireAuth()`                           | Server Action / RSC | profile         | throw error → 客户端重定向       |
| `requireRole('publisher', 'super_admin')` | Server Action       | profile         | throw error → 客户端显示"无权限" |
| `useAuth().profile`                       | Client Component    | profile \| null | null → 隐藏受保护 UI             |
| `getCurrentUser()`                        | RSC / Server Action | user \| null    | null → 按场景处理                |

---

## 4. Auth Module Architecture

### 4.1 目录设计

```
src/features/auth/
├── actions/
│   └── auth.ts              ← Server Actions: login, logout, getCurrentUser
│
├── components/
│   ├── LoginForm.tsx         ← 登录表单（Client Component）
│   └── UserMenu.tsx          ← 用户菜单（头像 + 下拉）
│
├── hooks/
│   └── useAuth.ts            ← AuthContext consumer hook
│
├── AuthContext.tsx            ← React Context 定义 + Provider
│
├── middleware.ts              ← 仅 re-export lib/supabase/middleware 的 updateSession
│
└── index.ts                  ← 公开导出
```

### 4.2 职责边界

| 模块              | 职责                                               | 不包含                                    |
| ----------------- | -------------------------------------------------- | ----------------------------------------- |
| `actions/auth.ts` | 登录/登出 Server Action、getCurrentUser 服务端函数 | Session 管理（Supabase Auth 处理）        |
| `LoginForm.tsx`   | 登录 UI、表单验证、调用 login Action、错误展示     | 角色选择、注册（系统不支持注册）          |
| `UserMenu.tsx`    | 用户头像 + 名称展示、下拉菜单、退出登录            | 用户管理（管理员管理在独立模块）          |
| `useAuth.ts`      | 暴露当前用户、profile、权限辅助函数                | 具体业务权限判断（由各 Feature 自行处理） |
| `AuthContext.tsx` | 全局提供 user 和 profile                           | 数据获取逻辑（由 Provider 调用 actions）  |

### 4.3 AuthContext 设计

```
AuthContext
├── user: User | null                  ← Supabase Auth User
├── profile: Profile | null            ← profiles 表记录
├── isLoading: boolean                 ← 初始加载状态
├── isAuthenticated: boolean           ← user && profile 是否有效
├── signIn: (email, password) => ActionResponse
├── signOut: () => Promise<void>
└── refresh: () => Promise<void>       ← 手动刷新
```

**Context 提供者位置**：

```
AdminLayout (RSC)
  → 获取 user + profile
  → 传递给 AuthProvider (Client Component)
    → AuthProvider 设置 Context 值
      → 所有子组件通过 useAuth() 访问
```

### 4.4 Auth 数据流

```
AdminLayout (Server Component)
  │
  ├── 1. createServerClient() → await getUser()
  │     └── 获取 Supabase Auth User
  │
  ├── 2. await getProfile(user.id)
  │     └── 从 profiles 表获取当前用户角色信息
  │
  ├── 3. 验证 is_active
  │     └── false → await signOut() → redirect('/admin/login?reason=disabled')
  │
  └── 4. 将 { user, profile } 传递给 AuthProvider
        └── AuthProvider 注入 Context
              └── Client Components 通过 useAuth() 消费
```

---

## 5. Auth Utilities Design

### 5.1 `requireAuth()`

| 属性         | 值                               |
| ------------ | -------------------------------- |
| **用途**     | 验证当前请求已认证，返回 profile |
| **使用位置** | Server Action / RSC              |
| **失败行为** | 抛出 `AuthenticationError`       |

```typescript
// 接口设计
type AuthResult = { user: User; profile: Profile };

async function requireAuth(): Promise<AuthResult> {
  // 1. 创建 Supabase Server Client (cookie-based)
  // 2. 调用 getUser() 获取 Supabase Auth User
  //   → 无 user → throw UNAUTHORIZED
  // 3. 从 profiles 表查询当前用户
  //   → 无 profile → throw PROFILE_NOT_FOUND
  //   → profile.is_active === false → throw USER_DISABLED
  // 4. 返回 { user, profile }
}
```

### 5.2 `requireRole()`

| 属性         | 值                           |
| ------------ | ---------------------------- |
| **用途**     | 验证当前用户拥有指定角色之一 |
| **使用位置** | Server Action                |
| **失败行为** | 抛出 `AuthorizationError`    |

```typescript
// 接口设计
async function requireRole(...roles: AdminRole[]): Promise<Profile> {
  // 1. 调用 requireAuth() 获取当前认证用户
  // 2. 检查 profile.role 是否在 roles 列表中
  //   → 不匹配 → throw FORBIDDEN
  // 3. 返回 profile
}
```

### 5.3 `getCurrentUser()`

| 属性         | 值                                                |
| ------------ | ------------------------------------------------- |
| **用途**     | 获取当前 Supabase Auth 用户（轻量，不查 profile） |
| **使用位置** | RSC / Server Action                               |
| **失败行为** | 返回 null（不抛异常）                             |

```typescript
// 接口设计
async function getCurrentUser(): Promise<User | null> {
  // 1. 创建 Supabase Server Client
  // 2. 调用 getUser()
  // 3. 返回 user.data.user 或 null
}
```

### 5.4 `getCurrentProfile()`

| 属性         | 值                             |
| ------------ | ------------------------------ |
| **用途**     | 获取当前用户的 profiles 表记录 |
| **使用位置** | RSC / Server Action            |
| **失败行为** | 返回 null                      |

```typescript
// 接口设计
async function getCurrentProfile(): Promise<Profile | null> {
  // 1. 调用 getCurrentUser()
  //   → null → return null
  // 2. 从 profiles 表查询 auth_id = user.id
  // 3. 返回 profile 或 null
}
```

### 5.5 错误类型定义

```typescript
class AuthenticationError extends Error {
  code: 'UNAUTHORIZED' | 'PROFILE_NOT_FOUND' | 'USER_DISABLED';
  constructor(code: AuthenticationErrorCode, message?: string);
}

class AuthorizationError extends Error {
  code: 'FORBIDDEN';
  constructor(message?: string);
}

// ActionResponse 中的错误码
type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'USER_DISABLED'
  | 'PROFILE_NOT_FOUND';
```

### 5.6 使用规范

| 函数                  | 调用频率                   | 缓存策略           | 备注                      |
| --------------------- | -------------------------- | ------------------ | ------------------------- |
| `getCurrentUser()`    | 每次 Server Action         | 无缓存（每次校验） | 轻量操作                  |
| `getCurrentProfile()` | 每次需要角色信息时         | 无缓存             | 与 getUser 可合并一次查询 |
| `requireAuth()`       | 每个受保护的 Server Action | 无缓存             | 失败则终止操作            |
| `requireRole()`       | 需要特定角色的操作         | 无缓存             | 失败则终止操作            |

**不缓存的原因**：user/profile 状态可能在任何请求之间变化（账号被禁用、角色被修改），每次校验保证安全性。

---

## 6. Edge Cases

### 6.1 禁用用户（is_active = false）

| 场景                   | 检测时机             | 处理方式                                                                                                     |
| ---------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| 已登录用户被禁用       | 下次请求 AdminLayout | `getProfile()` 检测 `is_active = false` → 登出 + 重定向到 `/admin/login?reason=disabled`                     |
| 被禁用用户尝试登录     | 登录 Server Action   | 登录成功后查询 profile → 检测 `is_active = false` → 调用 `signOut()` 清理 session → 返回错误 `USER_DISABLED` |
| 被禁用用户已有 session | Middleware / RSC     | session 仍然有效（Supabase Auth 不与 profiles 联动），AdminLayout 检测并拦截                                 |

**最佳方案**：在 AdminLayout 中作为 RSC，每次页面加载都检查 `is_active`。这是最可靠的位置，它在每次导航时执行。

### 6.2 不存在 Profile

| 场景                              | 检测时机                    | 处理方式                                                                                |
| --------------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| Auth 用户存在但 profiles 无记录   | AdminLayout / Server Action | `getProfile()` 返回 null → 调用 `signOut()` → 重定向到 `/admin/login?reason=no_profile` |
| 创建 Auth 用户后 profile 写入失败 | 初始配置阶段                | 属于系统配置错误，应通过告警发现                                                        |

**原因分析**：profile 不存在通常是系统错误（管理员创建流程中断），不是用户端问题。应向日志记录详细信息。

### 6.3 Session 过期

| 阶段                 | 表现                                 | 处理方式                                      |
| -------------------- | ------------------------------------ | --------------------------------------------- |
| 页面加载             | AdminLayout 中 `getUser()` 返回 null | 重定向到 `/admin/login`                       |
| Server Action 执行中 | `requireAuth()` 抛出 UNAUTHORIZED    | 客户端 catch 到错误 → 重定向到 `/admin/login` |
| Client 组件操作      | Server Action 返回 UNAUTHORIZED      | 显示 toast"登录已过期" + 3s 后重定向          |
| 静默后台             | Middleware 自动刷新                  | 无感知，token 自动续期                        |

**Server Action 超时处理**：

```
Client Component 调用 Server Action
  → Action 返回 { success: false, error: 'UNAUTHORIZED' }
  → Client 检查 error code
    → code === 'UNAUTHORIZED'
      → showToast('登录已过期，请重新登录')
      → setTimeout(() => router.push('/admin/login'), 3000)
```

### 6.4 角色异常

| 场景                               | 处理方式                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| 角色值非预期（如 NULL 或拼写错误） | `requireRole()` 中 CHECK 约束保证数据库层面合法；但仍需兜底，遇到未知角色按"无权限"处理 |
| 角色被降级                         | 下次请求时生效（无缓存）；当前已派发的客户端页面需要刷新后更新侧边栏                    |
| 超级管理员被误降级                 | 同一般角色变更，下次请求生效；但需注意不要将最后一个超级管理员降级（应用层可增加校验）  |

### 6.5 并发登出问题

| 场景                            | 处理                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------- |
| 用户同时在两个浏览器登录        | Supabase Auth 支持多 session，互不影响                                          |
| 管理员在 A 处登出，B 处仍在操作 | 下次 Server Action 调用时 `requireAuth()` 失败，触发重定向                      |
| 多 Tab 页                       | 一个 Tab 登出后，共享 cookie 失效，其他 Tab 下次请求时被中间件/AdminLayout 拦截 |

---

## 7. Security Review

### 7.1 风险分析

#### 风险 A：特权提升

| 属性     | 描述                                                |
| -------- | --------------------------------------------------- |
| **场景** | 编辑尝试通过修改 API 请求参数将角色提升为超级管理员 |
| **影响** | 严重：越权访问系统设置                              |
| **概率** | 中                                                  |

**缓解措施**：

1. RLS 策略：`super_admin_manage_profiles` 防止非超级管理员修改 profiles 表
2. Server Action 守卫：所有角色敏感操作调用 `requireRole('super_admin')`
3. 角色值存储在服务端数据库（profiles 表），客户端不存储角色用于鉴权
4. Client Component 中的角色信息仅用于 UI 展示

#### 风险 B：Session 劫持

| 属性     | 描述                                    |
| -------- | --------------------------------------- |
| **场景** | 攻击者窃取 httpOnly cookie 模拟登录状态 |
| **影响** | 严重：完全权限接管                      |
| **概率** | 低                                      |

**缓解措施**：

1. Cookie 使用 `httpOnly` + `Secure` + `SameSite=Lax` 属性（@supabase/ssr 默认）
2. 所有敏感操作受 RLS + Server Action 双层保护
3. Session 绑定 IP（Supabase Auth 内置 — 需额外配置）
4. 生产环境启用 HTTPS

#### 风险 C：Session 固定攻击

| 属性     | 描述                                     |
| -------- | ---------------------------------------- |
| **场景** | 攻击者在登录前后使用相同的 session token |
| **影响** | 中等                                     |
| **概率** | 低                                       |

**缓解措施**：Supabase Auth 登录时自动生成新的 access/refresh token 对，旧 token 立即失效。

#### 风险 D：暴力破解

| 属性     | 描述                   |
| -------- | ---------------------- |
| **场景** | 攻击者批量尝试登录密码 |
| **影响** | 中等                   |
| **概率** | 中                     |

**缓解措施**：

1. Supabase Auth 内置速率限制（默认配置，可在 Supabase Dashboard 调整）
2. 连续失败后增加延迟
3. 登录错误统一返回"邮箱或密码错误"（不泄露具体是邮箱不存在还是密码错误）
4. V2 可增加 CAPTCHA

#### 风险 E：Service Role Key 泄露

| 属性     | 描述                                          |
| -------- | --------------------------------------------- |
| **场景** | Service Role Key 在前端代码中被暴露，绕过 RLS |
| **影响** | 灾难性：完全数据库访问                        |
| **概率** | 低                                            |

**缓解措施**：

1. `SUPABASE_SERVICE_ROLE_KEY` 仅用于 Server Action（`lib/supabase/server.ts`）
2. 客户端只使用 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ESLint 规则禁止客户端代码引用 `process.env.SUPABASE_SERVICE_ROLE_KEY`
4. `.env.local` 已从 git 排除

#### 风险 F：CSRF

| 属性     | 描述         |
| -------- | ------------ |
| **场景** | 跨站请求伪造 |
| **影响** | 中等         |
| **概率** | 低           |

**缓解措施**：

1. Next.js Server Actions 内置 CSRF 防护
2. Cookie 使用 SameSite=Lax
3. 所有表单通过 Server Action 提交，不通过传统 form action

### 7.2 防护措施汇总

| 威胁              | 防护层 1               | 防护层 2                  | 防护层 3                  |
| ----------------- | ---------------------- | ------------------------- | ------------------------- |
| 未认证访问        | Middleware 重定向      | AdminLayout 检查          | Server Action requireAuth |
| 越权操作          | RLS 行级策略           | Server Action requireRole | UI 条件隐藏按钮           |
| 会话劫持          | httpOnly Secure Cookie | 短生命周期 access token   | IP 绑定（可选）           |
| 暴力破解          | Supabase 速率限制      | 统一错误信息              | 登出后延迟                |
| Service Role 泄露 | 环境变量隔离           | ESLint 规则               | 代码审查                  |
| XSS 注入          | DOMPurify 清洗         | CSP Header                | React 默认转义            |

---

## 8. Architecture Decision Records

### ADR-009: Authentication Strategy

| 字段             | 值                             |
| ---------------- | ------------------------------ |
| **标题**         | 认证策略                       |
| **状态**         | 提议                           |
| **日期**         | 2026-06-05                     |
| **受影响的文档** | Architecture.md, middleware.ts |

**背景**：需要确定后台管理系统的认证实现方式，包括登录、登出、session 管理和中间件策略。

**决策**：

1. **认证方式**：使用 Supabase Auth（邮箱 + 密码），利用 `@supabase/ssr` 的 cookie-based session 管理
2. **Session 存储**：httpOnly cookie，由 Supabase Auth 自动管理 access/refresh token
3. **Session 刷新**：在 `middleware.ts` 中通过 `updateSession()` 自动处理，对应用层透明
4. **登录流程**：Client Component 表单 → Server Action → `supabase.auth.signInWithPassword()` → cookie 设置 → 重定向
5. **登出流程**：UserMenu → Server Action → `supabase.auth.signOut()` → cookie 清除 → 重定向到登录页
6. **中间件职责**：只做 session 刷新 + 基础路由保护（重定向未认证用户），不做角色校验
7. **登录页重定向**：支持 `?redirect=` 参数，登录后返回原目标页面

**后果**：

- 正面：Session 管理完全托管给 Supabase，零配置
- 正面：middleware 无感知 token 刷新
- 正面：不支持注册，仅超级管理员可创建管理员（封闭系统）
- 负面：Session 过期时间依赖 Supabase 默认配置（1h access / 30d refresh）
- 负面：离线场景不支持（管理后台需要网络）

### ADR-010: Authorization Strategy

| 字段             | 值                                                    |
| ---------------- | ----------------------------------------------------- |
| **标题**         | 授权策略                                              |
| **状态**         | 提议                                                  |
| **日期**         | 2026-06-05                                            |
| **受影响的文档** | PRD.md, Architecture.md, admin-architecture-review.md |

**背景**：需要在应用层实现角色权限控制，配合数据库 RLS 形成纵深防御。

**决策**：

1. **三层防护模型**：
   - RLS（数据库层）— 行级数据控制
   - Server Action 守卫（应用层）— 操作权限控制
   - UI 条件渲染（展示层）— 交互可见性控制

2. **角色存储**：仅存储在 `profiles.role` 列，不信任客户端传递的角色信息

3. **角色校验函数**：
   - `requireAuth()` — 验证认证状态
   - `requireRole(...roles)` — 验证角色权限
   - `getCurrentUser()` — 获取当前用户（轻量）
   - `getCurrentProfile()` — 获取当前用户完整档案

4. **页面级访问控制**：在 Server Component 中检查角色，不可见页面返回重定向（非 403 页面）

5. **Client 端角色**：仅用于 UI 条件渲染，不作为安全决策依据

6. **无权限反馈**：Server Action 返回 `FORBIDDEN` 错误码，客户端显示 toast + 不暴露具体角色信息

**后果**：

- 正面：三层防护纵深防御，单层失效仍有备份
- 正面：角色统一在 Server Action 层校验，避免分散
- 正面：RLS 与应用层校验互补（RLS 应对复杂行级过滤，应用层应对复杂业务规则）
- 负面：新增角色需要修改三处代码（RLS 策略 + Server Action 守卫 + UI 展示）
- 负面：每个 Server Action 都需要显式调用 `requireRole()`，增加重复代码量
