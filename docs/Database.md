# NewsHub CMS — 数据库设计文档

| 元数据       | 值                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **文档状态** | 已评审修订 v0.2                                                                                                               |
| **作者**     | 技术负责人                                                                                                                    |
| **最后更新** | 2026-06-05                                                                                                                    |
| **版本号**   | 0.2                                                                                                                           |
| **修订记录** | v0.1 初稿 → v0.2 架构评审修订：新增 news_categories 关联表、SEO 字段、view_count、is_featured；移除 news.category_id 单分类列 |

---

## 1. 总览

- **数据库**：PostgreSQL（托管于 Supabase）
- **ORM**：直接使用 Supabase JS Client
- **类型生成**：`supabase gen types typescript --linked` 自动生成数据库类型
- **迁移工具**：Supabase Migration（本地 SQL 文件 + `supabase migration up`）

---

## 2. 实体关系图 (ERD)

```
┌─────────────┐       ┌──────────────────┐
│ admin_users │───1:N─│      news        │
│ (管理员)     │       │    (新闻)         │
└─────────────┘       ├──────────────────┤
                      │ author_id ───────┘
                      │ is_featured
                      │ view_count
                      │ seo_title
                      │ seo_description
                      │ seo_og_image      ───┐
                      └────────────────────┘ │
                                             │  N
                               ┌─────────────┴──────────┐
                               │     news_categories     │
                               │  (新闻-分类关联中间表)    │
                               └─────────────┬──────────┘
                                             │  N
                               ┌─────────────┴──────────┐
                               │      categories         │
                               │      (分类)             │
                               ├────────────────────────┤
                               │ parent_id (self-ref) ───┤
                               └────────────────────────┘

                               ┌────────────────────────┐
                               │       images            │
                               │   (图片元数据)           │
                               │ uploaded_by ────────────┤── admin_users
                               └────────────────────────┘
```

---

## 3. 表定义

### 3.1 `admin_users` — 管理员表

此表与 Supabase Auth 内置的 `auth.users` 表关联，用于存储额外的角色和状态信息。**无变更**。

| 列名           | 类型          | 约束                                                              | 说明                              |
| -------------- | ------------- | ----------------------------------------------------------------- | --------------------------------- |
| `id`           | `uuid`        | PK, DEFAULT `gen_random_uuid()`                                   | 主键，与 `auth.users.id` 一一对应 |
| `auth_id`      | `uuid`        | UNIQUE, NOT NULL, FK → `auth.users.id`                            | 关联 Supabase Auth 用户           |
| `email`        | `text`        | UNIQUE, NOT NULL                                                  | 管理员邮箱                        |
| `display_name` | `text`        | NOT NULL                                                          | 显示名称（作者署名）              |
| `role`         | `text`        | NOT NULL, CHECK(`role IN ('super_admin', 'publisher', 'editor')`) | 角色                              |
| `is_active`    | `boolean`     | NOT NULL, DEFAULT `true`                                          | 是否启用（禁用后无法登录）        |
| `created_at`   | `timestamptz` | DEFAULT `NOW()`                                                   | 创建时间                          |
| `updated_at`   | `timestamptz` | DEFAULT `NOW()`                                                   | 更新时间                          |

**索引**：

- `idx_admin_users_role` ON `role`
- `idx_admin_users_is_active` ON `is_active`

**RLS 策略**：

| 操作   | 策略                                       |
| ------ | ------------------------------------------ |
| SELECT | 仅超级管理员可查看列表；管理员可查看自身   |
| INSERT | 仅超级管理员（需同时创建 auth.users 记录） |
| UPDATE | 仅超级管理员                               |
| DELETE | 不允许（建议软禁用 `is_active = false`）   |

### 3.2 `categories` — 分类表

支持树形多级分类结构。**无变更**。

| 列名          | 类型          | 约束                            | 说明                            |
| ------------- | ------------- | ------------------------------- | ------------------------------- |
| `id`          | `uuid`        | PK, DEFAULT `gen_random_uuid()` | 主键                            |
| `name`        | `text`        | NOT NULL                        | 分类名称（如"科技"、"体育"）    |
| `slug`        | `text`        | UNIQUE, NOT NULL                | URL 友好的唯一标识（如 "tech"） |
| `description` | `text`        | 可空                            | 分类描述                        |
| `parent_id`   | `uuid`        | 可空, FK → `categories.id`      | 父分类 ID（null 为顶级分类）    |
| `sort_order`  | `integer`     | NOT NULL, DEFAULT `0`           | 排序权重                        |
| `is_active`   | `boolean`     | NOT NULL, DEFAULT `true`        | 是否在前台展示                  |
| `created_at`  | `timestamptz` | DEFAULT `NOW()`                 | 创建时间                        |
| `updated_at`  | `timestamptz` | DEFAULT `NOW()`                 | 更新时间                        |

**索引**：

- `idx_categories_slug` ON `slug` (UNIQUE)
- `idx_categories_parent_id` ON `parent_id`

**RLS 策略**：

| 操作   | 策略                                     |
| ------ | ---------------------------------------- |
| SELECT | 所有人可查已启用的分类                   |
| INSERT | 仅超级管理员                             |
| UPDATE | 仅超级管理员                             |
| DELETE | 仅超级管理员（若存在关联新闻则拒绝删除） |

### 3.3 `news` — 新闻表（修订）

**变更说明**：移除 `category_id` 单分类列，新增 SEO 字段、浏览计数、置顶标记。

| 列名              | 类型          | 约束                                                                      | 说明                                                       |
| ----------------- | ------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `id`              | `uuid`        | PK, DEFAULT `gen_random_uuid()`                                           | 主键                                                       |
| `title`           | `text`        | NOT NULL                                                                  | 新闻标题                                                   |
| `slug`            | `text`        | UNIQUE, NOT NULL                                                          | URL 友好的唯一标识（自动生成）                             |
| `summary`         | `text`        | 可空                                                                      | 摘要/导语，展示在新闻卡片                                  |
| `content`         | `text`        | NOT NULL                                                                  | 富文本 HTML 内容                                           |
| `cover_image_url` | `text`        | 可空                                                                      | 封面图 URL（也作为 OG image 回退值）                       |
| `status`          | `text`        | NOT NULL, DEFAULT `'draft'`, CHECK(`IN ('draft','published','archived')`) | 状态                                                       |
| `author_id`       | `uuid`        | NOT NULL, FK → `admin_users.id`                                           | 作者                                                       |
| `is_featured`     | `boolean`     | NOT NULL, DEFAULT `false`                                                 | 是否置顶（置顶新闻在首页优先展示）                         |
| `view_count`      | `integer`     | NOT NULL, DEFAULT `0`                                                     | 浏览计数（异步延迟更新）                                   |
| `seo_title`       | `text`        | 可空                                                                      | 自定义 SEO meta title，为空时回退使用 title                |
| `seo_description` | `text`        | 可空                                                                      | 自定义 SEO meta description，为空时回退使用 summary        |
| `seo_og_image`    | `text`        | 可空                                                                      | 自定义 Open Graph 图片 URL，为空时回退使用 cover_image_url |
| `published_at`    | `timestamptz` | 可空                                                                      | 发布时间                                                   |
| `created_at`      | `timestamptz` | DEFAULT `NOW()`                                                           | 创建时间                                                   |
| `updated_at`      | `timestamptz` | DEFAULT `NOW()`                                                           | 更新时间                                                   |

**索引**：

- `idx_news_status` ON `status`
- `idx_news_published_at` ON `published_at` DESC
- `idx_news_author_id` ON `author_id`
- `idx_news_slug` ON `slug` (UNIQUE)
- `idx_news_featured_published` ON `(is_featured DESC, published_at DESC)` — 首页置顶 + 时间排序
- `idx_news_view_count` ON `view_count` DESC — 热门排序
- `idx_news_fulltext` — `GIN(to_tsvector('simple', title || ' ' || content))`（全文搜索索引）

> **注意**：`category_id` 列已被移除。新闻与分类的关系通过 `news_categories` 中间表实现多对多关联。覆盖 `idx_news_category_id` 查询模式见第 8 节。

**RLS 策略**：

| 操作   | 策略                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| SELECT | 访客（anon）：`status = 'published'`；管理员：所有状态                           |
| INSERT | Editor / Publisher / Super Admin                                                 |
| UPDATE | 按角色：编辑仅可更新自己的草稿；发布者可更新草稿和 `is_featured`；超级管理员全部 |
| DELETE | 仅超级管理员可删除；编辑仅可删除自己的草稿                                       |

### 3.4 `news_categories` — 新闻-分类关联表（新增）

多对多关联中间表，一条新闻可归属零到多个分类，一个分类下可有多条新闻。

| 列名          | 类型          | 约束                                        | 说明         |
| ------------- | ------------- | ------------------------------------------- | ------------ |
| `news_id`     | `uuid`        | PK, FK → `news.id`, ON DELETE CASCADE       | 新闻 ID      |
| `category_id` | `uuid`        | PK, FK → `categories.id`, ON DELETE CASCADE | 分类 ID      |
| `created_at`  | `timestamptz` | DEFAULT `NOW()`                             | 关联创建时间 |

> 联合主键 `(news_id, category_id)` 确保同一新闻不能重复关联同一分类。级联删除确保新闻或分类被删除时关联记录自动清理。

**索引**：

- `idx_news_categories_news_id` ON `news_id` — 快速查询某新闻的全部分类
- `idx_news_categories_category_id` ON `category_id` — 快速查询某分类下所有新闻
- 联合主键自带唯一索引

**RLS 策略**：

| 操作   | 策略                                                                              |
| ------ | --------------------------------------------------------------------------------- |
| SELECT | 访客（anon）：仅可见已发布新闻的关联（与 news SELECT 策略联动）；管理员：全部可见 |
| INSERT | Editor / Publisher / Super Admin（需有对应 news 的写入权限）                      |
| DELETE | 与 INSERT 同权限，级联删除由外键触发                                              |

### 3.5 `images` — 图片表

跟踪上传到 Supabase Storage 的图片元数据。**无变更**。

| 列名           | 类型          | 约束                            | 说明                                         |
| -------------- | ------------- | ------------------------------- | -------------------------------------------- |
| `id`           | `uuid`        | PK, DEFAULT `gen_random_uuid()` | 主键                                         |
| `filename`     | `text`        | NOT NULL                        | 原始文件名                                   |
| `storage_path` | `text`        | UNIQUE, NOT NULL                | 存储路径（如 `images/{userId}/{ts}-{file}`） |
| `public_url`   | `text`        | NOT NULL                        | 公开可访问的 URL                             |
| `mime_type`    | `text`        | NOT NULL                        | MIME 类型（如 image/jpeg）                   |
| `file_size`    | `integer`     | NOT NULL                        | 文件大小（字节）                             |
| `width`        | `integer`     | 可空                            | 图片宽度（像素）                             |
| `height`       | `integer`     | 可空                            | 图片高度（像素）                             |
| `alt_text`     | `text`        | 可空                            | Alt 文本                                     |
| `uploaded_by`  | `uuid`        | FK → `admin_users.id`           | 上传者                                       |
| `created_at`   | `timestamptz` | DEFAULT `NOW()`                 | 上传时间                                     |

**索引**：

- `idx_images_uploaded_by` ON `uploaded_by`
- `idx_images_created_at` ON `created_at` DESC

**RLS 策略**：

| 操作   | 策略                     |
| ------ | ------------------------ |
| SELECT | 所有已登录管理员         |
| INSERT | 所有已登录管理员         |
| UPDATE | 仅上传者本人或超级管理员 |
| DELETE | 仅上传者本人或超级管理员 |

### 3.6 `_migrations` — 由 Supabase CLI 管理

版本化迁移文件位于 `supabase/migrations/` 目录。

---

## 4. 枚举与常数值

### 4.1 news.status

| 值          | 说明               |
| ----------- | ------------------ |
| `draft`     | 草稿，仅管理员可见 |
| `published` | 已发布，访客可见   |
| `archived`  | 已归档，访客不可见 |

### 4.2 admin_users.role

| 值            | 说明       |
| ------------- | ---------- |
| `super_admin` | 超级管理员 |
| `publisher`   | 发布者     |
| `editor`      | 编辑       |

---

## 5. 全文搜索策略

### 5.1 第一版（ILIKE 搜索）

```sql
SELECT * FROM news
WHERE status = 'published'
  AND (title ILIKE '%' || :keyword || '%'
    OR content ILIKE '%' || :keyword || '%')
ORDER BY is_featured DESC, published_at DESC;
```

### 5.2 后续优化（tsvector 全文索引）

```sql
-- 创建索引（已在 idx_news_fulltext 中定义）
CREATE INDEX idx_news_fulltext ON news
  USING GIN (to_tsvector('simple', title || ' ' || content));

-- 查询
SELECT * FROM news
WHERE status = 'published'
  AND to_tsvector('simple', title || ' ' || content) @@ plainto_tsquery('simple', :keyword)
ORDER BY is_featured DESC,
  ts_rank(to_tsvector('simple', title || ' ' || content), plainto_tsquery('simple', :keyword)) DESC;
```

---

## 6. 存储桶 (Supabase Storage)

### 6.1 Bucket 配置

| Bucket        | 用途                     | 公开访问     | 允许的文件类型                               |
| ------------- | ------------------------ | ------------ | -------------------------------------------- |
| `news-images` | 新闻封面和富文本正文图片 | 是（公开读） | image/jpeg, image/png, image/webp, image/gif |

### 6.2 存储路径结构

```
news-images/
├── {year}/{month}/
│   ├── {userId}/
│   │   ├── {timestamp}-{original_filename}
│   │   └── ...
│   └── ...
└── ...
```

> 路径以日期 + 用户 ID 组织，便于后续按用户和时间审计。

### 6.3 图片上传限制

- 单文件最大 **5MB**
- 推荐尺寸：
  - 封面/OG 图片：1200×630px（标准 OG 比例）
  - 正文配图：宽度 ≤ 800px
- 支持格式：JPEG, PNG, WebP, GIF（静态动画）
- 自动校验：服务端验证真实尺寸及 MIME 类型

---

## 7. 约束与触发器

### 7.1 自动 updated_at 触发器

所有含 `updated_at` 列的表均应用触发器：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 每张表注册
CREATE TRIGGER trigger_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- admin_users, images 同理
```

### 7.2 完整性约束

- `news` 的 `author_id` 引用 `admin_users.id`，删除管理员时需先 reassign 或删除关联新闻
- `news_categories` 的 `news_id` 和 `category_id` 均设 ON DELETE CASCADE，删除新闻或分类时自动清理关联
- `news_categories` 联合主键 `(news_id, category_id)` 防止重复关联
- 分类层级深度限制：业务层控制，不超过 3 层（防止过深嵌套）

---

## 8. 查询模式示例

| 场景                     | 说明                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- | ------------------------ | --- | --- | --- | -------------------------------------------------- |
| 首页新闻列表             | `SELECT * FROM news WHERE status='published' ORDER BY is_featured DESC, published_at DESC LIMIT 20`                                                                                         |
| 分类新闻列表             | `SELECT n.* FROM news n JOIN news_categories nc ON n.id = nc.news_id WHERE nc.category_id = :cid AND n.status='published' ORDER BY n.is_featured DESC, n.published_at DESC`                 |
| 新闻详情（含分类）       | `SELECT * FROM news WHERE slug = :slug AND status = 'published' LIMIT 1` + 独立查询 `SELECT c.* FROM categories c JOIN news_categories nc ON c.id = nc.category_id WHERE nc.news_id = :nid` |
| 管理端新闻列表           | `SELECT * FROM news ORDER BY created_at DESC`（无 status 过滤）                                                                                                                             |
| 搜索                     | `SELECT \* FROM news WHERE status='published' AND (title ILIKE '%'                                                                                                                          |     | :kw |     | '%' OR content ILIKE '%' |     | :kw |     | '%') ORDER BY is_featured DESC, published_at DESC` |
| 分类树                   | `SELECT * FROM categories WHERE is_active = true ORDER BY sort_order`，业务层构建树                                                                                                         |
| 置顶新闻                 | `SELECT * FROM news WHERE status='published' AND is_featured = true ORDER BY published_at DESC`                                                                                             |
| 热门新闻（按浏览）       | `SELECT * FROM news WHERE status='published' ORDER BY view_count DESC LIMIT 10`                                                                                                             |
| 更新分类关联（原子操作） | 事务内：`DELETE FROM news_categories WHERE news_id = :nid` → `INSERT INTO news_categories (news_id, category_id) VALUES ...`                                                                |
| SEO 元数据读取           | `SELECT seo_title, seo_description, seo_og_image, title, summary, cover_image_url FROM news WHERE slug = :slug`，业务层应用回退逻辑                                                         |
| 浏览计数批量更新         | `UPDATE news SET view_count = view_count + :delta WHERE id = ANY(:ids)`（定期批量合并）                                                                                                     |
