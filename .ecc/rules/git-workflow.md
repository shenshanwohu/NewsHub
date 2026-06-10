# Git 工作流规范

## 分支模型

```
main          生产部署分支（受保护，禁止直接推送）
  └─ develop  开发集成分支
       ├─ feature/xxx  功能分支
       ├─ fix/xxx      修复分支
       └─ refactor/xxx 重构分支
```

## 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能 | `feature/<short-description>` | `feature/multi-category` |
| 修复 | `fix/<short-description>` | `fix/view-count-race` |
| 重构 | `refactor/<short-description>` | `refactor/news-actions` |
| 文档 | `docs/<short-description>` | `docs/architecture-v2` |

## 提交规范

使用语义化提交信息（Conventional Commits）：

```
<type>(<scope>): <description>

[optional body]
```

| type | 使用场景 |
|------|---------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档变更 |
| `refactor` | 重构（非功能、非修复） |
| `style` | 代码格式（如 Prettier） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/CI/工具链 |

示例：
```
feat(news): add multi-category selection support
fix(search): handle empty keyword gracefully
docs(db): add news_categories table schema
```

## PR 流程

1. 从 `develop` 创建 feature 分支
2. 开发完成后创建 Pull Request 到 `develop`
3. PR 标题使用语义化前缀
4. PR 描述关联对应的 ADR 或 Issue
5. 至少 1 人 Review 后合并
6. 合并使用 Squash 策略（保持 `develop` 提交历史干净）
7. 发布时从 `develop` 合并到 `main`（使用 Merge Commit）

## 禁止提交的文件

- `.env.local`, `.env.development.local` — 环境变量
- `node_modules/`, `.next/` — 构建产物
- `supabase/.temp/` — Supabase 本地缓存
