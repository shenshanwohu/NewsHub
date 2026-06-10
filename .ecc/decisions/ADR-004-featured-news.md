# ADR-004: 置顶新闻机制

| 字段 | 值 |
|------|-----|
| **标题** | 置顶新闻机制 |
| **状态** | 已接受 |
| **日期** | 2026-06-05 |
| **决策者** | 技术负责人 |
| **受影响的文档** | [PRD.md](../docs/PRD.md), [Architecture.md](../docs/Architecture.md), [Database.md](../docs/Database.md) |

---

## 背景

首页需要展示被管理员标记的"置顶/精选"新闻，使其在列表中优先展示。需要决定置顶的实现方式和排序策略。

## 选项

### 选项 A：布尔字段 + 排序（选中）

在 `news` 表增加 `is_featured boolean NOT NULL DEFAULT false` 列，查询时按 `ORDER BY is_featured DESC, published_at DESC` 排序。

**优点**：
- 实现极其简单，单列标记
- 查询效率高（可使用复合索引 `(is_featured DESC, published_at DESC)`）
- 管理端只需一个开关组件
- 支持多条新闻同时置顶

**缺点**：
- 无法精细控制置顶顺序（置顶新闻之间按发布时间排序）
- 无法设置置顶过期时间（需业务层额外字段）

### 选项 B：独立的置顶表 + 排序权重

创建 `featured_news` 表：`news_id, sort_order, created_by, created_at`。首页查询时 JOIN 该表，按 `sort_order` 排序。

**优点**：
- 可精细控制置顶顺序
- 审计追踪（谁在何时设置了置顶）

**缺点**：
- 需要 JOIN 查询，复杂度增加
- 管理端需要排序操作 UI（拖拽/序号输入）
- 对第一版而言过度设计

### 选项 C：优先级数值字段

使用 `priority integer DEFAULT 0` 列替代布尔值，0 表示不置顶，> 0 表示置顶并按数值排序。

**优点**：
- 比布尔值灵活，可排序
- 不增加额外表

**缺点**：
- 数值语义不够直观
- 管理端仍需要排序 UI

## 决策

采用 **选项 A：`is_featured` 布尔字段 + `ORDER BY` 排序**。

- 首页查询：`SELECT * FROM news WHERE status = 'published' ORDER BY is_featured DESC, published_at DESC`
- 置顶新闻之间按发布时间倒序排列
- 复合索引 `idx_news_featured_published ON (is_featured DESC, published_at DESC)` 覆盖该查询

## 后果

### 正面

- 极低的实现和维护成本
- 查询性能优秀（单表 + 复合索引）
- 管理端仅需一个 Toggle 开关组件

### 负面

- 无法指定置顶顺序（按发布时间排序，最新置顶排最前）
- 无置顶过期机制（需手动取消置顶）
- 所有置顶新闻权重相同

### 未来扩展

- 如需排序权重：可升级到选项 B 或 C（目前数据兼容迁移）
- 如需过期时间：增加 `featured_until timestamptz` 列
