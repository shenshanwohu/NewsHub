# 编码规范

## 语言与工具

- 全量使用 TypeScript，启用 `strict` 模式
- 禁止使用 `any` 类型；必须使用 `unknown` 并在使用时进行类型收窄
- 编辑器统一使用 ESLint + Prettier 自动格式化
- 提交前自动运行 ESLint 检查（`next lint`）

## 命名约定

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `NewsCard.tsx`, `CategoryNav.tsx` |
| 工具函数文件 | camelCase | `slugify.ts`, `sanitize.ts` |
| Server Actions | camelCase | `createNews.ts`, `publishNews.ts` |
| 目录名 | kebab-case | `news/[slug]/`, `category/` |
| 类型/接口 | PascalCase | `interface NewsCreateInput` |
| 普通变量 | camelCase | `const featuredNews` |
| 数据库列 | snake_case | `view_count`, `is_featured` |
| SQL 标识符 | snake_case | `news_categories` |

## 组件规范

- 每个组件文件默认导出组件本身
- 组件类型定义使用 `interface`（不使用 `type`）
- Props 接口命名为 `{ComponentName}Props`
- 服务端组件（RSC）与客户端组件（'use client'）明确分离
- 客户端组件应尽量薄，核心逻辑放在 Server Actions 或自定义 hooks 中

## 导入顺序

```
1. React / Next.js 内置
2. 第三方库（@supabase, @tiptap 等）
3. 本地 lib / utils
4. 本地组件 (../components/)
5. 类型定义 (../types/)
6. 样式文件 (CSS)
```

## 注释规范

- 复杂的业务逻辑必须加注释说明意图
- Server Actions 的函数签名需要 JSDoc 注释（参数/返回值说明）
- 避免"显而易见"的注释（如 `// 设置标题`）

## 错误处理

- Server Actions 统一返回 `{ success: boolean; data?: T; error?: string }` 结构
- 组件中错误边界通过 `error.tsx` 处理
- 所有数据库查询必须 try-catch，静默失败只在非关键路径允许
- 不允许吞掉错误日志
