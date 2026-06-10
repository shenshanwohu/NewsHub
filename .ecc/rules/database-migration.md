# 数据库迁移规范

## 工具链

- 使用 Supabase CLI 管理迁移：`supabase migration new <name>`
- 迁移文件位于 `supabase/migrations/` 目录
- 类型生成：`supabase gen types typescript --linked > src/lib/types/database.ts`

## 迁移编写规则

1. **一次性原则**：迁移文件一旦提交即不可修改。需要改表结构时，创建新的迁移文件
2. **向前兼容**：所有迁移必须可回滚（提供 `up` 和 `down` SQL）
3. **事务包裹**：每个迁移文件内容包裹在事务中（Supabase CLI 默认行为）
4. **命名规范**：`<timestamp>_<描述>.sql`，如 `20260605000001_create_news_categories.sql`

## 表结构变更流程

```
1. 编写迁移 SQL
2. 本地 `supabase migration up` 执行
3. 验证表结构正确
4. 重新生成 TypeScript 类型
5. 提交迁移文件和类型文件到 git
```

## 多分类关联表操作规范

### 更新新闻的分类关联

必须在同一个事务中执行"先删后插"：

```sql
BEGIN;
DELETE FROM news_categories WHERE news_id = :target_news_id;
INSERT INTO news_categories (news_id, category_id) VALUES (:news_id, :cid1), (:news_id, :cid2);
COMMIT;
```

### 查询某分类下的新闻

```sql
SELECT n.* FROM news n
JOIN news_categories nc ON n.id = nc.news_id
WHERE nc.category_id = :category_id
  AND n.status = 'published'
ORDER BY n.is_featured DESC, n.published_at DESC;
```

## RLS 策略维护

- 每个表有明确的 RLS 策略矩阵（见 Database.md 第 3 节）
- `news_categories` 表的 RLS 策略必须与 `news` 表联动：
  - 访客仅能查询已发布新闻的关联记录
  - 管理员可按对应 news 的写入权限操作中间表
- 每次修改 RLS 策略后，编写测试用例验证（`supabase db test`）

## 索引维护

- 在迁移文件中管理索引的创建和删除
- 查询性能分析使用 `EXPLAIN ANALYZE`
- `news_categories` 的 `news_id` 和 `category_id` 必须始终有索引支持
