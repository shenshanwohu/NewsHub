# 数据库操作规范

## 客户端选择

| 场景 | 客户端 | 导入路径 |
|------|--------|---------|
| 浏览器端组件 | `createClient()` (browser) | `@/lib/supabase/client` |
| Server Action / RSC | `createClient()` (server) | `@/lib/supabase/server` |
| Middleware | `updateSession()` | `@/lib/supabase/middleware` |

- 禁止在客户端组件中直接使用服务端客户端
- 禁止在 Server Action 之外调用 service_role key

## 查询规范

### SELECT

- 始终指定具体列名，不使用 `SELECT *`（生产代码）
- 列表查询使用分页（`range()` + `limit()`）
- 全文搜索使用 Server Action 包装

```typescript
// ✅ 正确
const { data } = await supabase
  .from('news')
  .select('id, title, slug, summary, published_at')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .range(0, 19);

// ❌ 错误
const { data } = await supabase.from('news').select('*');
```

### INSERT / UPDATE

- 所有写操作在 Server Action 中执行
- 多表写操作使用事务（Supabase RPC 或应用层顺序 + 错误回滚）

```typescript
// 创建新闻 + 关联分类
const { data: news } = await supabase
  .from('news')
  .insert({ title, content, author_id, ... })
  .select('id')
  .single();

// 先删后插（分类关联）
await supabase.from('news_categories').delete().eq('news_id', news.id);
await supabase.from('news_categories').insert(
  categoryIds.map(cid => ({ news_id: news.id, category_id: cid })),
);
```

### DELETE

- 软删除优先（设计上 `status = 'archived'` 而非真删除）
- 真删除仅限超级管理员操作，且需二次确认
- `news_categories` 通过 ON DELETE CASCADE 自动清理

## RLS 策略配合

- 数据库查询默认受 RLS 约束
- 在 Supabase Dashboard 中为每个表启用 RLS
- 使用 `supabase.auth.getUser()` 而非 `getSession()` 做权限校验
- 访客查询自动受限于 `status = 'published'` 策略

## 类型安全

- 运行 `supabase gen types typescript --linked` 同步数据库类型
- 生成的文件位于 `src/lib/types/database.ts`
- 在代码中引用生成的类型，而不是手写

## 迁移管理

（见 [database-migration.md](./database-migration.md)）
