# NewsHub CMS — 项目上下文

## 项目概述

NewsHub CMS 是一个面向公开互联网的新闻发布系统，为多管理员团队提供完整的内容管理流程，基于 Next.js + Supabase 技术栈构建，部署于 Vercel。

## 核心决策记录

### 2026-06-05 — 需求确认（初版）

- **语言**：仅单一语言，第一版不做国际化
- **搜索**：需要全文搜索（ILKE 搜索，后续可升级 tsvector）
- **权限**：需要角色分级 — 超级管理员 / 发布者 / 编辑
- **发布**：手动发布，第一版不做定时发布
- **标签**：仅分类，不需要标签系统
- **富文本**：Tiptap（基于 ProseMirror）
- **评论**：第一版不做

### 2026-06-05 — 架构评审修订（v0.2）

- **多分类**：新闻支持多分类，通过 `news_categories` 中间表实现多对多关系，取代原来的单 `category_id` 列
- **SEO 字段**：新增 `seo_title`、`seo_description`、`seo_og_image` 三个独立列，回退策略为 `title`/`summary`/`cover_image_url`
- **浏览计数**：新增 `view_count` 列（默认 0），采用异步延迟写入策略（内存暂存 → 批量 flush，延迟 ≤ 5 分钟）
- **置顶新闻**：新增 `is_featured` 布尔列，首页按 `is_featured DESC, published_at DESC` 排序
- **分类关联更新**：采用事务内先删后插（DELETE + INSERT）的原子操作模式

### 架构基调

- 全栈 Next.js 14+ App Router
- TailwindCSS 原子化样式
- Supabase 提供 PostgreSQL + Auth + Storage
- 访客端以 ISR 为主，管理端为 Dynamic CSR/RSC
- 路由保护通过 Next.js middleware + Supabase Auth session
- 权限控制在 Server Action 层 + RLS（数据库层双重保障）
- 富文本 HTML 入库前后均做 DOMPurify 清洗（XSS 防护）
- SEO 元数据采用"自定义字段 > 自动推导"的两级回退策略

## 关键文档索引

| 文档 | 位置 | 内容 |
|------|------|------|
| 产品需求 | [docs/PRD.md](../docs/PRD.md) | 功能需求、角色定义、非功能需求 |
| 架构设计 | [docs/Architecture.md](../docs/Architecture.md) | 技术选型、路由、组件、安全、缓存、SEO 策略 |
| 数据库设计 | [docs/Database.md](../docs/Database.md) | ERD、表定义、RLS、索引、存储桶、查询模式 |
| 路线图 | [docs/Roadmap.md](../docs/Roadmap.md) | 分阶段计划、风险、里程碑 |
| ADR 记录 | [.ecc/decisions/](../.ecc/decisions/) | 架构决策记录 |
| 开发规范 | [.ecc/rules/](../.ecc/rules/) | 编码规范、数据库迁移、安全、Git 工作流、组件模式 |

## 开发规范

- 严格 TypeScript 模式
- 数据库类型由 `supabase gen types` 自动生成
- 数据库迁移使用 Supabase CLI 管理
- Server Actions 作为 API 层，不接受 REST 路由
- 所有富文本输出必须经过 DOMPurify 清洗
- Git flow: main 分支保护，feature 分支开发
- 分类关联更新采用事务内先删后插模式
- 浏览计数写入不低于每 5 分钟批量 flush 一次
- 所有架构决策记录在 `.ecc/decisions/` 中以 ADR 形式留存

## 外部依赖

| 依赖 | 用途 | 版本建议 |
|------|------|---------|
| next | 框架 | ^14.2 |
| react / react-dom | UI | ^18.3 |
| typescript | 类型系统 | ^5.4 |
| tailwindcss | 样式 | ^3.4 |
| @supabase/supabase-js | Supabase SDK | ^2.45 |
| @supabase/ssr | Supabase Next.js SSR | ^0.5 |
| @tiptap/react | 富文本编辑器 | ^2.6 |
| @tiptap/starter-kit | 编辑器扩展集 | ^2.6 |
| @tiptap/extension-image | 图片扩展 | ^2.6 |
| @tiptap/extension-link | 超链接扩展 | ^2.6 |
| @tiptap/extension-table | 表格扩展 | ^2.6 |
| dompurify | HTML 清洗 | ^3.1 |
| @types/dompurify | 类型定义 | ^3.0 |
| clsx / tailwind-merge | 条件类名合并 | 按需 |
| lucide-react | 图标库 | ^0.400 |
| date-fns | 日期处理 | ^3.6 |
