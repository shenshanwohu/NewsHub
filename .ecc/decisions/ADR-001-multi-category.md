# ADR-001: 新闻多分类关联设计

| 字段 | 值 |
|------|-----|
| **标题** | 新闻多分类关联设计 |
| **状态** | 已接受 |
| **日期** | 2026-06-05 |
| **决策者** | 技术负责人 |
| **受影响的文档** | [PRD.md](../docs/PRD.md), [Architecture.md](../docs/Architecture.md), [Database.md](../docs/Database.md), [Roadmap.md](../docs/Roadmap.md) |

---

## 背景

架构评审要求新闻支持多分类归属，一条新闻可关联到零个或多个分类。原设计中 `news` 表仅有一个 `category_id` 外键，只能归属单一分类。

## 选项

### 选项 A：多对多中间表（选中）

引入 `news_categories` 关联表，`news` 与 `categories` 通过该表建立多对多关系。

```
news ──1:N── news_categories ──N:1── categories
```

**优点**：
- 标准关系型数据库模式，规范化程度高
- 支持任意数量的分类关联
- 可利用外键约束保证数据完整性
- RLS 策略可精细控制

**缺点**：
- 查询分类新闻需要 JOIN，相比单列查询略复杂
- 在 `news` 表上额外增加关联维护逻辑

### 选项 B：PostgreSQL 数组列

`news` 表使用 `category_ids uuid[]` 数组列存储多个分类 ID。

**优点**：
- 无需 JOIN，查询单表即可
- 模式更简单，无需新增表

**缺点**：
- 无法设置外键约束（PostgreSQL 不支持数组元素外键）
- RLS 策略无法基于数组元素做行级过滤
- ORM / 类型生成工具兼容性差
- 数据完整性靠业务层保证，风险高

### 选项 C：逗号分隔字符串

`news` 表使用 `category_ids text` 存储逗号分隔的分类 Slug。

**缺点**：
- 完全违背数据库规范化原则
- 无约束、无索引、查询需 LIKE 匹配
- 仅作为"不推荐"对照列出

## 决策

采用 **选项 A：`news_categories` 多对多中间表**。

## 后果

### 正面

- 数据完整性由外键和联合主键保障
- RLS 策略可精确控制中间表访问
- JOIN 查询性能在预期数据量（万级新闻）下完全可接受
- 符合未来扩展需求（如添加关联时间、排序权重等附属属性）

### 负面

- 查询某分类下新闻列表需要 JOIN `news_categories` 表
- 创建/更新新闻时需要额外维护关联表的写操作

### 缓解措施

- 在 `news_categories.news_id` 和 `.category_id` 上建索引，确保 JOIN 走 Index Scan
- 分类更新的写操作在 Server Action 事务内完成（先删后插），避免部分更新
- 查询分类新闻列表时使用 `JOIN ... WHERE nc.category_id = :id` 模式，利用索引
