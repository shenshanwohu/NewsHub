# ADR-002: SEO 字段独立存储与回退策略

| 字段 | 值 |
|------|-----|
| **标题** | SEO 字段独立存储与回退策略 |
| **状态** | 已接受 |
| **日期** | 2026-06-05 |
| **决策者** | 技术负责人 |
| **受影响的文档** | [PRD.md](../docs/PRD.md), [Architecture.md](../docs/Architecture.md), [Database.md](../docs/Database.md) |

---

## 背景

每条新闻需要独立的 SEO 元数据（meta title、meta description、Open Graph image），同时当管理员未填写自定义 SEO 字段时，系统应自动从新闻已有内容推导默认值。

## 选项

### 选项 A：独立列 + 业务层回退（选中）

在 `news` 表中增加三个可空列：`seo_title`、`seo_description`、`seo_og_image`。系统获取 SEO 元数据时，优先使用独立列值，若为空则回退到新闻基础字段。

**优点**：
- 模式直观，字段和新闻在同一行，无需额外 JOIN
- 回退逻辑在业务层（Server Side / RSC）实现，灵活可控
- 可空列天然表达"未自定义"语义
- RLS 策略无额外复杂度

**缺点**：
- 占用表空间（三个可空 text 列，实际为空时不占 Postgres 磁盘空间）
- 需要在多处（generateMetadata、详情页 API）实现回退逻辑

### 选项 B：独立的 seo_meta JSONB 列

在 `news` 表中增加一个 `seo_meta JSONB` 列，存储 `{title, description, og_image}`。

**优点**：
- 扩展灵活，添加新 SEO 字段无需改表结构
- 列数更少，`news` 表不膨胀

**缺点**：
- 类型安全性差，无法在数据库层面约束字段名
- Supabase JS Client 对 JSONB 的类型推导不如独立列友好
- JSONB 在查询时无法单独建立索引（需要表达式索引）

### 选项 C：独立 seo_meta 子表

创建 `seo_meta` 子表与 `news` 一对一关联。

**缺点**：
- 过度的规范化，增加 JOIN 复杂度
- 没有实际的收益（SEO 字段和新闻是一对一关系）

## 决策

采用 **选项 A：三个独立可空列 + 业务层回退**。

回退策略：

| SEO 字段 | 来源列 | 回退链 |
|----------|--------|--------|
| meta title | `seo_title` | → `title` |
| meta description | `seo_description` | → `summary` → 截取 `content` 前 160 字符 |
| og:image | `seo_og_image` | → `cover_image_url` |

## 后果

### 正面

- 数据库类型安全，Supabase 类型生成器直接产出类型
- 回退逻辑集中在 `utils/seo.ts` 一个文件中
- `generateMetadata` 中可直接从查询结果构造，无需额外请求

### 负面

- 如需新增 SEO 字段（如 og:locale, twitter:card），需执行 DDL ALTER TABLE
- 管理员填写表单时需展示回退值预览，增加 UI 复杂度
