# ADR-005: 技术栈选型

| 字段 | 值 |
|------|-----|
| **标题** | 技术栈选型 |
| **状态** | 已接受 |
| **日期** | 2026-06-05 |
| **决策者** | 技术负责人 |
| **受影响的文档** | [Architecture.md](../docs/Architecture.md), [Database.md](../docs/Database.md) |

---

## 背景

需要为 NewsHub CMS 确定一整套技术栈。选型原则：主流成熟、社区活跃、与团队技能匹配、部署简单。

## 决策详情

### 框架：Next.js 14+ (App Router)

| 选项 | 理由 |
|------|------|
| Next.js App Router | 全栈框架，RSC/ISR/SSR 原生支持；与 Vercel 深度集成；活跃社区 |
| 备选：Remix | 也是优秀框架，但 ISR 生态不如 Next.js 成熟 |
| 备选：Nuxt (Vue) | Vue 生态与团队 TypeScript 偏好不匹配 |

### 数据库：PostgreSQL (Supabase)

| 选项 | 理由 |
|------|------|
| Supabase PostgreSQL | 托管 PostgreSQL + RLS + 类型生成 + 与 Auth/Storage 同一生态 |
| 备选：Neon | Serverless PostgreSQL，但缺少内置 Auth 和 Storage |
| 备选：PlanetScale (MySQL) | MySQL 缺少 RLS 等效功能；无 Supabase 的一体化集成 |

### 认证：Supabase Auth

选择 Supabase Auth 而非 NextAuth/Auth.js 的理由：
1. 与数据库 RLS 策略可直接联动
2. 无需额外配置 Session 管理（Supabase 自动处理 cookie）
3. 同一 Supabase 项目内免额外费用
4. 支持未来可能的匿名登录扩展

### 富文本：Tiptap (ProseMirror)

| 选项 | 理由 |
|------|------|
| Tiptap | 基于 ProseMirror，扩展性强；React 组件友好；TypeScript 原生支持 |
| 备选：TinyMCE | 自托管版功能完整，但 React 集成不如 Tiptap 自然；社区版有水印 |
| 备选：Slate | 灵活但需要更多自建功能（表格、图片等） |
| 备选：Quill 2.0 | 模块化，但 React 生态和表格/图片支持弱于 Tiptap |

### 部署：Vercel

Vercel 是 Next.js 的原生部署平台，优势包括：
1. ISR / Edge Functions 原生支持
2. Automatic HTTPS + CDN
3. Preview Deployments 用于分支预览
4. `next/image` 优化 CDN 内置

### API 模式：Server Actions

选择 Next.js Server Actions 而非传统 REST API 路由的理由：
1. 避免前端手动维护 API 调用代码
2. 类型统一（前后端共享类型）
3. 无需额外 API 文档（函数签名即接口契约）
4. 内置 CSRF 防护
5. 不支持对外暴露（第一版不需要）

## 后果

### 正面

- 全栈 TypeScript，类型安全贯穿前后端
- 极少的 DevOps 工作（Vercel + Supabase 几乎零运维）
- 开发效率高（Server Actions 减少样板代码）
- 性能优秀（ISR 缓存 + CDN）

### 负面

- 对 Vercel 平台有 vendor lock-in（ISR 是 Vercel 特有功能）
- Server Actions 在大型请求体下可能超时（Vercel Serverless 10s 限制）
- Supabase 免费计划的数据库连接数有限（第一版足够）

### 缓解措施

- 保持 Next.js 标准 API，迁移至其他平台时 ISR 可替换为 CDN 缓存策略
- 大内容（富文本）上传时做好分块和进度反馈
- 生产环境选用 Supabase Pro 计划
