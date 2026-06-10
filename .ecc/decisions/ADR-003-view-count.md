# ADR-003: 浏览计数策略

| 字段 | 值 |
|------|-----|
| **标题** | 浏览计数策略 |
| **状态** | 已接受 |
| **日期** | 2026-06-05 |
| **决策者** | 技术负责人 |
| **受影响的文档** | [PRD.md](../docs/PRD.md), [Architecture.md](../docs/Architecture.md), [Database.md](../docs/Database.md), [Roadmap.md](../docs/Roadmap.md) |

---

## 背景

新闻详情页需要展示浏览计数（`view_count`），但第一版不做实时分析系统。计数仅用作粗略的热度参考，不需要实时精确。需要平衡实现复杂度与数据库写入压力。

## 选项

### 选项 A：异步延迟批量写入（选中）

前端触发计数请求 → Server Action 接收后在**内存中暂存**（按 `news_id` 聚合计数） → 定时器每 60 秒或累计 10 次请求后，执行单条批量 UPDATE 写入数据库。

```
viewer → POST /api/view-count?id=X → server Map<id, delta> → flush: UPDATE news SET view_count = view_count + delta WHERE id = ANY(ids)
```

**优点**：
- 数据库写压力极低（合并写入）
- 架构简单，无需外部依赖（Redis / 消息队列）
- 浏览不阻塞页面渲染（异步触发）

**缺点**：
- 单实例内存暂存，多实例部署时计数不准确（第一版单实例部署可接受）
- 进程重启时未 flush 的计数丢失（容忍 ≤ 5 分钟的计数损失）
- 无法精确去重（同一用户多次刷新仍会计数）

### 选项 B：直接写入数据库

每次浏览直接执行 `UPDATE news SET view_count = view_count + 1`。

**优点**：
- 实现最简单
- 计数实时精确

**缺点**：
- 对数据库写入压力大（热门文章每秒几十次 UPDATE）
- 与 ISR 缓存结合时，每次写入后需考虑缓存失效

### 选项 C：Supabase 实时计数器（Extension）

使用 Supabase 的 `realtime` 功能或 pgmq 实现计数。

**缺点**：
- 增加基础设施复杂度
- 对于第一版"粗略计数"的需求过度设计

## 决策

采用 **选项 A：异步延迟批量写入**。

具体实现：
1. 服务端维护一个 `Map<string, number>`，key 为 news_id，value 为增量
2. 接收到计数请求后同步更新 Map 值（不等待数据库写入）
3. 每 60 秒（或累计 10+ 条不同新闻）触发一次 flush
4. flush 使用单条 SQL `UPDATE ... SET view_count = view_count + delta WHERE id = ANY(...)`
5. 页面显示的值直接读数据库 `news.view_count`（ISR 缓存中已包含）

## 后果

### 正面

- 数据库写压力从 O(N 次浏览) 降低到 O(N 种新闻 / 每分钟)
- 实现代码量小，集中在 `lib/actions/view-counter.ts`
- 浏览过程不阻塞页面渲染

### 负面

- 多实例部署时计数有偏差（Vercel 单实例可接受）
- 进程重启导致未 flush 的计数丢失

### 不在此决策范围内

- 精确的去重计数（按 IP / session）—— 后续版本按需添加
- 热门新闻排行榜 —— 后续版本按需添加
