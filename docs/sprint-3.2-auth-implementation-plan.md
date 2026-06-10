# Sprint 3.2 Phase 1 — Auth Infrastructure 实施计划

| 元数据     | 值                               |
| ---------- | -------------------------------- |
| **Sprint** | 3.2 — Auth & RBAC Implementation |
| **状态**   | 待评审                           |
| **文件**   | 新增 10 个，修改 3 个            |

---

## A. 文件变更总览

```
src/
├── lib/
│   ├── actions/
│   │   └── auth.ts                    ★ 新增    底层 Auth Server Actions
│   ├── utils/
│   │   ├── auth.ts                    ★ 新增    requireAuth / requireRole 守卫函数
│   │   └── errors.ts                  ★ 新增    认证/授权错误类型
│   └── types/
│       └── common.ts                  ✎ 修改    Profile / AuthResult 类型
│
├── features/
│   └── auth/
│       ├── index.ts                   ★ 新增    公开 API 导出
│       ├── AuthContext.tsx            ★ 新增    Auth React Context + Provider
│       ├── actions/
│       │   └── auth.ts                ★ 新增    Feature 层 getCurrentUser / getCurrentProfile
│       ├── hooks/
│       │   └── useAuth.ts             ★ 新增    消费 AuthContext 的 hook
│       └── components/
│           ├── LoginForm.tsx          ★ 新增    登录表单组件
│           └── UserMenu.tsx           ★ 新增    用户下拉菜单组件
│
├── app/(admin)/
│   ├── layout.tsx                     ✎ 修改    Auth Guard + AuthProvider
│   └── admin/login/page.tsx           ✎ 修改    集成真实登录表单
│
└── middleware.ts                       ✎ 修改    添加 /admin/* 路由保护
```

## B. 文件职责说明

### 新增文件

| #   | 文件                                         | 职责                                                                                                                            | 使用位置              |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | `src/lib/utils/errors.ts`                    | `AuthenticationError` / `AuthorizationError` 类定义，带错误码                                                                   | 全局                  |
| 2   | `src/lib/utils/auth.ts`                      | `requireAuth()` — 校验认证，`requireRole()` — 校验角色，`getCurrentUser()` / `getCurrentProfile()` — 获取当前用户（无异常版本） | Server Action / RSC   |
| 3   | `src/lib/actions/auth.ts`                    | `login(email, password)` — 登录 Server Action，`logout()` — 登出 Server Action                                                  | Client Component 调用 |
| 4   | `src/features/auth/AuthContext.tsx`          | `AuthContext` 定义 + `AuthProvider`（接收 RSC 注入的 user/profile，监听 auth state change）                                     | AdminLayout           |
| 5   | `src/features/auth/hooks/useAuth.ts`         | `useAuth()` hook，暴露 user、profile、canPublish、canManageSettings 等                                                          | Client Component      |
| 6   | `src/features/auth/actions/auth.ts`          | `getCurrentUser()` / `getCurrentProfile()` — 由 Client 通过 Server Action 调用                                                  | Client Component      |
| 7   | `src/features/auth/components/LoginForm.tsx` | 登录表单 UI：邮箱 + 密码 + 错误提示 + loading + redirect 处理                                                                   | Login 页面            |
| 8   | `src/features/auth/components/UserMenu.tsx`  | 右上角用户菜单：头像缩写 + 名称 + 下拉（个人资料 / 退出登录）                                                                   | AdminLayout Header    |
| 9   | `src/features/auth/index.ts`                 | 公开导出所有 auth 组件和类型                                                                                                    | 外部引用              |

### 修改文件

| #   | 文件                                   | 变更                                                                                                                            |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 10  | `src/lib/types/common.ts`              | 新增 `Profile` 接口、`AuthResult` 类型、导入 `User` 类型                                                                        |
| 11  | `src/middleware.ts`                    | 从 `@supabase/ssr` 直接创建 client，调用 `getUser()`，保护 `/admin/*` 路由，已登录时重定向登录页到 dashboard                    |
| 12  | `src/app/(admin)/layout.tsx`           | 改为 async RSC：调用 `getCurrentUser()` + `getCurrentProfile()` → 无效则 redirect → 有效则包裹 `AuthProvider` + 渲染 `UserMenu` |
| 13  | `src/app/(admin)/admin/login/page.tsx` | async RSC 检测已有 session → redirect → 否则渲染 `LoginForm`                                                                    |

## C. 实施顺序

```
Phase 1.1: 基础设施
  Step 1  src/lib/types/common.ts         添加 Profile 类型
  Step 2  src/lib/utils/errors.ts         错误类定义
  Step 3  src/lib/utils/auth.ts           守卫函数 (requireAuth / requireRole)
  Step 4  src/lib/actions/auth.ts         登录/登出 Server Action

Phase 1.2: Auth Feature 层
  Step 5  src/features/auth/AuthContext.tsx     Context + Provider
  Step 6  src/features/auth/actions/auth.ts     getCurrentUser/profile Action
  Step 7  src/features/auth/hooks/useAuth.ts    useAuth hook
  Step 8  src/features/auth/components/LoginForm.tsx  登录表单
  Step 9  src/features/auth/components/UserMenu.tsx   用户菜单
  Step 10 src/features/auth/index.ts                Barrel 导出

Phase 1.3: 应用集成
  Step 11 src/middleware.ts                路由保护逻辑
  Step 12 src/app/(admin)/layout.tsx       Auth Guard + Provider 注入
  Step 13 src/app/(admin)/admin/login/page.tsx  登录页
```

## D. 验收标准

| #   | 验收项                                                                   | 验证方式   |
| --- | ------------------------------------------------------------------------ | ---------- |
| 1   | 未登录访问 `/admin/dashboard` → `/admin/login?redirect=/admin/dashboard` | 浏览器访问 |
| 2   | 登录页展示邮箱 + 密码 + 登录按钮                                         | 视觉确认   |
| 3   | 错误凭据登录 → 显示"邮箱或密码错误"                                      | 手动测试   |
| 4   | 正确凭据登录 → 跳转到 dashboard 或 redirect 参数页面                     | 手动测试   |
| 5   | 已登录访问 `/admin/login` → 跳转到 `/admin/dashboard`                    | 浏览器访问 |
| 6   | 退出登录 → 跳转到 `/admin/login`                                         | 手动测试   |
| 7   | UserMenu 显示用户名和头像缩写                                            | 视觉确认   |
| 8   | `npm run build` 通过                                                     | 终端执行   |
| 9   | `npm run lint` 通过                                                      | 终端执行   |
