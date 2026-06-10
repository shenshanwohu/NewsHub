# Architecture Review Prompt

## 审查主题

{{review_topic}}

## 前置阅读

- [ ] 现有 ADR 列表: {{adr_list}}
- [ ] 相关 PRD 章节: {{prd_sections}}
- [ ] Architecture.md: {{arch_sections}}

## 审查维度

### 一致性
- [ ] 方案与 PRD 需求一致
- [ ] 方案与现有技术栈一致（Next.js + Supabase + TailwindCSS）
- [ ] 不引入未评估的外部依赖

### 可维护性
- [ ] 是否过度设计（YAGNI）？
- [ ] 是否为未来扩展预留了合理空间？
- [ ] 是否增加了不必要的复杂度？

### 安全性
- [ ] 数据流中是否存在安全盲区？
- [ ] RLS 策略是否足够？
- [ ] 是否存在 XSS/SQL 注入风险？

### 性能
- [ ] 查询是否可走索引？
- [ ] ISR 策略是否合理？
- [ ] 是否有 N+1 查询问题？

## 产出

- [ ] 新 ADR 文件（如决策涉及架构变更）
- [ ] 更新受影响的文档（PRD / Architecture / Database / Roadmap）
- [ ] 更新 project-context.md
